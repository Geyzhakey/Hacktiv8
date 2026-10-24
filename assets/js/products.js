/* ===================================================
   products.js  –  Product listing (calls PHP API)
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  renderNavbar('home');
  updateCartBadge();
  renderProducts();

  document.getElementById('sort-select').addEventListener('change', renderProducts);
  document.getElementById('search-input').addEventListener('input',  renderProducts);
  document.getElementById('cat-filter').addEventListener('change',   renderProducts);
});

// ── Render product grid ───────────────────────────────
async function renderProducts() {
  const sort   = document.getElementById('sort-select').value;
  const search = document.getElementById('search-input').value.trim();
  const cat    = document.getElementById('cat-filter').value;
  const grid   = document.getElementById('products-grid');

  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#6b7280">Memuat produk...</div>`;

  const params = new URLSearchParams();
  if (sort)   params.set('sort', sort);
  if (search) params.set('search', search);
  if (cat)    params.set('category', cat);

  try {
    const products = await apiGet(`/products.php?${params.toString()}`);

    if (products.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <span class="icon">📦</span> Tidak ada produk ditemukan.
      </div>`;
      return;
    }

    grid.innerHTML = products.map(p => `
      <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
        <img src="${p.image || ''}" alt="${p.name}"
          onerror="this.src='https://placehold.co/400x300/1a3a6b/fff?text=No+Image'">
        <div class="card-body">
          <span class="card-category">${p.category}</span>
          <div class="card-title">${p.name}</div>
          <div class="card-price">${formatRp(p.price)}</div>
          <div class="card-stock">Stok tersedia: ${p.stock}</div>
          <div class="card-actions">
            <button class="btn btn-primary btn-sm" onclick="addToCart(event,${p.id})">+ Keranjang</button>
            <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();window.location.href='product-detail.html?id=${p.id}'">Detail</button>
          </div>
        </div>
      </div>
    `).join('');

    populateCatFilter(products);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;color:#ef4444">⚠️ ${err.message}</div>`;
  }
}

// ── Add to cart ───────────────────────────────────────
async function addToCart(e, productId) {
  e.stopPropagation();
  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    await apiPost('/cart.php', { product_id: productId, qty: 1 });
    await updateCartBadge();
    showToast('Ditambahkan ke keranjang!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ── Populate category filter ──────────────────────────
function populateCatFilter(products) {
  const sel = document.getElementById('cat-filter');
  if (sel.options.length > 1) return; // already populated
  const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  });
}
