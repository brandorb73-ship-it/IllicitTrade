export async function loadGoogleSheet(sheetId, sheetName) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tqx=out:json`;
    const res = await fetch(url);
    const text = await res.text();
    // Remove the "google.visualization.Query.setResponse(...);" wrapper
    const json = JSON.parse(text.substring(47).slice(0, -2));
    return json.table;
  } catch (e) {
    console.error("Error loading sheet", e);
    return null;
  }
}
