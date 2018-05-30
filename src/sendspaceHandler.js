/**
 * Created by Le Pham Minh Duc on 31-May-18.
 */
let request = require('request')
let xml2js = require('xml2js');
let parser = new xml2js.Parser();

let myApiKey = 'M3AL0C04KU'
let baseRestfulApi = 'http://api.sendspace.com/rest/'

function getRequestTokenUrl() {
    return 'http://api.sendspace.com/rest/?method=auth.createtoken' +
    '&api_key=' + myApiKey +
    '&api_version=1.2&response_format=json&app_version=0.1'
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

getAppToken((err, token) => [
    console.log(token)
])