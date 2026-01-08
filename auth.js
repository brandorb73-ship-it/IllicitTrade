export const CLIENTS = {
  "BAT": ["Cambodia", "Vietnam", "Philippines"],
  "PMI": ["Pakistan", "Sri Lanka", "UAE"],
  "JTI": ["Libya", "Mauritania", "China"]
};

export function login(clientName) {
  sessionStorage.setItem("client", clientName);
}

export function getClient() {
  return sessionStorage.getItem("client");
}

export function logout() {
  sessionStorage.clear();
  location.reload();
}
