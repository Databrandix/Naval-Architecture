-- AlterTable
ALTER TABLE "event" ADD COLUMN     "heroImagePublicId" TEXT,
ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "heroImageVerticalPercent" INTEGER NOT NULL DEFAULT 50;

