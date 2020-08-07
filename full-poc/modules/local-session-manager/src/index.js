const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const process = require('process');
const os = require('os');
const fs = require('fs');
const request = require('request');
const net = require('net');
const JsonSocket = require('json-socket');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const configPath = process.argv.slice(2)[0];
var config = require(configPath);
const logEnabled = config.trace.enabled;

let Sessions = {};

var sessionManagerConnected = false;

var myPodName = process.env["MY_POD_NAME"];
if(!myPodName) myPodName = process.pid;
var myNodeName = process.env["MY_NODE_NAME"];
if(!myNodeName) {
    const os = require('os');
    myNodeName = os.hostname();
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
        } catch(e) {}
    }
}
/**
 * Definition of routes
 */

const router = express.Router();

router.post('*/session/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    if (sessionId in Sessions) {
        const msg = "Session " + sessionId + " already exists";
        log(msg);
        res.status(409).send(msg);
    } else {
        Sessions[sessionId] = sessionId;
        const msg = "Session " + sessionId + " has been successfully registered";
        log(msg);
        res.status(200).send(msg);
    }
})

router.delete('*/session/:sessionId', (req, res) => {
    var sessionId = req.params.sessionId;
    if (sessionId in Sessions) {
        delete Sessions[sessionId];
        const msg = "Session " + sessionId + " has been successfully deleted";
        log(msg);
        res.status(200).send(msg);
    } else {
        const msg = "Session " + sessionId + " does not exist";
        log(msg);
        res.status(403).send(msg);
    }
});

router.get('*/sessions', (req, res) => {
    log("receiving request to get all sessions infos");
    res.status(200).end(JSON.stringify(Sessions));
})

app.use('/', router);

async function establishTcpConnectionWithSessionManager(url, tcpPort) {
    const socket = new JsonSocket(new net.Socket());
    return new Promise((resolve, reject) => {
        try {
            socket.on('message', (msg)=> {
                log("Receiving tcp message " + JSON.stringify(msg));
                if(msg.question) {
                    const allSessions = Object.keys(Sessions);
                    socket.sendMessage({
                        podName : getMyPodName(),
                        nodeName : getMyNodeName(),
                        sessions : allSessions
                    });
                }
            });

            socket.on('error', (error) => log(error));

            socket.on('close', () => {
                log('Tcp connection with Session Manager was closed, reconnecting');
                sessionManagerConnected = false;
                doConnectToSessionManager();
            });

            socket.on('connect', () => {
                log("Tcp connection is established with central server");
                resolve(true);
            });

            socket.connect( {
                port : tcpPort, 
                host : 'session-mgt-svc'});
                //host : url});
            
        } catch(e) {
            reject(e);
        }
    });
}

async function registerPod() {
    log("Sending http post request to register pod");

    return new Promise((resolve, reject) => {
        request.post({
            headers: { 'content-type': 'application/json' },
            url: config.sessionManager.url + "/pod/" + getMyPodName(),
            body: JSON.stringify(
                {
                    podName: getMyPodName(),
                    nodeName: getMyNodeName()
                })
        }, async function (err, httpResponse, body) {
            if (err) reject(err);
            
            if (httpResponse && httpResponse.statusCode == 200) {
                const infos = JSON.parse(body)
                if(infos && infos.host && infos.tcpPort) {
                    log("Receiving HTTP response from Session manager with tcp infos " + infos.host + ':' + infos.tcpPort);
                    try {
                        // const connected = true;
                        const connected = await establishTcpConnectionWithSessionManager(infos.host, infos.tcpPort);
                        resolve(connected);
                        
                        // if(connected) {
                        //     log("Successfully sent http request to Central Manager");
                        // }
                        // resolve(connected);
                    } catch(e) {
                        reject(e);
                    }                                    
                } else {
                    reject("registerPod => Cannot read host and tcpPort from Session Manager response");
                }                                
            } else {                
                reject("registerPod => Failed to registered pod onto session manager");
            }
        }).on("error", (err) => { reject(err) });
    })
}

async function doConnectToSessionManager() {
    if (!sessionManagerConnected) {
        try {
            sessionManagerConnected = await registerPod();
            if (!sessionManagerConnected) connectToSessionManager();
        } catch (e) {
            log(e);
            connectToSessionManager();   
        }
    }
}

function connectToSessionManager() {
    setTimeout(() => doConnectToSessionManager(), 2000);
}

function traceSessions() {
    if(config["trace-sessions"]) {
        setInterval(
            () =>log("Sessions " + JSON.stringify(Sessions)), 
            1500);
    }
}

app.listen(config.port, () => {
    log(config.appName + " started on PORT " + config.port);    
    traceSessions();
    connectToSessionManager();    
});


