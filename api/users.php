<?php
// ============================================================
//  api/users.php
//
//  GET    /api/users.php          → list all users      (admin)
//  GET    /api/users.php?id=1     → single user         (admin or self)
//  POST   /api/users.php          → create user         (admin)
//  PUT    /api/users.php?id=1     → update name/email/role/password
//  DELETE /api/users.php?id=1     → delete user         (admin or self)
// ============================================================

require_once __DIR__ . '/../config/helpers.php';

$db     = getDB();
$method = getMethod();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// ── GET ───────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        requireAuthApi();
        $stmt = $db->prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        if (!$user) jsonError('Akun tidak ditemukan.', 404);
        jsonOk($user);
    }
    requireAdminApi();
    $rows = $db->query('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
    jsonOk($rows->fetchAll());
}

// ── POST create (admin) ───────────────────────────────────────
if ($method === 'POST') {
    requireAdminApi();
    $body = getBody();

    $name     = trim($body['name']     ?? '');
    $email    = trim($body['email']    ?? '');
    $password =      $body['password'] ?? '';
    $role     =      $body['role']     ?? 'user';

    if (!$name || !$email || !$password) jsonError('Nama, email, dan password wajib diisi.');
    if (strlen($password) < 6)           jsonError('Password minimal 6 karakter.');
    if (!in_array($role, ['admin','user'])) $role = 'user';

    $chk = $db->prepare('SELECT id FROM users WHERE email = ?');
    $chk->execute([$email]);
    if ($chk->fetch()) jsonError('Email sudah digunakan.');

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $ins  = $db->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    $ins->execute([$name, $email, $hash, $role]);
    $newId = (int) $db->lastInsertId();

    $row = $db->prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?');
    $row->execute([$newId]);
    jsonOk($row->fetch(), 201);
}

// ── PUT update ────────────────────────────────────────────────
if ($method === 'PUT') {
    $requesterId = requireAuthApi();
    if (!$id) jsonError('ID user diperlukan.');

    // User boleh edit diri sendiri; admin boleh edit siapa saja
    $stmt = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->execute([$requesterId]);
    $requester = $stmt->fetch();
    if ($requester['role'] !== 'admin' && $requesterId !== $id) {
        jsonError('Forbidden', 403);
    }

    $body   = getBody();
    $fields = [];
    $params = [];

    if (!empty($body['name']))  { $fields[] = 'name = ?';  $params[] = trim($body['name']); }
    if (!empty($body['email'])) {
        // cek duplikat email
        $chk = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        $chk->execute([trim($body['email']), $id]);
        if ($chk->fetch()) jsonError('Email sudah digunakan akun lain.');
        $fields[] = 'email = ?';
        $params[] = trim($body['email']);
    }
    if (!empty($body['password'])) {
        if (strlen($body['password']) < 6) jsonError('Password minimal 6 karakter.');
        // If old_password is provided (self-service change), verify it first
        if (!empty($body['old_password'])) {
            $cur = $db->prepare('SELECT password FROM users WHERE id = ?');
            $cur->execute([$id]);
            $curUser = $cur->fetch();
            if (!$curUser || !password_verify($body['old_password'], $curUser['password'])) {
                jsonError('Password lama salah.', 401);
            }
        }
        $fields[] = 'password = ?';
        $params[] = password_hash($body['password'], PASSWORD_BCRYPT);
    }
    // Only admin can change role
    if ($requester['role'] === 'admin' && isset($body['role']) && in_array($body['role'], ['admin','user'])) {
        $fields[] = 'role = ?';
        $params[] = $body['role'];
    }

    if (!$fields) jsonError('Tidak ada data yang diubah.');

    $params[] = $id;
    $db->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

    $row = $db->prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?');
    $row->execute([$id]);
    jsonOk($row->fetch());
}

// ── DELETE ────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $requesterId = requireAuthApi();
    if (!$id) jsonError('ID user diperlukan.');

    $stmt = $db->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->execute([$requesterId]);
    $requester = $stmt->fetch();
    if ($requester['role'] !== 'admin' && $requesterId !== $id) {
        jsonError('Forbidden', 403);
    }

    $chk = $db->prepare('SELECT id FROM users WHERE id = ?');
    $chk->execute([$id]);
    if (!$chk->fetch()) jsonError('Akun tidak ditemukan.', 404);

    $db->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    jsonOk(['message' => 'Akun berhasil dihapus.']);
}

jsonError('Method tidak diizinkan.', 405);
