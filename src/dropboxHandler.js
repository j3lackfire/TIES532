/**
 * Created by Le Pham Minh Duc on 29-May-18.
 */
require('isomorphic-fetch'); // or another library of choice.
let fs = require('fs')
let mkdirp = require('mkdirp');
let Dropbox = require('dropbox').Dropbox;

let sendspaceHandler = require('./sendspaceHandler')

let myAccessToken = 'KU1I6ilkxrAAAAAAAAAADmph3aEctjmw5LrRrAxHBeBsLabN0w2rN2j8hVlt84NA';

let dbx = new Dropbox({ accessToken: myAccessToken });

let baseParam = {
    path: '',
    recursive: true,
    limit: 50
}

let currentPath = process.cwd()

let allFolders = []
let allFiles = []

let folderTag = 'folder'
let fileTag = 'file'

function isEntryFolder(entry) { return entry['.tag'] == folderTag }

function isEntryFile(entry) { return entry['.tag'] == fileTag }

let onErrorReceived = (error) => { console.log(error) }

function initDropboxHandler(_accessToken, callback) {
    allFolders = []
    allFiles = []
    new Dropbox({ accessToken: _accessToken })
    dbx.filesListFolder(baseParam)
        .then((res) => {
            onServerResponseReceived(res, callback)
        })
        .catch(onErrorReceived)
}

//this function is called when we receive the response from Dropbox server
let onServerResponseReceived = (res, callback) => {
    console.log('onServerResponseReceived')
    for (let i = 0; i < res.entries.length; i ++) {
        if (isEntryFolder(res.entries[i])) {
            allFolders.push(res.entries[i].path_lower)
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

//this function is called when we receive everything from the dropbox server
function onListingCompleted(callback) {
    console.log('Finish getting all the meta data from dropbox server / Start making directory')
    makeDirectory()
    let totalNumberOfFiles = allFiles.length
    let numberOfSuccess = 0;

    console.log('\n\nUpload one file to send space - ' + allFiles[0])

    // dbx.filesDownload({path:allFiles[0]})
    //     .then((response) => {
    //         sendspaceHandler.uploadFileSingle(response.fileBinary, callback)
    //         saveFileToLocal(response.path_lower, response.fileBinary, callback)
    //     }).catch(onErrorReceived)
    for (let i = 0; i < allFiles.length; i ++) {
        downloadFileSingle(allFiles[i], (error) => {
            if (error) {
                console.log('Error downloading the file. something is wrong!')
                callback(error, 'Error downloading the file. something is wrong!')
            } else {
                numberOfSuccess ++;
                console.log('File: -' + allFiles[i] + '- index: ' + numberOfSuccess + '/' + totalNumberOfFiles)
                if (numberOfSuccess >= totalNumberOfFiles) {
                    console.log('The backup process is completed')
                    callback(null, 'The backup process is completed, ' + totalNumberOfFiles + ' files is copied')
                }
            }
        })
    }
}

function downloadFileSingle(_path, callback) {
    dbx.filesDownload({path:_path})
        .then((response) => {
            saveFileToLocal(response.path_lower, response.fileBinary, callback)
        }).catch(onErrorReceived)
}

function makeDirectory() {
    for (let i = 0; i < allFolders.length; i ++) {
        mkdirp(currentPath + '/cache' + allFolders[i], (err) => {
            console.log(err ? err : 'Succesfully create a directory: ' + allFolders[i])
        });
    }
}

function saveFileToLocal(name, fileBinary, callback) {
    fs.writeFile(currentPath + "/cache/" + name, fileBinary, "binary", function(err) {
        if(err) {
            console.log('Error happend in saving file to local!');
            callback(err, null)
        } else {
            console.log('file saved to local! ' + name);
            callback(null, currentPath + "/cache/" + name)
        }
    });
}




module.exports.initDropboxHandler = initDropboxHandler