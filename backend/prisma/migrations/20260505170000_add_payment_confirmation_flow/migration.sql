ALTER TYPE "PaymentStatus" ADD VALUE 'AWAITING_CONFIRMATION';

ALTER TABLE "payments"
  ADD COLUMN "receiptUrl" TEXT,
  ADD COLUMN "receiptFileName" TEXT,
  ADD COLUMN "receiptUploadedAt" TIMESTAMP(3);
