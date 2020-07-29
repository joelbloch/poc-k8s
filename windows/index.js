const express = require('express');
const app = express();
const router = express.Router();
const port = 3000;
const appName = "Repeater";

let counter = 0;

router.get('/ping', (req, res) => {        
    console.log(req.originalUrl);
    res.end('pong from Windows Container');    
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

app.listen(port, () => {
    console.log(appName + " started on PORT " + port);
});