import { initMap } from "./map.js";

const PASSWORD = "brandorb";

/* ===============================
   DOM READY
================================ */
document.addEventListener("DOMContentLoaded", () => {

  // 🔐 Login button
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", enterApp);
  }

  // 🔑 ENTER key + form submit support
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();   // ⛔ stop page reload
      enterApp();           // ✅ login
    });
  }

// 🔑 ENTER key login (no form used)
const passwordInput = document.getElementById("password");
if (passwordInput) {
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      enterApp();
    }
  });
}
   
  // 🖼 Logo upload
  const logoInput = document.getElementById("logoInput");
  if (logoInput) {
    logoInput.addEventListener("change", handleLogo);
  }

  // 📌 Tabs
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t =>
        t.classList.remove("active")
      );
      tab.classList.add("active");
      switchView(tab.dataset.view);
    });
  });

  // 📊 Load report button
  const loadBtn = document.getElementById("loadReportBtn");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      const url = document.getElementById("sheetUrl").value.trim();
      if (!url) {
        alert("Paste a Google Sheet URL");
        return;
      }
      loadSheetData(url);
    });
  }

});

/* ===============================
   LOGO HANDLING
================================ */
function handleLogo(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem("brandorbLogo", reader.result);
    applyLogo(reader.result);
  };
  reader.readAsDataURL(file);
}

function applyLogo(src) {
  const loginLogo = document.getElementById("logoPreviewLogin");
  const headerLogo = document.getElementById("logoPreviewHeader");

  if (loginLogo) loginLogo.src = src;
  if (headerLogo) headerLogo.src = src;
}

/* ===============================
   LOGIN
================================ */
function enterApp() {
  const input = document.getElementById("password").value;

  if (input !== PASSWORD) {
    alert("Wrong password");
    return;
  }

  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  const savedLogo = localStorage.getItem("brandorbLogo");
  if (savedLogo) applyLogo(savedLogo);

  initMap();
}

/* ===============================
   TAB SWITCHING
================================ */
function switchView(view) {

  if (view === "origin") {
    renderTable("Origin Countries - Trade Data");
  }

  if (view === "destination") {
    renderTable("Destination Countries - Trade Data");
  }

  if (view === "enforcement") {
    renderTable("Origin Countries - Enforcement");
  }

  if (view === "routes") {
    renderTable("Illicit Route Insights");
  }
}

/* ===============================
   GOOGLE SHEET LOADING (STUB)
================================ */
async function loadSheetData(sheetUrl) {
  console.log("Loading report from:", sheetUrl);
  alert("Sheet loading logic will be connected next");
}
import { loadGoogleSheet } from "./sheets.js";

const SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";

async function renderTable(sheetName) {
  const table = await loadGoogleSheet(SHEET_ID, sheetName);

  const thead = document.querySelector("#dataTable thead");
  const tbody = document.querySelector("#dataTable tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  // headers
  const headerRow = document.createElement("tr");
  table.cols.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col.label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // rows
  table.rows.forEach(row => {
    const tr = document.createElement("tr");
    row.c.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell ? cell.v : "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}
