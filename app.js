import { initTabMap, setRouteColor, clearTabRoutes, isMapReady } from "./map.js";

/* ===============================
   CONFIG
================================ */
const PASSWORD = "brandorb";

/* ===============================
   STATE
================================ */
let activeTab = "origin";
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
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.addEventListener("click", enterApp);

  /* -------- COLOR PICKER -------- */
  const colorPicker = document.getElementById("routeColorPicker");
  if (colorPicker) colorPicker.addEventListener("input", e => {
    setRouteColor(e.target.value);
  });

  /* -------- CLEAR ROUTES -------- */
  const clearBtn = document.getElementById("clearRoutesBtn");
  if (clearBtn) clearBtn.addEventListener("click", () => {
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
  const loadBtn = document.getElementById("loadReportBtn");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      const url = document.getElementById("sheetUrl").value.trim();
      if (!url) {
        alert("Paste a published Google Sheet CSV URL");
        return;
      }
      loadSheetData(url);
    });
  }
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

  // Initialize map for first tab
  initTabMap(activeTab);

  // Bind download button now that #app is visible
  const downloadBtn = document.getElementById("downloadReportBtn");
  if (downloadBtn) downloadBtn.onclick = downloadReport;
}

/* ===============================
   TAB SWITCHING
================================ */
function switchTab(tabName) {
  activeTab = tabName;

  // show correct map
  document.querySelectorAll(".tab-map").forEach(m => m.style.display = "none");
  const mapEl = document.getElementById(`map-${tabName}`);
  if (mapEl) mapEl.style.display = "block";

  // init map if needed
  initTabMap(tabName);

  // restore table if already loaded
  if (tabTables[tabName]) {
    renderTable(tabTables[tabName].headers, tabTables[tabName].rows);
  } else {
    clearTable();
  }
}

/* ===============================
   GOOGLE SHEET LOADING
================================ */
async function loadSheetData(csvUrl) {
  try {
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error("Fetch failed");

    const text = await res.text();

    const rows = text
      .trim()
      .split("\n")
      .map(r =>
        r.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
          ?.map(v => v.replace(/^"|"$/g, "")) || []
      );

    if (rows.length < 2) {
      alert("No data found in sheet");
      return;
    }

    const headers = rows.shift();
    tabTables[activeTab] = { headers, rows };
    renderTable(headers, rows);

  } catch (err) {
    console.error(err);
    alert("Failed to load report. Make sure the sheet is published as CSV.");
  }
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

  // ROWS
  rows.forEach(r => {
    const tr = document.createElement("tr");
    for (let i = 0; i < cols.length; i++) {
      const td = document.createElement("td");
      td.textContent = r[i] ?? "";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
}

function clearTable() {
  document.querySelector("#dataTable thead").innerHTML = "";
  document.querySelector("#dataTable tbody").innerHTML = "";
}

/* ===============================
   DOWNLOAD REPORT
================================ */
async function downloadReportPNG() {
  if (!isMapReady()) {
    alert("Map is still loading. Try again in a second.");
    return;
  }

  const mapNode = document.getElementById(`map-${activeTab}`);
  if (!mapNode) {
    alert("Map element not found");
    return;
  }

  try {
    const canvas = await html2canvas(mapNode, { useCORS: true });
    const mapImgData = canvas.toDataURL("image/png");

    // Create final canvas combining map + table
    const tableEl = document.getElementById("dataTable");
    const tableCanvas = await html2canvas(tableEl, { useCORS: true });

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = Math.max(canvas.width, tableCanvas.width);
    finalCanvas.height = canvas.height + tableCanvas.height;

    const ctx = finalCanvas.getContext("2d");
    ctx.drawImage(canvas, 0, 0);
    ctx.drawImage(tableCanvas, 0, canvas.height);

    // Download as PNG
    const a = document.createElement("a");
    a.href = finalCanvas.toDataURL("image/png");
    a.download = `brandorb-report-${activeTab}.png`;
    a.click();

  } catch (err) {
    console.error(err);
    alert("Failed to generate PNG.");
  }
}
