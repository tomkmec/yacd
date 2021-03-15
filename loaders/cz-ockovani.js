const fetch = require('node-fetch');
const fs = require('fs');
const csv = require('csv-parser');
const conf = require('./configuration.js')();

const results = {};
const totalsFirstDoze = {};
const ageGroups = [];
const transpose = m => m[0].map((x,i) => m.map(x => x[i]))


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
      if (data[6]=='1' && (/[0-9\-\+]+/.test(data[7]))) {
        if (!totalsFirstDoze[data[7]]) totalsFirstDoze[data[7]] = 0;
        totalsFirstDoze[data[7]]++;
      }
      if ((++count)%100000 == 0) {
        console.log(`Parsed ${count/1000}k lines`);
      }
    })
    .on('end', () => {
      const preprocessed = {
        dates: [],
        ageGroups: [],
        stackedDataByGroupAndDate:[],
        totalsByGroup:[]
      }
      preprocessed.dates = Object.keys(results).sort();
      preprocessed.ageGroups = ageGroups.sort();
      let dataByDate = preprocessed.dates.map(d => preprocessed.ageGroups.map(g => (results[d] || {})[g] || 0));
      for (let i=1; i<dataByDate.length; i++) {
        for (let j in dataByDate[i]) {
          dataByDate[i][j] += dataByDate[i-1][j];
        }
      }
      preprocessed.totalsByGroup=dataByDate[dataByDate.length-1];
      preprocessed.stackedDataByGroupAndDate=transpose(dataByDate)
      for (let i=1; i<preprocessed.stackedDataByGroupAndDate.length; i++) {
        for (let j in preprocessed.stackedDataByGroupAndDate[i]) {
          preprocessed.stackedDataByGroupAndDate[i][j] += preprocessed.stackedDataByGroupAndDate[i-1][j];
        }
      }
      preprocessed.totalsFirstDoze = preprocessed.ageGroups.map(ag => totalsFirstDoze[ag]);


      fs.writeFileSync(conf.ockovaniOutputFile, JSON.stringify(preprocessed))
      console.log(`Done, output written to ${conf.ockovaniOutputFile}`)
    });
  })
    
