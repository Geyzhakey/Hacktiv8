<?php
// ============================================================
//  config/database.php  –  Koneksi MySQL
//  Sesuaikan DB_USER / DB_PASS jika perlu
// ============================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'toko_db');
define('DB_USER', 'root');      // default Laragon
define('DB_PASS', '');          // default Laragon (kosong)
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}
