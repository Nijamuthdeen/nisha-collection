-- ============================================================
--  NISHA COLLECTION — MySQL Schema (Full Fixed Version)
-- ============================================================

CREATE DATABASE IF NOT EXISTS nisha_collection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nisha_collection;

CREATE TABLE IF NOT EXISTS products (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_name     VARCHAR(255) NOT NULL,
    barcode          VARCHAR(100) UNIQUE,
    price            DECIMAL(10,2) NOT NULL,
    stock            INT NOT NULL DEFAULT 0,
    low_stock_alert  INT NOT NULL DEFAULT 10,
    category         VARCHAR(100),
    description      TEXT,
    created_at       DATETIME NOT NULL DEFAULT NOW(),
    updated_at       DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_no       VARCHAR(50) UNIQUE NOT NULL,
    customer_name    VARCHAR(255),
    customer_mobile  VARCHAR(15),
    subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cgst             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sgst             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    grand_total      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method   ENUM('CASH','UPI','CARD') NOT NULL DEFAULT 'CASH',
    status           ENUM('COMPLETED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'COMPLETED',
    created_at       DATETIME NOT NULL DEFAULT NOW()
);

-- product_id is NULLABLE so deleting a product won't break existing invoices
CREATE TABLE IF NOT EXISTS invoice_items (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id   BIGINT NOT NULL,
    product_id   BIGINT NULL,                       -- nullable: product can be deleted later
    product_name VARCHAR(255) NOT NULL,
    barcode      VARCHAR(100),
    unit_price   DECIMAL(10,2) NOT NULL,
    quantity     INT NOT NULL,
    total_price  DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_barcode    ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name       ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv   ON invoice_items(invoice_id);

-- Seed data (safe re-run)
INSERT IGNORE INTO products (product_name, barcode, price, stock, low_stock_alert, category) VALUES
('Cotton Kurti - Blue',         'NC001', 499.00,  25, 5, 'Kurti'),
('Silk Saree - Red',            'NC002', 1299.00, 10, 3, 'Saree'),
('Floral Tops - White',         'NC003', 349.00,  40, 8, 'Tops'),
('Palazzo Pants - Black',       'NC004', 599.00,  15, 5, 'Pants'),
('Embroidered Dupatta - Green', 'NC005', 249.00,   8, 5, 'Dupatta'),
('Cotton Churidar Set - Pink',  'NC006', 799.00,   3, 5, 'Set'),
('Printed Anarkali - Purple',   'NC007', 999.00,  12, 5, 'Anarkali'),
('Designer Blouse - Gold',      'NC008', 449.00,  20, 5, 'Blouse');

-- If upgrading from old schema: make product_id nullable
-- ALTER TABLE invoice_items MODIFY product_id BIGINT NULL;
-- ALTER TABLE invoice_items DROP FOREIGN KEY <old_fk_name>;
-- ALTER TABLE invoice_items ADD CONSTRAINT fk_inv_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
