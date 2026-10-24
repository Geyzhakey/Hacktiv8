/* ===================================================
   admin.js  –  Admin dashboard (calls PHP API)
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  requireAdmin();
  renderNavbar();
  updateCartBadge();

  showSection('products');
  document.getElementById('nav-products').addEventListener('click', () => showSection('products'));
  document.getElementById('nav-users').addEventListener('click',    () => showSection('users'));

  document.getElementById('btn-add-product').addEventListener('click', openAddProduct);
  document.getElementById('product-form').addEventListener('submit', handleProductSave);

  document.getElementById('btn-add-user').addEventListener('click', openAddUser);
  document.getElementById('user-form').addEventListener('submit', handleUserSave);

  document.getElementById('modal-close-product').addEventListener('click', closeProductModal);
  document.getElementById('modal-close-user').addEventListener('click', closeUserModal);
});

// ── Section toggle ────────────────────────────────────
function showSection(sec) {
  ['products','users'].forEach(s => {
    document.getElementById('section-' + s).classList.toggle('hidden', s !== sec);
    document.getElementById('nav-' + s).classList.toggle('bg-blue-700', s === sec);
  });
  if (sec === 'products') loadProductTable();
  if (sec === 'users')    loadUserTable();
}

// ═══════════════════ PRODUCTS ════════════════════════

let _editingProductId = null;

async function loadProductTable() {
  const tbody = document.getElementById('product-tbody');
  tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="padding:1rem">Memuat...</td></tr>`;
  try {
    const products = await apiGet('/products.php');
    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Belum ada produk.</td></tr>`;
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.image || ''}" alt="${p.name}" style="width:46px;height:36px;object-fit:cover;border-radius:6px"
              onerror="this.src='https://placehold.co/46x36/ccc/555?text=?'"></td>
        <td>${p.name}</td>
        <td>${p.category || '-'}</td>
        <td>${formatRp(p.price)}</td>
        <td>${p.stock}</td>
        <td style="display:flex;gap:.4rem;flex-wrap:wrap">
          <button class="btn btn-warning btn-sm" onclick="openEditProduct(${p.id})">Edit</button>
          <button class="btn btn-danger btn-sm"  onclick="deleteProduct(${p.id},'${p.name.replace(/'/g,"\\'") }')">Hapus</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:#ef4444">${err.message}</td></tr>`;
  }
}

function openAddProduct() {
  _editingProductId = null;
  document.getElementById('product-form').reset();
  document.getElementById('modal-product-title').textContent = 'Tambah Produk';
  document.getElementById('modal-product').classList.remove('hidden');
}

async function openEditProduct(id) {
  try {
    const p = await apiGet(`/products.php?id=${id}`);
    _editingProductId = id;
    document.getElementById('p-name').value        = p.name;
    document.getElementById('p-price').value       = p.price;
    document.getElementById('p-stock').value       = p.stock;
    document.getElementById('p-category').value    = p.category || '';
    document.getElementById('p-image').value       = p.image || '';
    document.getElementById('p-description').value = p.description || '';
    document.getElementById('modal-product-title').textContent = 'Edit Produk';
    document.getElementById('modal-product').classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeProductModal() {
  document.getElementById('modal-product').classList.add('hidden');
  _editingProductId = null;
}

async function handleProductSave(e) {
  e.preventDefault();
  const btn  = e.target.querySelector('button[type="submit"]');
  const data = {
    name:        document.getElementById('p-name').value.trim(),
    price:       parseFloat(document.getElementById('p-price').value),
    stock:       parseInt(document.getElementById('p-stock').value),
    category:    document.getElementById('p-category').value.trim(),
    image:       document.getElementById('p-image').value.trim(),
    description: document.getElementById('p-description').value.trim(),
  };

  btn.disabled = true;
  try {
    if (_editingProductId) {
      await apiPut(`/products.php?id=${_editingProductId}`, data);
      showToast('Produk berhasil diperbarui!', 'success');
    } else {
      await apiPost('/products.php', data);
      showToast('Produk berhasil ditambahkan!', 'success');
    }
    closeProductModal();
    loadProductTable();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Hapus produk "${name}"?`)) return;
  try {
    await apiDelete(`/products.php?id=${id}`);
    loadProductTable();
    showToast('Produk dihapus.', '');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ═══════════════════ USERS ═══════════════════════════

let _editingUserId = null;

async function loadUserTable() {
  const tbody = document.getElementById('user-tbody');
  tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="padding:1rem">Memuat...</td></tr>`;
  try {
    const users   = await apiGet('/users.php');
    const session = getSession();
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><span class="badge-role ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">${u.role}</span></td>
        <td style="display:flex;gap:.4rem;flex-wrap:wrap">
          <button class="btn btn-warning btn-sm" onclick="openEditUser(${u.id})">Edit</button>
          ${u.id != session.id
            ? `<button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id},'${u.name.replace(/'/g,"\\'")}')">Hapus</button>`
            : `<span class="text-muted">(Anda)</span>`}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:#ef4444">${err.message}</td></tr>`;
  }
}

function openAddUser() {
  _editingUserId = null;
  document.getElementById('user-form').reset();
  document.getElementById('modal-user-title').textContent = 'Tambah Akun';
  document.getElementById('u-password-wrap').classList.remove('hidden');
  document.getElementById('modal-user').classList.remove('hidden');
}

async function openEditUser(id) {
  try {
    const u = await apiGet(`/users.php?id=${id}`);
    _editingUserId = id;
    document.getElementById('u-name').value  = u.name;
    document.getElementById('u-email').value = u.email;
    document.getElementById('u-role').value  = u.role;
    document.getElementById('u-password-wrap').classList.add('hidden');
    document.getElementById('modal-user-title').textContent = 'Edit Akun';
    document.getElementById('modal-user').classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeUserModal() {
  document.getElementById('modal-user').classList.add('hidden');
  _editingUserId = null;
}

async function handleUserSave(e) {
  e.preventDefault();
  const btn  = e.target.querySelector('button[type="submit"]');
  const data = {
    name:  document.getElementById('u-name').value.trim(),
    email: document.getElementById('u-email').value.trim(),
    role:  document.getElementById('u-role').value,
  };

  btn.disabled = true;
  try {
    if (_editingUserId) {
      const updated = await apiPut(`/users.php?id=${_editingUserId}`, data);
      // Refresh session if editing self
      const session = getSession();
      if (session.id == _editingUserId) {
        setSession({ ...session, name: updated.name, email: updated.email, role: updated.role });
        renderNavbar();
      }
      showToast('Akun berhasil diperbarui!', 'success');
    } else {
      const password = document.getElementById('u-password').value;
      await apiPost('/users.php', { ...data, password });
      showToast('Akun berhasil ditambahkan!', 'success');
    }
    closeUserModal();
    loadUserTable();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function deleteUser(id, name) {
  if (!confirm(`Hapus akun "${name}"?`)) return;
  try {
    await apiDelete(`/users.php?id=${id}`);
    loadUserTable();
    showToast('Akun dihapus.', '');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
