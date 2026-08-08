-- CreateTable
CREATE TABLE "contact_page_content" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroTitle" TEXT NOT NULL,
    "heroOverline" TEXT,
    "heroImageUrl" TEXT NOT NULL,
    "heroImagePublicId" TEXT,
    "heroImagePosition" TEXT,
    "introBody" TEXT NOT NULL,
    "quickContactHeading" TEXT NOT NULL DEFAULT 'Quick Contact Information',
    "formHeading" TEXT NOT NULL DEFAULT 'Send Us a Message',
    "formSubheading" TEXT NOT NULL,
    "campusesHeading" TEXT NOT NULL DEFAULT 'Campus Locations',
    "responseTimeNote" TEXT NOT NULL,
    "quickContactCards" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_page_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_location" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campus_location_slug_key" ON "campus_location"("slug");

-- CreateIndex
CREATE INDEX "campus_location_displayOrder_idx" ON "campus_location"("displayOrder");
