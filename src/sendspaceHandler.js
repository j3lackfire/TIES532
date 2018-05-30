/**
 * Created by Le Pham Minh Duc on 31-May-18.
 */
var crypto = require('crypto')
let request = require('request')
let xml2js = require('xml2js');
let parser = new xml2js.Parser();

let myUserName = 'minhduc.gameregistry@gmail.com'
let myApiKey = 'M3AL0C04KU'
let baseRestfulApi = 'http://api.sendspace.com/rest/'
let myPasswordMd5 = '6be3c296bfa4c35c1b5fcdbd1bc989a8'

function getRequestTokenUrl() {
    return 'http://api.sendspace.com/rest/?method=auth.createtoken' +
    '&api_key=' + myApiKey +
    '&api_version=1.2&response_format=json&app_version=0.1'
}

function logInRequest(token, username, tokenPass) {
    return 'http://api.sendspace.com/rest/?method=auth.login&' +
        'token=' + token +
        '&user_name=' + username +
        '&tokened_password=' + tokenPass
}

function getAppToken(callback) {
    request(getRequestTokenUrl(), (error, response, body) => {
        if (error) {
            console.log('Error requesting token from the sendspace server')
            callback(error, null)
        } else {
            parser.parseString(body, function (err, result) {
                callback(null, result.result.token[0])
            });
        }
    })
}

function login(callback) {
    getAppToken((err, token) => {
        let tokenPass = crypto.createHash('md5').update(token + myPasswordMd5).digest('hex')
        console.log('Token: ' + token)
        console.log('Token pass: ' + tokenPass)
        console.log(logInRequest(token, myUserName, tokenPass))
        request(logInRequest(token, myUserName, tokenPass), (error, response, body) => {
            if (error) {
                console.log('Error logging into the Sendspace')
                callback(error, null)
            } else {
                parser.parseString(body, function (err_2, result) {
                    callback(null, result.result.session_key)
                });
            }
        })
    })
}

login((err, res) => {
    console.log(res)
})




