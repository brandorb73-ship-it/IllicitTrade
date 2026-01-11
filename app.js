import {
  initTabMap,
  setRouteColor,
  clearTabRoutes,
  drawTrade,
  drawEnforcement,
  saveSnapshot,
  allMapsSnapshots,
  isMapReady,
  tabStates
} from "./map.js";

/* =================== CONFIG & STATE =================== */
const PASSWORD = "brandorb";
let activeTab = "origin";

// store table data per tab
const tabTables = {
  origin: null,
  destination: null,
  enforcement: null,
  routes: null
};

/* =================== DOM READY =================== */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").addEventListener("click", enterApp);
  document.getElementById("logoInput").addEventListener("change", handleLogo);

  document.getElementById("routeColorPicker").addEventListener("change", e => {
    setRouteColor(e.target.value);
  });

  document.getElementById("clearRoutesBtn").addEventListener("click", () => {
    clearTabRoutes(activeTab);
  });

  document.getElementById("loadReportBtn").addEventListener("click", () => {
    const url = document.getElementById("sheetUrl").value.trim();
    if (!url) return alert("Paste a published Google Sheet URL");
    loadReport(url);
  });

  document.getElementById("downloadReportBtn").addEventListener("click", downloadReportPDF);
  document.getElementById("saveMapBtn").addEventListener("click", () => {
    saveSnapshot(activeTab);
    renderAllMaps();
  });

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

  initTabMap("origin");
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

/* =================== TABS =================== */
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

      // Restore table if previously loaded for this tab
      if (tabTables[view]) {
        renderTable(tabTables[view].headers, tabTables[view].rows);
      } else {
        clearTable();
      }

      activeTab = view;
    });
  });
}

function getActiveTab() {
  return document.querySelector(".tab.active").dataset.view;
}

/* =================== GOOGLE SHEET LOADING =================== */
function normalizeGoogleCSV(url) {
  if (url.includes("gviz/tq")) return url;

  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error("Invalid Google Sheet URL");

  return `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv`;
}

async function loadReport(csvUrl) {
  try {
    const safeUrl = normalizeGoogleCSV(csvUrl);
    const res = await fetch(safeUrl);
    if (!res.ok) throw new Error("Fetch failed");

    const text = await res.text();
    if (!text || !text.trim()) {
      alert("CSV is empty.");
      return;
    }

    const rows = text
      .trim()
      .split("\n")
      .map(r =>
        r.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
          ?.map(v => v.replace(/^"|"$/g, "").trim()) || []
      )
      .filter(r => r.length > 0);

    if (rows.length < 2) {
      alert("CSV must contain header and at least one row.");
      return;
    }

    const headers = rows.shift();
    if (!headers || headers.length === 0) {
      alert("CSV header row is missing.");
      return;
    }

    tabTables[activeTab] = { headers, rows };
    renderTable(headers, rows);

  } catch (err) {
    console.error(err);
    alert("Failed to load report. Ensure the Google Sheet is published as CSV.");
  }
}

/* =================== TABLE =================== */
function renderTable(cols, rows) {
  const thead = document.querySelector("#dataTable thead");
  const tbody = document.querySelector("#dataTable tbody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  const trh = document.createElement("tr");
  cols.forEach(c => {
    const th = document.createElement("th");
    th.textContent = c;
    trh.appendChild(th);
  });
  thead.appendChild(trh);

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

/* =================== DOWNLOAD PDF =================== */
async function downloadReportPDF() {
  const tab = getActiveTab();
  const state = tabStates[tab];
  if (!state || !state.map) {
    alert("Map not ready");
    return;
  }

  const mapNode = document.getElementById(`map-${tab}`);
  const tableNode = document.getElementById("dataTable");

  try {
    const mapCanvas = await html2canvas(mapNode, { useCORS: true, scale: 2, backgroundColor: null });

    const tableClone = tableNode.cloneNode(true);
    tableClone.style.position = "absolute";
    tableClone.style.left = "-9999px";
    tableClone.style.top = "0px";
    tableClone.style.width = tableNode.offsetWidth + "px";
    document.body.appendChild(tableClone);
    await new Promise(r => setTimeout(r, 50));

    tableClone.querySelectorAll("thead th").forEach(th => {
      th.style.color = "#f0f0f0";      // light header
      th.style.background = "#333333"; 
      th.style.fontWeight = "bold";
    });

    tableClone.querySelectorAll("tbody tr").forEach(tr => {
      tr.style.color = "#000000";      // dark body
      tr.style.background = "#ffffff"; 
    });

    const tableCanvas = await html2canvas(tableClone, { useCORS: true, scale: 2, backgroundColor: "#fff" });
    document.body.removeChild(tableClone);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [mapCanvas.width, mapCanvas.height + tableCanvas.height + 20] });

    pdf.addImage(mapCanvas, "PNG", 0, 0, mapCanvas.width, mapCanvas.height);
    pdf.addImage(tableCanvas, "PNG", 0, mapCanvas.height + 20, tableCanvas.width, tableCanvas.height);

    pdf.save(`brandorb-report-${tab}.pdf`);

  } catch (err) {
    console.error(err);
    alert("Failed to generate PDF. See console for details.");
  }
}

/* =================== ALL MAPS =================== */
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
