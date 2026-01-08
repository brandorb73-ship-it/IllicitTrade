export async function loadSheet(id, sheet) {
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}`;
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.substring(47).slice(0, -2));

  const headers = json.table.cols.map(c => c.label);
  return json.table.rows.map(r => {
    const obj = {};
    r.c.forEach((c, i) => obj[headers[i]] = c?.v || "");
    return obj;
  });
}
