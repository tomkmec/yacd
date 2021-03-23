// source: https://www.czso.cz/csu/czso/vekove-slozeni-obyvatelstva-2019
const demography = [113866,114916,113801,112507,112082,109347,110396,110124,120209,121898,123396,118964,109278,103505,98771,95037,94185,92839,93186,
  92144,93667,94611,95440,101623,112676,126896,128501,136768,138864,137948,143280,142138,144427,147552,147794,147995,151034,151785,
  160010,176151,181386,183758,188194,191246,192819,180371,163487,153833,147672,141672,134662,134517,135735,140570,146483,140963,
  126447,122833,119971,117993,126732,135049,138930,139459,138790,138436,139469,138562,134452,129023,131053,133154,125905,98843,
  100918,95195,81762,75535,71230,60173,54763,48743,45004,41781,38877,35413,33043,28777,25063,19936,16200,12656,9797,7251,5348,
  4024,2596,1681,901,430,623]

/*
 * HELPER FUNCTIONS
 */

function floatingAvg(data, span) {
  const justY = data.map(_ => _.y)
  const averaged = justY.map((x,i) => justY.slice(Math.max(0, i-span+1), i+1).reduce((a,b) => a + b, 0) / Math.min(i+1, span))
  return data.map((a,i) => {return {x: a.x, y: averaged[i]}})
}

function fitsIn (point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  
  var x = point[0], y = point[1];
  
  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0], yi = vs[i][1];
      var xj = vs[j][0], yj = vs[j][1];
      
      var intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
  }
  
  return inside;
};

/*
 * CHARTS
 */


const bigScreen = matchMedia("(min-width:1200px)");
function toggleDetails() {
  if (bigScreen.matches) {
    document.querySelectorAll('details').forEach(node => {
      node.setAttribute('x-open', node.hasAttribute('open'));
      node.setAttribute('open', '')
    })
  } else {
    document.querySelectorAll('details').forEach(node => {
      if (node.getAttribute('x-open') == 'true') {
        node.setAttribute('open', '')
      } else {
        node.removeAttribute('open', '')
      }
    })
  }
}
toggleDetails();
bigScreen.addEventListener('resize', toggleDetails);

fetch('datasets/news.json').then(response => response.json()).then(data => {
  const datasets = Object.keys(data.news).map(source => { 
    const percentages = data.dates.map((d, i) => { return {
      x: dayjs(d).toDate(),
      y: 100*data.news[source].korona[i]/data.news[source].total[i]
    }})

    return {
      name: source,
      daily: percentages,
      smoothed: floatingAvg(percentages, 7)
    }
  });
  
  const chartData = {
    labels: data.dates,
    series: [].concat.apply([], datasets.map(dataset => [
      {name: dataset.name + ' daily', data: dataset.daily},
      {name: dataset.name + ' 7-day floating average', data: dataset.smoothed}
    ]))
  }
  const options = {
    axisX: {
      type: Chartist.FixedScaleAxis,
      ticks: data.dates.filter(d => d.lastIndexOf('-01') == 7).map(d => dayjs(d).toDate()),
      labelInterpolationFnc: function(value) {
        return dayjs(value).format('MMM D');
      }
    },
    axisY: {
      labelInterpolationFnc: function(value) {
        return value+"%";
      }
    },
    chartPadding: 0
  }
  
  new Chartist.Line('#news-coverage-chart', chartData, options);  
});

fetch('datasets/hospitalizace.json').then(response => response.json()).then(data => {
  const datesSlice = data.dates.slice(data.dates.indexOf("2020-03-20"));
  const valuesSlice = data.hospitalizations.critical.slice(data.dates.indexOf("2020-03-20"));
  const chartData = {
    labels: datesSlice,
    series: [valuesSlice.map((n,i) => {return {
      x: dayjs(datesSlice[i]).toDate(),
      y: n
    }})]
  }
  const options = {
    low: 0,
    axisX: {
      type: Chartist.FixedScaleAxis,
      ticks: datesSlice.filter(d => d.lastIndexOf('-01') == 7).map(d => dayjs(d).toDate()),
      labelInterpolationFnc: function(value) {
        return dayjs(value).format('MMM D');
      }
    },
    axisY: {
      onlyInteger: true
    },
    showPoint: false,
    chartPadding: 0
  }
  new Chartist.Line('#critical-cases-chart', chartData, options);  
});

fetch('datasets/ockovani.json').then(response => response.json()).then(data => {
  const closedRangePattern = /([0-9]+)\-([0-9]+)/
  const openRangePattern = /([0-9]+)\+/

  let svg = document.querySelector('#vaccination-demography svg');
  let squareTemplate = document.createElementNS('http://www.w3.org/2000/svg','rect');
  let addSquare = (x, y, classes) => {
    let s = squareTemplate.cloneNode();
    s.setAttribute('x', 10*x )
    s.setAttribute('y', 960-10*y)
    s.setAttribute('class', 'square ' + classes)
    svg.append(s)
  }

  data.ageGroups.forEach((g,i) => {
    let range;
    let closedRangeMatch=closedRangePattern.exec(g)
    let openRangeMatch=openRangePattern.exec(g)
    if (closedRangeMatch) {
      range = [parseInt(closedRangeMatch[1]), parseInt(closedRangeMatch[2])]
    } else if (openRangeMatch) {
      range = [parseInt(openRangeMatch[1]), 100]
    } else {
      console.error("Couldn't parse age range " + g)
      range = false;
    }

    if (range) {
      let total = demography.slice(range[0],range[1]+1).reduce((a,b)=>a+b);
      //the implied total will be larger due to rounding up to whole 2000 in each year
      let totalSquares = demography.slice(range[0],range[1]+1).map(a=>Math.ceil(a/2000)).reduce((a,b)=>a+b); 

      // Progress adjusted to the rounded-up demography, eventually mapped to # of squares.
      // The number is rounded, so that 0-999 vaccinated -> 0 squares, 1000-2999 -> 1, 3000-4999 -> 2, etc.
      // array [previous day final doze, today final doze, previous day initial doze, today initial doze] (should be ascending for sanity check)
      let progress = [
        data.totalsPrevious[data.ageGroups.indexOf(g)][1],
        data.totalsLatest[data.ageGroups.indexOf(g)][1],
        data.totalsPrevious[data.ageGroups.indexOf(g)][0],
        data.totalsLatest[data.ageGroups.indexOf(g)][0]
      ]
      .map(vaccinated => Math.round(vaccinated*totalSquares/total))
      
      let y=0, squareCount=0;
      do {
        for (let age = range[1]; age>=range[0]; age--) {
          if (y<Math.ceil(demography[age]/2000)) {
            let className = 'dose0';
            if (squareCount<progress[1]) {
              className = 'dose2'
              if (squareCount>progress[0]) {
                className += ' new'
              }
            } else if (squareCount<progress[3]) {
              className = 'dose1'
              if (squareCount>progress[2]) {
                className += ' new'
              }
            }
            addSquare(age+i/5,y,className);
            squareCount++;
          }
        }
        y++;
      } while (squareCount<totalSquares && y<100)
      if (y==100) {
        console.error("Something went wrong.", squareCount, totalSquares, range)
      }

      let label = document.createElementNS('http://www.w3.org/2000/svg','text');
      label.innerHTML=range[0];
      label.setAttribute('x',range[0]*10+i*2);
      label.setAttribute('y',980);
      svg.append(label);
    }
  });

});

fetch('datasets/r0.json').then(response => response.json()).then(data => {
  const datesSlice = data.dates.slice(data.dates.indexOf("2020-03-20"));
  const valuesSlice = {};
  for (key in data.estimates) {
    valuesSlice[key] = data.estimates[key].slice(data.dates.indexOf("2020-03-20"));
  }
  const series = ['high','low', 'r0'].map(set => {return {
      name: set,
      data: valuesSlice[set].map((n,i) => {return {x: dayjs(datesSlice[i]).toDate(), y: n }})
    }});
  series.push({name: 'base', data:datesSlice.map(d=>{return{x: dayjs(d).toDate(), y: 1}})});
  const chartData = {
    labels: datesSlice,
    series: series
  }
  const options = {
    low:0, high:2.5,
    axisX: {
      type: Chartist.FixedScaleAxis,
      ticks: datesSlice.filter(d => d.lastIndexOf('-01') == 7).map(d => dayjs(d).toDate()),
      labelInterpolationFnc: function(value) {
        return dayjs(value).format('MMM D');
      }
    },
    series: {
      high: { showLine: false, showPoint:false, showArea:true },
      low: { showLine: false, showPoint:false, showArea:true },
      r0: { showPoint:false }, 
      base: { showPoint:false }
    },
    chartPadding: 0
  }
  new Chartist.Line('#r0-chart', chartData, options);  
});

let container = document.getElementById( 'container3js' );
let camera, scene, renderer;
let maxDate = '2020-03-01';


function prepareBuffers(data, coodrinates) {
  let datePositions = {};
  for (let date in data) {
    if (dayjs(date).isAfter(dayjs(maxDate))) {
      maxDate = date;
    }
    datePositions[date] = [];
    for (let okres in data[date]) {
      let count = data[date][okres];
      if (coodrinates[okres]) {
        let c = coodrinates[okres].coords;
        const z = dayjs(date).diff(dayjs('2020-03-01'), 'd') + Math.random()
        for (let i=0; i<count; i++) {
          let x,y
          do {
            x = c.x[0]+Math.random()*(c.x[1]-c.x[0])
            y = c.y[0]+Math.random()*(c.y[1]-c.y[0])
          } while (!fitsIn([x, y], c.points) || (coodrinates[okres].interiorCoords && fitsIn([x, y], coodrinates[okres].interiorCoords.points)))

          const point = [150*(y-15.6), 250*(x-49.7), 2*(z-250)]

          datePositions[date].push(...point)
        }
      }
    }
  }

  return Object.assign(...Object.keys(datePositions).map(k => ({[k]: new THREE.Float32BufferAttribute( datePositions[k], 3 ) })))
}

function init(data, coodrinates) {
  container = document.getElementById( 'container3js' );

  camera = new THREE.PerspectiveCamera( 27, container.offsetWidth / container.offsetHeight, 5, 7000 );
  camera.position.z = 2021;

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xfafafa );
  scene.fog = new THREE.Fog( 0xfafafa, 6000, 7000 );

  let groupBase = new THREE.Group()
  let groupHL = new THREE.Group()
  scene.add(groupBase)
  scene.add(groupHL)
  groupBase.renderOrder = 1;
  groupHL.renderOrder = 2;

  const material1 = new THREE.PointsMaterial( {
    size:4, 
    transparent:true, 
    vertexColors: false, 
    color: 0xff0000, 
    opacity: 0.2, 
    blending: THREE.NormalBlending, 
    depthFunc: THREE.AlwaysDepth,  
    alphaMap: new THREE.TextureLoader().load( "circle.png" )
  });
  const material2 = new THREE.PointsMaterial( {
    size:12, 
    transparent:true, 
    vertexColors: false,
    color: 0x000000, 
    opacity: 0.33, 
    blending: THREE.NormalBlending, 
    depthFunc: THREE.AlwaysDepth,  
    alphaMap: new THREE.TextureLoader().load( "circle.png" )
  });

  const buffersByDate = prepareBuffers(data, coodrinates)

  let r = document.getElementById('vizRange')
  let max = dayjs(maxDate).diff(dayjs('2020-03-01'), 'd')
  r.max = max
  r.value = max
  let updateHighlight = () => {
    let theWeek = [];
    groupHL.traverseVisible(o => {
      if (o.name) o.visible = false;
    })
    document.getElementById('vizDate').innerHTML = dayjs('2020-03-01').add(r.value,'d').format('D.M.YYYY');
    for (let i=0; i<7; i++) {
      let date = dayjs('2020-03-01').add(r.value-i,'d').format('YYYY-MM-DD')
      if (groupHL.getObjectByName(date)) {
        groupHL.getObjectByName(date).visible=true;
      } 
    }
  }

  for (let date in buffersByDate) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', buffersByDate[date] );
    geometry.computeBoundingSphere();

    groupBase.add( new THREE.Points( geometry, material1 ) );

    let highlightPoints = new THREE.Points( geometry, material2 )
    highlightPoints.name = date;
    groupHL.add( highlightPoints );
  }

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( container.offsetWidth, container.offsetHeight );

  container.appendChild( renderer.domElement );

  const controls = new THREE.OrbitControls( camera, renderer.domElement );

  window.addEventListener( 'resize', onWindowResize );
  r.oninput = updateHighlight;
  updateHighlight();

}


function onWindowResize() {
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( container.offsetWidth, container.offsetHeight );
}

function animate() {
  requestAnimationFrame( animate );
  render();
}

function render() {
  renderer.render( scene, camera );
}

let button = document.querySelector('#container3js .button');
let trigger = () => {
  button.removeEventListener('click', trigger);
  button.setAttribute('class', 'button triggered');
  button.innerHTML="Spouštím...";
  Promise.all([
    fetch('./datasets/souradnice-obci/okresy.json').then(r => r.json()),
    fetch('./datasets/okresy2.json').then(r => r.json())
  ]).then(([coords, data]) => {
    init(data, coords)
    document.getElementsByClassName('placeholder')[0].remove()
    document.getElementById('vizRange').style.visibility = 'visible'
    animate()
  })
  
}
button.addEventListener('click', trigger);
