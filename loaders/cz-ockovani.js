const fetch = require('node-fetch');
const fs = require('fs');
const csv = require('csv-parser');
const conf = require('./configuration.js')();

const results = {};
const ageGroups = [];

let count = 0;

console.log(`Reading data from ${conf.ockovaniUrl}`)
fetch(conf.ockovaniUrl)
  .then(response => {
    response.body.pipe(csv({mapHeaders: (h,i) => {console.log(h); return h.index;}})) // can't access first columnt named "datum" for somne reason...
    .on('data', (data) => {
      if (!ageGroups.includes(data[7]) && (/[0-9\-\+]+/.test(data[7]))) {
        ageGroups.push(data[7]);
      }
      if (data[6]=='2' && (/[0-9\-\+]+/.test(data[7]))) {
        let datum = data[0];
        if (!results[datum]) results[datum] = {};
        if (!results[datum][data[7]]) results[datum][data[7]] = 0;
        results[datum][data[7]]++;
      }
      if ((++count)%100000 == 0) {
        console.log(`Parsed ${count/1000}k lines`);
      }
    })
    .on('end', () => {
      const preprocessed = {
        dates: [],
        ageGroups: [],
        dataByDate: []
      }
      preprocessed.dates = Object.keys(results).sort();
      preprocessed.ageGroups = ageGroups.sort();
      preprocessed.dataByDate = preprocessed.dates.map(d => preprocessed.ageGroups.map(g => (results[d] || {})[g] || 0));
      for (let i=1; i<preprocessed.dataByDate.length; i++) {
        for (let j in preprocessed.dataByDate[i]) {
          preprocessed.dataByDate[i][j] += preprocessed.dataByDate[i-1][j];
        }
      }

      fs.writeFileSync(conf.ockovaniOutputFile, JSON.stringify(preprocessed))
      console.log(`Done, output written to ${conf.ockovaniOutputFile}`)
    });
  })
    
