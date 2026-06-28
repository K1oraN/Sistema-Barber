CREATE TYPE "ClientPlanStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELED');

CREATE TYPE "ProductOrderStatus" AS ENUM (
  'RESERVED',
  'PRE_ORDER_REQUESTED',
  'UNDER_REVIEW',
  'ORDERED',
  'AVAILABLE_FOR_PICKUP',
  'DELIVERED',
  'CANCELED'
);

CREATE TYPE "ProductOrderType" AS ENUM ('RESERVATION', 'PRE_ORDER');

CREATE TYPE "RewardType" AS ENUM ('SERVICE', 'PRODUCT', 'DISCOUNT', 'GIFT');

ALTER TABLE "plans"
  ADD COLUMN "highlighted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "products"
  RENAME COLUMN "quantity" TO "stock";

ALTER TABLE "products"
  RENAME COLUMN "salePrice" TO "price";

ALTER TABLE "products"
  ADD COLUMN "reservedStock" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Geral',
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "allowPreOrder" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "products"
  ADD CONSTRAINT "products_stock_non_negative_check" CHECK ("stock" >= 0),
  ADD CONSTRAINT "products_reserved_stock_non_negative_check" CHECK ("reservedStock" >= 0),
  ADD CONSTRAINT "products_reserved_stock_lte_stock_check" CHECK ("reservedStock" <= "stock");

CREATE INDEX "products_category_idx" ON "products"("category");

CREATE TABLE "client_plans" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" "ClientPlanStatus" NOT NULL DEFAULT 'PENDING',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'AWAITING_CONFIRMATION',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "client_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "client_plans_clientId_idx" ON "client_plans"("clientId");
CREATE INDEX "client_plans_planId_idx" ON "client_plans"("planId");
CREATE INDEX "client_plans_status_idx" ON "client_plans"("status");
CREATE UNIQUE INDEX "client_plans_one_active_per_client_idx" ON "client_plans"("clientId") WHERE "status" = 'ACTIVE';

CREATE TABLE "product_orders" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "status" "ProductOrderStatus" NOT NULL DEFAULT 'RESERVED',
  "orderType" "ProductOrderType" NOT NULL,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentMethod" "PaymentMethod",
  "total" DECIMAL(10,2) NOT NULL,
  "notes" TEXT,
  "receiptUrl" TEXT,
  "receiptFileName" TEXT,
  "receiptUploadedAt" TIMESTAMP(3),
  "paymentConfirmedById" TEXT,
  "paymentConfirmedAt" TIMESTAMP(3),
  "deliveredById" TEXT,
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_orders_clientId_idx" ON "product_orders"("clientId");
CREATE INDEX "product_orders_status_idx" ON "product_orders"("status");
CREATE INDEX "product_orders_orderType_idx" ON "product_orders"("orderType");

CREATE TABLE "product_order_items" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "subtotal" DECIMAL(10,2) NOT NULL,

  CONSTRAINT "product_order_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_order_items_orderId_idx" ON "product_order_items"("orderId");
CREATE INDEX "product_order_items_productId_idx" ON "product_order_items"("productId");

ALTER TABLE "rewards"
  ADD COLUMN "rewardType" "RewardType" NOT NULL DEFAULT 'SERVICE',
  ADD COLUMN "serviceId" TEXT,
  ADD COLUMN "productId" TEXT,
  ADD COLUMN "discountValue" DECIMAL(10,2);

CREATE INDEX "rewards_rewardType_idx" ON "rewards"("rewardType");
CREATE INDEX "rewards_serviceId_idx" ON "rewards"("serviceId");
CREATE INDEX "rewards_productId_idx" ON "rewards"("productId");

ALTER TABLE "reward_redemptions"
  ADD COLUMN "productOrderId" TEXT,
  ADD COLUMN "code" TEXT;

CREATE UNIQUE INDEX "reward_redemptions_productOrderId_key" ON "reward_redemptions"("productOrderId");

ALTER TABLE "client_plans" ADD CONSTRAINT "client_plans_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_plans" ADD CONSTRAINT "client_plans_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_orders" ADD CONSTRAINT "product_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_order_items" ADD CONSTRAINT "product_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "product_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_order_items" ADD CONSTRAINT "product_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "rewards" ADD CONSTRAINT "rewards_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_productOrderId_fkey" FOREIGN KEY ("productOrderId") REFERENCES "product_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
