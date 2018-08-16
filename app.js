const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000), () => console.log(`Listening on the port ${process.env.PORT || 5000}`));


app.get('/', (req, res) => {
  res.status(200).send('Deployed');
});


// endpoint for Facebook
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === 'this_is_my_token') {
    console.log(`Verified webhook`);
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error(`Verification failed. The tokens don't match`);
    res.status(403);
  }
});