<?php
// ============================================================
//  api/products.php
//
//  GET    /api/products.php              → list all (+ sort/search/category)
//  GET    /api/products.php?id=1         → single product
//  POST   /api/products.php              → create  (admin)
//  PUT    /api/products.php?id=1         → update  (admin)
//  DELETE /api/products.php?id=1         → delete  (admin)
// ============================================================

require_once __DIR__ . '/../config/helpers.php';

$db     = getDB();
$method = getMethod();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// ── GET all / single ──────────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare('SELECT * FROM products WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) jsonError('Produk tidak ditemukan.', 404);
        jsonOk($product);
    }

    // List with optional sort / search / category filter
    $search = $_GET['search']   ?? '';
    $cat    = $_GET['category'] ?? '';
    $sort   = $_GET['sort']     ?? '';

    $where  = [];
    $params = [];

    if ($search) { $where[] = 'name LIKE ?';     $params[] = '%' . $search . '%'; }
    if ($cat)    { $where[] = 'category = ?';    $params[] = $cat; }

    $sql = 'SELECT * FROM products';
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);

    $sql .= match($sort) {
        'az'    => ' ORDER BY name ASC',
        'za'    => ' ORDER BY name DESC',
        'cheap' => ' ORDER BY price ASC',
        'exp'   => ' ORDER BY price DESC',
        default => ' ORDER BY id DESC',
    };

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonOk($stmt->fetchAll());
}

// ── POST create (admin) ───────────────────────────────────────
if ($method === 'POST') {
    requireAdminApi();
    $body = getBody();

    $name        = trim($body['name']        ?? '');
    $price       =      $body['price']       ?? 0;
    $stock       =      $body['stock']       ?? 0;
    $category    = trim($body['category']    ?? '');
    $image       = trim($body['image']       ?? '');
    $description = trim($body['description'] ?? '');

    if (!$name || !is_numeric($price) || !is_numeric($stock)) {
        jsonError('Nama, harga, dan stok wajib diisi.');
    }

    $stmt = $db->prepare(
        'INSERT INTO products (name, price, stock, category, image, description)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$name, (float)$price, (int)$stock, $category, $image, $description]);
    $newId = (int) $db->lastInsertId();

    $row = $db->prepare('SELECT * FROM products WHERE id = ?');
    $row->execute([$newId]);
    jsonOk($row->fetch(), 201);
}

// ── PUT update (admin) ────────────────────────────────────────
if ($method === 'PUT') {
    requireAdminApi();
    if (!$id) jsonError('ID produk diperlukan.');
    $body = getBody();

    $fields = [];
    $params = [];
    foreach (['name','price','stock','category','image','description'] as $f) {
        if (array_key_exists($f, $body)) {
            $fields[] = "$f = ?";
            $params[] = $body[$f];
        }
    }
    if (!$fields) jsonError('Tidak ada data yang diubah.');

    $params[] = $id;
    $db->prepare('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?')
       ->execute($params);

    $row = $db->prepare('SELECT * FROM products WHERE id = ?');
    $row->execute([$id]);
    jsonOk($row->fetch());
}

// ── DELETE (admin) ────────────────────────────────────────────
if ($method === 'DELETE') {
    requireAdminApi();
    if (!$id) jsonError('ID produk diperlukan.');

    $chk = $db->prepare('SELECT id FROM products WHERE id = ?');
    $chk->execute([$id]);
    if (!$chk->fetch()) jsonError('Produk tidak ditemukan.', 404);

    $db->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
    jsonOk(['message' => 'Produk berhasil dihapus.']);
}

jsonError('Method tidak diizinkan.', 405);
