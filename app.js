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

/* =================== LOGIN =================== */
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

  document.getElementById("loadReportBtn").addEventListener("click", loadReport);
  document.getElementById("downloadReportBtn").addEventListener("click", downloadReportPDF);
  document.getElementById("saveMapBtn").addEventListener("click", () => {
    saveSnapshot(getActiveTab());
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
    });
  });
}

function getActiveTab() {
  return document.querySelector(".tab.active").dataset.view;
}

/* =================== LOAD REPORT =================== */
async function loadSheetData(csvUrl) {
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

    // 🔒 SAFETY: ensure tab exists
    if (!tabTables.hasOwnProperty(activeTab)) {
      alert("Cannot load table in this tab.");
      return;
    }

    tabTables[activeTab] = { headers, rows };
    renderTable(headers, rows);

  } catch (err) {
    console.error(err);
    alert("Failed to load report. Ensure the Google Sheet is published as CSV.");
  }
}

/* =================== CSV =================== */
function parseCSV(text) {
  const [header, ...lines] = text.split("\n");
  const keys = header.split(",").map(h => h.trim());

  return lines
    .map(l => l.split(","))
    .filter(r => r.length === keys.length)
    .map(r => {
      const obj = {};
      keys.forEach((k, i) => (obj[k] = r[i]?.trim()));
      return obj;
    });
}

/* =================== TABLE =================== */
function renderTable(cols, rows) {
  const thead = document.querySelector("#dataTable thead");
  const tbody = document.querySelector("#dataTable tbody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  const tr = document.createElement("tr");
  cols.forEach(c => {
    const th = document.createElement("th");
    th.textContent = c;
    tr.appendChild(th);
  });
  thead.appendChild(tr);

  rows.forEach(r => {
    const tr = document.createElement("tr");
    cols.forEach(c => {
      const td = document.createElement("td");
      td.textContent = r[c];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
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

  const mapCanvas = await html2canvas(mapNode, { scale: 2, useCORS: true });
  const tableCanvas = await html2canvas(tableNode, { scale: 2 });

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const w = 190;
  let h = (mapCanvas.height * w) / mapCanvas.width;
  pdf.addImage(mapCanvas.toDataURL("image/png"), "PNG", 10, 10, w, h);

  h = (tableCanvas.height * w) / tableCanvas.width;
  pdf.addPage();
  pdf.addImage(tableCanvas.toDataURL("image/png"), "PNG", 10, 10, w, h);

  pdf.save("BrandOrb_Report.pdf");
}

/* =================== ALL MAPS VIEW =================== */
function renderAllMaps() {
  const container = document.getElementById("allMapsContainer");
  container.innerHTML = "";

  if (!allMapsSnapshots.length) {
    container.innerHTML = "<p>No saved reports</p>";
    return;
  }

  allMapsSnapshots.forEach((s, idx) => {
    const card = document.createElement("div");
    card.className = "saved-map-card";

    card.innerHTML = `
      <h4>${s.name}</h4>
      <small>${s.timestamp}</small>
      <img src="${s.map}" />
      <img src="${s.table}" />
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
