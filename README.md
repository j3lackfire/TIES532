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

As Ibm requires, I also uploaded this project into their git system and fix it a little bit so that it can upload to their cloud. It's quite nice, you just push the code into the main branch in ibm git and it will automatically build the server and deployed it on the ibm cloud for you.

The link to the git project on ibm server is here:

    https://git.eu-gb.bluemix.net/minhduc.lepham/MinhDucDropboxBackup

Usage:
First, you need to init the service by calling:
    
    /initall
    
This is a GET request that will requires 4 variables packed inside the request headers:

    dropboxAccessKey:KU1I6ilkxrAAAAAAAAAADmph3aEctjmw5LrRrAxHBeBsLabN0w2rN2j8hVlt84NA
    sendspaceUserName:minhduc.gameregistry@gmail.com
    sendSpaceApiKey:M3AL0C04KU
    sendspaceMd5Password:6be3c296bfa4c35c1b5fcdbd1bc989a8
    
In which, the Dropbox Access Key is the key you get for registering dropbox account
Sendspace username is the sendspace username
Sendspace API key is the API key
Sendspace password md5 is the password you logged in your sendspace account but hashed into md5. This is needed for their function as well.

After sending the /initall request to server and get a succesful response, send a /backup request to server to start the backup. The server will notify back the result or any error happens during the way.

    http://minhducdropboxbackup.eu-gb.mybluemix.net/initall
    http://minhducdropboxbackup.eu-gb.mybluemix.net/backup
    
