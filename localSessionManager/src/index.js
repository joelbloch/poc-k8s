const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const process = require('process');
const fs = require('fs');
const request = require('request');

const app = express();

app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const configPath = process.argv.slice(2)[0];
var config = require(configPath);
const logEnabled = config.enableLog;

const router = express.Router();

/**
 * Definition of routes
 */

let Sessions = {};

const podIp = process.env["MY_POD_IP"];
const podName = process.env["MY_POD_NAME"];
const nodeName = process.env["MY_NODE_NAME"];

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

router.post('*/session/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    if(sessionId in Sessions) {
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
    if(sessionId in Sessions) {
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

function registerPod() {
    log("sending post request to register pod");
    request.post({
        headers: {'content-type' : 'application/json'},
        url: config.sessionManager.url + "/pod/" + podName, 
        body : JSON.stringify(
          {
              podName: podName,
              podIp: podIp,
              nodeName: nodeName
          })
    }).on("error", (err) => { log(err) });
}

app.listen(config.port, () => {
    log(config.appName + " started on PORT " + config.port);

    if(config.sessionManager && config.sessionManager.push) {              
        //Pushing sessions info  in a timely manner        
    
        setInterval(() => {
            
            const allSessions = Object.keys(Sessions);
            if(allSessions.length > 0) {                          
                log("sending sessions infos");                
                request.post( {
                    url: config.sessionManager.url + "/sessions/" + podName, 
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body : JSON.stringify({
                        sessions : allSessions,                        
                        podName : podName,
                        nodeName : nodeName,
                        pushRate : config.sessionManager["push-interval"]
                    })                            
                }).on('error', (err) => { log(err);});
        }
        
        }, config.sessionManager["push-interval"]);    
    }
});


