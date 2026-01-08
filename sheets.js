export async function loadSheet(sheetId, tab) {
  const url =
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=` +
    encodeURIComponent(tab);

  const text = await fetch(url).then(r => r.text());
  const json = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));

  const cols = json.table.cols.map(c => c.label);
  return json.table.rows.map(r =>
    Object.fromEntries(r.c.map((c, i) => [cols[i], c ? c.v : ""]))
  );
}
