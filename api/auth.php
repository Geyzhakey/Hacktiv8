<?php
// ============================================================
//  api/auth.php
//
//  POST /api/auth.php?action=login
//  POST /api/auth.php?action=register
// ============================================================

require_once __DIR__ . '/../config/helpers.php';

$action = $_GET['action'] ?? '';
$body   = getBody();

// ── Login ─────────────────────────────────────────────────────
if (getMethod() === 'POST' && $action === 'login') {
    $email    = trim($body['email']    ?? '');
    $password =      $body['password'] ?? '';

    if (!$email || !$password) jsonError('Email dan password wajib diisi.');

    $db   = getDB();
    $stmt = $db->prepare('SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        jsonError('Email atau password salah.', 401);
    }

    unset($user['password']);
    jsonOk($user);
}

// ── Register ──────────────────────────────────────────────────
if (getMethod() === 'POST' && $action === 'register') {
    $name     = trim($body['name']     ?? '');
    $email    = trim($body['email']    ?? '');
    $password =      $body['password'] ?? '';

    if (!$name || !$email || !$password) jsonError('Semua field wajib diisi.');
    if (strlen($password) < 6)           jsonError('Password minimal 6 karakter.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Format email tidak valid.');

    $db   = getDB();
    $chk  = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $chk->execute([$email]);
    if ($chk->fetch()) jsonError('Email sudah terdaftar.');

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $ins  = $db->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "user")');
    $ins->execute([$name, $email, $hash]);

    jsonOk(['message' => 'Akun berhasil dibuat.'], 201);
}

jsonError('Endpoint tidak ditemukan.', 404);
