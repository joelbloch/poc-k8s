const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const process = require('process');
const request = require('request');

const { v4: uuidv4 } = require('uuid');

const fs = require('fs');
const app = express();

app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const configPath = process.argv.slice(2)[0];
var config = require(configPath);

const logEnabled = config.enableLog;

let Sessions = {};

const router = express.Router();

const processId = uuidv4();

function logSessions() {
    if(logEnabled)
        fs.appendFileSync('/log/back-log.txt', JSON.stringify(Object.keys(Sessions)) + '\n');
}

function log(msg) {

    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var msgWithDate = date + ' ' + time + ' - ' + msg;
    
    console.log(msgWithDate);
    if(logEnabled) {
        fs.appendFileSync('/log/session-log.txt', msgWithDate + '\n');
    }
}

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
        if(Sessions[sessionId]) {                        
            sessionCounter = Sessions[sessionId].counter;
            log("Session " + sessionId + " has been found with counter " + sessionCounter);            
            if(Sessions[sessionId].timeout != null) {
                clearTimeout(Sessions[sessionId].timeout);
            }
        } else {
            log("Session " + sessionId + " is unknown, creating a new session");
            sessionId = uuidv4();
            if(config["session-manager"]) {
                request
                .post(config["session-manager"] + "/session/" + sessionId)
                .on("error", (err) => {log(err) });                 
             }     
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