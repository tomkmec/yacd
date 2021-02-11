let fs = require('fs');
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
  return {
    x: [Math.min(...x), Math.max(...x)],
    y: [Math.min(...y), Math.max(...y)]
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
    if (currentAU.id.startsWith('AU.4.')) {
      result[currentAU.id.substring(5)] = {name: currentAU.name, coords: currentAU.coords}
    }
    console.log(currentAU.name);
    currentAU = false
  } else if (name==='gml:posList' && currentAU && currentAU.id.startsWith('AU.4.')) {
    currentAU.coords = parseCoords(text.trim());
  } else if (name==='gn:text' && currentPath.find(e => e.name==='au:name')) {
    currentAU.name = text.trim();
  } else if (name==='base:SpatialDataSet') {
    fs.writeFileSync('./obce.json', JSON.stringify(result))
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