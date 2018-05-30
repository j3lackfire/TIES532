/**
 * Created by Le Pham Minh Duc on 21-May-18.
 */
const express = require('express');
const app = express();

const dropboxHandler = require('./src/dropboxHandler')

/*dependencies:
    express - basic to set up a server
    dropbox - for dropbox
    isometric-fetch - dropbox advice using this
    //both of this might not be neccessary if I just cached the files download to memory somehow
    mkdirp - to create a directory to save file and stuffs //only to test on local though
    fs - file system, to save file and stuffs
 */

app.get('/', (req, res) => {
    res.json({
        message: 'Hello World!'
    });
});

app.get('/dropboxHandler', (req, res) => {
    dropboxHandler.initDropboxHandler(
        'KU1I6ilkxrAAAAAAAAAADmph3aEctjmw5LrRrAxHBeBsLabN0w2rN2j8hVlt84NA',
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
})

app.listen(3003);
console.log('Express app listening on port 3003')