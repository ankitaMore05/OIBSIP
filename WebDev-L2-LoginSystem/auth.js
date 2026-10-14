// Front-end only authentication (Approach A): localStorage + SHA-256 (Web Crypto) with a random salt.
// NOTE: this is a learning demo. Real apps must verify passwords on a server.
const USERS_KEY = "oib_users";
const SESSION_KEY = "oib_session";

const getUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch (e) { return {}; } };
const bytesToHex = (arr) => [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
const newSalt = () => bytesToHex(crypto.getRandomValues(new Uint8Array(16)));

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + password);
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", data)));
}
function say(text, ok) {
  const m = document.getElementById("msg");
  m.textContent = text; m.className = "msg" + (ok ? " ok" : "");
}

// ---- Register page ----
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("username").value.trim().toLowerCase();
    const pw = document.getElementById("password").value;
    if (!name || !pw) return say("Please fill in both fields.");
    if (pw.length < 8 || !/\d/.test(pw)) return say("Password must be at least 8 characters and include a number.");
    const users = getUsers();
    if (users[name]) return say("This username/email is already registered.");
    const salt = newSalt();
    users[name] = { salt, hash: await hashPassword(pw, salt) };   // never store the plain password
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    say("Registered! Redirecting to login...", true);
    setTimeout(() => { window.location.href = "login.html"; }, 1000);
  });
}

// ---- Login page ----
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  if (localStorage.getItem(SESSION_KEY)) window.location.href = "dashboard.html";
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("username").value.trim().toLowerCase();
    const pw = document.getElementById("password").value;
    if (!name || !pw) return say("Please fill in both fields.");
    const user = getUsers()[name];
    // Same message for wrong username or wrong password
    if (!user || (await hashPassword(pw, user.salt)) !== user.hash) return say("Invalid username or password.");
    localStorage.setItem(SESSION_KEY, name);
    window.location.href = "dashboard.html";
  });
}

// ---- Dashboard (protected) ----
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) window.location.replace("login.html");      // no session: redirect
  else document.getElementById("who").textContent = session;
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
  });
}
