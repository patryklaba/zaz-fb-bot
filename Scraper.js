const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const MenuOtd = require('./models/menuOtd');
const TextHelper = require('./TextHelper');


const getContent = (url) => {
  axios.get(url)
    .then(response => {
      if (response.status === '200') {
        console.log('Get content from ZAZ successful. Status code is 200');
        return {
          data: response.data,
          error: null
        };
      }
    })
    .catch(error => {
      return {
        response: null,
        error
      };
    });
};

const processContent = (content, cb) => {
  const $ = cheerio.load(content.data);
  const menu = $('.clFoodMenu').find('.ce_text');

  menu.each( (i, day) => {
    let weekday = TextHelper.escapeDiacritics($(day).find('h3').text().trim().toLowerCase());
    let content = $(day).find('p').map((i, el) => $(el).text().trim()).get();
    const menuDoc = {
      _id: new mongoose.Types.ObjectId(),
      weekday,
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

exports.scrapeAndSaveWholeWeek = () => {
  let url = 'http://zaz-siedlce.pl';
  const content = getContent(url);
  processContent(content, saveContent);
};

// exports.scrapeAndSaveWholeWeek = () => {
//   axios.get(url)
//     .then(response => {
//       const eachDayMenu = [];
//       if(response.status === 200) {
//         const $ = cheerio.load(response.data);
//         const menu = $('.clFoodMenu').find('.ce_text');
//         menu.each( (i, day) => {
//           let weekday = TextHelper.escapeDiacritics($(day).find('h3').text().trim().toLowerCase());
//           let content = $(day).find('p').map((i, el) => $(el).text().trim()).get();
//           const menuDoc = {
//             _id: new mongoose.Types.ObjectId(),
//             weekday,
//             content
//           };
//           let menuOtd = new MenuOtd(menuDoc);
//           menuOtd.save()
//             .then(result => {
//               console.log('Menu for the day saved', result);
//             })
//             .catch(err => {
//               console.log('An error occurred while saving to db', err);
//             })
//         });
//       }
//     })
//     .catch(error => {
//       console.log(error);
//     });
// };



