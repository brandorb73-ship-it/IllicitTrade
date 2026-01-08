import { CONFIG } from "./config.js";

let map = null;

export function initMap() {
  mapboxgl.accessToken = CONFIG.MAPBOX_TOKEN;

  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/dark-v11",
    center: [30, 10],
    zoom: 2
  });

  return map;
}

export function drawLayer(rows, color, id) {
  if (!map) return;

  if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(id)) map.removeSource(id);

  const features = rows
    .filter(r => r["ORIGIN LAT"] && r["DESTINATION LAT"])
    .map(r => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [Number(r["ORIGIN LNG"]), Number(r["ORIGIN LAT"])],
          [Number(r["DESTINATION LNG"]), Number(r["DESTINATION LAT"])]
        ]
      }
    }));

  if (!features.length) return;

  map.addSource(id, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features
    }
  });

  map.addLayer({
    id,
    type: "line",
    source: id,
    paint: {
      "line-color": color,
      "line-width": 2,
      "line-opacity": 0.9,
      "line-dasharray": [2, 2]
    }
  });
}
