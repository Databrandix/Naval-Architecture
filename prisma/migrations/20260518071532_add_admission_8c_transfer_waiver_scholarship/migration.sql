-- CreateTable
CREATE TABLE "admission_transfer_credits" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "intro" TEXT NOT NULL,
    "minimumGradeBullets" JSONB NOT NULL,
    "limitMaxLabel" TEXT NOT NULL DEFAULT 'Maximum Transfer Limit',
    "limitMaxValue" TEXT NOT NULL,
    "limitMaxSubtitle" TEXT NOT NULL,
    "limitFeeLabel" TEXT NOT NULL DEFAULT 'Credit Transfer Fee',
    "limitFeeValue" TEXT NOT NULL,
    "limitFeeSubtitle" TEXT NOT NULL,
    "documentsIntroText" TEXT NOT NULL,
    "documents" JSONB NOT NULL,
    "summaryKicker" TEXT NOT NULL DEFAULT 'Quick Reference',
    "summaryHeading" TEXT NOT NULL DEFAULT 'Summary of Key Constraints',
    "summaryRows" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_transfer_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waiver_scholarship_landing" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "intro" TEXT NOT NULL,
    "part1Kicker" TEXT NOT NULL DEFAULT 'Part 01',
    "part1Heading" TEXT NOT NULL DEFAULT 'Tuition Fee Waivers',
    "summaryHeading" TEXT NOT NULL DEFAULT 'Summary Table',
    "summarySubheading" TEXT NOT NULL DEFAULT 'Quick reference for all waiver categories.',
    "summaryRows" JSONB NOT NULL,
    "summaryFooterNote" TEXT NOT NULL,
    "part2Kicker" TEXT NOT NULL DEFAULT 'Part 02',
    "part2Heading" TEXT NOT NULL DEFAULT 'Merit Scholarships',
    "part2Intro" TEXT NOT NULL,
    "keyTakeawaysKicker" TEXT NOT NULL DEFAULT 'Key Takeaways',
    "keyTakeaways" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waiver_scholarship_landing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waiver_category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "note" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waiver_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" TEXT NOT NULL,
    "base" TEXT NOT NULL,
    "perfect" TEXT NOT NULL,
    "near" TEXT NOT NULL,
    "isHighlight" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waiver_category_slug_key" ON "waiver_category"("slug");

-- CreateIndex
CREATE INDEX "waiver_category_displayOrder_idx" ON "waiver_category"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "scholarship_slug_key" ON "scholarship"("slug");

-- CreateIndex
CREATE INDEX "scholarship_displayOrder_idx" ON "scholarship"("displayOrder");
