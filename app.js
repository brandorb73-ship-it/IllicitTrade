import { initTabMap, setRouteColor, clearTabRoutes, isMapReady, saveSnapshot, allMapsSnapshots } from "./map.js";

/* ================= CONFIG & STATE ================= */
const PASSWORD = "brandorb";
let activeTab = "origin";
const tabTables = { origin:null, destination:null, enforcement:null, routes:null };

/* ================= DOM READY ================= */
document.addEventListener("DOMContentLoaded", () => {
  // LOGIN
  document.getElementById("loginBtn").addEventListener("click", enterApp);

  // COLOR PICKER
  document.getElementById("routeColorPicker").addEventListener("input", e => setRouteColor(e.target.value));

  // CLEAR ROUTES
  document.getElementById("clearRoutesBtn").addEventListener("click", () => clearTabRoutes(activeTab));

  // LOAD REPORT
  document.getElementById("loadReportBtn").addEventListener("click", () => {
    const url = document.getElementById("sheetUrl").value.trim();
    if (!url) return alert("Paste a published Google Sheet CSV URL");
    loadSheetData(url);
  });

  // SAVE MAP SNAPSHOT
  const saveBtn = document.getElementById("saveMapBtn");
  if (saveBtn) saveBtn.addEventListener("click", () => saveSnapshot(activeTab));

  // DOWNLOAD PDF
  const downloadBtn = document.getElementById("downloadReportBtn");
  if (downloadBtn) downloadBtn.addEventListener("click", downloadReportPDF);

  // TABS
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      switchTab(tab.dataset.view);
    });
  });
});

/* ================= LOGIN ================= */
function enterApp() {
  const pwd = document.getElementById("password").value;
  if (pwd !== PASSWORD) return alert("Wrong password");

  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  initTabMap(activeTab);
}

/* ================= TAB SWITCH ================= */
function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll(".tab-map").forEach(m => m.style.display="none");
  const mapDiv = document.getElementById(`map-${tabName}`);
  if (mapDiv) mapDiv.style.display = "block";

  if(tabName!=="allmaps") {
    initTabMap(tabName);
    if(tabTables[tabName]) renderTable(tabTables[tabName].headers, tabTables[tabName].rows);
    else clearTable();
  } else {
    const container = document.getElementById("allMapsContainer");
    container.innerHTML = "";
    if(allMapsSnapshots.length===0) { container.innerHTML="<p>No saved reports yet.</p>"; return; }
    allMapsSnapshots.forEach(snap => {
      const div=document.createElement("div");
      div.style.marginBottom="30px"; div.style.border="1px solid #888"; div.style.padding="10px"; div.style.background="#f0f0f0";
      div.innerHTML=`<h4>${snap.name} (${snap.tab.toUpperCase()}) - ${snap.timestamp}</h4>
                     <img src="${snap.map}" style="width:100%; max-width:1200px; margin-bottom:10px; border:1px solid #333;" />
                     <img src="${snap.table}" style="width:100%; max-width:1200px; border:1px solid #333;" />`;
      container.appendChild(div);
    });
  }
}

/* ================= GOOGLE SHEET ================= */
async function loadSheetData(csvUrl) {
  try {
    const res = await fetch(csvUrl);
    if(!res.ok) throw new Error("Fetch failed");
    const text = await res.text();
    const rows = text.trim().split("\n").map(r => r.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v=>v.replace(/^"|"$/g,""))||[]);
    if(rows.length<2) return alert("No data found in sheet");
    const headers = rows.shift();
    tabTables[activeTab] = { headers, rows };
    renderTable(headers, rows);
  } catch(err) { console.error(err); alert("Failed to load report. Make sure sheet is published as CSV."); }
}

/* ================= TABLE ================= */
function renderTable(cols, rows) {
  const thead = document.querySelector("#dataTable thead");
  const tbody = document.querySelector("#dataTable tbody");
  thead.innerHTML=""; tbody.innerHTML="";
  const trh = document.createElement("tr");
  cols.forEach(c=>{ const th=document.createElement("th"); th.textContent=c; trh.appendChild(th); });
  thead.appendChild(trh);
  rows.forEach(r=>{ const tr=document.createElement("tr"); for(let i=0;i<cols.length;i++){ const td=document.createElement("td"); td.textContent=r[i]??""; tr.appendChild(td);} tbody.appendChild(tr);});
}
function clearTable(){ document.querySelector("#dataTable thead").innerHTML=""; document.querySelector("#dataTable tbody").innerHTML="";}

/* ================= DOWNLOAD PDF ================= */
async function downloadReportPDF() {
  try {
    if(!isMapReady(activeTab)) { alert("Map not ready."); return; }
    const mapNode=document.getElementById(`map-${activeTab}`);
    const tableEl=document.getElementById("dataTable");
    const mapCanvas=await html2canvas(mapNode,{ useCORS:true, scale:2 });
    const tableClone=tableEl.cloneNode(true);
    tableClone.style.position="absolute"; tableClone.style.left="-9999px"; document.body.appendChild(tableClone);
    tableClone.querySelectorAll("thead th").forEach(th=>{ th.style.color="#f0f0f0"; th.style.background="#333"; });
    tableClone.querySelectorAll("tbody tr").forEach(tr=>{ tr.style.color="#000"; tr.style.background="#fff"; });
    const tableCanvas=await html2canvas(tableClone,{scale:2}); document.body.removeChild(tableClone);
    const { jsPDF }=window.jspdf;
    const pdf=new jsPDF({ orientation:"landscape", unit:"px", format:[mapCanvas.width,mapCanvas.height+tableCanvas.height+20] });
    pdf.addImage(mapCanvas,"PNG",0,0,mapCanvas.width,mapCanvas.height);
    pdf.addImage(tableCanvas,"PNG",0,mapCanvas.height+20,tableCanvas.width,tableCanvas.height);
    pdf.save(`brandorb-report-${activeTab}.pdf`);
  } catch(err){ console.error(err); alert("Failed to generate PDF."); }
}
