/* ===================================================
   utils.js  –  Shared helpers, API wrapper, session
   =================================================== */

// ── Base API URL ─────────────────────────────────────
// Jika project ada di subfolder ubah BASE_URL sesuai path
const BASE_URL = "/api";

// ── Session (localStorage) ────────────────────────────
// Hanya menyimpan data user yang login (id, name, email, role)
// Data produk/cart disimpan di MySQL
function getSession() {
  try {
    return JSON.parse(localStorage.getItem("toko_session"));
  } catch {
    return null;
  }
}
function setSession(user) {
  localStorage.setItem("toko_session", JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem("toko_session");
}
function isLoggedIn() {
  return !!getSession();
}
function isAdmin() {
  const s = getSession();
  return s && s.role === "admin";
}

// ── Auth guards ───────────────────────────────────────
function requireAuth() {
  if (!isLoggedIn()) window.location.href = "login.html";
}
function requireGuest() {
  if (isLoggedIn()) window.location.href = "index.html";
}
function requireAdmin() {
  if (!isAdmin()) window.location.href = "index.html";
}

// ── Fetch wrapper ─────────────────────────────────────
async function api(path, options = {}) {
  const session = getSession();
  const headers = { "Content-Type": "application/json" };
  if (session) headers["Authorization"] = `Bearer ${session.id}`;

  const res = await fetch(BASE_URL + path, {
    headers,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Terjadi kesalahan.");
  return json.data;
}

// Shorthand
const apiGet = (path) => api(path, { method: "GET" });
const apiPost = (path, body) => api(path, { method: "POST", body });
const apiPut = (path, body) => api(path, { method: "PUT", body });
const apiDelete = (path) => api(path, { method: "DELETE" });

// ── Cart count stored in localStorage for badge ───────
function getCartCountLS() {
  return parseInt(localStorage.getItem("toko_cart_count") || "0");
}
function setCartCountLS(n) {
  localStorage.setItem("toko_cart_count", String(n));
}

// ── Toast notification ────────────────────────────────
function showToast(msg, type = "") {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.className = type;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2800);
}

// ── Format currency ───────────────────────────────────
function formatRp(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

// ── Update navbar cart badge ──────────────────────────
async function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge || !isLoggedIn()) return;
  try {
    const items = await apiGet("/cart.php");
    const count = items.reduce((acc, i) => acc + i.qty, 0);
    setCartCountLS(count);
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline" : "none";
  } catch {
    const count = getCartCountLS();
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline" : "none";
  }
}

// ── Theme toggle ──────────────────────────────────────
function getTheme() {
  return localStorage.getItem("toko_theme") || "light";
}
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("toko_theme", t);
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.innerHTML =
      t === "dark"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  }
}
function toggleTheme() {
  applyTheme(getTheme() === "dark" ? "light" : "dark");
}
// Apply on every page load
document.addEventListener(
  "DOMContentLoaded",
  () => applyTheme(getTheme()),
  true,
);

// ── Render shared navbar ──────────────────────────────
function renderNavbar(activePage) {
  const session = getSession();
  const cartCount = getCartCountLS();
  const nav = document.getElementById("navbar");
  if (!nav) return;

  const isDark = getTheme() === "dark";
  nav.innerHTML = `
    <a href="index.html" class="brand">🛒 TokoKu</a>
    <div class="nav-links">
      <a href="index.html" ${activePage === "home" ? 'style="font-weight:700"' : ""}>Produk</a>
      ${
        session
          ? `
        <a href="cart.html">
          Keranjang <span id="cart-badge" class="badge" style="display:${cartCount > 0 ? "inline" : "none"}">${cartCount}</span>
        </a>
        <a href="profile.html">${session.name}</a>
        <button onclick="logout()">Keluar</button>
      `
          : `
        <a href="login.html">Masuk</a>
      `
      }
      <button id="theme-toggle" onclick="toggleTheme()" title="Ganti tema">
        ${
          isDark
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
        }
      </button>
    </div>
  `;
}

// ── Logout ────────────────────────────────────────────
function logout() {
  clearSession();
  setCartCountLS(0);
  window.location.href = "login.html";
}
