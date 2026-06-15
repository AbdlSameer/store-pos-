# Code Review & Security Audit Report

As requested, I have completed a thorough audit of the Toy Store POS & Inventory Management System codebase. Below is the prioritized list of findings spanning Code Review, Security, Bugs/Edge Cases, Performance, Testing, and Deployment. 

## 🔴 Critical Findings

### 1. POS Checkout Race Condition (TOCTOU Vulnerability)
**Observation**: In `pos.service.ts`, stock decrement is calculated in memory (`const newQty = product.quantity - item.quantity;`) and then pushed to the database (`data: { quantity: update.qty }`). If two concurrent requests try to buy the last item, both read `1`, calculate `0`, and save `0`. Two items are sold, but inventory only drops by 1.
**Fix**: Refactor `pos.service.ts` to use Prisma's atomic decrement and move the check inside the database transaction if possible, or handle negative balances via DB constraints.
```typescript
await tx.product.update({
  where: { id: update.id },
  data: { quantity: { decrement: item.quantity } }
});
```

### 2. Broken Product State on QR Generation Failure
**Observation**: In `products.service.ts`, the product is inserted into the database *before* generating the QR/Barcode buffers. If image generation fails (or Cloudinary upload fails in production), an orphaned product exists without a QR code, breaking the POS scanner for that item.
**Fix**: Generate the QR payloads and image buffers *before* the database insertion, and use Prisma's nested writes to ensure atomicity.

### 3. Duplicate Bill Items on Checkout
**Observation**: If a malicious user bypasses the frontend and sends a payload with duplicate `productId` entries `[{ id: '1', qty: 1 }, { id: '1', qty: 1 }]`, the backend processes them as separate rows in `BillItem`. If not using atomic decrements, it also corrupts the stock calculation.
**Fix**: Add an aggregation step at the very beginning of `createBill` in `pos.service.ts` to reduce `data.items` by `productId`, summing their quantities before processing.

## 🟠 High Findings

### 4. Missing File Upload Validation (Security)
**Observation**: The blueprint mentions image upload via Multer/S3. Currently, the API accepts a raw `imageUrl` string without sanitization. If implementing Multer, there is no file size/type restriction.
**Fix**: Create a `middleware/upload.ts` using `multer`. Implement a file filter restricting to `image/jpeg`, `image/png`, and `image/webp`, with a strict `limits: { fileSize: 5 * 1024 * 1024 }` (5MB).

### 5. Lack of Graceful Shutdown
**Observation**: In `app.ts`, the server starts but does not trap `SIGTERM` or `SIGINT` signals. When Docker stops the container or AWS ECS cycles tasks, active POS checkouts may be abruptly killed, resulting in dropped connections and corrupted states.
**Fix**: Add a shutdown handler in `app.ts` to stop accepting new requests, await pending DB transactions, disconnect Prisma, disconnect Redis, and exit gracefully.

## 🟡 Medium Findings

### 6. Missing Containerization for Node/React
**Observation**: `docker-compose.yml` exists for Postgres and Redis, but there is no `Dockerfile` for the Node.js server or the React client.
**Fix**: Create a multi-stage `Dockerfile` in the root (or per app) optimized for production (using `node:20-alpine`, `npm ci`, and stripping `devDependencies`). Update `docker-compose.yml` to orchestrate the apps alongside the databases.

### 7. Unstructured Logging
**Observation**: The application uses `console.log` and `morgan('dev')`. In a production environment, this makes log querying and alerting difficult.
**Fix**: Introduce `winston` as the logger. Format logs as JSON in production and human-readable text in development.

## 🟢 Low Findings

### 8. Analytics Queries Potential Full Table Scan
**Observation**: In `analytics.service.ts`, `getTopProducts` groups by `productId` across the entire `SalesAnalytics` table. As the table grows over years, this will become slow.
**Fix**: Add an index to `productId` and `unitsSold` in `schema.prisma`. Furthermore, we should pass a date range (e.g., `last_30_days`) to limit the scanned rows.

---

> [!IMPORTANT]
> **User Review Required**
> Do you approve this audit report? Once approved, I will systematically apply these fixes to the codebase, ensuring production-level quality across the backend, frontend, and deployment configurations.
