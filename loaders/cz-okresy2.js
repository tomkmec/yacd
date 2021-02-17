const fetch = require('node-fetch');
const fs = require('fs');
const csv = require('csv-parser');
const conf = require('./configuration.js')();

const results = {};

let count = 0;

console.log(`Reading data from ${conf.okresyUrl}`)
fetch(conf.okresyUrl)
  .then(response => {
    response.body.pipe(csv())
    .on('data', (data) => {
      if (data.nove_pripady!=='0') {
        if (!results[data.datum]) results[data.datum] = {};
        if (!results[data.datum][data.okres_lau_kod]) results[data.datum][data.okres_lau_kod] = 0;
        results[data.datum][data.okres_lau_kod] += parseInt(data.nove_pripady);
      }
      if ((++count)%100000 == 0) {
        console.log(`Parsed ${count/1000}k lines`)
      }
    })
    .on('end', () => {
      fs.writeFileSync(conf.okresyOutputFile, JSON.stringify(results))
      console.log(`Done, output written to ${conf.okresyOutputFile}`)
    });
  })
    
