# Yet Another COVID-19 Dashboard

There are many, but this one is mine.

Should be short and to the point.

Live at [tomkmec.github.io/yacd](https://tomkmec.github.io/yacd/)

## What I'm tracking and why

* *Number of critical active cases in time* - Possible overwhelming of the healthcare system is probably the main concern. If # of active cases requiring intensive care rises quickly, we may actually get in trouble.
* *Reproduction number estimate* - an exponential spread is definitely an issue
* *Vaccination progress* - for sheer hope that the vaccination will help.
* *Ratio of news articles mentioning COVID* - The first wave of spring 2020 was extremely overexposed, occupying most of news coverage and everyday life with very little actual disease spread. This likely caused the disaster fatigue and lead to much worse waves we face now.

## What I'm NOT tracking and why

* *Active cases, daily new cases* - heavily depends on testing, so is kind of arbitrary and may be misleading
* *Positive test results ratio* - heavily biased by *who* gets tested and why = low value information
* *Deaths* - in most deaths COVID is not the primary cause, it is impossible to interpret this number. Excess deaths are reported with significant lag and not accurately and are, frankly, too grim to look at. Find it on ČSÚ website if you're not depressed enough.

## Solution

### Data 

* Hospitalizations: <https://onemocneni-aktualne.mzcr.cz/covid-19>
  * Simple parser using [cheerio](https://cheerio.js.org/) to parse the chart data (JSON in a chart element attribute)
* Reproduction number estimates: <https://docs.google.com/spreadsheets/d/1cCCECunGrLmcxp5RwTRvHPLPi2Uh2J8b4NIoyFDcu7c/edit#gid=1683234482>
  * R/O access with API Key using [node-google-spreadsheet](https://github.com/theoephraim/node-google-spreadsheet)
* Detailed infections distribution: 
  * MZČR: [COVID-19: Epidemiologická charakteristika obcí](https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19)
  * data.gov.cz: [INSPIRE - administrativní jednotky](https://data.gov.cz/datov%C3%A1-sada?iri=https%3A%2F%2Fdata.gov.cz%2Fzdroj%2Fdatov%C3%A9-sady%2Fhttps---atom.cuzk.cz-api-3-action-package_show-id-cz-00025712-cuzk_au_1)
* Vaccination progress:
  * MZČR: [COVID-19: Přehled vykázaných očkování podle očkovacích míst ČR](https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19) - streaming CSV parser in node
  * ČSÚ: [Věkové složení obyvatelstva - 2019](https://www.czso.cz/csu/czso/vekove-slozeni-obyvatelstva-2019)
* Covid-themed news articles
  * Crawler for novinky.cz and idnes.cz, counting # of unique articles in general news sections and corona sections, computing the ratio.

### Rendering

* Very simple [three.js](https://threejs.org) use case
* *Heavily* tweaked [chartist.js](https://gionkunz.github.io/chartist-js/) charts - see the source for the heatmap (checkout some 2020 version) and error "sleeve" goodies
* [Covid Infected!](https://www.najbrt.cz/en/detail/covid) typeface
