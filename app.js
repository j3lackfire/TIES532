/**
 * Created by Le Pham Minh Duc on 21-May-18.
 */
const express = require('express');
const app = express();

const dropboxHandler = require('./src/dropboxHandler');

/*dependencies:
    express - basic to set up a server
    dropbox - for dropbox
    isometric-fetch - dropbox advice using this
    request - to send https requst to server
    form-data - form data to send file to sendspace
    xml2js - to parse the xml data from sendspace to json format. Easier to work with
    //both of this might not be neccessary if I just cached the files download to memory somehow
    mkdirp - to create a directory to save file and stuffs //only to test on local though
    fs - file system, to save file and stuffs
    crypto - for md5 encryption, requred by sendspace
 */

let dropboxAccessKey = 'KU1I6ilkxrAAAAAAAAAADmph3aEctjmw5LrRrAxHBeBsLabN0w2rN2j8hVlt84NA';
let sendspaceApiKey = 'M3AL0C04KU';

app.get('/', (req, res) => {
    res.json({
        message: 'Hello World!'
    });
});

app.get('/dropboxHandler', (req, res) => {
    dropboxHandler.initDropboxHandler(
        dropboxAccessKey,
        (_error, _message) => {
            if (_error) {
                res.json({
                    message: _message,
                    error: _error
                })
            } else {
                res.json({
                    message: _message,
                    error: 'No error'
                })
            }
        })
});

app.listen(3003);
console.log('Express app listening on port 3003');

