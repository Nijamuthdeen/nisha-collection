# Nisha Collection — REST API Documentation

**Base URL:** `http://localhost:8080`  
**Content-Type:** `application/json`

---

## 📦 Products API — `/api/products`

### GET `/api/products`
Fetch all products.

**Response 200:**
```json
[
  {
    "id": 1,
    "productName": "Cotton Kurti - Blue",
    "barcode": "NC1001",
    "price": 499.00,
    "stock": 50,
    "lowStockAlert": 10,
    "category": "Kurti",
    "description": "Soft cotton kurti",
    "createdAt": "2025-01-01T10:00:00",
    "updatedAt": "2025-01-01T10:00:00"
  }
]
```

---

### GET `/api/products/{id}`
Fetch a single product by ID.

**Response 200:** Product object  
**Response 404:** `{ "status": 404, "message": "Product not found with ID: 1" }`

---

### GET `/api/products/barcode/{barcode}`
Fetch product by barcode. Used in billing scanner.

**Response 200:** Product object  
**Response 404:** Not found error

---

### GET `/api/products/search?query={q}`
Search products by name OR barcode (partial match).

**Example:** `GET /api/products/search?query=kurti`

**Response 200:** Array of matching products

---

### GET `/api/products/low-stock`
Get all products where stock ≤ lowStockAlert.

**Response 200:** Array of low-stock products

---

### POST `/api/products`
Create a new product.

**Request Body:**
```json
{
  "productName": "Silk Saree - Red",
  "barcode": "NC2001",           // optional — auto-generated if omitted
  "price": 1299.00,
  "stock": 30,
  "lowStockAlert": 5,
  "category": "Saree",
  "description": "Pure silk saree"
}
```

**Response 201:** Created product object  
**Response 400:** Validation error or duplicate barcode

---

### PUT `/api/products/{id}`
Update an existing product.

**Request Body:** Same as POST (all fields)  
**Response 200:** Updated product object  
**Response 404:** Product not found

---

### DELETE `/api/products/{id}`
Delete a product by ID.

**Response 204:** No content  
**Response 404:** Product not found

---

## 🧾 Invoices API — `/api/invoices`

### GET `/api/invoices`
Get all invoices sorted by date (newest first).

**Response 200:**
```json
[
  {
    "id": 1,
    "invoiceNo": "NC-12042025-0001",
    "customerName": "Priya S",
    "customerMobile": "9876543210",
    "subtotal": 1198.00,
    "cgst": 107.82,
    "sgst": 107.82,
    "grandTotal": 1413.64,
    "paymentMethod": "UPI",
    "status": "COMPLETED",
    "createdAt": "2025-04-12T14:30:00",
    "items": [
      {
        "id": 1,
        "productName": "Cotton Kurti - Blue",
        "unitPrice": 499.00,
        "quantity": 2,
        "totalPrice": 998.00
      }
    ]
  }
]
```

---

### GET `/api/invoices/{id}`
Get invoice by ID.

**Response 200:** Invoice object  
**Response 404:** Not found

---

### GET `/api/invoices/number/{invoiceNo}`
Get invoice by invoice number.

**Example:** `GET /api/invoices/number/NC-12042025-0001`

---

### GET `/api/invoices/filter?from=2025-04-01&to=2025-04-30`
Filter invoices by date range.

**Query Params:**
- `from` — Start date `YYYY-MM-DD`
- `to` — End date `YYYY-MM-DD`

**Response 200:** Array of invoices in range

---

### POST `/api/invoices`
Create a new invoice. Automatically:
- Calculates CGST + SGST + Grand Total
- Generates invoice number
- Deducts stock from each product

**Request Body:**
```json
{
  "customerName": "Priya S",
  "customerMobile": "9876543210",
  "paymentMethod": "UPI",
  "cgstRate": 9,
  "sgstRate": 9,
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 3, "quantity": 1 }
  ]
}
```

**Validations:**
- `paymentMethod` must be `CASH`, `UPI`, or `CARD`
- `items` must have at least one entry
- `quantity` must be ≥ 1
- Stock must be sufficient for all items

**Response 201:** Created invoice with full details  
**Response 400:** Insufficient stock or validation error

---

## 📊 Dashboard API — `/api/dashboard`

### GET `/api/dashboard`
Get today's statistics and recent invoices.

**Response 200:**
```json
{
  "todaySales": 15420.50,
  "todayBillsCount": 12,
  "totalProducts": 45,
  "lowStockCount": 3,
  "recentInvoices": [ ... ]
}
```

---

## ❌ Error Response Format

All errors follow this structure:

```json
{
  "status": 400,
  "message": "Insufficient stock for \"Cotton Kurti - Blue\". Available: 2, Requested: 5",
  "timestamp": "2025-04-12T14:30:00"
}
```

**Status Codes:**
| Code | Meaning              |
|------|----------------------|
| 200  | Success              |
| 201  | Created              |
| 204  | Deleted (no content) |
| 400  | Bad request / validation |
| 404  | Resource not found   |
| 500  | Internal server error |

---

## 💳 Payment Method Values

| Value  | Description      |
|--------|-----------------|
| `CASH` | Cash payment     |
| `UPI`  | UPI / QR payment |
| `CARD` | Debit/Credit card |
