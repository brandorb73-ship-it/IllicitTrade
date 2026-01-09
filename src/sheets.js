export async function loadGoogleSheet(sheetId, sheetName) {
  const url =
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}`;

  const res = await fetch(url);
  const text = await res.text();

  const json = JSON.parse(
    text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1)
  );

  return json.table;
}
