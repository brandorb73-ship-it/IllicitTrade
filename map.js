let map, tradeLayer, enforcementLayer;
let manualLayer;

// ===============================
// MANUAL ROUTE STATE
// ===============================
let manualStartPoint = null;
let manualRoutes = [];
let currentRouteColor = "#ff0000";

// ===============================
// INIT MAP
// ===============================
export function initMap() {
  map = L.map("map").setView([15, 20], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  manualLayer = L.layerGroup().addTo(map);

  // Manual click-to-draw handler
  map.on("click", onMapClick);

  setTimeout(() => map.invalidateSize(), 200);
}

// ===============================
// MANUAL ROUTE DRAWING
// ===============================
function onMapClick(e) {
  if (!manualStartPoint) {
    manualStartPoint = e.latlng;

    // Visual marker for start
    L.circleMarker(manualStartPoint, {
      radius: 6,
      color: currentRouteColor,
      fillOpacity: 0.8
    }).addTo(manualLayer);

    return;
  }

  // Draw route
  const route = L.polyline(
    [manualStartPoint, e.latlng],
    {
      color: currentRouteColor,
      weight: 3,
      opacity: 0.85
    }
  ).addTo(manualLayer);

  manualRoutes.push({
    from: manualStartPoint,
    to: e.latlng,
    color: currentRouteColor
  });

  manualStartPoint = null;
}

// ===============================
// ROUTE COLOR CONTROL (called from app.js)
// ===============================
export function setRouteColor(color) {
  currentRouteColor = color;
}

// ===============================
// CLEAR MANUAL ROUTES (optional)
// ===============================
export function clearManualRoutes() {
  manualLayer.clearLayers();
  manualRoutes = [];
  manualStartPoint = null;
}

// ===============================
// EXISTING AUTO DRAW FUNCTIONS
// (UNCHANGED — OPTIONAL USE)
// ===============================
export function drawTrade(rows) {
  if (tradeLayer) tradeLayer.remove();
  tradeLayer = L.layerGroup().addTo(map);

  rows.forEach(r => {
    if (!r.originLat || !r.destLat) return;

    L.polyline(
      [[r.originLat, r.originLng], [r.destLat, r.destLng]],
      { color: "#38bdf8", weight: 2 }
    ).addTo(tradeLayer);
  });
}

export function drawEnforcement(rows) {
  if (enforcementLayer) enforcementLayer.remove();
  enforcementLayer = L.layerGroup().addTo(map);

  rows.forEach(r => {
    if (!r.originLat || !r.destLat) return;

    L.polyline(
      [[r.originLat, r.originLng], [r.destLat, r.destLng]],
      { color: "#f97316", dashArray: "6,4", weight: 2 }
    ).addTo(enforcementLayer);
  });
}
window.clearManualRoutes = clearManualRoutes;
