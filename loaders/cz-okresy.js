/*
 * Loader for CZ county data.
 * Sources:
 * - https://docs.google.com/spreadsheets/d/1FFEDhS6VMWon_AWkJrf8j3XxjZ4J6UI1B2lO3IW-EEc/edit#gid=1011737151
 */

const { writeFileSync } = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const conf = require('./configuration.js')({googleApiKey: true});

async function loadKrajeData() {
  const result = {
    dates: [],
    counts: {}
  };

  console.log('Initializing. Using spreadsheet ID ' + conf.krajeSpreadsheetId);
  const doc = new GoogleSpreadsheet(conf.krajeSpreadsheetId);
  doc.useApiKey(conf.googleApiKey);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[conf.krajeSpreadsheetWorksheetIndex];
  console.log(`Initialized spreadsheet named "${doc.title}". Loading ${sheet.rowCount} rows and ${sheet.columnCount} columns from worksheet #${conf.krajeSpreadsheetWorksheetIndex}`);
  await sheet.loadCells();

  console.log(`Loaded ${sheet.cellStats.loaded} cells. Processing.`);
  var row, column;
  for (column = 2; column < sheet.columnCount; column++) {
    result.dates.push(sheet.getCell(0, column).formattedValue);
  }

  for (row = 1; row < sheet.rowCount; row++) {
    const kraj = sheet.getCell(row, 1).value;
    const okres = sheet.getCell(row, 0).value;
    if (!result.counts[kraj]) {
      result.counts[kraj] = {};
    }
    result.counts[kraj][okres] = [];
    for (column = 2; column < sheet.columnCount; column++) {
      result.counts[kraj][okres].push(sheet.getCell(row, column).value);
    }
  }

  return result;
}

loadKrajeData().then(data => {
  writeFileSync(conf.krajeOutputFile, JSON.stringify(data), 'utf8')
  console.log("Output written to " + conf.krajeOutputFile)
})

