// ------------------ PER-TAB STATE ------------------
const tabStates = {
  origin: { map:null, manualLayer:null, manualRoutes:[], startPoint:null, expectingLine:false },
  destination: { map:null, manualLayer:null, manualRoutes:[], startPoint:null, expectingLine:false },
  enforcement: { map:null, manualLayer:null, manualRoutes:[], startPoint:null, expectingLine:false },
  routes: { map:null, manualLayer:null, manualRoutes:[], startPoint:null, expectingLine:false }
};

let currentColor = "#ff0000";

// ------------------ INIT TAB MAP ------------------
export function initTabMap(tabName) {
  const state = tabStates[tabName];
  if (state.map) return;

  const mapDiv = document.getElementById(`map-${tabName}`);
  state.map = L.map(mapDiv).setView([15, 20], 2);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OSM &copy; CARTO',
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(state.map);

  state.manualLayer = L.layerGroup().addTo(state.map);
  state.map.on("click", e => onMapClickTab(e, tabName));
  setTimeout(() => state.map.invalidateSize(), 200);
}

// ------------------ CLICK HANDLER ------------------
export function onMapClickTab(e, tabName) {
  const state = tabStates[tabName];
  const point = e.latlng;

  // ===============================
  // CLICK 1 → CREATE ORIGIN DOT
  // ===============================
  if (!state.expectingLine) {
    state.startPoint = point;

    L.circleMarker(point, {
      radius: 6,
      color: currentColor,
      fillOpacity: 0.9
    }).addTo(state.manualLayer);

    state.expectingLine = true;
    return;
  }

  // ===============================
  // CLICK 2 → DRAW LINE + ARROW
  // ===============================
  const line = L.polyline(
    [state.startPoint, point],
    { color: currentColor, weight: 3 }
  ).addTo(state.manualLayer);

  // Arrow
  L.polylineDecorator(line, {
    patterns: [{
      offset: "60%",
      repeat: 0,
      symbol: L.Symbol.arrowHead({
        pixelSize: 10,
        polygon: true,
        pathOptions: { color: currentColor }
      })
    }]
  }).addTo(state.manualLayer);

  state.manualRoutes.push({
    from: state.startPoint,
    to: point,
    color: currentColor
  });

  // ✅ HARD RESET — THIS IS THE KEY
  state.startPoint = null;
  state.expectingLine = false;
}

// ------------------ SET ROUTE COLOR ------------------
export function setRouteColor(color) {
  currentColor = color;
}

// ------------------ CLEAR ROUTES ------------------
export function clearTabRoutes(tabName) {
  const state = tabStates[tabName];
  state.manualLayer.clearLayers();
  state.manualRoutes = [];
  state.currentOrigin = null;
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
