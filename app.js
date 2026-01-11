import {
  initTabMap,
  setRouteColor,
  clearTabRoutes
} from "./map.js";

/* ===============================
   CONFIG
================================ */
const PASSWORD = "brandorb";

/* ===============================
   STATE
================================ */
let activeTab = "origin";

// store table data per tab so switching tabs does not reload
const tabTables = {
  origin: null,
  destination: null,
  enforcement: null,
  routes: null
};

/* ===============================
   DOM READY
================================ */
document.addEventListener("DOMContentLoaded", () => {

  /* -------- LOGIN -------- */
  document.getElementById("loginBtn").addEventListener("click", enterApp);

  /* -------- COLOR PICKER -------- */
  document.getElementById("routeColorPicker").addEventListener("input", e => {
    setRouteColor(e.target.value);
  });

  /* -------- CLEAR ROUTES -------- */
  document.getElementById("clearRoutesBtn").addEventListener("click", () => {
    clearTabRoutes(activeTab);
  });

  /* -------- TABS -------- */
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const view = tab.dataset.view;
      switchTab(view);
    });
  });

  /* -------- LOAD REPORT -------- */
  document.getElementById("loadReportBtn").addEventListener("click", loadSheet);
});

/* ===============================
   LOGIN
================================ */
function enterApp() {
  const pwd = document.getElementById("password").value;
  if (pwd !== PASSWORD) {
    alert("Wrong password");
    return;
  }

  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  // init first tab map
  initTabMap(activeTab);
}

/* ===============================
   TAB SWITCHING
================================ */
function switchTab(tabName) {
  activeTab = tabName;

  // show correct map
  document.querySelectorAll(".tab-map").forEach(m => m.style.display = "none");
  document.getElementById(`map-${tabName}`).style.display = "block";

  // init map if needed
  initTabMap(tabName);

  // restore table if already loaded
  if (tabTables[tabName]) {
    renderTable(tabTables[tabName]);
  } else {
    clearTable();
  }
}

/* ===============================
   GOOGLE SHEET LOADING
================================ */
async function loadSheet() {
  const url = document.getElementById("sheetUrl").value.trim();
  if (!url) {
    alert("Paste Google Sheet URL");
    return;
  }

  try {
    const csvUrl = convertToCSV(url);
    const res = await fetch(csvUrl);
    const text = await res.text();

    const tableData = parseCSV(text);
    tabTables[activeTab] = tableData;
    renderTable(tableData);
  } catch (e) {
    console.error(e);
    alert("Failed to load report");
  }
}

/* ===============================
   CSV HELPERS
================================ */
function convertToCSV(url) {
  // expects a PUBLIC Google Sheet
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error("Invalid Google Sheet URL");

  const sheetId = match[1];
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
}

function parseCSV(text) {
  const lines = text.split("\n").filter(l => l.trim());
  const headers = lines.shift().split(",");

  const rows = lines.map(l =>
    l.split(",").map(v => v.replace(/^"|"$/g, ""))
  );

  return { headers, rows };
}

/* ===============================
   TABLE RENDERING
================================ */
export function renderTable(cols, rows) {
  const thead = document.querySelector("#dataTable thead");
  const tbody = document.querySelector("#dataTable tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  // HEADER
  const trh = document.createElement("tr");
  cols.forEach(c => {
    const th = document.createElement("th");
    th.textContent = c;
    trh.appendChild(th);
  });
  thead.appendChild(trh);

  // ROWS (CRITICAL FIX)
  rows.forEach(r => {
    const tr = document.createElement("tr");

    for (let i = 0; i < cols.length; i++) {
      const td = document.createElement("td");
      td.textContent = r[i] ?? ""; // 🔒 column lock
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
}

function clearTable() {
  document.querySelector("#dataTable thead").innerHTML = "";
  document.querySelector("#dataTable tbody").innerHTML = "";
}
document.getElementById("downloadReportBtn").onclick = async () => {
  const mapNode = document.getElementById("map");

  const clone = mapNode.cloneNode(true);
  clone.style.width = "1200px";
  clone.style.height = "600px";

  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-9999px";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  const svg = clone.querySelector("svg");
  if (!svg) {
    alert("Map not ready yet");
    return;
  }

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 600;

  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    ctx.drawImage(img, 0, 0);

    const tableHTML = document.getElementById("dataTable").outerHTML;

    const html = `
      <html>
      <body>
        <h2>BRANDORB Report</h2>
        <img src="${canvas.toDataURL("image/png")}" />
        ${tableHTML}
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "brandorb-report.html";
    a.click();

    document.body.removeChild(wrapper);
  };

  img.src = "data:image/svg+xml;base64," + btoa(svgStr);
};
