/* ===================================================
   profile.js  –  User profile & delete account (PHP API)
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  renderNavbar();
  updateCartBadge();
  loadProfile();

  document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
  document.getElementById('password-form').addEventListener('submit', handlePasswordChange);
  document.getElementById('btn-delete-account').addEventListener('click', handleDeleteAccount);
});

async function loadProfile() {
  const session = getSession();
  try {
    const user = await apiGet(`/users.php?id=${session.id}`);
    document.getElementById('p-name').value  = user.name;
    document.getElementById('p-email').value = user.email;
    document.getElementById('profile-role').textContent = user.role === 'admin' ? '👑 Admin' : '👤 Konsumen';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const btn     = e.target.querySelector('button[type="submit"]');
  const name    = document.getElementById('p-name').value.trim();
  const email   = document.getElementById('p-email').value.trim();
  const session = getSession();

  btn.disabled = true;
  try {
    const updated = await apiPut(`/users.php?id=${session.id}`, { name, email });
    setSession({ ...session, name: updated.name, email: updated.email });
    renderNavbar();
    showToast('Profil berhasil diperbarui!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handlePasswordChange(e) {
  e.preventDefault();
  const btn     = e.target.querySelector('button[type="submit"]');
  const oldPass = document.getElementById('old-password').value;
  const newPass = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-password').value;
  const session = getSession();

  if (newPass !== confirm) { showToast('Konfirmasi password tidak cocok!', 'error'); return; }

  // Verify old password by attempting login
  btn.disabled = true;
  try {
    // We send the new password; backend needs old password verification
    // Use a dedicated verify+change approach via PUT with old_password field
    await apiPut(`/users.php?id=${session.id}`, {
      old_password: oldPass,
      password: newPass,
    });
    document.getElementById('password-form').reset();
    showToast('Password berhasil diubah!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handleDeleteAccount() {
  if (!confirm('Yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan!')) return;
  const session = getSession();
  try {
    await apiDelete(`/users.php?id=${session.id}`);
    clearSession();
    setCartCountLS(0);
    showToast('Akun berhasil dihapus.', '');
    setTimeout(() => window.location.href = 'login.html', 800);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
