let map, tradeLayer, enforcementLayer;
let manualLayer;

let manualRoutes = [];
let currentRouteColor = "#ff0000";
let manualOrigins = []; // store origin markers
let manualStartPoint = null;

// helper: distance between two LatLng in meters
function latLngDistance(a, b) {
  return map.distance(a, b);
}

// helper: check if click is near an origin
function findNearbyOrigin(latlng) {
  return manualOrigins.find(orig => latLngDistance(orig.getLatLng(), latlng) < 10);
}

// ===============================
// MAP CLICK
// ===============================
function onMapClick(e) {
  const clickPoint = e.latlng;

  // check if click is near an existing origin
  const nearbyOrigin = findNearbyOrigin(clickPoint);

  if (!manualStartPoint) {
    // set start point: either nearby origin or new marker
    if (nearbyOrigin) {
      manualStartPoint = nearbyOrigin.getLatLng();
    } else {
      manualStartPoint = clickPoint;

      const marker = L.circleMarker(manualStartPoint, {
        radius: 6,
        color: currentRouteColor,
        fillOpacity: 0.8
      }).addTo(manualLayer);

      manualOrigins.push(marker);
    }
    return;
  }

  // draw line from origin to destination
  const line = L.polyline([manualStartPoint, clickPoint], {
    color: currentRouteColor,
    weight: 3,
    opacity: 0.85
  }).addTo(manualLayer);

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

  manualRoutes.push({
    from: manualStartPoint,
    to: clickPoint,
    color: currentRouteColor
  });

  // Reset origin for next click
  manualStartPoint = null;
}

// ===============================
// SET COLOR
// ===============================
export function setRouteColor(color) {
  currentRouteColor = color;
}

// ===============================
// CLEAR ROUTES
// ===============================
export function clearManualRoutes() {
  manualLayer.clearLayers();
  manualRoutes = [];
  manualOrigins = [];
  manualStartPoint = null;
}

// ===============================
// INIT MAP
// ===============================
export function initMap() {
  map = L.map("map").setView([15, 20], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  manualLayer = L.layerGroup().addTo(map);

  map.on("click", onMapClick);

  setTimeout(() => map.invalidateSize(), 200);
}

// ===============================
// AUTO DRAW (optional)
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
