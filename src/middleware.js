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
    //first, list all the files
    let filesPathList = []
    for (let i = 0; i < dropboxFilesInfo.length; i ++) {
        filesPathList.push(dropboxFilesInfo[i].localPath)
    }
    sendspaceHandler.uploadFiles(filesPathList, '0', (err, sendspace_raw_response) => {
        console.log('Completed upload all files to sendspace under the main folder!')
        // console.log(sendspace_raw_response)
        _sendspaceResponseHandler(sendspace_raw_response, (err_2, sendspaceFileList) => {
            _sendspace_moveFilesToCorrectFolder(dropboxFilesInfo, sendspaceFileList, callback)
        })
    })
}

function _sendspaceResponseHandler(raw_response, callback) {
    let splitedString = raw_response.split(/\r?\n/)
    if (splitedString[0] != 'upload_status=ok') {
        callback('Error', null)
        return
    }
    //the first line is the upload status
    //the last 4 lines are just some random info
    //the line for each file are grouped in a 2 tople
    //id and then name.
    let ssFileList = []
    for (let i = 1; i < (splitedString.length - 4) / 2; i ++) {
        let val = {}
        val.id = splitedString[2 * i - 1].split('=')[1]
        val.name = splitedString[2 * i].split('=')[1]
        ssFileList.push(val)
    }
    callback(null, ssFileList)
}

function _sendspace_moveFilesToCorrectFolder(dropboxFilesInfo, sendspaceFileList, callback) {
    console.log('Movings file in sendspace to the correct folder')
    sendspaceHandler.getFoldersInfo((err_1, ssFolderInfo) => {
        if (err_1) {
            callback(err_1, null)
        } else {
            _divideFilesByFolders(dropboxFilesInfo, ssFolderInfo, sendspaceFileList, (pushingInfo) => {
                console.log('Divide files from dropbox into seperate folders.')
                // for (let i = 0; i < pushingInfo.length; i ++) {
                //     console.log(pushingInfo[i])
                // }
                _recursiveMoveFilesToCorrectFolder(pushingInfo, 0, (err_2, res_2)=> {
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

function _divideFilesByFolders(dropboxFiles, sendspaceFolderInfo, sendspaceFilesInfo, callback) {
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
            myFile.id = _getFileId(dropboxFiles[i].name, sendspaceFilesInfo)
            myVal.fileList.push(myFile)
            returnList.push(myVal)
        } else {
            let myFile = {}
            myFile.name = dropboxFiles[i].name
            myFile.path = dropboxFiles[i].localPath
            myFile.id = _getFileId(dropboxFiles[i].name, sendspaceFilesInfo)
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

function _getFileId(fileName, sendspaceFilesInfo) {
    for (let i = 0; i < sendspaceFilesInfo.length; i ++) {
        if (fileName == sendspaceFilesInfo[i].name) {
            return sendspaceFilesInfo[i].id
        }
    }
    return -1
}

function _recursiveMoveFilesToCorrectFolder(pushingInfo, index, callback) {
    // console.log('Backup all file from folder - ' + pushingInfo.length)
    let filesIdList = []
    for (let i = 0; i < pushingInfo[index].fileList.length; i ++) {
        filesIdList.push(pushingInfo[index].fileList[i].id)
    }

    if (filesIdList.length == 0) { //in case of empty folder
        if (index + 1 >= pushingInfo.length) {
            callback(null, 'OK')
        } else {
            _recursiveMoveFilesToCorrectFolder(pushingInfo, index + 1, callback)
        }
    } else {
        sendspaceHandler.moveFilesToFolder(filesIdList, pushingInfo[index].folderId, (err, res) => {
            if (err) {
                callback(err, null)
            } else {
                // console.log('Upload files to sendspace response: ')
                // console.log(res)
                if (index + 1 >= pushingInfo.length) {
                    callback(null, 'OK')
                } else {
                    _recursiveMoveFilesToCorrectFolder(pushingInfo, index + 1, callback)
                }
            }
        })
    }
}

module.exports.backupFilesToSendspace = backupFilesToSendspace;
module.exports.duplicateFoldersToSendspace = duplicateFoldersToSendspace
module.exports.getUnbackupedFiles = getUnbackupedFiles;