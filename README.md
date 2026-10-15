# 🧸 Toy Store POS & Inventory Management System

[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-ef4444.svg)](https://turbo.build/)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933.svg?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-61DAFB.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg?logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A high-performance, production-hardened Point of Sale (POS) and inventory management platform tailored for modern retail toy stores and franchise outlets. Designed for high cashier throughput (<50ms barcode scans), rock-solid ACID transactional checkout, atomic stock consistency, enterprise role-based security with TOTP Two-Factor Authentication, and automated cloud disaster recovery.

---

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Monorepo Directory Structure](#-monorepo-directory-structure)
- [Environment Configuration](#-environment-configuration)
- [Quick Start Guide](#-quick-start-guide)
  - [Option A: Docker Compose (Fastest)](#option-a-docker-compose-fastest)
  - [Option B: Local Development (Turborepo)](#option-b-local-development-turborepo)
- [Default Credentials & Roles](#-default-credentials--roles)
- [Available Scripts](#-available-scripts)
- [API Reference](#-api-reference)
- [Security & Production Hardening](#-security--production-hardening)
- [Disaster Recovery & Backups](#-disaster-recovery--backups)
- [Contributing & License](#-contributing--license)

---

## 🏛 System Architecture

The platform is structured as a **modular monolith** within a Turborepo monorepo, balancing strict domain boundaries with zero network latency between core billing and inventory modules:

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 19 + Vite)"]
        UI_POS["POS Checkout Terminal"]
        UI_INV["Inventory & Barcode Manager"]
        UI_DASH["Analytics & Auditing Dashboard"]
    end

    subgraph Gateway ["Middleware & Gateway"]
        AuthMid["JWT Auth & Inactivity Guard"]
        RateLim["Redis Sliding-Window Limiter"]
        AuditMid["Audit Logging Engine"]
        UploadMid["Multer File Validator (5MB Limit)"]
    end

    subgraph Server ["Server Modules (Express 4 + Node.js 20)"]
        ModAuth["Auth & 2FA Service (TOTP)"]
        ModPOS["POS & Billing Engine (Atomic Decrements)"]
        ModProd["Product & Barcode/QR Generator (HMAC)"]
        ModAlert["Stock Alert Engine"]
        ModAnalyt["Analytics & Dead Stock Service"]
    end

    subgraph Data ["Persistence & Cache"]
        Postgres[("PostgreSQL 16 (Neon / Local)")]
        RedisCache[("Redis 7 (In-Memory Cache & Queues)")]
    end

    subgraph AsyncJobs ["Background Processing"]
        BullWorker["BullMQ Worker"]
        SendGridService["Email Alerts (SendGrid)"]
        TwilioService["SMS Alerts (Twilio)"]
    end

    Client --> AuthMid
    AuthMid --> RateLim
    RateLim --> AuditMid
    AuditMid --> Server

    ModPOS -->|ACID Transactions| Postgres
    ModProd -->|Cached Reads <50ms| RedisCache
    ModProd --> Postgres
    ModAuth --> Postgres
    ModAnalyt --> Postgres

    ModPOS -.->|Low Stock Event| BullWorker
    BullWorker --> SendGridService
    BullWorker --> TwilioService
```

---

## ✨ Key Features

### ⚡ Point of Sale (POS) Terminal
- **Hardware Scanner Ready**: Plug-and-play USB & Bluetooth barcode scanner support via global HID keyboard-wedge interception.
- **Camera Fallback**: Mobile/tablet camera scanning via `html5-qrcode`.
- **Sub-50ms Scans**: Redis caching for ultra-fast product SKU and barcode lookups.
- **Dynamic Pricing Modes**: Seamless toggle between **Retail** and **Wholesale** pricing.
- **Flexible Bill Calculation**: Supports flat or percentage discounts, configurable tax rates (GST/VAT), and multi-tender payments (Cash, Card, UPI, Split).
- **Thermal Receipt Printing**: Printable thermal receipt modal with instant formatting for standard 80mm/58mm POS receipt printers.

### 📦 Inventory & Barcode Generation
- **Automated Label Generator**: Server-side rendering of **Code128 1D Barcodes** (`bwip-js`) and **2D QR Codes** (`qrcode`).
- **Anti-Tampering HMAC Verification**: Every QR code contains an HMAC-SHA256 signature to prevent price and product spoofing.
- **Stock Tracking & Manual Adjustments**: Adjust inventory with mandatory audit reason logging.
- **Hierarchical Categories**: Parent-child category classification.
- **Secure File Uploads**: Image uploads with strict MIME-type whitelisting (`image/jpeg`, `image/png`, `image/webp`) and 5MB size caps.

### 🛡️ Enterprise Security & Role-Based Access Control (RBAC)
- **Role Hierarchy**:
  - `super_admin`: Store owner with full system access, user management, and security controls.
  - `admin`: Manager access to inventory, analytics, categories, and stock adjustments.
  - `cashier`: Dedicated access to POS register, scan lookup, and bill history.
- **Two-Factor Authentication (2FA)**: RFC 6238 TOTP authentication compatible with Google Authenticator, 1Password, and Authy.
- **Two-Man Rule Bill Voiding**: Cashiers cannot unilaterally cancel completed bills. Voiding requires supervisor credentials (email, password, and optional 2FA OTP) with atomic stock restitution.
- **Inactivity Timeout**: Automatic session termination via `useIdleLogout` after prolonged inactivity.
- **Structured Audit Trail**: Detailed `AuditLog` records capturing Actor, Role, IP Address, HTTP Method, Target Resource, Status Code, and Payload metadata.

### 🚨 Low-Stock & Out-of-Stock Alerts
- **Real-Time Monitoring**: Automatically triggers stock alerts when item quantities breach defined thresholds.
- **Alert Resolution**: Admin acknowledgement tracking for restock requests.
- **Background Dispatch**: Asynchronous email (SendGrid) and SMS (Twilio) notifications via Redis-backed BullMQ workers without slowing down checkout.

### 📊 Business Analytics & Reporting
- **Executive KPI Dashboard**: Today's revenue, transaction volume, units sold, and active alerts.
- **Optimized Top-Selling Query**: 30-day bounded aggregation preventing full-table scan bottlenecks.
- **Dead Stock Analysis**: Identifies slow-moving inventory to optimize cash flow and storage.
- **Interactive Visualizations**: Clean, responsive charts rendered with Recharts.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | React 19 + Vite 8 | High-speed Single Page Application (SPA) |
| **State Management** | Zustand | Lightweight, selective global state |
| **UI Components & Icons**| Vanilla CSS + Lucide React | Clean, responsive design with zero Tailwind lock-in |
| **Charts & Data Viz** | Recharts 3 | Responsive SVG business charts |
| **Backend Runtime** | Node.js 20+ (Alpine) | High-performance asynchronous runtime |
| **API Framework** | Express 4 (TypeScript) | Modular RESTful architecture |
| **Database & ORM** | PostgreSQL 16 + Prisma 5 | ACID-compliant relational DB with typesafe models |
| **Cache & Queues** | Redis 7 + BullMQ | Scan caching, rate limiting, and background workers |
| **Barcode & QR Engine** | `bwip-js` + `qrcode` | Server-side Code128 and HMAC-signed QR generation |
| **Logging** | Winston 3 | JSON logging in production, colorized in development |
| **Monorepo Engine** | Turborepo 2 | Parallel builds, caching, and unified workspace execution |
| **Containerization** | Docker & Docker Compose | Multi-stage Docker builds and orchestration |

---

## 📂 Monorepo Directory Structure

```text
store-pos/
├── apps/
│   ├── client/                      # React 19 Frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/          # Reusable UI (Modals, Receipts, Layout)
│   │   │   ├── hooks/               # useAuthBootstrap, useIdleLogout, etc.
│   │   │   ├── pages/               # POS, Products, BillHistory, Analytics, Security
│   │   │   ├── services/            # Axios API client with automatic token refresh
│   │   │   └── store/               # Zustand auth & session store
│   │   ├── Dockerfile               # Multi-stage Nginx production container
│   │   └── nginx.conf               # SPA routing & fallback configuration
│   │
│   └── server/                      # Express Backend
│       ├── prisma/
│       │   ├── schema.prisma        # Database schema definitions & indices
│       │   └── seed.ts              # Idempotent database seeder
│       ├── src/
│       │   ├── config/              # Database, Redis, and validated env variables
│       │   ├── middleware/          # JWT auth, RBAC, Rate limiter, Upload, Audit
│       │   ├── modules/
│       │   │   ├── alerts/          # Stock alert endpoints & logic
│       │   │   ├── analytics/       # KPI aggregations & reporting
│       │   │   ├── audit/           # Audit logging service
│       │   │   ├── auth/            # Login, Refresh, 2FA TOTP setup/confirm
│       │   │   ├── categories/      # Category tree management
│       │   │   ├── pos/             # Scanning, Bill creation, Void approvals
│       │   │   └── products/        # Catalog CRUD, QR/Barcode generation
│       │   └── utils/               # Logger (Winston), HMAC, Pagination
│       └── Dockerfile               # Multi-stage Node.js Alpine container
│
├── packages/
│   └── shared/                      # Shared Types & Contracts
│       ├── src/
│       │   ├── constants/           # Business limits, roles, TTLs
│       │   ├── types/               # TypeScript interfaces (Product, Bill, User)
│       │   └── validators/          # Zod validation schemas shared front/back
│       └── package.json
│
├── .github/
│   └── workflows/
│       └── backup.yml               # Nightly pg_dump → Backblaze B2 backup
├── docker-compose.yml               # Full-stack local orchestration
├── turbo.json                       # Turborepo task pipeline
├── BACKUPS.md                       # Comprehensive Disaster Recovery Guide
└── package.json                     # Monorepo root workspace configuration
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root (or copy `.env.example`):

```bash
cp .env.example .env
```

### Core Variables

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Backend HTTP port | `4000` |
| `NODE_ENV` | Application environment | `development` \| `production` |
| `CLIENT_URL` | Allowed CORS origin(s) | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://toystore:toystore_dev_pass@localhost:5432/toystore_db` |
| `REDIS_URL` | Redis connection string | `redis://:redis_dev_pass@localhost:6379` |
| `JWT_ACCESS_SECRET` | Secret key for 15m access tokens (min 32 chars) | `your_super_secret_jwt_access_key_min_32_chars!` |
| `JWT_REFRESH_SECRET` | Secret key for 7d refresh tokens (min 32 chars) | `your_super_secret_jwt_refresh_key_min_32_chars!` |
| `QR_HMAC_SECRET` | Secret key for QR code digital signatures (min 32 chars) | `your_super_secret_qr_hmac_key_min_32_chars_long!` |
| `SEED_ADMIN_EMAIL` | Initial super admin email for seeder | `admin@toystore.com` |
| `SEED_ADMIN_PASSWORD`| Initial super admin password | `AdminPassword123!` |
| `VITE_API_URL` | Frontend API target | `http://localhost:4000/api` |

### Optional Integrations
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Product image hosting.
- `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `ADMIN_ALERT_EMAIL`: Automated low-stock email alerts.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `ADMIN_ALERT_PHONE`: Critical out-of-stock SMS alerts.

---

## 🚀 Quick Start Guide

### Option A: Docker Compose (Fastest)

Run the complete multi-container stack (PostgreSQL, Redis, Backend, and Nginx-hosted Frontend) with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/store-pos.git
cd store-pos

# 2. Prepare environment variables
cp .env.example .env

# 3. Build and launch all containers in detached mode
docker-compose up --build -d
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:4000/api](http://localhost:4000/api)
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

To view container logs or shut down:
```bash
docker-compose logs -f
docker-compose down
```

---

### Option B: Local Development (Turborepo)

#### Prerequisites
- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **PostgreSQL**: Running locally or via Docker
- **Redis**: Running locally or via Docker

#### Step 1: Start Databases via Docker (Recommended)
You can start just PostgreSQL and Redis using docker compose:
```bash
docker-compose up -d postgres redis
```

#### Step 2: Install Workspace Dependencies
```bash
npm install
```

#### Step 3: Run Database Migrations & Seed
```bash
# Generate Prisma Client & apply database migrations
npm run db:migrate

# Seed database with initial categories and admin accounts
npm run db:seed
```

#### Step 4: Start Development Servers
```bash
npm run dev
```

Turborepo will spin up the backend and frontend in parallel:
- **Client (Vite SPA)**: `http://localhost:5173`
- **Server (Express API)**: `http://localhost:4000`

---

## 🔑 Default Credentials & Roles

When you run `npm run db:seed` or the initial Docker bootstrap, the following demo accounts are created:

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Super Admin** | `admin@toystore.com` *(or `SEED_ADMIN_EMAIL`)* | `AdminPassword123!` *(or `SEED_ADMIN_PASSWORD`)* | Full System Access, 2FA Management, Security Settings, User Audits |
| **Cashier** | `cashier@toystore.com` | `123456` | POS Checkout Terminal, Barcode Scanning, Bill History |

> [!IMPORTANT]
> Change the default passwords immediately upon deploying to any production or publicly accessible environment.

---

## 📜 Available Scripts

Run from the root directory:

| Command | Action |
|---|---|
| `npm run dev` | Starts all apps in parallel using Turborepo (`apps/server` + `apps/client`) |
| `npm run build` | Builds `@toystore/shared`, `@toystore/server`, and `@toystore/client` for production |
| `npm run lint` | Runs ESLint across all apps and packages |
| `npm run type-check` | Performs TypeScript static type verification without emitting files |
| `npm run db:migrate` | Runs Prisma database migrations against the configured `DATABASE_URL` |
| `npm run db:seed` | Populates the database with initial categories, products, and admin credentials |

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/login` - Authenticate user & receive access token + HTTP-only refresh cookie.
- `POST /api/auth/refresh` - Refresh an expired access token using the refresh cookie.
- `POST /api/auth/logout` - Invalidate user session.
- `GET /api/auth/me` - Fetch profile of currently authenticated user.
- `PATCH /api/auth/change-password` - Update user account password.
- `POST /api/auth/2fa/setup` - Generate TOTP secret and QR code URI *(Super Admin)*.
- `POST /api/auth/2fa/confirm` - Verify and activate 2FA with 6-digit TOTP code.
- `POST /api/auth/2fa/disable` - Disable 2FA protection.

### 🛒 Point of Sale & Billing (`/api/pos`)
- `POST /api/pos/scan` - Ultra-fast barcode/QR verification & product lookup (<50ms).
- `POST /api/pos/bills` - Transactional checkout with atomic stock decrement and analytics update.
- `GET /api/pos/bills` - List sales history with pagination and cashier filters.
- `GET /api/pos/bills/:id` - Fetch detailed invoice data with line items.
- `POST /api/pos/bills/:id/void` - Two-man rule voiding requiring supervisor credentials; restores stock.

### 📦 Product & Inventory (`/api/products`)
- `GET /api/products` - List and search products (supports `search`, `categoryId`, `lowStock`, `outOfStock`).
- `GET /api/products/:id` - Get single product details including QR and barcode URLs.
- `POST /api/products` - Create product with automatic QR and barcode generation *(Admin)*.
- `PATCH /api/products/:id` - Update product details *(Admin)*.
- `DELETE /api/products/:id` - Soft-delete product *(Admin)*.
- `PATCH /api/products/:id/stock` - Manual stock adjustment with reason tracking *(Admin)*.

### 🏷️ Categories (`/api/categories`)
- `GET /api/categories` - Fetch hierarchical category tree.
- `POST /api/categories` - Create new category *(Admin)*.

### 🚨 Stock Alerts (`/api/alerts`)
- `GET /api/alerts` - List active low-stock and out-of-stock alerts.
- `PATCH /api/alerts/:id/acknowledge` - Mark stock alert as acknowledged.

### 📈 Analytics (`/api/analytics`)
- `GET /api/analytics/dashboard` - Daily summary KPI cards (revenue, bill count, units sold).
- `GET /api/analytics/top-products` - Top-performing products over the last 30 days.
- `GET /api/analytics/dead-stock` - Inventory items with zero sales velocity.

---

## 🛡️ Security & Production Hardening

The application has been audited and hardened against standard retail attack vectors:

1. **TOCTOU & Race Condition Immunity**: Stock decrement is executed natively by PostgreSQL via Prisma atomic operations (`decrement: item.quantity`), preventing inventory oversell under concurrent cashier checkouts.
2. **Duplicate Bill Item Protection**: Scanned payloads are aggregated in memory before database submission, preventing duplicate line items and corrupted counts.
3. **QR Code Anti-Tamper Signatures**: Barcode and QR payloads include an HMAC-SHA256 signature calculated from a secure server secret. Fraudulently printed labels are immediately rejected.
4. **Brute-Force & Rate Limiting**: Redis-backed rate limiting enforces strict thresholds on login attempts (5/15min) and scan lookups (60/min).
5. **Supervisor Bill Voiding Workflow**: Cashiers cannot void bills without an admin/super_admin email, password, and active TOTP code.
6. **Graceful Server Shutdown**: Handles `SIGTERM` and `SIGINT` cleanly by closing HTTP listeners, waiting for pending database transactions, disconnecting Prisma, and safely closing Redis connections.

---

## 💾 Disaster Recovery & Backups

The system implements a **dual-layer disaster recovery strategy** (detailed in [BACKUPS.md](file:///Users/abdulsameer/Desktop/store-pos--main/BACKUPS.md)):

```mermaid
flowchart LR
    A[Production Database] -->|Continuous WAL Snapshots| B[Layer 1: Neon PITR]
    A -->|Nightly 01:00 UTC GitHub Action| C[Layer 2: pg_dump gzip]
    C -->|Encrypted Off-Site Storage| D[Backblaze B2 Bucket]
```

1. **Layer 1: Neon Point-in-Time Recovery (PITR)**:
   - Continuous WAL archiving allowing point-in-time branch restores down to any second within the retention window.
2. **Layer 2: Nightly Off-Site Backups (`.github/workflows/backup.yml`)**:
   - Automated GitHub Actions cron job dumps the PostgreSQL database via `pg_dump`, compresses it with `gzip`, and stores it securely in a Backblaze B2 private bucket.

---

## 🤝 Contributing & License

Contributions are welcome! Please follow these guidelines:
1. Fork the repository and create a feature branch (`git checkout -b feature/amazing-feature`).
2. Run `npm run type-check` and `npm run lint` before committing.
3. Commit changes with clear, descriptive messages.
4. Submit a Pull Request.

This project is licensed under the [MIT License](LICENSE).
