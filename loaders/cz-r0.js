/*
 * Loader for CZ r0 extimations.
 * Sources:
 * - https://docs.google.com/spreadsheets/d/1cCCECunGrLmcxp5RwTRvHPLPi2Uh2J8b4NIoyFDcu7c/edit#gid=1683234482
 */

const { writeFileSync } = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const conf = require('./configuration.js')({googleApiKey: true});

async function loadR0Estimates() {
  const result = {
    dates: [],
    estimates: {
      high: [],
      low: [],
      r0: []
    }
  };

  console.log('Initializing. Using spreadsheet ID ' + conf.r0SpreadsheetId);
  const doc = new GoogleSpreadsheet(conf.r0SpreadsheetId);
  doc.useApiKey(conf.googleApiKey);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[conf.r0SpreadsheetWorksheetIndex];
  console.log(`Initialized spreadsheet named "${doc.title}". Loading ${sheet.rowCount} rows and ${sheet.columnCount} columns from worksheet #${conf.r0SpreadsheetWorksheetIndex}`);
  await sheet.loadCells();

  console.log(`Loaded ${sheet.cellStats.loaded} cells. Processing.`);
  var row, column;
  for (row = 1; row < sheet.rowCount; row++) {
    result.dates.push(sheet.getCell(row, 0).formattedValue);
  }

  for (row = 1; row < sheet.rowCount; row++) {
    ["r0", "low", "high"].forEach((prop, index) => result.estimates[prop].push(sheet.getCell(row, 1 + index).value)) 
  }

  result.dates.reverse();
  result.estimates.r0.reverse();
  result.estimates.low.reverse();
  result.estimates.high.reverse();

  return result;
}

loadR0Estimates().then(data => {
  writeFileSync(conf.r0OutputFile, JSON.stringify(data), 'utf8')
  console.log("Output written to " + conf.r0OutputFile)
})

