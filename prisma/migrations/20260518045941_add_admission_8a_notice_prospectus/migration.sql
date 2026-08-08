-- CreateTable
CREATE TABLE "admission_notice" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "displayDate" TEXT,
    "headerOverline" TEXT NOT NULL DEFAULT 'Office of the Registrar',
    "bodyParagraphs" JSONB NOT NULL,
    "signatoryPreamble" TEXT,
    "signatoryName" TEXT NOT NULL,
    "signatoryDesignation" TEXT NOT NULL,
    "ccLabel" TEXT NOT NULL DEFAULT 'Copy for Kind Information (not according to seniority)',
    "ccList" JSONB NOT NULL,
    "heroImageUrl" TEXT,
    "heroImagePublicId" TEXT,
    "fileUrl" TEXT,
    "filePublicId" TEXT,
    "fileName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospectus_entry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "coverPublicId" TEXT,
    "pdfUrl" TEXT,
    "pdfPublicId" TEXT,
    "pdfFileName" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospectus_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admission_notice_slug_key" ON "admission_notice"("slug");

-- CreateIndex
CREATE INDEX "admission_notice_publishedAt_idx" ON "admission_notice"("publishedAt");

-- CreateIndex
CREATE INDEX "admission_notice_isActive_publishedAt_idx" ON "admission_notice"("isActive", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "prospectus_entry_slug_key" ON "prospectus_entry"("slug");

-- CreateIndex
CREATE INDEX "prospectus_entry_displayOrder_idx" ON "prospectus_entry"("displayOrder");

-- CreateIndex
CREATE INDEX "prospectus_entry_level_idx" ON "prospectus_entry"("level");
