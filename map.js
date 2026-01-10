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
function onMapClick(e) {
  const clickPoint = e.latlng;

  if (!manualStartPoint) {
    // First click: create new origin marker
    manualStartPoint = clickPoint;

    L.circleMarker(manualStartPoint, {
      radius: 6,
      color: currentRouteColor,
      fillOpacity: 0.8,
    }).addTo(manualLayer);

    return; // wait for next click to draw line
  }

  // Second click: draw line to destination
  const line = L.polyline([manualStartPoint, clickPoint], {
    color: currentRouteColor,
    weight: 3,
    opacity: 0.85,
  }).addTo(manualLayer);

  // Arrow
  L.polylineDecorator(line, {
    patterns: [
      {
        offset: "50%",
        repeat: 0,
        symbol: L.Symbol.arrowHead({
          pixelSize: 10,
          polygon: true,
          pathOptions: { color: currentRouteColor },
        }),
      },
    ],
  }).addTo(manualLayer);

  // Save route
  manualRoutes.push({
    from: manualStartPoint,
    to: clickPoint,
    color: currentRouteColor,
  });

  // Reset origin: next click creates a new dot
  manualStartPoint = null;
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
