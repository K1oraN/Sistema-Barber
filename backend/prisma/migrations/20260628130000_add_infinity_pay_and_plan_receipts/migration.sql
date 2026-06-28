ALTER TABLE "payments"
  ADD COLUMN "infinityPayUrl" TEXT;

ALTER TABLE "client_plans"
  ADD COLUMN "infinityPayUrl" TEXT,
  ADD COLUMN "receiptUrl" TEXT,
  ADD COLUMN "receiptFileName" TEXT,
  ADD COLUMN "receiptUploadedAt" TIMESTAMP(3),
  ADD COLUMN "confirmedById" TEXT,
  ADD COLUMN "confirmedAt" TIMESTAMP(3);

ALTER TABLE "product_orders"
  ADD COLUMN "infinityPayUrl" TEXT;
