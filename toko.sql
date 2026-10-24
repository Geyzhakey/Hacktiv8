-- ============================================================
--  toko.sql  –  Schema database TokoKu
--  Cara pakai:
--    1. Buka phpMyAdmin (http://localhost/phpmyadmin)
--    2. Buat database baru bernama  toko_db
--    3. Import / jalankan file SQL ini
-- ============================================================

CREATE DATABASE IF NOT EXISTS `toko_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `toko_db`;

-- ── Tabel users ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(120)     NOT NULL,
  `email`      VARCHAR(180)     NOT NULL UNIQUE,
  `password`   VARCHAR(255)     NOT NULL,          -- bcrypt hash
  `role`       ENUM('admin','user') NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tabel products ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `products` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(200)  NOT NULL,
  `price`       DECIMAL(15,2) NOT NULL DEFAULT 0,
  `stock`       INT UNSIGNED  NOT NULL DEFAULT 0,
  `category`    VARCHAR(100)  NOT NULL DEFAULT '',
  `image`       TEXT,
  `description` TEXT,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tabel cart ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `cart` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `qty`        INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart_item` (`user_id`, `product_id`),
  CONSTRAINT `fk_cart_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Demo data ─────────────────────────────────────────────────
-- Password  admin123  →  bcrypt hash (cost 12)
-- Password  budi123   →  bcrypt hash (cost 12)
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
  ('Admin',  'admin@toko.com', '$2y$12$b9iBtOEKNnlVTcnrbK1ndettdSGSxMTcA06i6EH1g6HA/fKmm7gpK', 'admin'),
  ('Budi',   'budi@toko.com',  '$2y$12$QR6f2uuxqLiz90AbdTZv4eWMUh49GQjk65BfkDEs4jtH9cRnBy7R2', 'user');

INSERT INTO `products` (`name`, `price`, `stock`, `category`, `image`, `description`) VALUES
  ('Laptop Asus VivoBook', 8500000, 12, 'Elektronik', 'https://placehold.co/400x300/1d4ed8/fff?text=Laptop',     'Laptop ringan dengan performa tinggi.'),
  ('Sepatu Nike Air Max',  1200000, 30, 'Fashion',    'https://placehold.co/400x300/6d28d9/fff?text=Sepatu',     'Sepatu olahraga stylish dan nyaman.'),
  ('Kopi Arabica 250gr',     85000, 50, 'Makanan',    'https://placehold.co/400x300/854d0e/fff?text=Kopi',       'Kopi arabica premium pilihan petani lokal.'),
  ('Headphone Sony WH',    2300000,  8, 'Elektronik', 'https://placehold.co/400x300/0f766e/fff?text=Headphone',  'Noise cancelling, baterai 30 jam.'),
  ('Tas Ransel Eiger',      450000, 20, 'Fashion',    'https://placehold.co/400x300/b45309/fff?text=Tas',        'Ransel kuat untuk petualangan.'),
  ('Minyak Goreng 2L',       35000,100, 'Makanan',    'https://placehold.co/400x300/166534/fff?text=Minyak',     'Minyak goreng premium kemasan 2 liter.');
