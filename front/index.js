var httpProxy = require('http-proxy');
//var config = require('./web.config.json');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const router = express.Router();
let logEnabled = true;

const configPath = process.argv.slice(2)[0];
var config = require(configPath);

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
    console.log("Frontend Started on PORT " + config.frontEnd.port);
});