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
export function onMapClickTab(e,tabName){
  const state = tabStates[tabName];
  const clickPoint = e.latlng;

  // 1st click → new origin dot
  if(!state.manualStartPoint){
    state.manualStartPoint = clickPoint;
    L.circleMarker(clickPoint,{radius:6,color:currentColor,fillOpacity:0.8}).addTo(state.manualLayer);
    return;
  }

  // 2nd click → line with arrow
  const line = L.polyline([state.manualStartPoint, clickPoint],{
    color: currentColor, weight:3, opacity:0.85
  }).addTo(state.manualLayer);

  // Arrow (uses global L.polylineDecorato
