const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const MenuOtd = require('./models/menuOtd');
const TextHelper = require('./TextHelper');

exports.getAndSaveMenuContent = (url) => {
  if (countDocsInCollection() > 0) {
    console.log(`~~[INFO]~~ There are docs in collection. Do not have to scrape for data`);
    return;
  }
  console.log('~~[INFO]~~ Trying to get content from:', url);
  axios.get(url)
    .then(response => {
      if (response.status === 200) {
        console.log('~~[INFO]~~ Getting content from ZAZ successful. Status code is 200');
        processContent(response, saveContent);
      }
    })
    .catch(error => {
      console.log('~~[ERROR]~~ Getting content failed', error);
    });
};

const countDocsInCollection = () => {
  const collCount = MenuOtd.estimatedDocumentCount();
  console.log(`~~[INFO]~~ number of docs in collection: ${collCount}`);
  return  collCount;
};

const processContent = (content, cb) => {
  const $ = cheerio.load(content.data);
  const menu = $('.clFoodMenu').find('.ce_text');

  menu.each( (i, day) => {
    let weekday = $(day).find('h3').text().trim();
    let weekday_esc = TextHelper.escapeDiacritics(weekday.toLowerCase());
    let content = $(day).find('p').map((i, el) => $(el).text().trim()).get();
    content = content.filter(el => el !== 'ALERGENY:');
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
      console.log(`~~[INFO]~~ Menu for the day successfully saved into database`);
    })
    .catch(err => {
      console.log(`~~[ERROR]~~ An error occurred while saving to db`, err);
    });
};



