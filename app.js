/**
 * Created by Le Pham Minh Duc on 21-May-18.
 */
const express = require('express');
const app = express();

/*dependencies:
    express - basic to set up a server
    dropbox - for dropbox
    isometric-fetch - dropbox advice using this
    mkdirp - to create a directory to save file and stuffs //only to test on local though
 */

app.get('/', function(req, res){
    res.send("Hello world!");
});

app.listen(3003);
console.log('Express app listening on port 3003')