let map;
let tradeLayer;
let enforcementLayer;

export function initMap() {
  map = L.map("map", {
    zoomControl: true,
    worldCopyJump: true
  }).setView([15, 20], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  setTimeout(() => map.invalidateSize(), 200);
  return map;
}

export function drawTradeRoutes(rows) {
  if (tradeLayer) tradeLayer.remove();

  tradeLayer = L.layerGroup().addTo(map);

  rows.forEach(r => {
    if (!r["ORIGIN LAT"] || !r["DESTINATION LAT"]) return;

    L.polyline(
      [
        [r["ORIGIN LAT"], r["ORIGIN LNG"]],
        [r["DESTINATION LAT"], r["DESTINATION LNG"]]
      ],
      {
        color: "#38bdf8",
        weight: 2,
        opacity: 0.9
      }
    ).addTo(tradeLayer);
  });
}

export function drawEnforcementRoutes(rows) {
  if (enforcementLayer) enforcementLayer.remove();

  enforcementLayer = L.layerGroup().addTo(map);

  rows.forEach(r => {
    if (!r["ORIGIN LAT"] || !r["DESTINATION LAT"]) return;

    L.polyline(
      [
        [r["ORIGIN LAT"], r["ORIGIN LNG"]],
        [r["DESTINATION LAT"], r["DESTINATION LNG"]]
      ],
      {
        color: "#f97316",
        weight: 2,
        dashArray: "6,4",
        opacity: 0.85
      }
    ).addTo(enforcementLayer);
  });
}
