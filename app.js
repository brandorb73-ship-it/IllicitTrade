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

// =================== TABLE STATE ===================
const tabTables = {
  origin: null,
  destination: null,
  enforcement: null,
  routes: null
};

// =================== LOGIN ===================
const PASSWORD = "brandorb";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").addEventListener("click", enterApp);
  document.getElementById("logoInput").addEventListener("change", handleLogo);

  document.getElementById("routeColorPicker").addEventListener("change", e => {
    setRouteColor(e.target.value);
  });

  document.getElementById("clearRoutesBtn").addEventListener("click", () => {
    const tab = getActiveTab();
    clearTabRoutes(tab);
  });

  document.getElementById("loadReportBtn").addEventListener("click", () => {
    const url = document.getElementById("sheetUrl").value.trim();
    if (!url) return alert("Paste a Google Sheet URL (original / normal format, not published /d/e/ link)");
    const csvUrl = normalizeGoogleCSV(url);
    loadReport(csvUrl);
  });

  document.getElementById("downloadReportBtn").addEventListener("click", downloadReportPDF);
  document.getElementById("saveMapBtn").addEventListener("click", () => {
    saveSnapshot(getActiveTab());
    renderAllMaps();
  });

  bindTabs();
});

// =================== LOGIN FUNCTIONS ===================
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

// =================== TABS ===================
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

      // restore table if loaded
      if (tabTables[view]) {
        renderTable(tabTables[view].headers, tabTables[view].rows);
      } else {
        clearTable();
      }
    });
  });
}

function getActiveTab() {
  return document.querySelector(".tab.active").dataset.view;
}

// =================== GOOGLE SHEET URL NORMALIZER ===================
function normalizeGoogleCSV(url) {
  if (url.includes("gviz/tq")) return url;

  if (url.includes("/d/e/")) {
    throw new Error("Please paste the original Google Sheet URL (not the /d/e/ published link).");
  }

  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error("Invalid Google Sheet URL");

  return `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv`;
}

// =================== LOAD REPORT ===================
async function loadReport(csvUrl) {
  try {
    const res = await fetch(csvUrl);
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

    // Save to current tab
    tabTables[getActiveTab()] = { headers, rows };
    renderTable(headers, rows);

  } catch (err) {
    console.error(err);
    alert("Failed to load report. Make sure the Google Sheet is in original format and published as CSV.");
  }
}

// =================== TABLE ===================
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

// =================== DOWNLOAD PDF ===================
async function downloadReportPDF() {
  const tab = getActiveTab();
  if (!isMapReady(tab)) {
    alert("Map not ready");
    return;
  }

  const mapNode = document.getElementById(`map-${tab}`);
  const tableNode = document.getElementById("dataTable");

  // ---------------- MAP ----------------
  const mapRect = mapNode.getBoundingClientRect();
  const canvasMap = await html2canvas(mapNode, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    width: mapRect.width,
    height: mapRect.height
  });

  // ---------------- TABLE ----------------
  const tableClone = tableNode.cloneNode(true);
  tableClone.style.position = "absolute";
  tableClone.style.left = "-9999px";
  tableClone.style.top = "0px";
  tableClone.style.width = tableNode.offsetWidth + "px";
  document.body.appendChild(tableClone);
  await new Promise(r => setTimeout(r, 50)); // wait for render

  // Header styling
  tableClone.querySelectorAll("thead th").forEach(th => {
    th.style.color = "#f0f0f0";      // light font
    th.style.background = "#333333"; // dark background
    th.style.fontWeight = "bold";
  });

  // Body styling
  tableClone.querySelectorAll("tbody tr").forEach(tr => {
    tr.style.color = "#000000";      // dark font
    tr.style.background = "#ffffff"; // light background
  });

  const canvasTable = await html2canvas(tableClone, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#fff"
  });

  document.body.removeChild(tableClone);

  // ---------------- CREATE PDF ----------------
  const { jsPDF } = window.jspdf;

  // A4 landscape in mm
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth() - 20; // leave margin 10mm each side
  const pageHeight = pdf.internal.pageSize.getHeight() - 20;

  // scale map to fit width
  let mapW = pageWidth;
  let mapH = (canvasMap.height * mapW) / canvasMap.width;
  if (mapH > pageHeight * 0.6) {
    // limit map to max 60% page height
    mapH = pageHeight * 0.6;
    mapW = (canvasMap.width * mapH) / canvasMap.height;
  }

  pdf.addImage(canvasMap, "PNG", 10, 10, mapW, mapH);

  // scale table to fit remaining height
  let tableW = pageWidth;
  let tableH = (canvasTable.height * tableW) / canvasTable.width;
  const tableStartY = 10 + mapH + 5; // 5mm spacing
  if (tableStartY + tableH > pageHeight + 10) {
    tableH = pageHeight - tableStartY;
    tableW = (canvasTable.width * tableH) / canvasTable.height;
  }

  pdf.addImage(canvasTable, "PNG", 10, tableStartY, tableW, tableH);

  pdf.save(`BrandOrb_Report_${tab}.pdf`);
}
