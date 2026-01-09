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

      const view = tab.dataset.view;
      switchView(view);
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
  console.log("Switching view:", view);

  // Clear map layers / tables later
  // map.eachLayer(...)

  // Placeholder logic (we will wire sheets next)
  if (view === "origin") {
    console.log("Load Origin Trade view");
  } else if (view === "destination") {
    console.log("Load Destination Trade view");
  } else if (view === "enforcement") {
    console.log("Load Enforcement view");
  } else if (view === "routes") {
    console.log("Load Illicit Route Insights view");
  }
}

/* ===============================
   GOOGLE SHEET LOADING (STUB)
================================ */
async function loadSheetData(sheetUrl) {
  console.log("Loading report from:", sheetUrl);
  alert("Sheet loading logic will be connected next");
}
