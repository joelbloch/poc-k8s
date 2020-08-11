const express = require('express');
const app = express();
const router = express.Router();

router.get('/ping', (req, res) => {    
    res.end('pong from Azure');
});

router.get('/*', (req, res) => {    
    res.end(req.originalUrl);
});

app.use('/', router);

app.listen(8080, () => {
    console.log("aks-ping started on PORT " + 8080);
});