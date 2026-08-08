-- CreateTable
CREATE TABLE "lab_facility_landing" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroTitle" TEXT NOT NULL,
    "heroOverline" TEXT,
    "heroImageUrl" TEXT NOT NULL,
    "heroImagePublicId" TEXT,
    "heroImagePosition" TEXT,
    "introBody" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_facility_landing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "heroImagePublicId" TEXT,
    "gallery" TEXT[],
    "galleryPublicIds" TEXT[],
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laboratory_facility_landing" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroTitle" TEXT NOT NULL,
    "heroOverline" TEXT,
    "heroImageUrl" TEXT NOT NULL,
    "heroImagePublicId" TEXT,
    "heroImagePosition" TEXT,
    "introBody" TEXT NOT NULL,
    "featuresOverline" TEXT,
    "featuresHeading" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laboratory_facility_landing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laboratory_lab" (
    "id" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keyLabel" TEXT NOT NULL,
    "keyItems" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laboratory_lab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_slug_key" ON "lab"("slug");

-- CreateIndex
CREATE INDEX "lab_displayOrder_idx" ON "lab"("displayOrder");

-- CreateIndex
CREATE INDEX "laboratory_lab_displayOrder_idx" ON "laboratory_lab"("displayOrder");
