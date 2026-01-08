import { CONFIG } from "./config.js";
import { loadSheet } from "./sheets.js";
import { initMap, drawTrade, drawEnforcement } from "./map.js";

let currentTab = "origin";

window.enterApp = () => {
  if (document.getElementById("password").value !== "brandorb") return;

  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display = "block";
  initMap();
};

window.switchTab = tab => {
  currentTab = tab;
  // next: load data + draw map + table
};

  document.getElementById("logoUpload").onchange = handleLogoUpload;
  document.getElementById("enterBtn").onclick = enterApp;
}

function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem("brandorbLogo", reader.result);
    document.getElementById("loginLogo").src = reader.result;
    document.getElementById("headerLogo").src = reader.result;
  };
  reader.readAsDataURL(file);
}

async function enterApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  // IMPORTANT: init map AFTER visible
  map = initMap();

  // Load data AFTER map exists
  originTrade = await loadSheet(
    CONFIG.SHEETS.ORIGIN_TRADE.id,
    CONFIG.SHEETS.ORIGIN_TRADE.name
  );

  populateCountries();
}

function populateCountries() {
  const select = document.getElementById("country");
  select.innerHTML = "";

  const countries = [...new Set(originTrade.map(d => d["ORIGIN COUNTRIES"]))];

  countries.forEach(c => {
    const opt = document.createElement("option");
    opt.textContent = c;
    select.appendChild(opt);
  });

  select.onchange = () => renderCountry(select.value);

  if (countries.length) renderCountry(countries[0]);
}

function renderCountry(country) {
  const rows = originTrade.filter(r => r["ORIGIN COUNTRIES"] === country);

  drawLayer(rows, "#38bdf8", "trade");

  renderTable(rows);
}

function renderTable(rows) {
  if (!rows.length) {
    document.getElementById("table").innerHTML =
      "<p style='padding:12px'>No data available</p>";
    return;
  }

  document.getElementById("table").innerHTML = `
    <table>
      <tr>${Object.keys(rows[0]).map(h => `<th>${h}</th>`).join("")}</tr>
      ${rows.map(r =>
        `<tr>${Object.values(r).map(v => `<td>${v}</td>`).join("")}</tr>`
      ).join("")}
    </table>
  `;
}
