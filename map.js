import { CONFIG } from "./config.js";

mapboxgl.accessToken = CONFIG.MAPBOX_TOKEN;

export const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/dark-v11",
  center: [30, 10],
  zoom: 2
});

export function drawLayer(rows, color, id) {
  if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(id)) map.removeSource(id);

  map.addSource(id, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: rows.map(r => ({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [r["ORIGIN LNG"], r["ORIGIN LAT"]],
            [r["DESTINATION LNG"], r["DESTINATION LAT"]]
          ]
        }
      }))
    }
  });

  map.addLayer({
    id,
    type: "line",
    source: id,
    paint: {
      "line-color": color,
      "line-width": 2,
      "line-opacity": 0.85,
      "line-dasharray": [2, 2]
    }
  });
}
