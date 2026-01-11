// ------------------ PER-TAB STATE ------------------
const tabStates = {
  origin: { map:null, manualLayer:null, manualRoutes:[], startPoint:null, clickCount:0 },
  destination: { map:null, manualLayer:null, manualRoutes:[], startPoint:null, clickCount:0 },
  enforcement: { map:null, manualLayer:null, manualRoutes:[], startPoint:null, clickCount:0 },
  routes: { map:null, manualLayer:null, manualRoutes:[], startPoint:null, clickCount:0 }
};

let currentColor = "#ff0000";
export const allMapsSnapshots = [];

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

  state.clickCount++;

  // Odd click → new dot (origin)
  if (state.clickCount % 2 === 1) {
    state.startPoint = point;

    L.circleMarker(point, {
      radius: 6,
      color: currentColor,
      fillOpacity: 0.9
    }).addTo(state.manualLayer);

    return;
  }

  // Even click → draw line to this point
  if (!state.startPoint) return;

  L.polyline([state.startPoint, point], { color: currentColor, weight: 3 }).addTo(state.manualLayer);

  state.manualRoutes.push({
    from: state.startPoint,
    to: point,
    color: currentColor
  });

  // Reset start point
  state.startPoint = null;
}

// ------------------ ROUTE COLOR ------------------
export function setRouteColor(color) {
  currentColor = color;
}

// ------------------ CLEAR ROUTES ------------------
export function clearTabRoutes(tabName) {
  const state = tabStates[tabName];
  if (state.manualLayer) state.manualLayer.clearLayers();
  state.manualRoutes = [];
  state.startPoint = null;
}

// ------------------ DRAW TRADE/ENFORCEMENT ------------------
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

// ------------------ MAP READY CHECK ------------------
export function isMapReady(tabName) {
  return !!tabStates[tabName].map;
}

// ------------------ SAVE SNAPSHOT ------------------
export async function saveSnapshot(tabName) {
  const state = tabStates[tabName];
  if (!state.map) {
    alert("Map not initialized yet.");
    return;
  }

  const mapNode = document.getElementById(`map-${tabName}`);
  const tableEl = document.getElementById("dataTable");

  // Map to canvas
  const canvasMap = await html2canvas(mapNode, { useCORS:true, scale:2 });
  const mapData = canvasMap.toDataURL("image/png");

  // Table to canvas
  const tableClone = tableEl.cloneNode(true);
  tableClone.style.position = "absolute";
  tableClone.style.left = "-9999px";
  document.body.appendChild(tableClone);

  tableClone.querySelectorAll("thead th").forEach(th => { th.style.color="#f0f0f0"; th.style.background="#333"; });
  tableClone.querySelectorAll("tbody tr").forEach(tr => { tr.style.color="#000"; tr.style.background="#fff"; });

  const canvasTable = await html2canvas(tableClone, { scale:2 });
  const tableData = canvasTable.toDataURL("image/png");
  document.body.removeChild(tableClone);

  const snapName = prompt("Enter snapshot name:", `Report-${tabName}`);
  if (!snapName) return;

  allMapsSnapshots.push({
    tab: tabName,
    name: snapName,
    map: mapData,
    table: tableData,
    timestamp: new Date().toLocaleString()
  });

  alert(`Snapshot "${snapName}" saved!`);
}
