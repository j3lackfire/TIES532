/**
 * Created by Le Pham Minh Duc on 05-Jun-18.
 */
let sendspaceHandler = require('./sendspaceHandler');
let dropboxHandler = require('./dropboxHandler')

//dropbox will call this function
function compareFileWithSendspace(dropboxFiles, callback) {
    //should call a function to list all of the folders and file currently exist in the sendspace
    callback(null, dropboxFiles)
}

function backupFilesToSendspace(allFilePaths, callback) {
    console.log('backupFilesToSendspace')
    sendspaceHandler.uploadFiles(allFilePaths, (err, res) => {
        if (err) {
            callback(err, null)
        } else {
            callback(null, 'The backup process is completed, ' + allFilePaths.length + ' files is copied')
        }

    })
}

module.exports.backupFilesToSendspace = backupFilesToSendspace;