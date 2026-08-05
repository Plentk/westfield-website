// adapted from jooferj's examination schedule
let data = [];
let busstopdata = []

async function loadFile(fileName) {
  try {
    const Fetched = await fetch(fileName);
    data  = await Fetched.json();
    const BusStops = await fetch('../static/db/busstops.json');
    busstopdata = await BusStops.json();

    renderBarseServe();
  } catch (e) {
    console.error("Error loading:", e);
  }
}

function titleCase(s) {
    return s.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
}

function renderBarseServe() {
  const grid = document.getElementById('bus-list');
  grid.innerHTML = '';

  const bus_data = data
    .map(route => ({...route, OriginName: busstopdata.find(busStopObj => busStopObj.BusStopCode === route.OriginCode)?.Description || route.OriginCode}))
    .map(route => ({...route, DestinationName: busstopdata.find(busStopObj => busStopObj.BusStopCode === route.DestinationCode)?.Description || route.DestinationCode}))
    //.filter(a => a.Direction === 1)
    .sort((a, b) => {
      const numA = parseInt(a.ServiceNo, 10) || 1000;
      const numB = parseInt(b.ServiceNo, 10) || 1000;

      return numA - numB;
    });

    // .map(bus_service => ({...exam, dateObj: new Date(exam.time) }))

  bus_data.forEach(bus_datum => {
    //console.log(parseInt(bus_datum.ServiceNo), bus_datum.OriginName, bus_datum)

    const bus_service = document.createElement('div');
    bus_service.className = `bus-route p ${bus_datum.Operator} ${bus_datum.Category} ${bus_datum.Direction}`;

    if (bus_datum.LoopDesc == "") {
      bus_service.innerHTML = `
      <div class="serviceTitle">
        <div class="serviceNo">
          Bus ${bus_datum.ServiceNo}
        </div>
        <div class="busOperator">
          ${bus_datum.Operator}
        </div>
      </div>
      <div class="serviceStats">
        <div class="busCat ${bus_datum.Category}">
          ${titleCase(bus_datum.Category)}
        </div>
        <div class="bus_start">
          ${bus_datum.OriginName}
        </div>
        <div class="bus_dest">
          — ${bus_datum.DestinationName}
        </div>
      </div>`;
    } else if (bus_datum.OriginCode === bus_datum.DestinationCode) {
      bus_service.innerHTML = `
      <div class="serviceTitle">
        <div class="serviceNo">
          Bus ${bus_datum.ServiceNo}
        </div>
        <div class="busOperator">
          ${bus_datum.Operator}
        </div>
      </div>
      <div class="serviceStats">
        <div class="busCat ${bus_datum.Category}">
          ${titleCase(bus_datum.Category)}
        </div>
        <div class="bus_start">
          ${bus_datum.OriginName}
        </div>
        <div class="bus_dest bus_loop">
          ↺ ${bus_datum.LoopDesc}
        </div>
      </div>`;
    } else {
      bus_service.innerHTML = `
      <div class="serviceTitle">
        <div class="serviceNo">
          Bus ${bus_datum.ServiceNo}
        </div>
        <div class="busOperator">
          ${bus_datum.Operator}
        </div>
      </div>
      <div class="serviceStats">
        <div class="busCat ${bus_datum.Category}">
          ${titleCase(bus_datum.Category)}
        </div>
        <div class="bus_start">
          ${bus_datum.OriginName}
        </div>
        <div class="bus_dest bus_loop">
          ↺ ${bus_datum.LoopDesc}
        </div>
        <div class="bus_dest">
          — ${bus_datum.DestinationName}
        </div>
      </div>`;
    }
    grid.appendChild(bus_service);
    
  });
}

loadFile('../static/db/wfbusroute.json');


//      <div class="">
//        ${bus_datum.AM_Peak_Freq}
//      </div>
//      <div class="">
//        ${bus_datum.AM_Offpeak_Freq}
//      </div>
//      <div class="">
//        ${bus_datum.PM_Peak_Freq}
//      </div>
//      <div class="">
//        ${bus_datum.PM_Offpeak_Freq}
//      </div>
