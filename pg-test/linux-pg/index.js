const express = require('express');
const app = express();
const pg = require('pg');
const fetch = require('node-fetch');

const router = express.Router();

const configPath = process.argv.slice(2)[0];
var config = require(configPath);


let dbConfigKey = "db-" + config.db;

const client = new pg.Client({
    user: config[dbConfigKey].user,
    host: config[dbConfigKey].host,
    database: config[dbConfigKey].database,
    password: config[dbConfigKey].password,
    port: config[dbConfigKey].port,
});

client.connect();

client.query('SELECT NOW()', (err, res) => {
    console.log("connection to Db");
    console.log("===================");
    console.log("db host : " + config[dbConfigKey].host);
    console.log("db port : " + config[dbConfigKey].port);
    console.log("db username : " + config[dbConfigKey].user);
    console.log("db password : " + config[dbConfigKey].password);
    console.log("db name : " + config[dbConfigKey].database);
    console.log("===================");
    if(err) {
        console.log("there was an error with db query" + err.stack);
    } else {
        console.log("Here is the db response " + res);
    }    
    //client.end();
})
let counter = 0;


router.get('/ping', (req, res) => {
    console.log(req.originalUrl);
    res.end('pong from Linux container');
})

router.get('/db', (req, res) => {
    console.log('request to db');

    client.query('SELECT NOW() as now')
    .then(respdb => res.end("Here is the db response " + respdb.rows[0]))
    .catch(err => res.end("there was an error with db query" + err.stack));
})

router.get('/counter', (req, res) => {        
    console.log(req.originalUrl);
    res.end('counter : ' + counter);
    counter++;    
})

router.get('/host', (req, res) => {
    console.log(req.originalUrl);

    fetch('http://host.docker.internal:82/index.html')
        .then(resFetch => resFetch.text())
        .then(body => res.end(body))
        .catch(err => res.end(err));
})

router.get('/*', (req, res) => {        
    console.log(req.originalUrl + ' from Linux Container');
    res.end(req.originalUrl);    
})

app.use('/', router);

app.listen(config.port, () => {
    console.log(config.appName + " started on PORT " + config.port);
});