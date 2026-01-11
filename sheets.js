export async function loadGoogleSheet(sheetUrl) {
  const sheetId = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!sheetId) throw new Error("Invalid Google Sheet URL");

  const apiUrl =
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

  const res = await fetch(apiUrl);
  const text = await res.text();

  // Google returns weird JS, not JSON
  const json = JSON.parse(text.substring(47).slice(0, -2));

  const cols = json.table.cols.map(c => c.label || "");
  const rows = json.table.rows.map(r =>
    r.c.map(c => (c ? c.v : ""))
  );

  return { cols, rows };
}
