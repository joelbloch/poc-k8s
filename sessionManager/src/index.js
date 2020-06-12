const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const process = require('process');
const request = require('request');

const app = express();

app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const configPath = process.argv.slice(2)[0];
var config = require(configPath);

const router = express.Router();

var SessionsByPod = {};
var PodBySessions = {};
var Pods = {};

function evictPod(podName) {
    console.log("Attempt to evict pod " + podName);
    if(Pods[podName]) {
        const podIP = Pods[podName].podIp;

        SessionsByPod[podIP] = {};

        Object.keys(PodBySessions)
        .filter((sessionId => PodBySessions[sessionId] = podIp))
        .forEach(sessionId => delete PodBySessions[sessionId]);

        console.log("Pod has been evicted " + podName);
    } else {
        console.log("Pod " + podName + " is not registered");
    }
}

/**
 * POST /pod/:podname {podName, podIp, nodeName}
 * Register new Pod
 */
 
router.post("*/pod/:podName", (req, res) => {
    const podName = req.params.podName;
    const podIp = req.body.podIp;
    const nodeName = req.body.nodeName;

    console.log("Registring Pod " + podName);
    Pods[podName] = {
        podName: podName,
        podIp: podIp,
        nodeName: nodeName,
        failure: 0
    };
});

/**
 * GET /pods
 * Get all the pods
 */
router.get("*/pods", (req, res) => {
    res.status(200).send(Pods);
});

/**
 * DELETE /pod/:podname
 * Delete pod entry
 */
router.delete("*/pod/:podName", (req, res) => {
    const podName = req.params.podName;
    evictPod(podName);
});

function processPodInfo(podName, podIp, nodeName, sessions) {

    SessionsByPod[podIp] = {        
        podName : podName,
        podIp : podIp,        
        nodeName : nodeName,
        sessions: sessions
    };

    //clean all sessions for that pod
    Object.keys(PodBySessions)
        .filter((sessionId => PodBySessions[sessionId] = podIp))
        .forEach(sessionId => delete PodBySessions[sessionId]);
    
    //add the sessions
    for(var session in req.body.sessions) {
        PodBySessions[session] = podIp
    }
}

/**
 * POST /sessions/:podIp
 * Send all sessions from pod Ip
 */
router.post("*/sessions/:podIp", (req,res) => {
    const podIp = req.params.podIp;
    if(podIp in SessionsByPod)
        delete SessionsByPod[podIp];

    processPodInfo(req.body.podName, podIp, req.body.nodeName, req.body.sessions);

    res.status(200).send("Sessions have been added");
})

/**
 * GET /sessions
 * Get all the sessions
 */
router.get("*/sessions", (req, res) => {
    res.status(200).send(SessionsByPod);
});

/**
 * DELETE /session/:sessionId
 * Delete session from its id
 */

router.delete("*/session/:sessionId", (req,res) => {
    const sessionId = req.params.sessionId;

    if(PodBySessions[sessionId] == null) {
        res.status(403).send("Session " + sessionId + " does not exist");
    } else {
        const podIp = PodBySessions[sessionId];
        try {
            request.delete(podIp + "/" + sessionId, ()=> {});
        } catch(e) {
            console.log(e);
        }
    }
});

app.use('/', router);

app.listen(config.port, () => {
    console.log(config.appName + " started on PORT " + config.port);
    if(config.pull) {
        setInterval(function() {
            for(var pod in Pods) {
                try {
                    console.log("Getting sessions on information on pod " + pod);
                    request.get(pod.podIp + "/sessions", {}, (err, httpResponse, body) => {
                        if(err) {
                            console.log(err);
                        } else {               
                            console.log("processing info from pod response ("+ pod + ")");
                            processPodInfo(body.podName, body.podIp, body.nodeName, body.sessions);
                        }
                    })
                } catch(e) {
                    console.log(e);
                    Pods[pod].failure++;
                    if(Pods[pod].failure > config["pod-failure-limit"]) {
                        evictPod(pod);
                    }
                }
            }
        }, config["pull-interval"])
    }
});


