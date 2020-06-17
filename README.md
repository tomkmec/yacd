# Yet Another COVID-19 Dashboard

There are many, but this one is mine.

Should be short and to the point.

Live at [tomkmec.github.io/yacd](https://tomkmec.github.io/yacd/)

## What I'm tracking and why

* *Number of critical active cases in time* - Possible overwhelming of the healthcare system is probably the main concern. If # of active cases requiring intensive care rises quickly, we may actually get in trouble.
* *Reproduction number estimate* - an exponential spread is definitely an issue
* *Number of counties with new cases* - this should point how localized the outbreak is.
* *Ratio of news articles mentioning COVID* - COVID-19 is a lucrative topic. Media profit from the fear. This is probably more dangerous than the disease itself as it's a reinforcing factor in media-public-goverment loop, directly affecting everyday life and economics. 

## What I'm NOT tracking and why

* *Active cases, daily new cases* - heavily depends on testing, so is kind of arbitrary and may be misleading
* *Positive test results ration* - heavily biased by *who* gets tested and why = low value information
* *Deaths* - in most deaths COVID is not the primary cause, it is impossible to interpret this number

## Solution

### Data 

* Hospitalizations: <https://onemocneni-aktualne.mzcr.cz/covid-19>
  * Simple parser using [cheerio](https://cheerio.js.org/) to parse the chart data (JSON in a chart element attribute)
* Reproduction number estimates: <https://docs.google.com/spreadsheets/d/1cCCECunGrLmcxp5RwTRvHPLPi2Uh2J8b4NIoyFDcu7c/edit#gid=1683234482>
  * R/O access with API Key using [node-google-spreadsheet](https://github.com/theoephraim/node-google-spreadsheet)
* Detailed infections distribution: <https://docs.google.com/spreadsheets/d/1FFEDhS6VMWon_AWkJrf8j3XxjZ4J6UI1B2lO3IW-EEc/edit#gid=1011737151>
  * R/O access with API Key using [node-google-spreadsheet](https://github.com/theoephraim/node-google-spreadsheet)
* Covid-themed news articles
  * Crawler for novinky.cz and idnes.cz, counting # of unique articles in general news sections and corona sections, computing the ratio.

### Rendering

* *Heavily* tweaked [chartist.js](https://gionkunz.github.io/chartist-js/) charts - see the source for the heatmap and error "sleeve" goodies
* [Covid Infected!](https://www.najbrt.cz/en/detail/covid) typeface
