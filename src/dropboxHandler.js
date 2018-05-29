/**
 * Created by Le Pham Minh Duc on 29-May-18.
 */
require('isomorphic-fetch'); // or another library of choice.
let Dropbox = require('dropbox').Dropbox;

let myAccessToken = 'KU1I6ilkxrAAAAAAAAAADmph3aEctjmw5LrRrAxHBeBsLabN0w2rN2j8hVlt84NA';

let dbx = new Dropbox({ accessToken: myAccessToken });

let baseParam = {
    path: '',
    recursive: true,
    limit: 50
}

let downloadFileParam = {

}

let allFolders = []
let allFiles = []

let folderTag = 'folder'
let fileTag = 'file'

function isEntryFolder(entry) {
    return entry['.tag'] == folderTag
}

function isEntryFile(entry) {
    return entry['.tag'] == fileTag
}

let onErrorReceived = (error) => {
    console.log(error)
}

let onServerResponseReceived = (res) => {
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
            .then(onServerResponseReceived)
            .catch(onErrorReceived)
    } else {
        onListingCompleted()
    }
}

function listAllFoldersAndFiles(_accessToken) {
    allFolders = []
    allFiles = []
    new Dropbox({ accessToken: _accessToken })
    dbx.filesListFolder(baseParam)
        .then(onServerResponseReceived)
        .catch(onErrorReceived)
}

function onListingCompleted() {
    console.log('\n\non Listing Completed: All folder')
    console.log(allFolders)
    console.log('\nNumber of files')
    console.log(allFiles)
}

dbx.filesDownload({
    path: '/duc_dog.jpg'
}).then(response => {
    console.log(response)
}).catch(onErrorReceived)

// listAllFoldersAndFiles(myAccessToken)