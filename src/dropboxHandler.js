/**
 * Created by Le Pham Minh Duc on 29-May-18.
 */
require('isomorphic-fetch'); // or another library of choice.
let fs = require('fs')
let mkdirp = require('mkdirp');
let Dropbox = require('dropbox').Dropbox;

let myAccessToken = 'KU1I6ilkxrAAAAAAAAAADmph3aEctjmw5LrRrAxHBeBsLabN0w2rN2j8hVlt84NA';

let dbx = new Dropbox({ accessToken: myAccessToken });

let baseParam = {
    path: '',
    recursive: true,
    limit: 50
}

let allFolders = []
let allFiles = []

let folderTag = 'folder'
let fileTag = 'file'

function isEntryFolder(entry) { return entry['.tag'] == folderTag }

function isEntryFile(entry) { return entry['.tag'] == fileTag }

let onErrorReceived = (error) => { console.log(error) }

let onServerResponseReceived = (res, callback) => {
    console.log('onServerResponseReceived ')
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

function getDownloadFileParam(name) { return {path:name} }

function downloadFileSingle(path, callback) {
    dbx.filesDownload(getDownloadFileParam(path))
        .then((response) => {
        saveFileToLocal(response.path_lower, response.fileBinary, callback)
    }).catch(onErrorReceived)

}

function makeDirectory() {
    for (let i = 0; i < allFolders.length; i ++) {
        mkdirp('cache' + allFolders[i], (err) => {
            console.log(err ? err : 'Succesfully create a directory: ' + allFolders[i])
        });
    }
}

function saveFileToLocal(name, fileBinary, callback) {
    fs.writeFile("cache/" + name, fileBinary, "binary", function(err) {
        if(err) {
            console.log('Error happend in saving file to local!');
            callback(err)
        } else {
            console.log('file saved to local! ' + name);
            callback(null)
        }
    });
}

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


//this function is called when the dropbox handler init is complete
function onListingCompleted(callback) {
    console.log('Finish getting all the meta data from dropbox server')
    console.log('Start making directory')
    makeDirectory()
    let totalNumberOfFiles = allFiles.length
    let numberOfSuccess = 0;
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

module.exports.initDropboxHandler = initDropboxHandler