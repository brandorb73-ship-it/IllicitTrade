import { initMap, setRouteColor, clearManualRoutes } from "./map.js";

const PASSWORD = "brandorb";

document.addEventListener("DOMContentLoaded", () => {
  // LOGIN BUTTON
  const loginBtn = document.getElementById("loginBtn");
  loginBtn?.addEventListener("click", enterApp);

  // ENTER KEY LOGIN
  const passwordInput = document.getElementById("password");
  passwordInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      enterApp();
    }
  });

  // LOGO UPLOAD
  const logoInput = document.getElementById("logoInput");
  logoInput?.addEventListener("change", handleLogo);

  // TABS
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      switchView(tab.dataset.view);
    });
  });

  // LOAD REPORT BUTTON (stub)
  const loadBtn = document.getElementById("loadReportBtn");
  loadBtn?.addEventListener("click", () => {
    const url = document.getElementById("sheetUrl").value.trim();
    if (!url) {
      alert("Paste a Google Sheet URL");
      return;
    }
    alert("Sheet loading logic will be connected later");
  });

  // ROUTE TOOLS
  const colorPicker = document.getElementById("routeColorPicker");
  colorPicker?.addEventListener("change", e => {
    setRouteColor(e.target.value);
  });

  const clearBtn = document.getElementById("clearRoutesBtn");
  clearBtn?.addEventListener("click", () => {
    clearManualRoutes();
  });
});

// LOGO HANDLING
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

// LOGIN FUNCTION
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

// TAB SWITCHING (stub)
function switchView(view) {
  alert(`Switching to tab: ${view}`);
}
