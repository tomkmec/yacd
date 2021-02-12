const fetch = require('node-fetch');
const fs = require('fs');
const csv = require('csv-parser');

const results = [];

fs.createReadStream('./obce.csv')
  .pipe(csv())
  .on('data', (data) => {
    if (data.nove_pripady!=='0') {
      results.push([data.datum, data.obec_kod, parseInt(data.nove_pripady)])
    }
  })
  .on('end', () => {
    fs.writeFileSync('../datasets/obce.json', JSON.stringify(results))
  });
