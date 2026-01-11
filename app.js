import {
  initTabMap,
  setRouteColor,
  clearTabRoutes,
  drawTrade,
  drawEnforcement,
  saveSnapshot,
  allMapsSnapshots,
  isMapReady
} from "./map.js";

/* =================== CONFIG & STATE =================== */
const PASSWORD = "brandorb";
let activeTab = "origin";
const tabTables = {
  origin: null,
  destination: null,
  enforcement: null,
  routes: null
};

/* =================== DOM READY =================== */
document.addEventListener("DOMContentLoaded", () => {
  // LOGIN
  document.getElementById("loginBtn").addEventListener("click", enterApp);
  document.getElementById("logoInput").addEventListener("change", handleLogo);

  // ROUTE COLOR PICKER
  document.getElementById("routeColorPicker").addEventListener("change", e => {
    setRouteColor(e.target.value);
  });

  // CLEAR ROUTES
  document.getElementById("clearRoutesBtn").addEventListener("click", () => {
    clearTabRoutes(activeTab);
  });

  // LOAD REPORT
  document.getElementById("loadReportBtn").addEventListener("click", () => {
    const url = document.getElementById("sheetUrl").value.trim();
    if (!url) return alert("Paste a published Google Sheet CSV URL");
    loadReport(url);
  });

  // DOWNLOAD PDF
  document.getElementById("downloadReportBtn").addEventListener("click", downloadReportPDF);

  // SAVE MAP & TABLE SNAPSHOT
  document.getElementById("saveMapBtn").addEventListener("click", () => {
    saveSnapshotTab(activeTab);
    renderAllMaps();
  });

  // TAB SWITCHING
  bindTabs();
});

/* =================== LOGIN =================== */
function enterApp() {
  if (document.getElementById("password").value !== PASSWORD) {
    alert("Incorrect password");
    return;
  }

  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  initTabMap(activeTab);
}

function handleLogo(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("logoPreviewLogin").src = reader.result;
    document.getElementById("logoPreviewHeader").src = reader.result;
  };
  reader.readAsDataURL(file);
}

/* =================== TAB SWITCHING =================== */
function bindTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const view = tab.dataset.view;
      document.querySelectorAll(".tab-map").forEach(m => m.style.display = "none");

      if (view === "allmaps") {
        document.getElementById("map-allmaps").style.display = "block";
        renderAllMaps();
        return;
      }

      document.getElementById(`map-${view}`).style.display = "block";
      initTabMap(view);

      // Restore table if exists
      if (tabTables[view]) {
        renderTable(tabTables[view].headers, tabTables[view].rows);
      } else {
        clearTable();
      }

      activeTab = view;
    });
  });
}

/* =================== ACTIVE TAB =================== */
function getActiveTab() {
  return document.querySelector(".tab.active").dataset.view;
}

/* =================== GOOGLE SHEET LOADING =================== */
async function loadReport(sheetUrl) {
  try {
    // Normalize Google Sheet URL for CSV
    const csvUrl = normalizeGoogleCSV(sheetUrl);

    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error("Fetch failed");

    const text = await res.text();
    if (!text || !text.trim()) {
      alert("CSV is empty.");
      return;
    }

    // Parse CSV safely
    const rows = text
      .trim()
      .split("\n")
      .map(r => r.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, "").trim()) || [])
      .filter(r => r.length > 0);

    if (rows.length < 2) {
      alert("CSV must contain header and at least one row.");
      return;
    }

    const headers = rows.shift();
    tabTables[activeTab] = { headers, rows };

    renderTable(headers, rows);
  } catch (err) {
    console.error(err);
    alert("Failed to load report. Ensure the Google Sheet is published as CSV.");
  }
}

function normalizeGoogleCSV(url) {
  // Already in gviz format
  if (url.includes("gviz/tq")) return url;

  // /d/e/ published URL
  if (url.includes("/d/e/")) {
    throw new Error("Use the ORIGINAL Google Sheet URL, not the /d/e/ link.");
  }

  // Normal Google Sheet URL
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error("Invalid Google Sheet URL");

  return `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv`;
}

/* =================== TABLE =================== */
function renderTable(cols, rows) {
  const thead = document.querySelector("#dataTable thead");
  const tbody = document.querySelector("#dataTable tbody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  // HEADER
  const trh = document.createElement("tr");
  cols.forEach(c => {
    const th = document.createElement("th");
    th.textContent = c;
    th.style.color = "#f0f0f0";      // light header
    th.style.background = "#333333"; // dark background
    th.style.fontWeight = "bold";
    trh.appendChild(th);
  });
  thead.appendChild(trh);

  // ROWS
  rows.forEach(r => {
    const tr = document.createElement("tr");
    for (let i = 0; i < cols.length; i++) {
      const td = document.createElement("td");
      td.textContent = r[i] ?? "";
      td.style.color = "#000000";      // dark text
      td.style.background = "#ffffff"; // light row
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
}

function clearTable() {
  document.querySelector("#dataTable thead").innerHTML = "";
  document.querySelector("#dataTable tbody").innerHTML = "";
}

/* =================== DOWNLOAD PDF =================== */
async function downloadReportPDF() {
  const tab = getActiveTab();
  if (!isMapReady(tab)) {
    alert("Map not ready");
    return;
  }

  const mapNode = document.getElementById(`map-${tab}`);
  const tableNode = document.getElementById("dataTable");

  // Map canvas
  const mapCanvas = await html2canvas(mapNode, { scale: 1, useCORS: true });
  const tableCanvas = await html2canvas(tableNode, { scale: 1 });

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const w = 190;
  let h = (mapCanvas.height * w) / mapCanvas.width;
  pdf.addImage(mapCanvas.toDataURL("image/png"), "PNG", 10, 10, w, h);

  h = (tableCanvas.height * w) / tableCanvas.width;
  pdf.addPage();
  pdf.addImage(tableCanvas.toDataURL("image/png"), "PNG", 10, 10, w, h);

  pdf.save(`BrandOrb_Report_${tab}.pdf`);
}

/* =================== SAVE SNAPSHOT =================== */
function saveSnapshotTab(tab) {
  const mapNode = document.getElementById(`map-${tab}`);
  const tableNode = document.getElementById("dataTable");

  if (!mapNode) {
    alert("Map not ready");
    return;
  }

  html2canvas(mapNode, { scale: 1 }).then(mapCanvas => {
    html2canvas(tableNode, { scale: 1 }).then(tableCanvas => {
      const snap = {
        name: `Snapshot ${tab} ${new Date().toLocaleString()}`,
        tab,
        timestamp: new Date().toLocaleString(),
        map: mapCanvas.toDataURL(),
        table: tableCanvas.toDataURL()
      };
      allMapsSnapshots.push(snap);
      alert("Snapshot saved!");
    });
  });
}

/* =================== ALL MAPS VIEW =================== */
function renderAllMaps() {
  const container = document.getElementById("allMapsContainer");
  container.innerHTML = "";

  if (!allMapsSnapshots.length) {
    container.innerHTML = "<p>No saved reports</p>";
    return;
  }

  allMapsSnapshots.forEach((snap, idx) => {
    const card = document.createElement("div");
    card.className = "saved-map-card";

    card.innerHTML = `
      <h4>${snap.name}</h4>
      <small>${snap.timestamp}</small>
      <img src="${snap.map}" />
      <img src="${snap.table}" />
      <button class="delete-btn">Delete</button>
    `;

    card.querySelector(".delete-btn").onclick = () => {
      if (confirm("Delete this saved report?")) {
        allMapsSnapshots.splice(idx, 1);
        renderAllMaps();
      }
    };

    container.appendChild(card);
  });
}
