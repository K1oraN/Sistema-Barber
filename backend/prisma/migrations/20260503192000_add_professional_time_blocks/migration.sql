-- CreateTable
CREATE TABLE "professional_time_blocks" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_time_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "professional_time_blocks_professionalId_date_startTime_idx" ON "professional_time_blocks"("professionalId", "date", "startTime");

-- AddForeignKey
ALTER TABLE "professional_time_blocks" ADD CONSTRAINT "professional_time_blocks_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
