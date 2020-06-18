const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const process = require('process');
const request = require('request');
const fs = require('fs');

const app = express();

app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const configPath = process.argv.slice(2)[0];
const config = require(configPath);
const logEnabled = config.enableLog;
const router = express.Router();

var SessionsByPod = {};
var PodBySessions = {};
var Pods = {};

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

function evictPod(podName) {
    log("Evicting pod " + podName);
    if(Pods[podName]) {       
        SessionsByPod[podName] = {};

        Object.keys(PodBySessions)
        .filter((sessionId => PodBySessions[sessionId] = podName))
        .forEach(sessionId => delete PodBySessions[sessionId]);

        log("Pod has been evicted " + podName);
    } else {
        log("Pod " + podName + " is not registered");
    }
}

function registerPod(podName, nodeName, pushRate) {

    Pods[podName] = {
        podName: podName,       
        nodeName: nodeName,
        failure: 0,
        timeout : setTimeout(function() {
            evictPod(podName);
        }, pushRate * 1.5)
    };
}

/**
 * POST /pod/:podname {podName, podIp, nodeName}
 * Register new Pod
 */
 
router.post("*/pod/:podName", (req, res) => {
    log("Registring Pod " + req.params.podName);  

    registerPod(req.params.podName, req.body.nodeName, req.body.pushRate);
    res.status(200).send("pod registered");
});

/**
 * GET /pods
 * Get all the pods
 */
router.get("*/pods", (req, res) => {
    res.status(200).send(Pods);
});


function processPodInfo(podName, nodeName, sessions, pushRate) {
    log(podName + " - Adding sessions infos");

    registerPod(podName, nodeName, pushRate);

    SessionsByPod[podName] = {        
        podName : podName,               
        nodeName: nodeName,      
        sessions: sessions
    };

    //clean all sessions for that pod
    Object.keys(PodBySessions)
        .filter((sessionId => PodBySessions[sessionId] = podIp))
        .forEach(sessionId => delete PodBySessions[sessionId]);
    
    //add the sessions
    Object.keys(sessions).forEach((session) => {
        PodBySessions[session] = podIp;
    });
}

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

app.listen(config.port, () => {
    log(config.appName + " started on PORT " + config.port);

    if(config.pull) {
        setInterval(function() {
            Object.keys(Pods).forEach(podName => {
                log("Requesting sessions details on pod " + podName);
                request.get("http://" + Pods[podName].podIp + ":" + config["local-manager-port"]+ "/sessions", {}, (err, httpResponse, body) => {
                    if(err) {
                        log(err);
                    } else {                                     
                        processPodInfo(body.podName, body.nodeName, body.sessions);
                    }
                }).on("error", (err) => {
                    log(err);
                    Pods[pod].failure++;
                    if(Pods[pod].failure > config["pod-failure-limit"]) {
                        evictPod(pod);
                    }
                });               
            });
        }, config["pull-interval"])
    }
});


