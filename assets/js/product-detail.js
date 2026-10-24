/* ===================================================
   product-detail.js  –  Single product detail (PHP API)
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  renderNavbar();
  updateCartBadge();

  const params  = new URLSearchParams(window.location.search);
  const id      = params.get('id');
  if (!id) { showNotFound(); return; }

  loadProduct(id);
});

async function loadProduct(id) {
  const wrap = document.getElementById('detail-content');
  try {
    const p = await apiGet(`/products.php?id=${id}`);
    renderDetail(p);
  } catch {
    showNotFound();
  }
}

function showNotFound() {
  document.getElementById('detail-content').innerHTML =
    `<div class="empty-state"><span class="icon">❌</span> Produk tidak ditemukan.<br>
     <a href="index.html" class="btn btn-primary" style="margin-top:1rem">Kembali</a></div>`;
}

function renderDetail(p) {
  document.getElementById('detail-content').innerHTML = `
    <div style="display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start">
      <img src="${p.image || ''}" alt="${p.name}"
        style="width:320px;max-width:100%;border-radius:12px;object-fit:cover;background:#f3f4f6"
        onerror="this.src='https://placehold.co/400x300/ccc/555?text=No+Image'">
      <div style="flex:1;min-width:220px">
        <span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 12px;font-size:.8rem;font-weight:700">${p.category || ''}</span>
        <h1 style="margin:.6rem 0 .3rem;font-size:1.6rem">${p.name}</h1>
        <div style="font-size:1.5rem;font-weight:700;color:#1d4ed8;margin-bottom:.8rem">${formatRp(p.price)}</div>
        <p style="color:#374151;line-height:1.7;margin:0 0 1rem">${p.description || ''}</p>
        <div style="color:#6b7280;font-size:.9rem;margin-bottom:1.2rem">
          Stok tersedia: <b>${p.stock}</b>
        </div>
        <div style="display:flex;gap:.8rem;align-items:center;flex-wrap:wrap">
          <label style="font-size:.9rem;font-weight:600">Jumlah:</label>
          <input type="number" id="qty-input" value="1" min="1" max="${p.stock}" class="qty-input" style="width:70px">
          <button id="btn-add-cart" class="btn btn-primary" onclick="addToCartDetail(${p.id})">🛒 Tambah ke Keranjang</button>
          <a href="index.html" class="btn btn-outline">← Kembali</a>
        </div>
      </div>
    </div>
  `;
}

async function addToCartDetail(productId) {
  const qty = parseInt(document.getElementById('qty-input').value) || 1;
  const btn = document.getElementById('btn-add-cart');
  if (qty < 1) { showToast('Jumlah tidak valid!', 'error'); return; }

  btn.disabled = true;
  try {
    await apiPost('/cart.php', { product_id: productId, qty });
    await updateCartBadge();
    showToast(`Ditambahkan ke keranjang (x${qty})!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}
