import { initTabMap, onMapClickTab, setRouteColor, clearTabRoutes } from "./map.js";
import { loadGoogleSheet } from "./sheets.js"; // implement your sheets loader

const PASSWORD = "brandorb";
const tabs = ["origin","destination","enforcement","routes"];
let currentTab = "origin";

// ------------------ LOGIN ------------------
document.getElementById("loginBtn").addEventListener("click", () => {
  const input = document.getElementById("password").value;
  if(input !== PASSWORD){ alert("Wrong password"); return; }

  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  // init map for first tab
  switchTab(currentTab);
});

// ------------------ COLOR PICKER ------------------
document.getElementById("routeColorPicker").addEventListener("change", e=>{
  setRouteColor(e.target.value);
});

// ------------------ CLEAR ROUTES ------------------
document.getElementById("clearRoutesBtn").addEventListener("click", ()=>{
  clearTabRoutes(currentTab);
});

// ------------------ TAB SWITCH ------------------
document.querySelectorAll(".tab").forEach(tabBtn=>{
  tabBtn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    tabBtn.classList.add("active");
    const view = tabBtn.dataset.view;
    switchTab(view);
  });
});

function switchTab(tabName){
  currentTab = tabName;
  tabs.forEach(t=>{
    document.getElementById(`${t}-content`).style.display = t===tabName?"grid":"none";
  });
  initTabMap(tabName);
  renderTableForCurrentTab();
}

// ------------------ LOAD GOOGLE SHEET ------------------
document.getElementById("loadReportBtn").addEventListener("click", ()=>{
  const url = document.getElementById("sheetUrl").value.trim();
  if(!url){ alert("Paste Google Sheet URL"); return; }
  loadSheetForCurrentTab(url);
});

async function loadSheetForCurrentTab(sheetUrl){
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if(!match){ alert("Invalid Google Sheet URL"); return; }
  const sheetId = match[1];
  const sheetName = "Sheet1"; // adjust if different

  try{
    const table = await loadGoogleSheet(sheetId,sheetName);
    localStorage.setItem("table-"+currentTab, JSON.stringify(table));
    renderTable(table);
  }catch(err){
    console.error(err);
    alert("Failed to load report");
  }
}

// ------------------ RENDER TABLE ------------------
function renderTable(table){
  const thead = document.querySelector(`#table-${currentTab} thead`);
  const tbody = document.querySelector(`#table-${currentTab} tbody`);
  thead.innerHTML = "";
  tbody.innerHTML = "";

  if(!table) return;

  // headers
  const tr = document.createElement("tr");
  table.cols.forEach(c=>{
    const th = document.createElement("th"); th.textContent=c.label; tr.appendChild(th);
  });
  thead.appendChild(tr);

  // rows
  table.rows.forEach(r=>{
    const tr = document.createElement("tr");
    r.c.forEach(cell=>{
      const td = document.createElement("td");
      td.textContent = cell ? cell.v : "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// ------------------ RENDER TABLE FROM LOCALSTORAGE ------------------
function renderTableForCurrentTab(){
  const stored = localStorage.getItem("table-"+currentTab);
  if(stored){
    renderTable(JSON.parse(stored));
  }
}
