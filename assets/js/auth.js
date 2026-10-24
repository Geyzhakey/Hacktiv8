/* ===================================================
   auth.js  –  Register / Login (calls PHP API)
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  requireGuest();
  initTabs();
  document.getElementById('form-login').addEventListener('submit', handleLogin);
  document.getElementById('form-register').addEventListener('submit', handleRegister);
});

// ── Tab switching ─────────────────────────────────────
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById('panel-' + btn.dataset.tab).classList.remove('hidden');
    });
  });
}

// ── Login ─────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn      = e.target.querySelector('button[type="submit"]');
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  btn.disabled = true; btn.textContent = 'Memuat...';
  try {
    const user = await apiPost('/auth.php?action=login', { email, password });
    setSession(user);
    showToast('Selamat datang, ' + user.name + '!', 'success');
    setTimeout(() => {
      window.location.href = user.role === 'admin' ? 'admin.html' : 'index.html';
    }, 700);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false; btn.textContent = 'Masuk';
  }
}

// ── Register ──────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  const btn      = e.target.querySelector('button[type="submit"]');
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;

  if (password !== confirm) { showToast('Konfirmasi password tidak cocok!', 'error'); return; }

  btn.disabled = true; btn.textContent = 'Mendaftar...';
  try {
    await apiPost('/auth.php?action=register', { name, email, password });
    showToast('Akun berhasil dibuat! Silakan login.', 'success');
    document.querySelector('[data-tab="login"]').click();
    document.getElementById('login-email').value = email;
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-password').value = '';
    document.getElementById('reg-confirm').value = '';
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Buat Akun';
  }
}
