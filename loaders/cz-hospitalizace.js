/*
 * Loader for CZ hospitalizations data.
 * Sources:
 * -https://onemocneni-aktualne.mzcr.cz/covid-19
 */

const { writeFileSync } = require('fs');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const conf = require('./configuration')();
const dateRegex = /(\d{2})\.(\d{2})\.(\d{4})/;

function formatDate(d) { // DD.MM.YYYY => YYYY-MM-DD
  const p = dateRegex.exec(d);
  return `${p[3]}-${p[2]}-${p[1]}`;
}

async function loadData() {
  console.log(`Reading COVID dashboard web from ${conf.hospitalizaceUrl}`);
  const response = await fetch(conf.hospitalizaceUrl);
  const html = await response.text();

  console.log(`Loaded (${Math.round(html.length/1024)}kB). Parsing HTML and looking for the hospitalization data`);
  const $ = cheerio.load(html);
  const dataElement = $(conf.hospitalizaceDataElementPath);
  const data = JSON.parse(dataElement.attr(conf.hospitalizaceDataAttribute));

  console.log(`Done. Processing.`);
  const result = {hospitalizations:{}};
  result.dates = data[0].values.map(_ => formatDate(_.x));
  result.hospitalizations.total = data[0].values.map(_ => _.y)
  result.hospitalizations.critical = data[1].values.map(_ => _.y)
  return result;
}

loadData().then(data => {
  console.log(`Done. Writing to ${conf.hospitalizaceOutputFile}.`)
  writeFileSync(conf.hospitalizaceOutputFile, JSON.stringify(data));
})