const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const MenuOtd = require('./models/menuOtd');
const db = mongoose.connect(process.env.MONGODB_URI);
const Scraper = require('./Scraper');
const TextHelper = require('./TextHelper');

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000), () => console.log(`Listening on the port ${process.env.PORT || 5000}`));
// TODO: below should be scheduled and executed once a week!
Scraper.scrapeAndSaveWholeWeek();

app.get('/', (req, res) => {
  res.status(200).send('Deployed');
});


// endpoint for Facebook
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFICATION_TOKEN) {
    console.log(`Verified webhook`);
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error(`Verification failed. The tokens don't match`);
    res.status(403);
  }
});


// All calbacks for messenger will be POST-ed here
app.post('/webhook', (req, res, next) => {
  // Make sure this is a page subscription
  if (req.body.object === 'page') {
    // Iterate over each entry
    // Sometimes messages are batched and sent together
    req.body.entry.forEach(entry => {
      // Iterate over each messaging event
      entry.messaging.forEach(event => {
        if (event.postback) {
          console.log(`Got new postback event`);
          processPostback(event);
        } else if (event.message) {
          console.log(`Got new message event`);
          processMessage(event);
        }
      });
    });
    res.sendStatus(200);
  }
});


const processPostback = (event) => {
  const senderId = event.sender.id;
  const payload = event.postback.payload;
  console.log(`Got following payload: ${payload}`);
  if (payload === 'Greeting') {
    // Get user's first name from the User Profile API
    // and include it in the greeting

    request({
      url: `https://graph.facebook.com/v2.6/${senderId}`,
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        fields: "first_name"
      },
      method: 'GET'
    }, (error, response, body) => {
      let greeting = "";
      if (error) {
        console.log(`Error while getting user's name from API`, error);
      } else {
        const bodyObj = JSON.parse(body);
        const name = bodyObj.first_name;
        greeting = `Cześć, ${name}.`;
      }
      const message = `${greeting} Jestem ZAZBot i mogę Ci przedstawić menu w naszej restauracji na najbliższe dni.`;
      sendMessage(senderId, {text: message});
    });
  }
};

const processMessage = (event) => {
  if (!event.message.is_echo) {
    const message = event.message;
    const senderId = event.sender.id;

    console.log(`Received message from senderId ${senderId}`);
    console.log(`Message is: ${JSON.stringify(message)}`);

    // text or attachement but not both
    if (message.text) {
      const formattedMsg = TextHelper.escapeDiacritics(message.text.toLowerCase().trim());
      console.log(`Formatted message is: ${formattedMsg}`);
      // check for keywords and send back corresponding data
      // otherwise send menu for current day

      switch(formattedMsg) {
        case 'poniedzialek':
        case 'wtorek':
        case 'sroda':
        case 'czwartek':
        case 'piatek':
          // getMenuOtd(senderId, formattedMsg);
          // break;
        case 'tydzien':
          // getWeeklyMenu(senderId, formattedMsg);
        default:
          getTodaysMenu(senderId, formattedMsg);

      }
    } else if (message.attachements) {
      sendMessage(senderId, {text: `Przepraszam, ale nie rozumiem Twojej prośby. Wpisz nazwę dnia tygodnia, aby zobaczyć menu.`});
    }
  }
};



// send message to user
const sendMessage = (recipientId, message) => {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
      recipient: {id: recipientId},
      message: message
    }
  }, (error, response, body) => {
    if (error) {
      console.log(`Error while sending message: ${response.error}`);
    }
  });
};

const weekdays = ['niedziela', 'poniedzialek', 'wtorek', 'sroda', 'czwartek', 'piatek', 'sobota'];

const getTodaysMenu = (senderId, message) => {
  console.log(`[INFO]~~ About to present menu for today to the user`);
  const weekdayIdx = 1; //new Date().getDay();
  if (weekdayIdx < 1 || weekdayIdx > 5) {
    sendMessage(senderId, {text: `Hej! Mamy weekend, więc stołówka nie jest czynna. Zapraszamy od poniedziałku`});
    return;
  }

  MenuOtd
    .find({weekday: weekdays[weekdayIdx]})
    .select('weekday content')
    .then(doc => {
      console.log(doc);
      let menuContent = doc.content.join('\n');
      console.log(`[INFO]~~ sending to user: ${menuContent}`);
      sendMessage(senderId, {text: menuContent});
    })
    .catch(error => {
      console.log(error);
    });
};