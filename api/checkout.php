<?php
// ============================================================
//  api/checkout.php
//
//  POST /api/checkout.php  → deduct stock + clear cart
// ============================================================

require_once __DIR__ . '/../config/helpers.php';

if (getMethod() !== 'POST') jsonError('Method tidak diizinkan.', 405);

$db     = getDB();
$userId = requireAuthApi();

// Fetch cart items
$stmt = $db->prepare(
    'SELECT c.id AS cart_id, c.product_id, c.qty,
            p.name, p.stock
     FROM   cart c
     JOIN   products p ON p.id = c.product_id
     WHERE  c.user_id = ?'
);
$stmt->execute([$userId]);
$items = $stmt->fetchAll();

if (!$items) jsonError('Keranjang kosong.');

// Validate stock first
foreach ($items as $item) {
    if ($item['stock'] < $item['qty']) {
        jsonError("Stok \"{$item['name']}\" tidak mencukupi (tersisa {$item['stock']}).");
    }
}

// Deduct stock and clear cart in a transaction
$db->beginTransaction();
try {
    foreach ($items as $item) {
        $db->prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
           ->execute([$item['qty'], $item['product_id']]);
    }
    $db->prepare('DELETE FROM cart WHERE user_id = ?')->execute([$userId]);
    $db->commit();
} catch (Throwable $e) {
    $db->rollBack();
    jsonError('Checkout gagal, silakan coba lagi.', 500);
}

jsonOk(['message' => 'Pesanan berhasil! Terima kasih.']);
