-- ============================================================
--  NISHA COLLECTION — PostgreSQL Schema
--  Run this on Supabase SQL Editor or any PostgreSQL instance
-- ============================================================

-- 1. Products table
CREATE TABLE IF NOT EXISTS products (
    id               BIGSERIAL PRIMARY KEY,
    product_name     VARCHAR(255) NOT NULL,
    barcode          VARCHAR(100) UNIQUE,
    price            NUMERIC(10,2) NOT NULL CHECK (price > 0),
    stock            INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_alert  INTEGER NOT NULL DEFAULT 10,
    category         VARCHAR(100),
    description      TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id               BIGSERIAL PRIMARY KEY,
    invoice_no       VARCHAR(50) UNIQUE NOT NULL,
    customer_name    VARCHAR(255),
    customer_mobile  VARCHAR(15),
    subtotal         NUMERIC(10,2) NOT NULL DEFAULT 0,
    cgst             NUMERIC(10,2) NOT NULL DEFAULT 0,
    sgst             NUMERIC(10,2) NOT NULL DEFAULT 0,
    grand_total      NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method   VARCHAR(10) NOT NULL DEFAULT 'CASH'
                         CHECK (payment_method IN ('CASH','UPI','CARD')),
    status           VARCHAR(15) NOT NULL DEFAULT 'COMPLETED'
                         CHECK (status IN ('COMPLETED','CANCELLED','REFUNDED')),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id           BIGSERIAL PRIMARY KEY,
    invoice_id   BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id   BIGINT NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL,
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    total_price  NUMERIC(10,2) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_barcode    ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name       ON products(LOWER(product_name));
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv   ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_prod  ON invoice_items(product_id);

-- Auto update_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed data
INSERT INTO products (product_name, barcode, price, stock, low_stock_alert, category) VALUES
    ('Cotton Kurti - Blue',         'NC001', 499.00,  25, 5, 'Kurti'),
    ('Silk Saree - Red',            'NC002', 1299.00, 10, 3, 'Saree'),
    ('Floral Tops - White',         'NC003', 349.00,  40, 8, 'Tops'),
    ('Palazzo Pants - Black',       'NC004', 599.00,  15, 5, 'Pants'),
    ('Embroidered Dupatta - Green', 'NC005', 249.00,   8, 5, 'Dupatta'),
    ('Cotton Churidar Set - Pink',  'NC006', 799.00,   3, 5, 'Set'),
    ('Printed Anarkali - Purple',   'NC007', 999.00,  12, 5, 'Anarkali'),
    ('Designer Blouse - Gold',      'NC008', 449.00,  20, 5, 'Blouse')
ON CONFLICT (barcode) DO NOTHING;
