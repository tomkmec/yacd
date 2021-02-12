let fs = require('fs');

const maxPoints = 500;

var expat = require('node-expat')
var parser = new expat.Parser('UTF-8')
let currentAU = false
let currentPath = [];
let text = ''
let result = {}

let parseCoords = (t) => {
  let coords = t.split(' ').map(_ => parseFloat(_));
  let x = coords.filter((_,i) => i%2==0);
  let y = coords.filter((_,i) => i%2==1);
  let interleave = Math.ceil(x.length / maxPoints);
  return {
    x: [Math.min(...x), Math.max(...x)],
    y: [Math.min(...y), Math.max(...y)],
    points: [...Array(Math.floor(x.length / interleave)).keys()].map(i => [ x[i*interleave], y[i*interleave] ])
  }
}

parser.on('startElement', (name, attrs) => {
  currentPath.push({name, attrs});
  if (name==='elf-au:AdministrativeUnit') {
    currentAU = {
      id: attrs['gml:id']
    }
  }
})

parser.on('endElement', (name) => {
  if (name==='elf-au:AdministrativeUnit') {
    if (currentAU.id.startsWith('AU.3.')) {
      // result[currentAU.id.substring(5)] = {name: currentAU.name, coords: currentAU.coords}
      result[currentAU.id2.substring(0,6)] = {name: currentAU.name, coords: currentAU.coords, interiorCoords: currentAU.interiorCoords}
    }
    console.log(currentAU.name);
    currentAU = false
  } else if (name==='gml:posList' && currentAU && currentAU.id.startsWith('AU.3.') && currentPath.find(e => e.name==='gml:exterior')) {
    if (!currentAU.coords) currentAU.coords = parseCoords(text.trim()); //litomerice maji 2 exteriory, ten 2. s rozlohou asi pul m2 :facepalm:
  } else if (name==='gml:posList' && currentAU && currentAU.id.startsWith('AU.3.') && currentPath.find(e => e.name==='gml:interior')) {
    currentAU.interiorCoords = parseCoords(text.trim()); // brno mesto a louny, kvuli litomericim
  } else if (name==='gn:text' && currentPath.find(e => e.name==='au:name')) {
    currentAU.name = text.trim();
  } else if (name==='identifier' && currentPath.find(e => e.name==='ThematicIdentifier')) {
    currentAU.id2 = text.trim();
  } else if (name==='base:SpatialDataSet') {
    fs.writeFileSync('./okresy.json', JSON.stringify(result))
    console.log(result);
    }

  let popped = currentPath.pop()
  text = '';
})

parser.on('text', textChunk => {
  text += textChunk
});

console.log('>>>>')
let stream = fs.createReadStream('./1.xml');
stream.pipe(parser);