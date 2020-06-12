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
let SessionTimeouts = {};

const router = express.Router();

function log(msg) {
    console.log(msg);
    if(logEnabled) {
        fs.appendFile('/log/back-log.txt',msg + '\n');
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
    var cookie = req.cookies["session-id"];
    if(cookie && SessionTimeouts[cookie]) {
        clearTimeout(SessionTimeouts[cookie]);        
    }

    if(!cookie || !Sessions[cookie]) {
        sessionId = uuidv4();
        Sessions[sessionId] = {
            counter : 0          
        };
        if(config["session-manager"]) {
           try {
                request.post(config["session-manager"] + "/session/" + sessionId);
            } catch(e) {
                log(e);
            }
        }
    }
    const sessionCounter = Sessions[sessionId].counter;

    log('session ' + sessionId + ' => new counter value : ' + sessionCounter);

    Sessions[sessionId] = {
        counter : sessionCounter + 1,
        lastAccess : Date.now()
    }

    SessionTimeouts[sessionId] 
        = setTimeout(() => { 
            log("session " + sessionId + " has timed out");
            deleteSession(sessionId, true);
        }, 
        config["session-timeout"] * 1000);

    res.cookie("session-id", sessionId);    
    res.status(200).send('counter : ' + sessionCounter + '<br><hr>sessionId : '+ sessionId + '<br><hr>');
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