-- CreateTable
CREATE TABLE "service_charter_entry" (
    "id" TEXT NOT NULL,
    "serial" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "responsible" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_charter_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_charter_entry_displayOrder_idx" ON "service_charter_entry"("displayOrder");

