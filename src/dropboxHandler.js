/**
 * Created by Le Pham Minh Duc on 29-May-18.
 */
require('isomorphic-fetch'); // or another library of choice.
let fs = require('fs');
let mkdirp = require('mkdirp');
let Dropbox = require('dropbox').Dropbox;

let sendspaceHandler = require('./sendspaceHandler');
let middleware = require('./middleware');

let myAccessToken = 'KU1I6ilkxrAAAAAAAAAADmph3aEctjmw5LrRrAxHBeBsLabN0w2rN2j8hVlt84NA';

let dbx = new Dropbox({ accessToken: myAccessToken });

let baseParam = {
    path: '',
    recursive: true,
    limit: 50
}

let currentPath = process.cwd()
console.log('current path: ' + currentPath)

let allFolders = []
let allFiles = []

let folderTag = 'folder'
let fileTag = 'file'

function initDropbox(_accessToken) {
    allFolders = []
    allFiles = []
    new Dropbox({ accessToken: _accessToken })
}

function doBackup(callback) {
    allFolders = []
    allFiles = []
    // new Dropbox({ accessToken: _accessToken })
    dbx.filesListFolder(baseParam)
        .then((res) => {
            onServerResponseReceived(res, callback)
        })
        .catch(onErrorReceived)
}

let onErrorReceived = (error) => { console.log(error) }

//this function is called when we receive the response from Dropbox server
let onServerResponseReceived = (res, callback) => {
    console.log('onServerResponseReceived')
    for (let i = 0; i < res.entries.length; i ++) {
        if (isEntryFolder(res.entries[i])) {
            let addedEntry = {}
            addedEntry.name = res.entries[i].name
            addedEntry.path = res.entries[i].path_lower
            allFolders.push(addedEntry)
        } else {
            if (isEntryFile(res.entries[i])) {
                allFiles.push(res.entries[i].path_lower)
            }
        }
    }
    if (res.has_more) {
        dbx.filesListFolderContinue( { cursor:res.cursor } )
            .then((res_2) => {
                onServerResponseReceived(res_2, callback)
            })
            .catch(onErrorReceived)
    } else {
        onListingCompleted(callback)
    }
}

function isEntryFolder(entry) { return entry['.tag'] == folderTag }

function isEntryFile(entry) { return entry['.tag'] == fileTag }

//this function is called when we receive everything from the dropbox server
function onListingCompleted(callback) {
    console.log('Finish getting all the meta data from dropbox server / Start making directory')
    makeDirectory((err_makeFile) => {
        if (err_makeFile) {
            callback(err_makeFile)
        } else {
            middleware.getUnbackupedFiles(allFiles, (err_getFiles, res_files) => {
                if (err_getFiles) {
                    console.log(err_getFiles)
                    callback(err_getFiles, null)
                } else {
                    // console.log(res_files)
                    let totalNumberOfFiles = res_files.length;
                    if (totalNumberOfFiles  == 0) {
                        callback(null, 'No need to backup')
                        return
                    }
                    let numberOfSuccess = 0;
                    for (let i = 0; i < res_files.length; i ++) {
                        // console.log(res_files[i].fullPath)
                        downloadFileSingle(res_files[i].fullPath, (error, localDownloadedPath) => {
                            if (error) {
                                console.error('Error downloading the file. something is wrong!')
                                callback(error, 'Error downloading the file. something is wrong!')
                            } else {
                                numberOfSuccess ++;
                                // console.log('File: -' + res_files[i].fullPath + '- index: ' + numberOfSuccess + '/' + totalNumberOfFiles)
                                res_files[i].localPath = localDownloadedPath
                                // localFiles.push(localDownloadedPath)
                                if (numberOfSuccess >= totalNumberOfFiles) {
                                    console.log('Finish saving dropbox files to local!')
                                    // middleware.backupFilesToSendspace(localFiles, callback)
                                    middleware.backupFilesToSendspace(res_files, callback)
                                }
                            }
                        })
                    }
                }
            })
        }
    })
}

function makeDirectory(callback) {
    for (let i = 0; i < allFolders.length; i ++) {
        mkdirp(currentPath + '/cache' + allFolders[i].path, (err) => {
            if (err) {
                console.log(err)
            }
            // console.log(err ? err : 'Succesfully create a local  directory: ' + allFolders[i].path)
        });
    }
    middleware.duplicateFoldersToSendspace(allFolders, (err) => {
        if (err) {
            console.error('Error duplicate the folder to sendspace')
            callback(err)
        } else {
            console.log('Successfully create all of the responding folder to sendspace')
            callback(null)
        }
    })
}

function downloadFileSingle(_path, callback) {
    dbx.filesDownload({path:_path})
        .then((response) => {
            saveFileToLocal(response.path_lower, response.fileBinary, callback)
        }).catch(onErrorReceived)
}

function saveFileToLocal(name, fileBinary, callback) {
    fs.writeFile(currentPath + "/cache/" + name, fileBinary, "binary", function(err) {
        if(err) {
            console.log('Error happend in saving file to local!');
            callback(err, null)
        } else {
            // console.log('file saved to local! ' + name);
            callback(null, "./cache" + name)
        }
    });
}

// dbx.filesDownload({path:'/papa.PNG'})
//     .then((response) => {
//         saveFileToLocal(response.path_lower, response.fileBinary, (err, filePath) => {
//             if (err) {
//                 console.error(err)
//             } else {
//                 console.log(filePath)
//                 sendspaceHandler.uploadFiles(filePath, (err, res) => {
//                     if (err) {
//                         console.error(err)
//                     } else {
//                         console.log(res)
//                     }
//                 });
//             }
//         });
//
//
//     }).catch(onErrorReceived);

module.exports.doBackup = doBackup;
module.exports.initDropbox = initDropbox;