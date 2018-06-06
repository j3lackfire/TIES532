/**
 * Created by Le Pham Minh Duc on 05-Jun-18.
 */
let sendspaceHandler = require('./sendspaceHandler');
let dropboxHandler = require('./dropboxHandler')

let s = '/bascb/cav/d//alsvkj'

//dropbox will call this function
function compareFileWithSendspace(dropboxFiles, callback) {
    //should call a function to list all of the folders and file currently exist in the sendspace
    callback(null, dropboxFiles)
}

//duplicate the folders from dropbox to sendspace.
function duplicateFoldersToSendspace(dropboxFoldersInfo, callback) {
    console.log('Duplicate the folder from dropbox to sendspace')
    let folders = []
    for (let i = 0; i < dropboxFoldersInfo.length; i ++) {
        folders.push(_getFolderInfo(dropboxFoldersInfo[i].path))
    }
    folders.sort(function(a,b) {
        return a.depth - b.depth;
    })
    console.log(folders)
    sendspaceHandler.getFoldersInfo((err, info) => {
        if (err) {
            callback(err)
        } else {
            console.log(info)
            _createFolderSendSpaceRecursive(folders, info, 0, (err_1, res_1) => {
                if (err_1) {
                    callback(err_1)
                } else {
                    //do the things with folder
                    console.log('Successfully create all folders to sendspace')
                    callback(null, 'OK')
                }
            })
        }
    })
}

//root folder is the function that doesn't have parent folder
//which mean, if we split it, its length will be 2
function _getFolderInfo(folderPath) {
    let returnVal = {}
    let ss = folderPath.split('/')
    returnVal.name = ss[ss.length - 1]
    returnVal.parent = ss[ss.length - 2]
    returnVal.depth = ss.length - 2 //depth of 0 means root folder
    return returnVal
}

function _createFolderSendSpaceRecursive(folders, sendspaceInfo, index, callback) {
    if (!_isFolderExistInSendspace(folders[index].name, sendspaceInfo)) {
        console.log('Create a folder inside sendspace ' + folders[index].name)
        let sendspaceFolderId = folders[index].depth == 0 ? '0' : _getSendspaceFolderID(folders[index].parent, sendspaceInfo)
        console.log(folders[index])
        console.log(sendspaceFolderId)
        sendspaceHandler.createFolder(folders[index].name, sendspaceFolderId, (err_1, res_1) => {
            if (err_1) {
                console.error(err_1)
                callback(err_1)
            } else {
                if (index + 1 >= folders.length) {
                    callback(null, 'success')
                } else{
                    sendspaceHandler.getFoldersInfo((err_2, info_new) => {
                        if (err_2) {
                            callback(err_2)
                        } else {
                            _createFolderSendSpaceRecursive(folders, info_new, index + 1, callback)
                        }
                    })
                }
            }
        })
    } else {
        if (index + 1 >= folders.length) {
            callback(null, 'success')
        } else{
            _createFolderSendSpaceRecursive(folders, sendspaceInfo, index + 1, callback)
        }
    }
}

function _isFolderExistInSendspace(folderName, sendspaceFolders) {
    let isExist = false
    for (let i = 0; i < sendspaceFolders.length; i ++) {
        if (sendspaceFolders[i].name == 'Default' || sendspaceFolders[i].parent_folder_id != '0') {
            continue
        }
        if (sendspaceFolders[i].name == folderName) {
            isExist = true
            break
        }
    }
    return isExist
}

function _getSendspaceFolderID(folderName, sendspaceInfo) {
    for (let i = 0; i < sendspaceInfo.length; i ++) {
        if (sendspaceInfo[i].name == 'Default') {
            continue
        }
        if (sendspaceInfo[i].name == folderName) {
            return sendspaceInfo[i].id
        }
    }
    return ''
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