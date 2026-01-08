import { CONFIG } from "./config.js";
import { loadSheet } from "./sheets.js";
import { drawLayer } from "./map.js";

let originTrade = [];
let destTrade = [];
let enforcement = [];
let illicit = [];

initLogin();

function initLogin() {
  const savedLogo = localStorage.getItem("brandorbLogo");
  if (savedLogo) {
    document.getElementById("loginLogo").src = savedLogo;
    document.getElementById("headerLogo").src = savedLogo;
  }

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

  await loadData();
}

async function loadData() {
  originTrade = await loadSheet(CONFIG.SHEETS.ORIGIN_TRADE.id, CONFIG.SHEETS.ORIGIN_TRADE.name);
  destTrade = await loadSheet(CONFIG.SHEETS.DEST_TRADE.id, CONFIG.SHEETS.DEST_TRADE.name);
  enforcement = await loadSheet(CONFIG.SHEETS.ENFORCEMENT.id, CONFIG.SHEETS.ENFORCEMENT.name);
  illicit = await loadSheet(CONFIG.SHEETS.ILLICIT.id, CONFIG.SHEETS.ILLICIT.name);

  populateCountries();
}

function populateCountries() {
  const countries = [...new Set([
    ...originTrade.map(d => d["ORIGIN COUNTRIES"]),
    ...destTrade.map(d => d["DESTINATION COUNTRIES"])
  ])];

  const select = document.getElementById("country");
  select.innerHTML = "";

  countries.forEach(c => {
    const opt = document.createElement("option");
    opt.textContent = c;
    select.appendChild(opt);
  });

  select.onchange = () => renderCountry(select.value);
  renderCountry(countries[0]);
}

function renderCountry(country) {
  const tradeRows = originTrade.filter(r => r["ORIGIN COUNTRIES"] === country);
  drawLayer(tradeRows, "#38bdf8", "trade");
  renderTable(tradeRows);
}

function renderTable(rows) {
  if (!rows.length) return;

  document.getElementById("table").innerHTML = `
    <table>
      <tr>${Object.keys(rows[0]).map(h => `<th>${h}</th>`).join("")}</tr>
      ${rows.map(r => `<tr>${Object.values(r).map(v => `<td>${v}</td>`).join("")}</tr>`).join("")}
    </table>
  `;
}
