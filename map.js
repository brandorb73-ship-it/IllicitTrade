// ------------------ PER-TAB STATE ------------------
const tabStates = {
  origin: { map:null, manualLayer:null, manualRoutes:[], startPoint:null, clickCount:0 },
  destination: { map:null, manualLayer:null, manualRoutes:[], startPoint:null, clickCount:0 },
  enforcement: { map:null, manualLayer:null, manualRoutes:[], startPoint:null, clickCount:0 },
  routes: { map:null, manualLayer:null, manualRoutes:[], startPoint:null, clickCount:0 }
};

let currentColor = "#ff0000";

// ------------------ INIT TAB MAP ------------------
export function initTabMap(tabName) {
  const state = tabStates[tabName];
  if (state.map) {
    state.map.invalidateSize();
    return;
  }

  const mapDiv = document.getElementById(`map-${tabName}`);
  state.map = L.map(mapDiv).setView([15, 20], 2);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OSM &copy; CARTO',
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(state.map);

  state.manualLayer = L.layerGroup().addTo(state.map);
  state.map.on("click", e => onMapClickTab(e, tabName));

  // Fix map display in hidden tabs
  setTimeout(() => state.map.invalidateSize(), 200);
}

// ------------------ CLICK HANDLER ------------------
export function onMapClickTab(e, tabName) {
  const state = tabStates[tabName];
  const point = e.latlng;

  // Ignore duplicate Leaflet fires
  state.clickCount++;

  // ODD CLICK → CREATE DOT
  if (state.clickCount % 2 === 1) {
    state.startPoint = point;

    L.circleMarker(point, {
      radius: 6,
      color: currentColor,
      fillOpacity: 0.9
    }).addTo(state.manualLayer);

    return;
  }

  // EVEN CLICK → DRAW LINE
  if (!state.startPoint) return;

  const line = L.polyline([state.startPoint, point], { color: currentColor, weight: 3 })
    .addTo(state.manualLayer);

  state.manualRoutes.push({
    from: state.startPoint,
    to: point,
    color: currentColor
  });

  // HARD RESET — prevents dot 1 reuse
  state.startPoint = null;
}

// ------------------ SET ROUTE COLOR ------------------
export function setRouteColor(color) {
  currentColor = color;
}

// ------------------ CLEAR ROUTES ------------------
export function clearTabRoutes(tabName) {
  const state = tabStates[tabName];
  if (state.manualLayer) state.manualLayer.clearLayers();
  state.manualRoutes = [];
  state.startPoint = null;
  state.clickCount = 0;
}

// ------------------ OPTIONAL: DRAW TRADE/ENFORCEMENT ------------------
export function drawTrade(rows) {
  const state = tabStates.origin;
  if (!state.map) return;
  const layer = L.layerGroup().addTo(state.map);

  rows.forEach(r => {
    if (!r.originLat || !r.destLat) return;
    L.polyline([[r.originLat, r.originLng], [r.destLat, r.destLng]], { color: "#38bdf8", weight: 2 }).addTo(layer);
  });
}

export function drawEnforcement(rows) {
  const state = tabStates.enforcement;
  if (!state.map) return;
  const layer = L.layerGroup().addTo(state.map);

  rows.forEach(r => {
    if (!r.originLat || !r.destLat) return;
    L.polyline([[r.originLat, r.originLng], [r.destLat, r.destLng]], { color: "#f97316", dashArray: "6,4", weight: 2 }).addTo(layer);
  });
}

// ------------------ IS MAP READY ------------------
// Check if the current active tab has a map
export function isMapReady(tabName = null) {
  if (tabName) {
    return tabStates[tabName] && !!tabStates[tabName].map;
  }
  // fallback: check any tab
  return Object.values(tabStates).some(s => !!s.map);
}
