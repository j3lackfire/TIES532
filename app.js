/**
 * Created by Le Pham Minh Duc on 21-May-18.
 */
const express = require('express');
const app = express();

app.get('/', function(req, res){
    res.send("Hello world!");
});

app.listen(3003);
console.log('Express app listening on port 3003')