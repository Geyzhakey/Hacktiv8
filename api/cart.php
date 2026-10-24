<?php
// ============================================================
//  api/cart.php
//
//  GET    /api/cart.php           → get cart of logged-in user
//  POST   /api/cart.php           → add / update item  { product_id, qty }
//  PUT    /api/cart.php?id=1      → update qty of cart row  { qty }
//  DELETE /api/cart.php?id=1      → remove one item
//  DELETE /api/cart.php?clear=1   → clear entire cart (after checkout)
// ============================================================

require_once __DIR__ . '/../config/helpers.php';

$db     = getDB();
$method = getMethod();
$userId = requireAuthApi();

// ── GET cart ──────────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $db->prepare(
        'SELECT c.id, c.product_id, c.qty,
                p.name, p.price, p.image, p.stock
         FROM   cart c
         JOIN   products p ON p.id = c.product_id
         WHERE  c.user_id = ?
         ORDER  BY c.id ASC'
    );
    $stmt->execute([$userId]);
    jsonOk($stmt->fetchAll());
}

// ── POST add/update item ──────────────────────────────────────
if ($method === 'POST') {
    $body       = getBody();
    $productId  = (int)($body['product_id'] ?? 0);
    $qty        = (int)($body['qty']        ?? 1);

    if (!$productId || $qty < 1) jsonError('product_id dan qty wajib diisi.');

    // Check product exists and has enough stock
    $pstmt = $db->prepare('SELECT id, stock FROM products WHERE id = ?');
    $pstmt->execute([$productId]);
    $product = $pstmt->fetch();
    if (!$product) jsonError('Produk tidak ditemukan.', 404);
    if ($product['stock'] < $qty) jsonError('Stok tidak mencukupi.');

    // Upsert
    $chk = $db->prepare('SELECT id, qty FROM cart WHERE user_id = ? AND product_id = ?');
    $chk->execute([$userId, $productId]);
    $existing = $chk->fetch();

    if ($existing) {
        $newQty = $existing['qty'] + $qty;
        if ($newQty > $product['stock']) jsonError('Stok tidak mencukupi.');
        $db->prepare('UPDATE cart SET qty = ? WHERE id = ?')->execute([$newQty, $existing['id']]);
    } else {
        $db->prepare('INSERT INTO cart (user_id, product_id, qty) VALUES (?, ?, ?)')
           ->execute([$userId, $productId, $qty]);
    }

    // Return updated cart
    $stmt = $db->prepare(
        'SELECT c.id, c.product_id, c.qty, p.name, p.price, p.image, p.stock
         FROM cart c JOIN products p ON p.id = c.product_id
         WHERE c.user_id = ? ORDER BY c.id ASC'
    );
    $stmt->execute([$userId]);
    jsonOk($stmt->fetchAll());
}

// ── PUT update qty ────────────────────────────────────────────
if ($method === 'PUT') {
    $cartId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $body   = getBody();
    $qty    = (int)($body['qty'] ?? 0);

    if (!$cartId || $qty < 1) jsonError('ID cart dan qty wajib diisi.');

    // Verify ownership
    $chk = $db->prepare('SELECT c.id, c.product_id FROM cart c WHERE c.id = ? AND c.user_id = ?');
    $chk->execute([$cartId, $userId]);
    $item = $chk->fetch();
    if (!$item) jsonError('Item tidak ditemukan.', 404);

    // Verify stock
    $pstmt = $db->prepare('SELECT stock FROM products WHERE id = ?');
    $pstmt->execute([$item['product_id']]);
    $product = $pstmt->fetch();
    if ($product['stock'] < $qty) jsonError('Stok tidak mencukupi.');

    $db->prepare('UPDATE cart SET qty = ? WHERE id = ?')->execute([$qty, $cartId]);

    $stmt = $db->prepare(
        'SELECT c.id, c.product_id, c.qty, p.name, p.price, p.image, p.stock
         FROM cart c JOIN products p ON p.id = c.product_id
         WHERE c.user_id = ? ORDER BY c.id ASC'
    );
    $stmt->execute([$userId]);
    jsonOk($stmt->fetchAll());
}

// ── DELETE ────────────────────────────────────────────────────
if ($method === 'DELETE') {
    // Clear entire cart (after checkout)
    if (isset($_GET['clear'])) {
        $db->prepare('DELETE FROM cart WHERE user_id = ?')->execute([$userId]);
        jsonOk(['message' => 'Keranjang dikosongkan.']);
    }

    $cartId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$cartId) jsonError('ID cart diperlukan.');

    $chk = $db->prepare('SELECT id FROM cart WHERE id = ? AND user_id = ?');
    $chk->execute([$cartId, $userId]);
    if (!$chk->fetch()) jsonError('Item tidak ditemukan.', 404);

    $db->prepare('DELETE FROM cart WHERE id = ?')->execute([$cartId]);
    jsonOk(['message' => 'Item dihapus dari keranjang.']);
}

jsonError('Method tidak diizinkan.', 405);
