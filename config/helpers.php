<?php
// ============================================================
//  config/helpers.php  –  Shared API helpers
// ============================================================

// Jangan tampilkan error PHP sebagai output (agar JSON tidak rusak)
ini_set('display_errors', 0);
error_reporting(0);

require_once __DIR__ . '/database.php';

// ── CORS + JSON headers ──────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Tangkap fatal error dan kembalikan sebagai JSON
register_shutdown_function(function () {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => $e['message'] . ' (line ' . $e['line'] . ')']);
    }
});

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Helpers ──────────────────────────────────────────────────
function jsonOk($data = null, int $code = 200): void {
    http_response_code($code);
    echo json_encode(['ok' => true,  'data' => $data]);
    exit;
}

function jsonError(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

function getBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function getMethod(): string {
    return $_SERVER['REQUEST_METHOD'];
}

// ── Simple session via Authorization header ───────────────────
// Frontend kirim header:  Authorization: Bearer <user_id>
function getAuthUserId(): ?int {
    // Apache kadang tidak meneruskan Authorization ke $_SERVER
    $header = $_SERVER['HTTP_AUTHORIZATION']
           ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
           ?? '';

    // Fallback via getallheaders()
    if (!$header && function_exists('getallheaders')) {
        $all = getallheaders();
        foreach ($all as $k => $v) {
            if (strtolower($k) === 'authorization') { $header = $v; break; }
        }
    }

    if (preg_match('/^Bearer\s+(\d+)$/i', $header, $m)) {
        return (int) $m[1];
    }
    return null;
}

function requireAuthApi(): int {
    $id = getAuthUserId();
    if (!$id) jsonError('Unauthorized', 401);
    return $id;
}

function requireAdminApi(): int {
    $userId = requireAuthApi();
    $db  = getDB();
    $row = $db->prepare('SELECT role FROM users WHERE id = ?');
    $row->execute([$userId]);
    $user = $row->fetch();
    if (!$user || $user['role'] !== 'admin') jsonError('Forbidden', 403);
    return $userId;
}
