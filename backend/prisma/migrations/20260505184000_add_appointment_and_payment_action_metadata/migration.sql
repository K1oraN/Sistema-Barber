ALTER TABLE "appointments"
  ADD COLUMN "isExtraSlot" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "cancelReason" TEXT,
  ADD COLUMN "canceledById" TEXT,
  ADD COLUMN "canceledAt" TIMESTAMP(3),
  ADD COLUMN "confirmedById" TEXT,
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "finishedById" TEXT,
  ADD COLUMN "finishedAt" TIMESTAMP(3);

ALTER TABLE "payments"
  ADD COLUMN "confirmedById" TEXT,
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "confirmationNote" TEXT;
