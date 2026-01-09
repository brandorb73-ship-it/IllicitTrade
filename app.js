import { initMap } from "./map.js";

const PASSWORD = "brandorb";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").addEventListener("click", enterApp);
  document.getElementById("logoInput").addEventListener("change", handleLogo);
});

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
  document.getElementById("logoPreviewLogin").src = src;
  document.getElementById("logoPreviewHeader").src = src;
}

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
