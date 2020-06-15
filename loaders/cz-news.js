/*
 * Loader for major CZ news server coverage ratio.
 * Top 2-5 most read servers according to https://cs.wikipedia.org/wiki/M%C3%A9dia_v_%C4%8Cesku#Internetov%C3%A9_port%C3%A1ly
 * Sources:
 * ☑ https://novinky.cz
 * ☑ https://zpravy.idnes.cz
 * ☐ https://aktualne.cz
 * ☒ https://blesk.cz
 * ☒ https://denik.cz
 */

const { writeFileSync } = require('fs');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const conf = require('./configuration')();
// const dateRegex = /(\d{2})\.(\d{2})\.(\d{4})/;

// function formatDate(d) { // DD.MM.YYYY => YYYY-MM-DD
//   const p = dateRegex.exec(d);
//   return `${p[3]}-${p[2]}-${p[1]}`;
// }

const progress = {};
const sources = {};

const wait = async function(time) {
  return new Promise((ok,ko) => {setTimeout(ok, time)})
}

//-------

sources['novinky'] = async function loadDataNovinky(since) {
  // method: # of articles in "Koronavirus" section vs. # of unique articles in "domaci" and "zahranicni" sections.
  const categories = {
    domaci: {id: "section_5ad5a5fcc25e64000bd6e7ab_novinky", korona: false},
    zahranicni: {id: "section_5ad5a5fcc25e64000bd6e7a5_novinky", korona: false},
    koronavirus: {id: "section_5e57a6e3258aaab67a8564ce_novinky", korona: true}
  }

  const urlTemplate = "https://www.novinky.cz/api/documenttimelines?service=novinky&maxItems=8&itemIds={categoryId}&lastItemId={lastItemId}&loadingNextItems=1&sort=-dateOfPublication%2C-uid&embedded=sectionsTree";
  const waitTime = 500;
  const articles = {};

  const loadArticlesInCategory = async function(categoryName) {
    const category = categories[categoryName]
        , categoryId = category.id

    do {
      if (articles[categoryName].length > 0) {
        await wait(waitTime);
      }
      const url = urlTemplate
        .replace('{categoryId}', categoryId)
        .replace('{lastItemId}', articles[categoryName].length == 0 ? 0 : articles[categoryName][articles[categoryName].length-1].id)
      try {
        const response = await fetch(url)
        const json = await response.json()
        articles[categoryName].push(...json._items[0].documents.map(d => {return {title: d.title, id: d.uid, date: d.dateOfPublication}}))
      } catch (e) {
        console.log(`error fetching ${url}, will try again`)
      }
      progress.novinky = "Novinky.cz: ";
      Object.keys(categories).forEach(c => progress.novinky += `${c} ${articles[c].length? articles[c][articles[c].length-1].date : '-'}, `);
    } while (articles[categoryName][articles[categoryName].length-1].date >= since)
  }

  // Parallel rewuests did not do well, let's be nice
  // await Promise.all(Object.keys(categories).map(categoryName => {
  //   articles[categoryName] = [];
  //   return loadArticlesInCategory(categoryName, since)
  // }))
  for (categoryName in categories) {
    articles[categoryName] = [];
  }

  for (categoryName in categories) {
    await loadArticlesInCategory(categoryName, since);
  }

  const union = {};
  Object.keys(categories).forEach(categoryName => {
    articles[categoryName].forEach(a => {
      if (!union[a.id]) union[a.id] = a;
      a[categories[categoryName].korona? 'koronaY' : 'koronaN'] = true;
    })
  })

  const countsByDate = {};
  Object.keys(union).forEach(aId => {
    const date = union[aId].date.substr(0,10);
    if (!countsByDate[date]) countsByDate[date] = {korona:0, total:0};
    if (union[aId].koronaY) countsByDate[date].korona++;
    countsByDate[date].total++;
  })

  return countsByDate;
}

//----------

sources['idnes'] = async function loadDataIDnes(since) {
  const categories = {
    zpravodajstvi: {urlFn: (p) => "https://www.idnes.cz/zpravy/archiv/" + p, korona: false},
    koronavirus_domaci: {urlFn: (p) => `https://www.idnes.cz/wiki/temata/koronavirus-v-cesku.K533269/${p}`, korona: true},
    koronavirus_zahranici: {urlFn: (p => {
      return p==1 ? "https://www.idnes.cz/koronavirus/clanky" : `https://www.idnes.cz/zpravy/zahranicni/koronavirus.K466979/${p}`
    }) , korona: true}
  }
  const articleLinkPattern = /.*\.A(\d{6}_\d{6}).*/
  const waitTime = 1000;
  const articles = {};

  const loadArticlesInCategory = async function(categoryName) {
    let page=0
    do {
      if (page++ > 0) {
        await wait(waitTime);
      }
      const url = categories[categoryName].urlFn(page);
      try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        const data = $('div.art').map((i,e) => {
          return {
            id: articleLinkPattern.test($('a',e).attr('href')) ? articleLinkPattern.exec($('a',e).attr('href'))[1] : false,
            dateUpdated: $('span.time', e).attr('datetime')
          }
        }).get().filter(a => a.id);
        articles[categoryName].push(...data);
      } catch (e) {
        console.log(`error fetching ${url}, will try again`, e);
        page--;
      }
      
      progress.idnes = "idnes.cz: ";
      Object.keys(categories).forEach(c => progress.idnes += `${c} ${articles[c].length? articles[c][articles[c].length-1].dateUpdated : '-'}, `);
    } while (articles[categoryName][articles[categoryName].length-1].dateUpdated >= since)

    return articles;
  }

  for (categoryName in categories) {
    articles[categoryName] = [];
  }

  for (categoryName in categories) {
    await loadArticlesInCategory(categoryName);
  }

  const union = {};
  Object.keys(categories).forEach(categoryName => {
    articles[categoryName].forEach(a => {
      if (!union[a.id]) union[a.id] = a;
      a[categories[categoryName].korona? 'koronaY' : 'koronaN'] = true;
    })
  })

  const countsByDate = {};
  Object.keys(union).forEach(aId => {
    const date = '20'+aId.substr(0,2)+'-'+aId.substr(2,2)+'-'+aId.substr(4,2);
    if (!countsByDate[date]) countsByDate[date] = {korona:0, total:0};
    if (union[aId].koronaY) countsByDate[date].korona++;
    countsByDate[date].total++;
  })

  return countsByDate;
}

//-----------

let result = { dates: [], news: {} };
let startDate = conf.newsEarliestStart;
try {
  result = require(conf.newsOutputFile);
  startDate = result.dates.reduce((a,b) => a > b ? a : b);
  console.log('Using latest date from previous state as start date: ' + startDate);
  //and also deleting the results for that date...
  result.dates.pop();
  for (let source in result.news) {
    result.news[source].total.pop();
    result.news[source].korona.pop();
  }
} catch (e) {
  console.log('No previous dataset found, starting from scratch');
}

let reportingInterval=0;

Promise.all(Object.values(sources).map(fn => fn(startDate))).then((data) => {
  clearInterval(reportingInterval);

  const sourceKeys = Object.keys(sources);
  const o = {};
  for (let i = 0; i < data.length; i++) {
    const sourceName = sourceKeys[i];
    for (let date in data[i]) {
      if (!o[date]) o[date]={};
      o[date][sourceName] = data[i][date];
    }
  }
  for (let source in sources) if (!result.news[source]) result.news[source] = {total:[], korona:[]};
  const datesOrdered = Object.keys(o).sort();
  datesOrdered.forEach(date => {
    if (date >= startDate) {
      result.dates.push(date);
      sourceKeys.forEach((source) => {
        result.news[source].total.push(o[date][source]? o[date][source].total : 0);
        result.news[source].korona.push(o[date][source]? o[date][source].korona : 0);
      })
    }
  })
  writeFileSync(conf.newsOutputFile, JSON.stringify(result));
  console.log(JSON.stringify(result, null, 2))
})

reportingInterval = setInterval(() => {
  console.log(JSON.stringify(progress, null, 2));
}, 1000)

