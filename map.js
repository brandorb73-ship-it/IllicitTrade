// Each tab will have its own state
const tabs = {
  origin: { map: null, manualLayer: null, manualRoutes: [], manualStartPoint: null, tableData: null },
  destination: { map: null, manualLayer: null, manualRoutes: [], manualStartPoint: null, tableData: null },
  enforcement: { map: null, manualLayer: null, manualRoutes: [], manualStartPoint: null, tableData: null },
  routes: { map: null, manualLayer: null, manualRoutes: [], manualStartPoint: null, tableData: null },
};

let currentTab = 'origin';

let map, tradeLayer, enforcementLayer;
let manualLayer;

// ROUTE STATE
let manualStartPoint = null;
let manualRoutes = [];
let currentRouteColor = "#ff0000";

// ===============================
// INIT MAP
// ===============================
export function initMap() {
  // Use Carto light tiles for English names
  map = L.map("map").setView([15, 20], 2);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);

  manualLayer = L.layerGroup().addTo(map);

  map.on("click", onMapClick);

  setTimeout(() => map.invalidateSize(), 200);
}

// ===============================
// MAP CLICK: new origin → draw line
// ===============================
function onMapClickTab(e, tabName) {
  const tab = tabs[tabName];
  const clickPoint = e.latlng;

  // First click → origin marker
  if (!tab.manualStartPoint) {
    tab.manualStartPoint = clickPoint;
    L.circleMarker(clickPoint, {
      radius: 6,
      color: currentRouteColor,
      fillOpacity: 0.8
    }).addTo(tab.manualLayer);
    return;
  }

  // Second click → draw line to destination
  const line = L.polyline([tab.manualStartPoint, clickPoint], {
    color: currentRouteColor,
    weight: 3,
    opacity: 0.85
  }).addTo(tab.manualLayer);

  L.polylineDecorator(line, {
    patterns: [
      {
        offset: '50%',
        repeat: 0,
        symbol: L.Symbol.arrowHead({
          pixelSize: 10,
          polygon: true,
          pathOptions: { color: currentRouteColor }
        })
      }
    ]
  }).addTo(tab.manualLayer);

  tab.manualRoutes.push({
    from: tab.manualStartPoint,
    to: clickPoint,
    color: currentRouteColor
  });

  // Reset start point → next click creates new origin
  tab.manualStartPoint = null;
}

// ===============================
// SET ROUTE COLOR
// ===============================
export function setRouteColor(color) {
  currentRouteColor = color;
}

// ===============================
// CLEAR MANUAL ROUTES
// ===============================
export function clearManualRoutes() {
  manualLayer.clearLayers();
  manualRoutes = [];
  manualStartPoint = null;
}

// ===============================
// AUTO DRAW FUNCTIONS
// ===============================
export function drawTrade(rows) {
  if (tradeLayer) tradeLayer.remove();
  tradeLayer = L.layerGroup().addTo(map);

  rows.forEach((r) => {
    if (!r.originLat || !r.destLat) return;
    L.polyline(
      [
        [r.originLat, r.originLng],
        [r.destLat, r.destLng],
      ],
      { color: "#38bdf8", weight: 2 }
    ).addTo(tradeLayer);
  });
}

export function drawEnforcement(rows) {
  if (enforcementLayer) enforcementLayer.remove();
  enforcementLayer = L.layerGroup().addTo(map);

  rows.forEach((r) => {
    if (!r.originLat || !r.destLat) return;
    L.polyline(
      [
        [r.originLat, r.originLng],
        [r.destLat, r.destLng],
      ],
      { color: "#f97316", dashArray: "6,4", weight: 2 }
    ).addTo(enforcementLayer);
  });
}
export function switchTab(tabName) {
  currentTab = tabName;

  // Hide all tab content first
  document.querySelectorAll('.content-grid').forEach(c => c.style.display = 'none');
  document.getElementById(`${tabName}-content`).style.display = 'grid';

  // Initialize map for tab if not already
  if (!tabs[tabName].map) {
    const mapContainer = document.querySelector(`#${tabName}-content #map`);
    tabs[tabName].map = L.map(mapContainer).setView([15, 20], 2);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 19
      }
    ).addTo(tabs[tabName].map);

    // Manual layer for routes/dots
    tabs[tabName].manualLayer = L.layerGroup().addTo(tabs[tabName].map);

    // Add click handler for manual drawing
    tabs[tabName].map.on("click", e => onMapClickTab(e, tabName));

    setTimeout(() => tabs[tabName].map.invalidateSize(), 200);
  }

  // Render table if data already loaded
  if (tabs[tabName].tableData) {
    renderTable(tabs[tabName].tableData);
  }
}
