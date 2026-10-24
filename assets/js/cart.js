/* ===================================================
   cart.js  –  Shopping cart (calls PHP API)
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  renderNavbar();
  loadCart();
});

// ── Load & render cart ────────────────────────────────
async function loadCart() {
  try {
    const items = await apiGet('/cart.php');
    const count = items.reduce((acc, i) => acc + i.qty, 0);
    setCartCountLS(count);
    renderCart(items);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderCart(items) {
  const tbody   = document.getElementById('cart-body');
  const summary = document.getElementById('cart-summary');
  const emptyEl = document.getElementById('cart-empty');
  const tableEl = document.getElementById('cart-table-wrap');

  // Update badge in navbar (navbar already rendered, re-inject badge)
  const badge = document.getElementById('cart-badge');
  if (badge) {
    const count = items.reduce((acc, i) => acc + i.qty, 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline' : 'none';
  }

  if (items.length === 0) {
    emptyEl.classList.remove('hidden');
    tableEl.classList.add('hidden');
    summary.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  tableEl.classList.remove('hidden');
  summary.classList.remove('hidden');

  let total = 0;
  tbody.innerHTML = items.map(item => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    return `
      <tr>
        <td>
          <img src="${item.image || ''}" alt="${item.name}"
            style="width:52px;height:40px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:.5rem"
            onerror="this.src='https://placehold.co/52x40/ccc/555?text=?'">
          ${item.name}
        </td>
        <td>${formatRp(item.price)}</td>
        <td>
          <input type="number" class="qty-input" value="${item.qty}" min="1" max="${item.stock}"
            onchange="updateQty(${item.id}, this.value)">
        </td>
        <td>${formatRp(subtotal)}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="removeItem(${item.id}, '${item.name}')">Hapus</button>
        </td>
      </tr>
    `;
  }).join('');

  document.getElementById('cart-total').textContent = formatRp(total);
}

// ── Update qty ────────────────────────────────────────
async function updateQty(cartId, val) {
  const qty = parseInt(val);
  if (isNaN(qty) || qty < 1) { showToast('Jumlah tidak valid!', 'error'); loadCart(); return; }
  try {
    const items = await apiPut(`/cart.php?id=${cartId}`, { qty });
    const count = items.reduce((acc, i) => acc + i.qty, 0);
    setCartCountLS(count);
    renderCart(items);
  } catch (err) {
    showToast(err.message, 'error');
    loadCart();
  }
}

// ── Remove item ───────────────────────────────────────
async function removeItem(cartId, name) {
  try {
    await apiDelete(`/cart.php?id=${cartId}`);
    showToast((name || 'Item') + ' dihapus dari keranjang.', '');
    loadCart();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Checkout ──────────────────────────────────────────
async function checkout() {
  const btn = document.getElementById('btn-checkout');
  if (btn) btn.disabled = true;
  try {
    await apiPost('/checkout.php', {});
    setCartCountLS(0);
    showToast('✅ Pesanan berhasil! Terima kasih.', 'success');
    setTimeout(loadCart, 400);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}
