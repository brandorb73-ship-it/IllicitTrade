// ------------------ PER-TAB STATE ------------------
const tabStates = {
  origin: { map: null, manualLayer: null, manualRoutes: [], startPoint: null, clickCount: 0 },
  destination: { map: null, manualLayer: null, manualRoutes: [], startPoint: null, clickCount: 0 },
  enforcement: { map: null, manualLayer: null, manualRoutes: [], startPoint: null, clickCount: 0 },
  routes: { map: null, manualLayer: null, manualRoutes: [], startPoint: null, clickCount: 0 },
  allmaps: { map: null } // container for All Maps tab
};

let currentColor = "#ff0000";

// ------------------ ALL MAPS SNAPSHOTS ------------------
export const allMapsSnapshots = []; // stores {tab, map, table, timestamp}

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

  if (tabName !== "allmaps") {
    state.manualLayer = L.layerGroup().addTo(state.map);
    state.map.on("click", e => onMapClickTab(e, tabName));
  }

  setTimeout(() => state.map.invalidateSize(), 200);
}

// ------------------ CLICK HANDLER ------------------
export function onMapClickTab(e, tabName) {
  const state = tabStates[tabName];
  const point = e.latlng;

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

  const line = L.polyline([state.startPoint, point], { color: currentColor, weight: 3 }).addTo(state.manualLayer);

  // ------------------ Arrow decorator ------------------
  if (window.L.PolylineDecorator) {
    L.polylineDecorator(line, {
      patterns: [{
        offset: "50%",
        repeat: 0,
        symbol: L.Symbol.arrowHead({
          pixelSize: 10,
          polygon: true,
          pathOptions: { color: currentColor, fillOpacity: 1 }
        })
      }]
    }).addTo(state.manualLayer);
  }

  state.manualRoutes.push({ from: state.startPoint, to: point, color: currentColor });

  // HARD RESET → new origin for next line
  state.startPoint = null;

  // Optional: save snapshot automatically after each line
  // saveSnapshot(tabName);
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

// ------------------ TRADE / ENFORCEMENT EXAMPLES ------------------
export function drawTrade(rows) {
  const state = tabStates.origin;
  if (!state.map) return;
  const layer = L.layerGroup().addTo(state.map);

  rows.forEach(r => {
    if (!r.originLat || !r.destLat) return;

    const line = L.polyline([[r.originLat, r.originLng], [r.destLat, r.destLng]], { color: "#38bdf8", weight: 2 }).addTo(layer);
  });
}

export function drawEnforcement(rows) {
  const state = tabStates.enforcement;
  if (!state.map) return;
  const layer = L.layerGroup().addTo(state.map);

  rows.forEach(r => {
    if (!r.originLat || !r.destLat) return;

    const line = L.polyline([[r.originLat, r.originLng], [r.destLat, r.destLng]], { color: "#f97316", dashArray: "6,4", weight: 2 }).addTo(layer);
  });
}

// ------------------ CHECK MAP READY ------------------
export function isMapReady(tabName) {
  const state = tabStates[tabName];
  return !!state && !!state.map;
}

// ------------------ SAVE SNAPSHOT ------------------
export async function saveSnapshot(tabName) {
  const state = tabStates[tabName];
  if (!state || !state.map) return;

  const mapNode = document.getElementById(`map-${tabName}`);
  const tableEl = document.getElementById("dataTable");

  const mapCanvas = await html2canvas(mapNode, { useCORS: true, scale: 2 });
  const tableCanvas = await html2canvas(tableEl, { useCORS: true, scale: 2 });

  allMapsSnapshots.push({
    tab: tabName,
    map: mapCanvas.toDataURL("image/png"),
    table: tableCanvas.toDataURL("image/png"),
    timestamp: new Date().toLocaleString()
  });

  alert(`Snapshot saved for tab "${tabName}"`);
}
