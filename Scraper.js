const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const MenuOtd = require('./models/menuOtd');
const TextHelper = require('./TextHelper');

exports.getAndSaveMenuContent = (url) => {
  console.log('Trying to get content from:', url);
  axios.get(url)
    .then(response => {
      if (response.status === 200) {
        console.log('Get content from ZAZ successful. Status code is 200');
        processContent(response, saveContent);
      }
    })
    .catch(error => {
      console.log('Getting content failed', error);
    });
};

const processContent = (content, cb) => {
  const $ = cheerio.load(content.data);
  const menu = $('.clFoodMenu').find('.ce_text');

  menu.each( (i, day) => {
    let weekday = $(day).find('h3').text().trim();
    let weekday_esc = TextHelper.escapeDiacritics(weekday.toLowerCase());
    let content = $(day).find('p').map((i, el) => $(el).text().trim()).get();
    content = content.filter(el => el !== 'ALERGENY');
    const menuDoc = {
      _id: new mongoose.Types.ObjectId(),
      weekday,
      weekday_esc,
      content
    };
    cb(menuDoc);
  });
};

const saveContent = (menuDoc) => {
  const menuOtd = new MenuOtd(menuDoc);
  menuOtd.save()
    .then(result => {
      console.log('Menu for the day successfully saved into database');
    })
    .catch(err => {
      console.log('An error occurred while saving to db', err);
    });
};



