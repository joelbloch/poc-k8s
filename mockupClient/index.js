const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const process = require('process');
var httpProxy = require('http-proxy');

const fs = require('fs');
const app = express();

app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());



const configPath = process.argv.slice(2)[0];
var config = require(configPath);

const proxy = httpProxy.createProxyServer({
    target: config.server.host + ':' + config.server.port,
}).on("error", () => {});

const logEnabled = config.trace.enabled;
const router = express.Router();

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
        if(!fileName) fileName = 'log.txt';

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

router.get('/ping', (req, res) => {    
    log('receiving ping on mock client \n');
    res.end('pong');
});

router.get('/*', (req, res) => {    
    log('receiving request on mock client \n');
    proxy.web(req, res);
});


app.use('/', router);

app.listen(config.port, () => {
    log(config.appName + " started on PORT " + config.port);
});