# Nisha Collection — API Documentation

Base URL: `http://localhost:8080` (dev) | `https://your-app.onrender.com` (prod)

All requests/responses use `Content-Type: application/json`.

---

## 📊 Dashboard

### GET /api/dashboard
Returns today's stats + recent invoices.

**Response 200:**
```json
{
  "todaySales": 4598.00,
  "todayBillsCount": 6,
  "totalProducts": 42,
  "lowStockCount": 3,
  "recentInvoices": [ { ...Invoice } ]
}
```

---

## 📦 Products

### GET /api/products
Returns all products.

**Response 200:** `[ ...Product ]`

---

### GET /api/products/{id}
Get product by ID.

**Response 200:** `Product`
**Response 404:** `{ "status": 404, "message": "Product not found with ID: 5" }`

---

### GET /api/products/barcode/{barcode}
Get product by barcode. Used in billing scan.

**Response 200:** `Product`
**Response 404:** Not found error

---

### GET /api/products/search?query=kurti
Search products by name or barcode.

**Response 200:** `[ ...Product ]`

---

### GET /api/products/low-stock
Returns products where stock <= lowStockAlert.

**Response 200:** `[ ...Product ]`

---

### POST /api/products
Create a new product.

**Request Body:**
```json
{
  "productName": "Cotton Kurti - Blue",
  "barcode": "NC001",          // optional — auto-generated if omitted
  "price": 499.00,
  "stock": 25,
  "lowStockAlert": 5,
  "category": "Kurti",
  "description": "Summer collection"
}
```

**Response 201:** `Product`
**Response 400:** Validation error

---

### PUT /api/products/{id}
Update a product.

**Request Body:** Same as POST (all fields)
**Response 200:** `Product`

---

### DELETE /api/products/{id}
Delete a product.

**Response 204:** No content
**Response 404:** Not found

---

## 🧾 Invoices

### GET /api/invoices
Returns all invoices, sorted by date descending.

**Response 200:** `[ ...Invoice ]`

---

### GET /api/invoices/{id}
Get invoice by ID.

**Response 200:** `Invoice`

---

### GET /api/invoices/number/{invoiceNo}
Get invoice by invoice number. e.g. `NC-13042025-0001`

**Response 200:** `Invoice`

---

### GET /api/invoices/filter?from=2025-04-01&to=2025-04-13
Filter invoices by date range. Dates in `YYYY-MM-DD` format.

**Response 200:** `[ ...Invoice ]`

---

### POST /api/invoices
Create a new invoice. Automatically deducts stock.

**Request Body:**
```json
{
  "customerName": "Priya",           // optional
  "customerMobile": "9876543210",    // optional, must be 10 digits
  "paymentMethod": "UPI",            // CASH | UPI | CARD
  "cgstRate": 9,                     // optional, default 9%
  "sgstRate": 9,                     // optional, default 9%
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 3, "quantity": 1 }
  ]
}
```

**Response 201:** `Invoice` (with calculated totals + items)
**Response 400:** Insufficient stock or validation error

---

## 📐 Data Models

### Product
```json
{
  "id": 1,
  "productName": "Cotton Kurti - Blue",
  "barcode": "NC001",
  "price": 499.00,
  "stock": 25,
  "lowStockAlert": 5,
  "category": "Kurti",
  "description": "",
  "createdAt": "2025-04-13T10:00:00",
  "updatedAt": "2025-04-13T10:00:00"
}
```

### Invoice
```json
{
  "id": 1,
  "invoiceNo": "NC-13042025-0001",
  "customerName": "Priya",
  "customerMobile": "9876543210",
  "subtotal": 1347.00,
  "cgst": 121.23,
  "sgst": 121.23,
  "grandTotal": 1589.46,
  "paymentMethod": "UPI",
  "status": "COMPLETED",
  "createdAt": "2025-04-13T14:30:00",
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Cotton Kurti - Blue",
      "unitPrice": 499.00,
      "quantity": 2,
      "totalPrice": 998.00
    }
  ]
}
```

---

## ⚠️ Error Format
```json
{
  "status": 400,
  "message": "Insufficient stock for \"Cotton Kurti\". Available: 2, Requested: 5",
  "timestamp": "2025-04-13T14:30:00"
}
```

---

## 📋 HTTP Status Codes
| Code | Meaning              |
|------|----------------------|
| 200  | Success              |
| 201  | Created              |
| 204  | Deleted (no content) |
| 400  | Bad request / validation |
| 404  | Resource not found   |
| 500  | Internal server error |
