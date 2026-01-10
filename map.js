let map, tradeLayer, enforcementLayer;
let manualLayer;

// MANUAL ROUTE STATE
let manualStartPoint = null;
let manualRoutes = [];
let currentRouteColor = "#ff0000";

// INIT MAP
export function initMap() {
  map = L.map("map").setView([15, 20], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  manualLayer = L.layerGroup().addTo(map);

  // Click to draw manual route
  map.on("click", onMapClick);

  setTimeout(() => map.invalidateSize(), 200);
}

// MANUAL ROUTE DRAWING
function onMapClick(e) {
  if (!manualStartPoint) {
    manualStartPoint = e.latlng;

    // Marker for start point
    L.circleMarker(manualStartPoint, {
      radius: 6,
      color: currentRouteColor,
      fillOpacity: 0.8
    }).addTo(manualLayer);

    return;
  }

  // Draw line between points
  const line = L.polyline([manualStartPoint, e.latlng], {
    color: currentRouteColor,
    weight: 3,
    opacity: 0.85
  }).addTo(manualLayer);

  // Add arrow decorator
  L.polylineDecorator(line, {
    patterns: [
      { offset: '50%', repeat: 0, symbol: L.Symbol.arrowHead({ pixelSize: 10, polygon: true, pathOptions: { color: currentRouteColor } }) }
    ]
  }).addTo(manualLayer);

  manualRoutes.push({
    from: manualStartPoint,
    to: e.latlng,
    color: currentRouteColor
  });

  manualStartPoint = null;
}
<script src="https://unpkg.com/leaflet-polylinedecorator@1.7.0/dist/leaflet.polylineDecorator.min.js"></script>

// SET ROUTE COLOR
export function setRouteColor(color) {
  currentRouteColor = color;
}

// CLEAR ROUTES
export function clearManualRoutes() {
  manualLayer.clearLayers();
  manualRoutes = [];
  manualStartPoint = null;
}

// EXISTING AUTO DRAW FUNCTIONS (optional)
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
