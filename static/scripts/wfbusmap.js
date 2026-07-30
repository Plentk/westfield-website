const SvgKey = "http://www.w3.org/2000/svg";

const svg = document.getElementById("wfbusmap");
const wfroads = document.getElementById("wfroads");
const busroutes = document.getElementById("wfroutes");
const wfbldgs = document.getElementById("wfbldg");
const wfbusstops = document.getElementById("wfstop");
const hover = document.getElementById("wfmapinfo");

const roadHierachy = {"Local": 10, "Secondary": 20, "Primary": 30, "Expressway": 40};

let wfroadsdata;
let wfbusroutesdata;
let wfbuildingsdata;
let wfbusstopsdata;

let view = {};

const toolTipMargin = 5;

async function loadFiles() {
  try {
    let fetched;
    fetched = await fetch("../../static/db/roads.json");
    wfroadsdata = await fetched.json();  
    fetched = await fetch("../../static/db/wfbusroute.json");
    wfbusroutesdata = await fetched.json();
    fetched = await fetch("../../static/db/buildings.json");
    wfbuildingsdata = await fetched.json();
    fetched = await fetch("../../static/db/busstops.json");
    wfbusstopsdata = await fetched.json();

    drawRoads(wfroadsdata);
    drawBuildings(wfbuildingsdata);
    drawBusStops(wfbusstopsdata);

    resizeSVG(svg);
  } catch (e) {
    console.error("Error loading:", e);
  }
  
}

function fetchJSONData(fileName, func) {
  fetch(fileName)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();  
    })
    //.then(data => console.log(data))
    .then(data => func(data))  
    .catch(error => console.error('Failed to fetch data:', error)); 
};

function create(type, attrs) {
  const el = document.createElementNS(SvgKey, type);
  for (let k in attrs) el.setAttribute(k, attrs[k]);
  return el;
};

function drawRoads(roadList) {
  // console.log(roadHierachy);
  const adjustedRoadList = roadList
    .map(a => ({...a, typeRoadInt: roadHierachy[a.Type] || 0}))
    .sort((a, b) => {
      return a.typeRoadInt - b.typeRoadInt;
    })
    .sort((a, b) => {
      return a.roadName > b.roadName;
    });
  // console.log(adjustedRoadList)
  adjustedRoadList.forEach((road, index) => {
    // console.log(road);
    const roadGroup = create("g", {
        class:`road-segment ${road.Type} ${road.RoadName.replaceAll(" ", "_")} ${road.Direction}`,
      });
    roadGroup.appendChild(create("path", {
      d: `M ${road.StartLatitude} ${road.StartLongitude} L ${road.EndLatitude} ${road.EndLongitude}`,
      class: `road ${road.Type} ${road.RoadName.replaceAll(" ", "_")}`
    }));
    const textXCentre = (parseInt(road.StartLatitude) + parseInt(road.EndLatitude)) / 2;
    const textYCentre = (parseInt(road.StartLongitude) + parseInt(road.EndLongitude)) / 2;
    const roadName = create("text", {
      x: textXCentre,
      y: textYCentre,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      transform: `rotate(${Math.atan((parseInt(road.EndLongitude) - parseInt(road.StartLongitude)) / (parseInt(road.EndLatitude) - parseInt(road.StartLatitude))) * (180/Math.PI) || 0} ${textXCentre},${textYCentre})`
    });
    roadName.textContent = (Math.sqrt((road.EndLongitude - road.StartLongitude)**2+(road.EndLatitude - road.StartLatitude)**2) > 50) ? road.RoadName : ``;
    roadGroup.appendChild(roadName);
    wfroads.appendChild(roadGroup);
    
  });
}

function drawBuildings(buildingList) {
  buildingList.forEach((building, index) => {
    const buildingGroup = create("g", {
      class: `building ${building.RoadName.replaceAll(" ", "_")} ${building.Description.replaceAll(" ", "_")} ${building.Abbreviation.replaceAll(" ", "_")} ${building.Category.replaceAll(" ", "_")} ${building.Type.replaceAll(" ", "_")}`
    });
    buildingGroup.appendChild(create("path", {
      x: building.Longitude,
      y: building.Latitude,
      d: `m ${building.Longitude} ${building.Latitude} ${building.Path || `m -5 -5 l 10 0 l 0 10 l -10 0 z`}`,
    }));
    const buildingName = create("text", {
      x: building.Longitude,
      y: building.Latitude,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      transform: ``,
    });
    buildingName.textContent = building.Description;
    buildingGroup.appendChild(buildingName);
    wfbldgs.appendChild(buildingGroup)
  })
}

function drawBusStops(busStopList) {
  const busStopBlobGroup = create("g", {
    class: `busstopblob`,
  });
  busStopList.forEach((busStop, index) => {
    const busStopGroup = create("g", {
      class: `busstop ${busStop.RoadName.replaceAll(" ", "_")} ${busStop.Description.replaceAll(" ", "_")}`,
      id: `${busStop.BusStopCode}`
    });
    busStopGroup.appendChild(create("circle", {
      class: `busstop busstopblob`,
      cx: busStop.Longitude,
      cy: busStop.Latitude,
      r: 5,
    }));
    const busStopToolTip = create("g", {
      class: `tool_tip`,
    })
    const busStopName = create("text", {
      x: busStop.Longitude,
      y: busStop.Latitude + 25,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      transform: ``,
      class: `busstoptext`
    });
    busStopName.textContent = `${busStop.BusStopCode} ${busStop.Description}`;
    busStopToolTip.appendChild(busStopName);
    
    busStopGroup.appendChild(busStopToolTip);
    
    wfbusstops.appendChild(busStopGroup);
    const boundingBox = busStopToolTip.getBBox();

    const hitbox = create("rect", {
      x: boundingBox.x - toolTipMargin,
      y: boundingBox.y - toolTipMargin,
      width: boundingBox.width + toolTipMargin * 2,
      height: boundingBox.height + toolTipMargin * 2,
      class: "hitbox",
      rx: toolTipMargin,
      ry: toolTipMargin,
      "pointer-events": "all",
    });
    busStopToolTip.insertBefore(hitbox, busStopToolTip.firstChild);
  })
}

function resizeSVG(svgDoc) {
  const boundingBox = svgDoc.getBBox();
  svgDoc.setAttribute("viewBox", `${boundingBox.x} ${boundingBox.y} ${boundingBox.width} ${boundingBox.height}`);
  view = {
    x: boundingBox.x,
    y: boundingBox.y,
    w: boundingBox.width,
    h: boundingBox.height
  };
}

// Zoom
let dragging = false;
let start = {};

function updateView() {
    svg.setAttribute(
        "viewBox",
        `${view.x} ${view.y} ${view.w} ${view.h}`
    );
}

svg.addEventListener("wheel", e => {
    e.preventDefault();

    const scale = e.deltaY > 0 ? 1.15 : 0.87;

    // mouse position inside SVG
    const rect = svg.getBoundingClientRect();

    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;

    const oldW = view.w;
    const oldH = view.h;

    view.w *= scale;
    view.h *= scale;

    // keep zoom centered on cursor
    view.x += (oldW - view.w) * mx;
    view.y += (oldH - view.h) * my;
    updateView();

}, {passive:false});


// Drag
svg.addEventListener("mousedown", e => {
    dragging = true;
    start.x = e.clientX;
    start.y = e.clientY;
    start.viewX = view.x;
    start.viewY = view.y;
});


window.addEventListener("mousemove", e => {
    if (!dragging) return;

    const rect = svg.getBoundingClientRect();

    const dx = (e.clientX - start.x) / rect.width * view.w;
    const dy = (e.clientY - start.y) / rect.height * view.h;

    view.x = start.viewX - dx;
    view.y = start.viewY - dy;
    updateView();
});


window.addEventListener("mouseup", () => {
    dragging = false;
});



loadFiles();


const placeholder = document.getElementById("error");
placeholder.innerHTML = "";