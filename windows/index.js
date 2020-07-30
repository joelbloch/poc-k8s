const express = require('express');
const app = express();
const pg = require('pg')

const router = express.Router();

const configPath = process.argv.slice(2)[0];
var config = require(configPath);

const client = new pg.Client({
    user: config.db.user,
    host: config.db.host,
    database: config.db.database,
    password: config.db.password,
    port: config.db.port,
  });

client.connect();
client.query('SELECT NOW()', (err, res) => {
    console.log("connection to Db");
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
    res.end('pong from Windows container');
})

router.get('/db', (req, res) => {
    console.log(req.originalUrl);

    client.query('SELECT NOW() as now')
    .then(respdb => res.end("Here is the db response " + respdb.rows[0]))
    .catch(err => res.end("there was an error with db query" + err.stack));
})

router.get('/counter', (req, res) => {        
    console.log(req.originalUrl);
    res.end('counter : ' + counter);
    counter++;    
})

router.get('/*', (req, res) => {        
    console.log(req.originalUrl + ' from Windows Container');
    res.end(req.originalUrl);    
})

app.use('/', router);

app.listen(config.port, () => {
    console.log(config.appName + " started on PORT " + config.port);
});