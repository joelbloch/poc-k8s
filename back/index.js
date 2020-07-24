const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const process = require('process');
const request = require('request');

const { v4: uuidv4 } = require('uuid');

const fs = require('fs');
const app = express();

const pg = require('pg')

app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const configPath = process.argv.slice(2)[0];
var config = require(configPath);

const logEnabled = config.trace.enabled;

var myPodName = process.env["MY_POD_NAME"];
if(!myPodName) myPodName = process.pid;
var myNodeName = process.env["MY_NODE_NAME"];
if(!myNodeName) {
    const os = require('os');
    myNodeName = os.hostname();
}

let Sessions = {};

const router = express.Router();

const processId = uuidv4();

const client = new pg.Client({
    user: config.db.user,
    host: config.db.host,
    database: config.db.database,
    password: config.db.password,
    port: config.db.port,
  });


function logSessions() {
    if(logEnabled)
        fs.appendFileSync('/log/back-log.txt', JSON.stringify(Object.keys(Sessions)) + '\n');
}

function log(msg) {

    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var formattedMsg = date + ' ' + time + ' - ' + myPodName + '.' + myNodeName + ' - ' + msg;
    
    console.log(formattedMsg);
    if (logEnabled) {
        var fileName = config.trace["file-name"];
        if(!fileName) fileName = 'sessions.txt';

        if(config.trace['file-name-policy'] == 'process') {
            fileName = '/log/' + myPodName + '-' + fileName;           
        } else {
            fileName = '/log/' + fileName;           
        }
        try {
            if(config.trace['write-sync']) {
                fs.appendFileSync(fileName, formattedMsg + '\n');
            } else {
                fs.appendFile(fileName, formattedMsg + '\n', () => {});
            }
        } catch(e) {            
        }
    }
}

client.connect();

client.query('SELECT NOW()', (err, res) => {
    log("connection to Db");
    if(err) {
        log("there was an error with db query" + err.stack);
    } else {
        log("Here is the db response " + res);
    }    
    client.end();
})


function deleteSession(sessionId, notifyManager) {
    log("deleting session " + sessionId);
    delete Sessions[sessionId];
    delete SessionTimeouts[sessionId];

    if(notifyManager && config["session-manager"]) {
        try {
            request.delete(config["session-manager"] + "/session/" + sessionId);
        } catch(e) {
            log(e);
        }
    }
}

router.get('*/counter', (req, res) => {

    var sessionId = req.cookies["session-id"];
    var sessionCounter = 0;

    if(sessionId) {
        log("receiving counter request from " + sessionId);
    }

    if(sessionId && Sessions[sessionId]) {
        sessionCounter = Sessions[sessionId].counter;
        log("Session " + sessionId + " has been found with counter " + sessionCounter);            
        if(Sessions[sessionId].timeout != null) {
            clearTimeout(Sessions[sessionId].timeout);
        }
    } else {
        if(sessionId) {
            log("Session " + sessionId + " is unknown, creating a new session");
        } else {
            log("New request without cookie received, creating session");
        }
        sessionId = uuidv4();
        if(config["session-manager"]) {
            request
            .post(config["session-manager"] + "/session/" + sessionId)
            .on("error", (err) => {log(err) });                 
         }     
    }      
    
    let sessionTimeout = null;
    if(config["session-timeout"] && config["session-timeout"] > 0) {
        log("Setting timeout for session " + sessionId);
        sessionTimeout = setTimeout(() => { 
            log("session " + sessionId + " has timed out");
            deleteSession(sessionId, true);
        }, config["session-timeout"] * 1000);
    }

    Sessions[sessionId] = {
        counter : sessionCounter + 1,
        lastAccess : Date.now(),
        timeout: sessionTimeout
    }

    logSessions();

    res.cookie("session-id", sessionId);
    res.set('pod-id', processId);
    res.status(200).send('counter : ' + sessionCounter + '<br><hr>sessionId : '+ sessionId + '<br><hr>process Id : ' + processId);  
});

router.delete('*/session', (req, res) => {
    var sessionId = req.cookies["session-id"];
    log('delete ' + sessionId);
    deleteSession(sessionId, false);
})

router.get('*/ping', (req, res) => {
    log('ping');
    res.end('<h1>pong</h1>');    
});

router.get('/*', (req, res) => {        
    log(req.originalUrl);
    res.end(req.originalUrl);    
})

app.use('/', router);

app.listen(config.port, () => {
    log("Backend Started on PORT " + config.port);
});