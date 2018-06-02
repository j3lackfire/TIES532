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
let baseRestfulApi = 'http://api.sendspace.com/rest/';
let myPasswordMd5 = '6be3c296bfa4c35c1b5fcdbd1bc989a8';
let sessionKey = 'olnqkn2dvhhvzkwcro60aozxuxnemi61';

function getRequestTokenUrl() {
    return 'http://api.sendspace.com/rest/?method=auth.createtoken' +
        '&api_key=' + myApiKey +
        '&api_version=1.2&response_format=json&app_version=0.1'
}

function getLogInRequestUrl(token, username, tokenPass) {
    return 'http://api.sendspace.com/rest/?method=auth.login&' +
        'token=' + token +
        '&user_name=' + username +
        '&tokened_password=' + tokenPass
}

function getAppToken(callback) {
    request(getRequestTokenUrl(), (error, response, body) => {
        console.log(getRequestTokenUrl());
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

function checkSession(sessionKey, callback) {
    request(
        'http://api.sendspace.com/rest/?method=auth.checksession&session_key=' + sessionKey,
        (error, response, body) => {
            if (error) {
                console.log('Error checking the session key')
                callback(error, null)
            } else {
                parser.parseString(body, function (err, result) {
                    console.log(result.result)
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
    getAppToken((err, token) => {
        let tokenPass = crypto.createHash('md5').update(token + myPasswordMd5).digest('hex')
        console.log('Token: ' + token)
        console.log('Token pass: ' + tokenPass)
        console.log(getLogInRequestUrl(token, myUserName, tokenPass))
        request(getLogInRequestUrl(token, myUserName, tokenPass), (error, response, body) => {
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
                            callback(null, result.result.session_key[0])
                        }
                    }
                })
            }
        })
    })
}

function uploadInfoUrl(sessionKey) {
    return 'http://api.sendspace.com/rest/?method=upload.getinfo' +
        '&session_key=' + sessionKey +
        '&speed_limit=0'
}

function getUploadInfo(sessionKey, callback) {
    request(uploadInfoUrl(sessionKey), (err, result, body) => {
        parser.parseString(body, function (err_2, result) {
            callback(null, result.result)
        });
    })
}

function uploadFileSingle(filePath, callback) {
    sendspaceLogin((err, res) => {
        if (err) {
            console.log('Error logging in sendspace!');
            callback(err)
        } else {
            getUploadInfo(res, (err, res) => {
                //sendspace response data and this xml parser tool are weird :/
                _uploadFile(filePath, res.upload[0].$, callback)
            })
        }
    })
}

function _uploadFile(filePath, uploadInfo, callback) {
    console.log('\n\nRequest post');
    console.log(uploadInfo);

    let req = request.post(
        uploadInfo.url,
        (err, httpResponse, body) => {
            if (err) {
                console.log('Error uploading data to Sendspace!');
                callback(err, 'Error uploading data to Sendspace!')
            } else {
                console.log('Successfully upload data to the Sendspace server!');
                console.log(body);
                console.log('\n\n**************\n\n');
                callback(null, body);
            }
        });
    let form = req.form();

    form.append('MAX_FILE_SIZE', uploadInfo.max_file_size);
    form.append('UPLOAD_IDENTIFIER', uploadInfo.upload_identifier);
    form.append('extra_info', uploadInfo.extra_info);
    // form.append('UPLOAD_IDENTIFIER', 'ascb;alskcjb')
    // form.append('extra_info', ';alxkcjb;lakjcb')
    form.append('userfile',
        fs.createReadStream(filePath),
        {
            fileName: 'MyFile.jpg',
            contentType: 'binary'
        }
    );
}

// uploadFileSingle(null, () => {})

// checkSession(sessionKey, (error, returnBool) => {
//     if (returnBool) console.log('Session is ok')
// })

// authLogout(sessionKey, (error, returnBool) => {
//     console.log('Log out')
// })

module.exports.uploadFileSingle = uploadFileSingle;