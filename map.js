let map, tradeLayer, enforcementLayer;
let manualLayer;

// MANUAL ROUTE STATE
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

  // Click to draw manual route
  map.on("click", onMapClick);

  setTimeout(() => map.invalidateSize(), 200);
}

// ===============================
// HELPER: check if two LatLngs are same
// ===============================
function sameLatLng(a, b) {
  return a.lat === b.lat && a.lng === b.lng;
}

// ===============================
// MANUAL ROUTE DRAWING WITH ARROWS
// ===============================
function onMapClick(e) {
  const clickPoint = e.latlng;

  // If no origin or clicked a new origin → create new origin
  if (!manualStartPoint || !sameLatLng(clickPoint, manualStartPoint)) {
    manualStartPoint = clickPoint;

    // Add circle marker for origin
    L.circleMarker(manualStartPoint, {
      radius: 6,
      color: currentRouteColor,
      fillOpacity: 0.8
    }).addTo(manualLayer);

    return;
  }

  // If click same origin again → stay on origin (allow multiple lines)
  if (sameLatLng(clickPoint, manualStartPoint)) return;

  // Draw line from origin to destination
  const line = L.polyline([manualStartPoint, clickPoint], {
    color: currentRouteColor,
    weight: 3,
    opacity: 0.85
  }).addTo(manualLayer);

  // Add arrow decorator using Leaflet PolylineDecorator
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
  }).addTo(manualLayer);

  // Save route in state
  manualRoutes.push({
    from: manualStartPoint,
    to: clickPoint,
    color: currentRouteColor
  });

  // Reset origin after line drawn → next click is new origin
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
// EXISTING AUTO DRAW FUNCTIONS
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
