// ------------------ PER-TAB STATE ------------------
const tabStates = {
  origin:{map:null,manualLayer:null,manualRoutes:[],manualStartPoint:null},
  destination:{map:null,manualLayer:null,manualRoutes:[],manualStartPoint:null},
  enforcement:{map:null,manualLayer:null,manualRoutes:[],manualStartPoint:null},
  routes:{map:null,manualLayer:null,manualRoutes:[],manualStartPoint:null}
};

let currentColor = "#ff0000";

// ------------------ INIT TAB MAP ------------------
export function initTabMap(tabName){
  const state = tabStates[tabName];
  if(state.map) return; // already initialized

  const mapDiv = document.getElementById(`map-${tabName}`);
  state.map = L.map(mapDiv).setView([15,20],2);

  // CARTO Light tiles with English country names
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{
    attribution:'&copy; OSM &copy; CARTO', subdomains:"abcd", maxZoom:19
  }).addTo(state.map);

  state.manualLayer = L.layerGroup().addTo(state.map);
  state.map.on("click", e=>onMapClickTab(e,tabName));
  setTimeout(()=>state.map.invalidateSize(),200);
}

// ------------------ CLICK HANDLER ------------------
export function onMapClickTab(e, tabName) {
  const state = tabStates[tabName];
  const clickPoint = e.latlng;

  if (!state.manualStartPoint) {
    // 1st click → create new origin dot
    const dot = L.circleMarker(clickPoint, {
      radius: 6,
      color: currentColor,
      fillOpacity: 0.8
    }).addTo(state.manualLayer);

    // save this dot as the new start point for next line
    state.manualStartPoint = clickPoint;
    return;
  }

  // 2nd click → draw line from start point to this click
  const line = L.polyline([state.manualStartPoint, clickPoint], {
    color: currentColor,
    weight: 3,
    opacity: 0.85
  }).addTo(state.manualLayer);

  // add arrow
  L.polylineDecorator(line, {
    patterns: [{
      offset: "50%",
      repeat: 0,
      symbol: L.Symbol.arrowHead({
        pixelSize: 10,
        polygon: true,
        pathOptions: { color: currentColor }
      })
    }]
  }).addTo(state.manualLayer);

  // save route
  state.manualRoutes.push({ from: state.manualStartPoint, to: clickPoint, color: currentColor });

  // ✅ Reset start point so next click will create a new dot
  state.manualStartPoint = null;
}

// ------------------ SET ROUTE COLOR ------------------
export function setRouteColor(color){
  currentColor = color;
}

// ------------------ CLEAR ROUTES ------------------
export function clearTabRoutes(tabName){
  const state = tabStates[tabName];
  state.manualLayer.clearLayers();
  state.manualRoutes=[];
  state.manualStartPoint=null;
}

// ------------------ OPTIONAL: AUTO DRAW FUNCTIONS ------------------
export function drawTrade(rows){
  const state = tabStates["origin"];
  if(!state.map) return;
  const layer = L.layerGroup().addTo(state.map);

  rows.forEach(r=>{
    if(!r.originLat || !r.destLat) return;
    L.polyline([[r.originLat,r.originLng],[r.destLat,r.destLng]],{color:"#38bdf8",weight:2}).addTo(layer);
  });
}

export function drawEnforcement(rows){
  const state = tabStates["enforcement"];
  if(!state.map) return;
  const layer = L.layerGroup().addTo(state.map);

  rows.forEach(r=>{
    if(!r.originLat || !r.destLat) return;
    L.polyline([[r.originLat,r.originLng],[r.destLat,r.destLng]],{color:"#f97316",dashArray:"6,4",weight:2}).addTo(layer);
  });
}
