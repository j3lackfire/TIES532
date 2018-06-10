/**
 * Created by Le Pham Minh Duc on 05-Jun-18.
 */
let sendspaceHandler = require('./sendspaceHandler');
let dropboxHandler = require('./dropboxHandler')

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
    // console.log(folders)
    sendspaceHandler.getFoldersInfo((err, info) => {
        if (err) {
            callback(err)
        } else {
            // console.log(info)
            _createFolderSendSpaceRecursive(folders, info, 0, (err_1, res_1) => {
                if (err_1) {
                    callback(err_1)
                } else {
                    //do the things with folder
                    console.log('Successfully create all folders to sendspace')
                    callback(null)
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
        // console.log('Create a folder inside sendspace ' + folders[index].name)
        let sendspaceFolderId = folders[index].depth == 0 ? '0' : _getSendspaceFolderID(folders[index].parent, sendspaceInfo)
        // console.log(folders[index])
        // console.log(sendspaceFolderId)
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
        if (sendspaceFolders[i].name == 'Default') {
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
    return '0'
}

//dropbox will call this function
function getUnbackupedFiles(dropboxFiles, callback) {
    sendspaceHandler.getAllFiles((err, ssFiles) => {
        if (err) {
            console.error('Error getting files from sendspace server')
            callback(err, null)
        } else {
            let notExistFileList = []
            //dropbox files is Path_Display
            for (let i = 0; i < dropboxFiles.length; i ++) {
                let isFileExist = false
                for (let j = 0; j < ssFiles.length; j ++) {
                    if (_compareDropboxAndSsFiles(_analyzeDropboxFiles(dropboxFiles[i]), ssFiles[j])) {
                        isFileExist = true
                        break
                    }
                }
                if (!isFileExist) {
                    notExistFileList.push(_analyzeDropboxFiles(dropboxFiles[i]))
                }
            }
            console.log('\nBackup - ' + notExistFileList.length + ' - files / over - ' + dropboxFiles.length)
            callback(null, notExistFileList)
        }
    })
}

function _analyzeDropboxFiles(dropboxFiles) {
    let returnVal = {}
    returnVal.fullPath = dropboxFiles
    let ss = dropboxFiles.split('/')
    returnVal.name = ss[ss.length - 1]
    returnVal.folder = ss[ss.length - 2]
    return returnVal
}

function _compareDropboxAndSsFiles(dbFile, ssFile) {
    return ((dbFile.name == ssFile.name) && //must have the same name AND
        //same folder name or they are all at root
            ((dbFile.folder == '' && ssFile.folder_name == 'Default') || (dbFile.folder == ssFile.folder_name)))

    // if (dbFile.name != ssFile.name) {
    //     return false
    // }
    // if (dbFile.folder == '' && ssFile.folder_name == 'Default') {
    //     return true
    // } else {
    //     return (dbFile.folder == ssFile.folder_name)
    // }
}

function backupFilesToSendspace(dropboxFilesInfo, callback) {
    console.log('backup Files To Sendspace')
    sendspaceHandler.getFoldersInfo((err_1, ssFolderInfo) => {
        if (err_1) {
            callback(err_1, null)
        } else {
            _divideFilesByFolders(dropboxFilesInfo, ssFolderInfo, (pushingInfo) => {
                console.log('Divide files from dropbox into seperate folders.')
                // for (let i = 0; i < pushingInfo.length; i ++) {
                //     console.log(pushingInfo[i])
                // }
                _recursiveBackupFileToSendspace(pushingInfo, 0, (err_2, res_2)=> {
                    if (err_2) {
                        callback(err_2, null)
                    } else {
                        console.log('\n\nFinally, backup completed')
                        callback(null, res_2)
                    }
                })


            })
        }
    })

}

function _divideFilesByFolders(dropboxFiles, sendspaceFolderInfo, callback) {
    let returnList = []
    let firstVal = {}
    firstVal.folderName = 'Default'
    firstVal.folderId = '0'
    firstVal.fileList = []
    returnList.push(firstVal)
    for (let i = 0; i < dropboxFiles.length; i ++) {
        let folderIndex = _getFolderId(dropboxFiles[i], returnList)
        if (folderIndex == -1) {
            let myVal = {}
            myVal.folderName = dropboxFiles[i].folder
            myVal.folderId = _getSendspaceFolderID(dropboxFiles[i].folder, sendspaceFolderInfo)
            myVal.fileList = []
            let myFile = {}
            myFile.name = dropboxFiles[i].name
            myFile.path = dropboxFiles[i].localPath
            myVal.fileList.push(myFile)
            returnList.push(myVal)
        } else {
            let myFile = {}
            myFile.name = dropboxFiles[i].name
            myFile.path = dropboxFiles[i].localPath
            returnList[folderIndex].fileList.push(myFile)
        }
    }
    callback(returnList)
}

function _getFolderId(fileInfo, returnList) {
    for (let i = 0; i < returnList.length; i ++) {
        if ((returnList[i].folderName == fileInfo.folder) ||
            (returnList[i].folderName == 'Default' && fileInfo.folder == '')) {
            return i
        }
    }
    return -1
}

function _recursiveBackupFileToSendspace(pushingInfo, index, callback) {
    // console.log('Backup all file from folder - ' + pushingInfo.length)
    console.log(pushingInfo[index].folderId)
    let filesPathList = []
    for (let i = 0; i < pushingInfo[index].fileList.length; i ++) {
        filesPathList.push(pushingInfo[index].fileList[i].path)
    }

    if (filesPathList.length == 0) {
        if (index + 1 >= pushingInfo.length) {
            callback(null, 'OK')
        } else {
            _recursiveBackupFileToSendspace(pushingInfo, index + 1, callback)
        }
    } else {
        sendspaceHandler.uploadFiles(filesPathList, pushingInfo[index].folderId, (err, res) => {
            if (err) {
                callback(err, null)
            } else {
                console.log('Upload files to sendspace response: ')
                console.log(res)
                if (index + 1 >= pushingInfo.length) {
                    callback(null, 'OK')
                } else {
                    setTimeout(() => {
                        _recursiveBackupFileToSendspace(pushingInfo, index + 1, callback)
                    }, 5000);

                }
            }
        })
    }
}

module.exports.backupFilesToSendspace = backupFilesToSendspace;
module.exports.duplicateFoldersToSendspace = duplicateFoldersToSendspace
module.exports.getUnbackupedFiles = getUnbackupedFiles;