import "leaflet-polylinedecorator";

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

  if(!state.manualStartPoint){
    // first click → dot
    state.manualStartPoint = clickPoint;
    L.circleMarker(clickPoint,{radius:6,color:currentColor,fillOpacity:0.8}).addTo(state.manualLayer);
    return;
  }

  // second click → line
  const line = L.polyline([state.manualStartPoint, clickPoint],{
    color: currentColor, weight:3, opacity:0.85
  }).addTo(state.manualLayer);

  L.polylineDecorator(line,{
    patterns:[{
      offset:"50%", repeat:0,
      symbol:L.Symbol.arrowHead({pixelSize:10, polygon:true, pathOptions:{color:currentColor}})
    }]
  }).addTo(state.manualLayer);

  state.manualRoutes.push({from:state.manualStartPoint, to:clickPoint, color:currentColor});
  state.manualStartPoint = null; // reset origin for next dot
}

// ------------------ SET COLOR ------------------
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
