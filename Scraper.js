const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const MenuOtd = require('./models/menuOtd');
const db = mongoose.connect(process.env.MONGODB_URI);

exports.scrapeAndSaveWholeWeek = () => {
  const url = 'http://zaz-siedlce.pl';
  axios.get(url)
    .then(response => {
      const eachDayMenu = [];
      if(response.status === 200) {
        console.log('response status is 2000');
        const $ = cheerio.load(response.data);
        const menu = $('.clFoodMenu').find('.ce_text');
        menu.each( (i, day) => {
          let weekday = $(day).find('h3').text().trim();
          let content = $(day).find('p').map((i, el) => $(el).text().trim()).get();
          const menuDoc = {
            _id: new mongoose.Types.ObjectId(),
            weekday,
            content
          };
          let menuOtd = new MenuOtd(menuDoc);
          console.log(menuDoc);
          menuOtd.save()
            .then(result => {
              console.log('Menu for the day saved', result);
            })
            .catch(err => {
              console.log('An error occurred while saving to db', err);
            })
        });
      }
    })
    .catch(error => {
      console.log(error);
    });
};



