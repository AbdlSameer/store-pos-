-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'cashier');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('none', 'flat', 'percent');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'card', 'upi', 'other');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'pending', 'refunded');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('low_stock', 'out_of_stock');

-- CreateEnum
CREATE TYPE "SaleMode" AS ENUM ('retail', 'wholesale');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'cashier',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sku" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category_id" UUID NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "wholesale_price" DECIMAL(10,2),
    "cost_price" DECIMAL(10,2),
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "image_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "qr_payload" TEXT NOT NULL,
    "qr_image_url" TEXT NOT NULL,
    "barcode_payload" VARCHAR(100) NOT NULL,
    "barcode_image_url" TEXT NOT NULL,
    "hmac_signature" VARCHAR(255) NOT NULL,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "regenerated_at" TIMESTAMPTZ,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bill_number" VARCHAR(20) NOT NULL,
    "cashier_id" UUID NOT NULL,
    "customer_name" VARCHAR(100),
    "customer_phone" VARCHAR(20),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount_type" "DiscountType" NOT NULL DEFAULT 'none',
    "discount_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'paid',
    "sale_mode" "SaleMode" NOT NULL DEFAULT 'retail',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bill_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "product_sku" VARCHAR(50) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,
    "sale_mode" "SaleMode" NOT NULL DEFAULT 'retail',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "alert_type" "AlertType" NOT NULL,
    "current_quantity" INTEGER NOT NULL,
    "threshold" INTEGER NOT NULL,
    "is_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_by" UUID,
    "acknowledged_at" TIMESTAMPTZ,
    "notification_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "product_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "units_sold" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "profit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bill_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sales_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "products_quantity_idx" ON "products"("quantity");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_product_id_key" ON "qr_codes"("product_id");

-- CreateIndex
CREATE INDEX "qr_codes_barcode_payload_idx" ON "qr_codes"("barcode_payload");

-- CreateIndex
CREATE UNIQUE INDEX "bills_bill_number_key" ON "bills"("bill_number");

-- CreateIndex
CREATE INDEX "bills_bill_number_idx" ON "bills"("bill_number");

-- CreateIndex
CREATE INDEX "bills_cashier_id_idx" ON "bills"("cashier_id");

-- CreateIndex
CREATE INDEX "bills_created_at_idx" ON "bills"("created_at" DESC);

-- CreateIndex
CREATE INDEX "bills_payment_status_idx" ON "bills"("payment_status");

-- CreateIndex
CREATE INDEX "bill_items_bill_id_idx" ON "bill_items"("bill_id");

-- CreateIndex
CREATE INDEX "bill_items_product_id_idx" ON "bill_items"("product_id");

-- CreateIndex
CREATE INDEX "bill_items_created_at_idx" ON "bill_items"("created_at" DESC);

-- CreateIndex
CREATE INDEX "stock_alerts_product_id_idx" ON "stock_alerts"("product_id");

-- CreateIndex
CREATE INDEX "stock_alerts_is_acknowledged_idx" ON "stock_alerts"("is_acknowledged");

-- CreateIndex
CREATE INDEX "stock_alerts_created_at_idx" ON "stock_alerts"("created_at" DESC);

-- CreateIndex
CREATE INDEX "sales_analytics_date_idx" ON "sales_analytics"("date" DESC);

-- CreateIndex
CREATE INDEX "sales_analytics_product_id_idx" ON "sales_analytics"("product_id");

-- CreateIndex
CREATE INDEX "sales_analytics_category_id_idx" ON "sales_analytics"("category_id");

-- CreateIndex
CREATE INDEX "sales_analytics_revenue_idx" ON "sales_analytics"("revenue" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sales_analytics_date_product_id_key" ON "sales_analytics"("date", "product_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_analytics" ADD CONSTRAINT "sales_analytics_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_analytics" ADD CONSTRAINT "sales_analytics_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
