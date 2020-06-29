var httpProxy = require('http-proxy');
//var config = require('./web.config.json');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const router = express.Router();

const configPath = process.argv.slice(2)[0];
var config = require(configPath);

let logEnabled = true;
if(config.trace) {
    logEnabled = config.trace.enabled;
}

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
        } catch(e) {            
        }
    }
}

const proxyStateful = httpProxy.createProxyServer({
    target: config.apiStateful.domain + ':' + config.apiStateful.port,
}).on("error", () => {})

const proxyStateless =  httpProxy.createProxyServer({
    target: config.apiStateless.domain + ':' + config.apiStateless.port,
}).on("error", () => {})

router.get('*/stateful/*', (req, res) => {    
    log('receiving request for stateful api \n');
    proxyStateful.web(req, res);
});

router.get('*/stateless/*', (req, res) => {
    log('receiving request for stateless api');
    proxyStateless.web(req, res);
});

router.get('*/ping', (req, res) => {    
    log('ping');
    res.end('<h1>pong</h1>');    
})
router.get('/*', (req, res) => {    
    log(req.originalUrl);
    res.end(req.originalUrl);    
})

app.use('/', router);

app.listen(config.frontEnd.port, () => {
    log("Frontend Started on PORT " + config.frontEnd.port);
});