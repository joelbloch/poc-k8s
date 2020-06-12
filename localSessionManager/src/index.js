const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const process = require('process');
const fs = require('fs');
const request = require('request');
const { request } = require('http');

const app = express();

app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const configPath = process.argv.slice(2)[0];
var config = require(configPath);

const router = express.Router();

/**
 * Definition of routes
 */
let Sessions = {};
const podIp = process.env["MY_POD_IP"];
const podName = process.env["MY_POD_NAME"];
const nodeName = process.env["MY_NODE_NAME"];

router.post('*/session/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;

    if(sessionId in Sessions) {
        res.status(409).send("Session " + sessionId + " already exists");
    } else {
        Sessions[sessionId] = sessionId;    
        res.status(200).send("Session " + sessionId + " has been successfully registered");        
    }
})

router.delete('*/session/:sessionId', (req, res) => {
    var sessionId = req.params.sessionId;
    if(sessionId in Sessions) {
        delete Sessions[sessionId];
        res.status(200).send("Session " + sessionId + " has been successfully deleted");    
    } else {
        res.status(403).send("Session " + sessionId + " does not exist");
    }
})

router.get('*/sessions', (req, res) => {
    res.status(200).send(JSON.stringify(Sessions));
})

app.use('/', router);

app.listen(config.port, () => {
    console.log(config.appName + " started on PORT " + config.port);

    if(config.sessionManager) {
        //Register Pod at in a timely manner
        if(config.sessionManager != null) {
            setInterval(() => {
                request.post(config.sessionManager.url + "/pod/" + podName, 
                {
                    podName: podName,
                    podIp: podIp,
                    nodeName: nodeName
                });
            }, config.sessionManager["push-interval"]);
        }

        //Pushing sessions info  in a timely manner
        if(config.sessionManager.push) {
            setInterval(() => {
                const allSessions = JSON.stringify(Sessions.keys());
                request.post(config.sessionManager.url + "/sessions/" + podIp, 
                {
                    sessions : allSessions,
                    podIp: podIp,
                    podName : podName,
                    nodeName : nodeName
                })
            }, config.sessionManager["push-interval"]);
        }        
    }
});


