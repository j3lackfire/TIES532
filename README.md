# TIES532
RESTful Web Services - backup from Dropbox to Sendspace

The project is creating using NodeJs with these custom libraries:
    express - basic to set up a server
    dropbox - for dropbox
    isometric-fetch - dropbox advice using this
    request - to send https requst to server
    form-data - form data to send file to sendspace
    xml2js - to parse the xml data from sendspace to json format. Easier to work with
    mkdirp - to create a directory to save file and stuffs //only to test on local though
    fs - file system, to save file and stuffs
    crypto - for md5 encryption, requred by sendspace
    cors - cross platform something, so that my frontend can call to this backend

Usesage:
Clone the project using git:
    git clone https://github.com/j3lackfire/TIES532.git
    
Install all the neccessary dependencies: (require NodeJS, get it here: https://nodejs.org/en/) 
    npm install
    
Run the project:
    npm start run
    
The server is now listening in port 3003:
    You can test the server by sending a request to - which will return a HelloWorld
    http://localhost:3003/
    
The backend is uploaded to IBM Cloud, which is quite good for continuous development.

As Ibm requires, I also uploaded this project into their git system and fix it a little bit so that it can upload to their cloud.

The link to the git project on ibm server is here:

    https://git.eu-gb.bluemix.net/minhduc.lepham/MinhDucDropboxBackup

