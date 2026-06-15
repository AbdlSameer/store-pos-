# Toy Store POS System - Audit Fix Tracker

## 🔴 Critical
- [x] 1. POS Checkout Race Condition (Use atomic decrement)
- [x] 2. Broken Product State on QR Generation (Generate QR before DB insert)
- [x] 3. Duplicate Bill Items on Checkout (Aggregate `data.items` by `productId`)

## 🟠 High
- [x] 4. Missing File Upload Validation (Add multer middleware)
- [x] 5. Lack of Graceful Shutdown (Handle SIGTERM/SIGINT in app.ts)

## 🟡 Medium
- [x] 6. Missing Containerization for Node/React (Create Dockerfile, update compose)
- [x] 7. Unstructured Logging (Implement Winston logger)

## 🟢 Low
- [x] 8. Analytics Queries Potential Full Table Scan (Add date range to queries)
