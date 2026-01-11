import { initTabMap, setRouteColor, clearTabRoutes, isMapReady } from "./map.js";

/* ===============================
   CONFIG & STATE
================================ */
const PASSWORD = "brandorb";
let activeTab = "origin";
const tabTables = {
  origin: null,
  destination: null,
  enforcement: null,
  routes: null
};

/* ===============================
   BUTTON & INPUT BINDINGS
================================ */
// LOGIN BUTTON
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) loginBtn.addEventListener("click", enterApp);

// COLOR PICKER
const colorPicker = document.getElementById("routeColorPicker");
if (colorPicker) colorPicker.addEventListener("input", e => {
  setRouteColor(e.target.value);
});

// CLEAR ROUTES
const clearBtn = document.getElementById("clearRoutesBtn");
if (clearBtn) clearBtn.addEventListener("click", () => {
  clearTabRoutes(activeTab);
});

// LOAD REPORT
const loadBtn = document.getElementById("loadReportBtn");
if (loadBtn) loadBtn.addEventListener("click", () => {
  const url = document.getElementById("sheetUrl").value.trim();
  if (!url) return alert("Paste a published Google Sheet CSV URL");
  loadSheetData(url);
});

// TABS
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const view = tab.dataset.view;
    switchTab(view);
  });
});

import { saveSnapshot } from "./map.js";

document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveMapBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveSnapshot(activeTab);
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

  // Show app
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  // Initialize first tab map
  initTabMap(activeTab);

  // Bind download button AFTER login
  const downloadBtn = document.getElementById("downloadReportBtn");
  if (downloadBtn) downloadBtn.onclick = downloadReportPDF;
}

/* ===============================
   TAB SWITCHING
================================ */
function switchTab(tabName) {
  activeTab = tabName;

  // Hide all tab maps
  document.querySelectorAll(".tab-map").forEach(m => m.style.display = "none");

  // Show selected tab map
  const mapDiv = document.getElementById(`map-${tabName}`);
  if (mapDiv) mapDiv.style.display = "block";

  // Init map if needed (except All Maps)
  if (tabName !== "allmaps") {
    initTabMap(tabName);

    // Restore previously loaded table if exists
    if (tabTables[tabName]) {
      renderTable(tabTables[tabName].headers, tabTables[tabName].rows);
    } else {
      clearTable();
    }
  }

  // ------------------ ALL MAPS TAB ------------------
 if (tabName === "allmaps") {
  const container = document.getElementById("allMapsContainer");
  container.innerHTML = "";

  if (allMapsSnapshots.length === 0) {
    container.innerHTML = "<p>No saved reports yet.</p>";
    return;
  }

  allMapsSnapshots.forEach((snap, idx) => {
    const div = document.createElement("div");
    div.style.marginBottom = "30px";
    div.style.border = "1px solid #888";
    div.style.padding = "10px";
    div.style.background = "#f0f0f0";

    div.innerHTML = `
      <h4 style="margin-bottom:10px;">${snap.name} (${snap.tab.toUpperCase()}) - ${snap.timestamp}</h4>
      <img src="${snap.map}" style="width:100%; max-width:1200px; margin-bottom:10px; border:1px solid #333;" />
      <img src="${snap.table}" style="width:100%; max-width:1200px; border:1px solid #333;" />
    `;

    container.appendChild(div);
  });
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
   DOWNLOAD REPORT AS PDF
================================ */
document.getElementById("downloadReportBtn").addEventListener("click", async () => {
  try {
    if (!isMapReady(activeTab)) {
      alert("Map is still loading. Try again in a second.");
      return;
    }

    const mapNode = document.getElementById(`map-${activeTab}`);
    const tableEl = document.getElementById("dataTable");

    // ---------------- MAP ----------------
const mapRect = mapNode.getBoundingClientRect();
const canvasMap = await html2canvas(mapNode, {
  useCORS: true,
  width: mapRect.width,
  height: mapRect.height,
  scale: 2,
  backgroundColor: null
});

    // ---------------- TABLE ----------------
    const tableClone = tableEl.cloneNode(true);
    tableClone.style.position = "absolute";
    tableClone.style.left = "-9999px";
    tableClone.style.top = "0px";
    tableClone.style.width = tableEl.offsetWidth + "px";
    document.body.appendChild(tableClone);
    await new Promise(r => setTimeout(r, 50));

    // Header styling
    tableClone.querySelectorAll("thead th").forEach(th => {
      th.style.color = "#f0f0f0";      // light
      th.style.background = "#333333"; // dark
      th.style.fontWeight = "bold";
    });

    // Body styling
    tableClone.querySelectorAll("tbody tr").forEach(tr => {
      tr.style.color = "#000000";      // dark
      tr.style.background = "#ffffff"; // light
    });

    const canvasTable = await html2canvas(tableClone, {
      useCORS: true,
      scale: 2,
      backgroundColor: "#fff"
    });
    document.body.removeChild(tableClone);

    // ---------------- CREATE PDF ----------------
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvasMap.width, canvasMap.height + canvasTable.height + 20]
    });

    pdf.addImage(canvasMap, "PNG", 0, 0, canvasMap.width, canvasMap.height);
    pdf.addImage(canvasTable, "PNG", 0, canvasMap.height + 20, canvasTable.width, canvasTable.height);

    pdf.save(`brandorb-report-${activeTab}.pdf`);

  } catch (err) {
    console.error(err);
    alert("Failed to generate PDF. See console for details.");
  }
});
