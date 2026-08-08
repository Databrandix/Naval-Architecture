-- CreateTable
CREATE TABLE "office_location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "isDepartment" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "office_location_displayOrder_idx" ON "office_location"("displayOrder");

