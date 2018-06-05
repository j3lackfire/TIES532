/**
 * Created by Le Pham Minh Duc on 31-May-18.
 */
let crypto = require('crypto');
let request = require('request');
let xml2js = require('xml2js');
let parser = new xml2js.Parser();
let fs = require('fs');
let stream = require('stream');
let FormData = require('form-data');

let myUserName = 'minhduc.gameregistry@gmail.com';
let myApiKey = 'M3AL0C04KU';

// let myUserName = 'minhduc.lepham@gmail.com';
// let myApiKey = 'HR7J2LQPQE';

let baseRestfulApi = 'http://api.sendspace.com/rest/';
let myPasswordMd5 = '6be3c296bfa4c35c1b5fcdbd1bc989a8';
let sessionKey = '';
let uploadInfo = {};

// initialize sendspace first
_loginAndGetUploadInfo((err, res) => {
    if (err) {
        console.error(err)
    } else {
        console.log('Init sendspace successfully')
        console.log(sessionKey)
        console.log(uploadInfo)
    }
})

// getFoldersInfo((err, res) => {
//     if (err) {
//         console.error(err)
//     } else {
//         console.log(res)
//     }
// })

function checkSession(sessionKey, callback) {
    request(
        'http://api.sendspace.com/rest/?method=auth.checksession&session_key=' + sessionKey,
        (error, response, body) => {
            if (error) {
                console.log('Error checking the session key')
                callback(error, null)
            } else {
                parser.parseString(body, function (err, result) {
                    // console.log(result.result)
                    callback(null, result.result.session[0] == 'ok')
                });
            }
        })
}

function authLogout(sessionKey, callback) {
    request(
        'http://api.sendspace.com/rest/?method=auth.logout&session_key=' + sessionKey,
        (error, response, body) => {
            if (error) {
                console.log('Error Logging out')
                callback(error, null)
            } else {
                parser.parseString(body, function (err, result) {
                    console.log(result.result)
                    callback(null, result.result)
                });
            }
        })
}

function sendspaceLogin(callback) {
    requestAppToken((err, token) => {
        let tokenPass = crypto.createHash('md5').update(token + myPasswordMd5).digest('hex')
        console.log('Token: ' + token)
        console.log('Token pass: ' + tokenPass)
        // console.log(_getLogInRequestUrl(token, myUserName, tokenPass))
        request(_getLogInRequestUrl(token, myUserName, tokenPass), (error, response, body) => {
            if (error) {
                console.log('Error logging into the Sendspace')
                callback(error, null)
            } else {
                parser.parseString(body, function (err_2, result) {
                    if (err_2) {
                        console.log('Error when parsing xml data to json')
                        callback(err_2, null)
                    } else {
                        if (result.result.error) {
                            console.log('Error logging into the Sendspace')
                            console.log(result.result.error[0])
                            callback(result.result.error[0], null)
                        } else {
                            sessionKey = result.result.session_key[0];
                            console.log('\n\n******************\nSession key:')
                            console.log(sessionKey)
                            console.log('\n\n******************\n')
                            callback(null, result.result.session_key[0])
                        }
                    }
                })
            }
        })
    })
}

function requestAppToken(callback) {
    request(_getRequestTokenUrl(), (error, response, body) => {
        console.log(_getRequestTokenUrl());
        if (error) {
            console.log('Error requesting token from the sendspace server');
            callback(error, null)
        } else {
            parser.parseString(body, function (err, result) {
                callback(null, result.result.token[0])
            });
        }
    })
}

function _getSessionKey(callback) {
    if (sessionKey === '') {
        sendspaceLogin((err, res) => {
            callback(err ? null : res)
        })
    } else {
        checkSession(sessionKey, (err, result) => {
            if (err) {
                callback(null)
            } else {
                if (!result) {
                    sendspaceLogin((err, res) => {
                        callback(err ? null : res)
                    })
                } else {
                    callback(sessionKey)
                }
            }
        })
    }
}

function _getRequestTokenUrl() {
    return 'http://api.sendspace.com/rest/?method=auth.createtoken' +
        '&api_key=' + myApiKey +
        '&api_version=1.2&response_format=json&app_version=0.1'
}

function _getLogInRequestUrl(token, username, tokenPass) {
    return 'http://api.sendspace.com/rest/?method=auth.login&' +
        'token=' + token +
        '&user_name=' + username +
        '&tokened_password=' + tokenPass
}

function _sendspaceResponseParser(error, response, body, callback) {
    parser.parseString(body, function (err_2, result) {
        if (err_2) {
            console.log('Error when parsing xml data to json')
            callback(err_2, null)
        } else {
            if (result.result.error) {
                console.error('Error with the Sendspace response')
                console.error(result.result.error[0])
                callback(result.result.error[0], null)
            } else {
                callback(null, result.result)
            }
        }
    })
}

function getFoldersInfo(callback) {
    _getSessionKey((_session) => {
        request('http://api.sendspace.com/rest/?method=folders.getall&session_key=' + _session,
            (error, response, body) => {
                _sendspaceResponseParser(error, response, body, (err_1, res_1) => {
                    if (err_1) {
                        callback(err_1, null)
                    } else {
                        let returnArray = []
                        for (let i = 0; i < res_1.folder.length; i ++) {
                            returnArray.push(res_1.folder[i].$)
                        }
                        callback(null, returnArray)
                    }
                })
            }
        )
    })
}

//TODO
function getFolderId(folderName, callback) {
    getFoldersInfo((err, allFolders) => {
        for (let i = 0; i < allFolders.length; i ++) {
            //if the list has it, return the id
            callback(i)
            return
        }
        callback(-1)
    })
}

function createFolder(folderPath, parentPath, callback) {

}

function uploadFiles(filePath, callback) {
    if (sessionKey === '') {
        _loginAndGetUploadInfo((err, res) => {
            if (err) {
                callback(err, null)
            } else {
                uploadFiles(filePath, callback)
            }
        })
    } else {
        checkSession(sessionKey, (err, result) => {
            if (err || !result) {
                _loginAndGetUploadInfo((err, res) => {
                    if (err) {
                        callback(err, null)
                    } else {
                        uploadFiles(filePath, callback)
                    }
                })
            } else {
                _uploadMultipleFiles(filePath, uploadInfo, callback)
            }
        })
    }
}

function _loginAndGetUploadInfo(callback) {
    sendspaceLogin((err, res) => {
        if (err) {
            console.error('Error logging in sendspace!');
            callback(err, null)
        } else {
            requestUploadInfo(res, (err_1, res_1) => {
                if (err_1) {
                    console.error('Error requesting upload info from sendspace')
                    callback(err_1, 'Error requesting upload info from sendspace')
                } else {
                    callback(null, res_1)
                }
            })
        }
    })
}

function requestUploadInfo(sessionKey, callback) {
    request(_getUploadInfoUrl(sessionKey), (err, result, body) => {
        parser.parseString(body, function (err_2, result) {
            uploadInfo = result.result.upload[0].$
            callback(null, result.result.upload[0].$)
        });
    })
}

function _getUploadInfoUrl(sessionKey) {
    return 'http://api.sendspace.com/rest/?method=upload.getinfo' +
        '&session_key=' + sessionKey +
        '&speed_limit=0'
}

function _uploadMultipleFiles(filesPath, uploadInfo, callback) {
    let req = request.post(
        uploadInfo.url,
        (err, httpResponse, body) => {
            if (err) {
                console.log('Error uploading data to Sendspace!');
                console.error(err);
                callback(err, 'Error uploading data to Sendspace!')
            } else {
                console.log('Successfully upload data to the Sendspace server!');
                console.log(body);
                console.log('\n\n+++++++++++++++++++++++++\n');
                callback(null, body);
            }
        });
    let form = req.form();

    form.append('MAX_FILE_SIZE', uploadInfo.max_file_size);
    form.append('UPLOAD_IDENTIFIER', uploadInfo.upload_identifier);
    form.append('extra_info', uploadInfo.extra_info);
    form.append('userfile',
        fs.createReadStream(filesPath[0]),
        {
            fileName: filesPath[0],
            contentType: 'binary'
        }
    );

    for (let i = 1; i < filesPath.length; i ++) {
        form.append('userfile' + (i+1).toString(),
            fs.createReadStream(filesPath[i]),
            {
                fileName: filesPath[i],
                contentType: 'binary'
            }
        );
    }
}

// uploadFiles(null, () => {})

// checkSession(sessionKey, (error, returnBool) => {
//     if (returnBool) console.log('Session is ok')
// })

// authLogout(sessionKey, (error, returnBool) => {
//     console.log('Log out')
// })

module.exports.uploadFiles = uploadFiles;