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

//duplicate the folders from dropbox to sendspace.
function duplicateFoldersToSendspace(dropboxFolders, callback) {

}

function backupFilesToSendspace(allFilePaths, callback) {
    console.log('backupFilesToSendspace')
    sendspaceHandler.uploadFiles(allFilePaths, (err, res) => {
        if (err) {
            callback(err, null)
        } else {
            console.log('The backup process is completed, ' + allFilePaths.length + ' files is copied')
            callback(null, res)
            //also delete all the file on local as well, to not waste hdd
        }
    })
}

module.exports.backupFilesToSendspace = backupFilesToSendspace;
module.exports.duplicateFoldersToSendspace = duplicateFoldersToSendspace;