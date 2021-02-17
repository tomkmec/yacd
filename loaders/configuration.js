const config = {
  googleApiKey: '',

  okresyUrl: "https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/obce.csv",
  okresyOutputFile: '../datasets/okresy2.json',

  r0SpreadsheetId: '1cCCECunGrLmcxp5RwTRvHPLPi2Uh2J8b4NIoyFDcu7c',
  r0SpreadsheetWorksheetIndex: 0,
  r0OutputFile: '../datasets/r0.json',

  hospitalizaceUrl: 'https://onemocneni-aktualne.mzcr.cz/covid-19/prehled-hospitalizaci',
  hospitalizaceDataElementPath: 'div#js-hospitalization-data',
  hospitalizaceDataAttribute: 'data-linechart',
  hospitalizaceOutputFile: '../datasets/hospitalizace.json',

  newsOutputFile: '../datasets/news.json',
  newsEarliestStart: '2020-03-20',

  ockovaniUrl: 'https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/ockovaci-mista.csv',
  ockovaniOutputFile: '../datasets/ockovani.json'
}

const configInternal = {
  googleApiKeyEnvironmentVariable: "GOOGLE_API_KEY",
  googleApiKeyFile: "./apiKey.json" // JSON file containing {"key":"<your api key>"}
}

// Options:
// * googleApiKey: boolean: try to get Google API Key. Default = false
module.exports = function init(options = {}) {
  if (options.googleApiKey) {
    if (process.env[configInternal.googleApiKeyEnvironmentVariable]) {
      config.googleApiKey = process.env[configInternal.googleApiKeyEnvironmentVariable];
      console.log(`Using Google API Key specified by ${configInternal.googleApiKeyEnvironmentVariable} environment variable`)
    } else try {
      config.googleApiKey = require(configInternal.googleApiKeyFile).key;
      console.log(`Using Google API Key loaded from ${configInternal.googleApiKeyFile}`)
    } catch (e) {
      throw Error("Can't initialize configuration due to missing Google API Key", e)
    }
  }

  return config;
};