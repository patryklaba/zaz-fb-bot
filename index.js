const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');


axios.get('http://zaz-siedlce.pl')
  .then(response => {
    const eachDayMenu = [];
    if(response.status === 200) {
      const $ = cheerio.load(response.data);
      const menu = $('.clFoodMenu').find('.ce_text');
      menu.each( (i, day) => {
        eachDayMenu[i] = {
          weekday: $(day).find('h3').text().trim(),
          menu: $(day).find('p').map((i, el) => $(el).text().trim()).get()
        };
      })
    }
    console.log(eachDayMenu);
  })
  .catch(error => {
    console.log(error);
  });