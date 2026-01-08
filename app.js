import { CONFIG } from "./config.js";
import { loadSheet } from "./sheets.js";
import { drawLayer } from "./map.js";
import { CLIENTS, getClient, login, logout } from "./auth.js";

let originTrade = [];
let destTrade = [];
let enforcement = [];
let illicit = [];

async function init() {
  if (!getClient()) return renderLogin();

  originTrade = await loadSheet(CONFIG.SHEETS.ORIGIN_TRADE.id, CONFIG.SHEETS.ORIGIN_TRADE.name);
  destTrade = await loadSheet(CONFIG.SHEETS.DEST_TRADE.id, CONFIG.SHEETS.DEST_TRADE.name);
  enforcement = await loadSheet(CONFIG.SHEETS.ENFORCEMENT.id, CONFIG.SHEETS.ENFORCEMENT.name);
  illicit = await loadSheet(CONFIG.SHEETS.ILLICIT.id, CONFIG.SHEETS.ILLICIT.name);

  renderApp();
}

function renderLogin() {
  document.body.innerHTML = `
    <div class="login">
      <img src="brandorb-logo.svg"/>
      <select id="client">
        <option>Select Client</option>
        ${Object.keys(CLIENTS).map(c => `<option>${c}</option>`).join("")}
      </select>
      <button onclick="window.doLogin()">Login</button>
    </div>
  `;
  window.doLogin = () => login(document.getElementById("client").value);
}

function renderApp() {
  const client = getClient();
  const countries = CLIENTS[client];

  document.getElementById("logout").onclick = logout;

  const select = document.getElementById("country");
  countries.forEach(c => {
    const o = document.createElement("option");
    o.textContent = c;
    select.appendChild(o);
  });

  select.onchange = () => renderCountry(select.value);
}

function renderCountry(country) {
  const rows = originTrade.filter(r => r["ORIGIN COUNTRIES"] === country);
  drawLayer(rows, "#38bdf8", "trade");
  renderTable(rows);
}

function renderTable(rows) {
  document.getElementById("table").innerHTML = `
    <table>
      <tr>${Object.keys(rows[0]).map(h => `<th>${h}</th>`).join("")}</tr>
      ${rows.map(r => `<tr>${Object.values(r).map(v => `<td>${v}</td>`).join("")}</tr>`).join("")}
    </table>
  `;
}

init();
