const fetch = require('node-fetch');
const fs = require('fs');
const csv = require('csv-parser');

const results = {};

fs.createReadStream('./obce.csv')
  .pipe(csv())
  .on('data', (data) => {
    if (data.nove_pripady!=='0') {
      if (!results[data.datum]) results[data.datum] = {};
      if (!results[data.datum][data.okres_lau_kod]) results[data.datum][data.okres_lau_kod] = 0;
      results[data.datum][data.okres_lau_kod] += parseInt(data.nove_pripady);
    }
  })
  .on('end', () => {
    fs.writeFileSync('../datasets/okresy2.json', JSON.stringify(results))
  });
