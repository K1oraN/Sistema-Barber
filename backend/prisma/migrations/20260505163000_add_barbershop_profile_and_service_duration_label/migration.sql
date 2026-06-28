ALTER TABLE "services" ADD COLUMN "durationLabel" TEXT;

CREATE TABLE "barbershop_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsappUrl" TEXT NOT NULL,
    "instagramUrl" TEXT NOT NULL,
    "openingHours" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barbershop_profiles_pkey" PRIMARY KEY ("id")
);
