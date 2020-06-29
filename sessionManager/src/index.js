const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const process = require('process');
const request = require('request');
const fs = require('fs');
const net = require('net');
const JsonSocket = require('json-socket');

const app = express();

app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const configPath = process.argv.slice(2)[0];
const config = require(configPath);
const logEnabled = config.trace.enabled;
const router = express.Router();

var SessionsByPod = {};
var PodBySessions = {};
var Pods = {};
var availableTcpPorts = [3005, 3006, 3007, 3008, 3009, 3010, 3011, 3012, 3013, 3014];

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

function getSessionCount() {
    return Object.keys(PodBySessions).length;
}

function evictPod(podName) {
    log(podName + " - Evicting pod ");
    if(Pods[podName]) {       
        SessionsByPod[podName] = {};

        Object.keys(PodBySessions)
        .filter((sessionId => PodBySessions[sessionId] = podName))
        .forEach(sessionId => delete PodBySessions[sessionId]);

        delete Pods[podName];

        log(podName + " - Pod has been successfully evicted");
    } else {
        log(podName + " - Pod cannot be evicted, it is not registered");
    }
}

function storePod(podName, nodeName, tcpPort) {   

    Pods[podName] = {
        podName: podName,       
        nodeName: nodeName,
        port : tcpPort
    };
}

function processPodInfo(podName, nodeName, sessions) {    
    log(podName + " - Adding sessions infos");

    SessionsByPod[podName] = {        
        podName : podName,               
        nodeName: nodeName,      
        sessions: sessions
    };

    //clean all sessions for that pod
    Object.keys(PodBySessions)
        .filter((sessionId => PodBySessions[sessionId] = podName))
        .forEach(sessionId => delete PodBySessions[sessionId]);
    if(sessions.length > 0 && config["trace-sessions"]) {
        log(podName + " - Adding sessions " + JSON.stringify(sessions));
    }
    //add the sessions
    sessions.forEach((sessionId, _) => PodBySessions[sessionId] = podName);
}

function createTcpServer(podName, port) {
    const server = net.createServer();
    server.listen(port);
    

    server.on("listening", function(socket) {
        log(podName + " - TCP server listens on port " + port);
    });

    server.on('error', (e) => log(e));

    var comeAgainCallBack = null;

    server.on("connection", function(socket) {
        log(podName + " - receive TCP connection from pod on port " + port);
        socket = new JsonSocket(socket);

        socket.on("message", function(msg) {
            log(podName + " - Receiving sessions info from pod : " + JSON.stringify(msg));
            if(msg.podName)
                processPodInfo(msg.podName, msg.nodeName, msg.sessions);
            else
                log(podName + " - Infos from pod are not incomplete, skipping ");

            comeAgainCallBack = setTimeout(function() {
                log(podName + " - Asking pod sessions again");                
                socket.sendMessage( {question: "Come again?"} );
            }, config["pull-interval"]);
        });

        socket.on("error", function(error) {
            log(error);
        });

        socket.on("close", function(hadError) {
            log(podName + " - Closing TCP connection with pod on port " + port);
            clearTimeout(comeAgainCallBack);
            evictPod(podName);
            server.close();
            availableTcpPorts.unshift(port);
         });

         //This line below should start the ping-pong between pod and session manager.
         socket.sendMessage({ question : "Show me the money"}); 
    });        
}

function registerPod(podName, nodeName) {

    if(Pods[podName] && Pods[podName].port) {
        log("Pod " + podName +" already registered with port " + Pods[podName].port);
        return Pods[podName].port;
    } else {
        if(availableTcpPorts.length > 0) {
            const port = availableTcpPorts.shift();     
            log("Port " + port + " is available for pod " + podName)            ;
            storePod(podName, nodeName, port);
            createTcpServer(podName, port);
            
            return port;
        } else {
            return undefined;
        }    
    }        
}

/**
 * POST /pod/:podname {podName, podIp, nodeName}
 * Register new Pod
 */
router.post("*/pod/:podName", (req, res) => {
    log("Registring Pod " + req.params.podName + " " + req.body.nodeName);  

    const tcpPort = registerPod(req.params.podName, req.body.nodeName);    
    if(tcpPort) {        
        res.status(200).json(
            { 
                tcpPort : tcpPort,
                host: myPodName
            });       
    } else {
        log("Conflict in allocating port");
        res.status(409).send("Too many pods already registered");
    }    
});

/**
 * GET /pods
 * Get all the pods
 */
router.get("*/pods", (req, res) => {
    res.status(200).send(Pods);
});

/**
 * POST /sessions/:podIp
 * Receive all sessions from pod Ip
 */
router.post("*/sessions/:podName", (req,res) => {
    const podName = req.params.podName;
    if(Pods[podName] && Pods[podName].timeout)
        clearTimeout(Pods[podName].timeout);
    
    processPodInfo(podName, req.body.nodeName, req.body.sessions, req.body.pushRate);

    res.status(200).send("Sessions have been added");
})

/**
 * GET /sessions
 * Get all the sessions
 */
router.get("*/sessions", (req, res) => {
    res.status(200).send({ info: SessionsByPod });
});

router.get("*/sessioncount", (req, res) => {
    res.status(200).send({ count: getSessionCount() });
});


/**
 * DELETE /session/:sessionId
 * Delete session from its id
 */
router.delete("*/session/:sessionId", (req,res) => {
    const sessionId = req.params.sessionId;

    log("Deleting session " + sessionId);
    if(PodBySessions[sessionId] == null) {
        const msg = "Session " + sessionId + " does not exist";
        log(msg);
        res.status(403).send(msg);
    } else {
        const podName = PodBySessions[sessionId];
        try {
            request.delete(podName + ":" + config["local-manager-port"]+ "/" + sessionId, ()=> {});
        } catch(e) {
            log(e);
        }
    }
});

app.use('/', router);

function traceSessions() {
    if(config["trace-sessions"]) {
        setInterval(() => {
            log("ACTIVE SESSIONS COUNT : " + getSessionCount());
            log(JSON.stringify(PodBySessions));
        }, config["pull-interval"]);
    }
}

app.listen(config.port, () => {
    log(config.appName + " started on PORT " + config.port);
    traceSessions();
});