-- CreateTable
CREATE TABLE "admission_requirements" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "intro" TEXT NOT NULL,
    "undergraduateRequirements" JSONB NOT NULL,
    "additionalNotes" JSONB NOT NULL,
    "diplomaRequirements" JSONB NOT NULL,
    "combinedGpaBody" TEXT NOT NULL,
    "diplomaQuickCriteria" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_fee_structure" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "introOverline" TEXT NOT NULL,
    "introHeading" TEXT NOT NULL DEFAULT 'Tuition Fee Structure',
    "introBody" TEXT NOT NULL,
    "overviewStats" JSONB NOT NULL,
    "shifts" JSONB NOT NULL,
    "policies" JSONB NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_fee_structure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "program_fee_structure_programId_key" ON "program_fee_structure"("programId");

-- CreateIndex
CREATE INDEX "program_fee_structure_displayOrder_idx" ON "program_fee_structure"("displayOrder");

-- AddForeignKey
ALTER TABLE "program_fee_structure" ADD CONSTRAINT "program_fee_structure_programId_fkey" FOREIGN KEY ("programId") REFERENCES "program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
