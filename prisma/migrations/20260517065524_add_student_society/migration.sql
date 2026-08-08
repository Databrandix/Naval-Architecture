-- CreateTable
CREATE TABLE "alumni" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "photoUrl" TEXT,
    "photoPublicId" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "affiliation" TEXT,
    "photoUrl" TEXT NOT NULL,
    "photoPublicId" TEXT,
    "quote" JSONB NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_paper" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "date" TEXT,
    "publicationYear" INTEGER,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_route" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "busNumber" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "departureTimes" TEXT[],
    "returnTimes" TEXT[],
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bus_route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabus" (
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
    "summary" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "syllabus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_landing" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "introBody" TEXT NOT NULL,
    "bannerHeading" TEXT NOT NULL,
    "bannerBody" TEXT NOT NULL,
    "instructions" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_landing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alumni_slug_key" ON "alumni"("slug");

-- CreateIndex
CREATE INDEX "alumni_displayOrder_idx" ON "alumni"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "club_slug_key" ON "club"("slug");

-- CreateIndex
CREATE INDEX "club_displayOrder_idx" ON "club"("displayOrder");

-- CreateIndex
CREATE INDEX "faq_displayOrder_idx" ON "faq"("displayOrder");

-- CreateIndex
CREATE INDEX "faq_category_idx" ON "faq"("category");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_slug_key" ON "visitor"("slug");

-- CreateIndex
CREATE INDEX "visitor_displayOrder_idx" ON "visitor"("displayOrder");

-- CreateIndex
CREATE INDEX "research_paper_displayOrder_idx" ON "research_paper"("displayOrder");

-- CreateIndex
CREATE INDEX "research_paper_publicationYear_idx" ON "research_paper"("publicationYear");

-- CreateIndex
CREATE UNIQUE INDEX "bus_route_slug_key" ON "bus_route"("slug");

-- CreateIndex
CREATE INDEX "bus_route_displayOrder_idx" ON "bus_route"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "syllabus_slug_key" ON "syllabus"("slug");

-- CreateIndex
CREATE INDEX "syllabus_displayOrder_idx" ON "syllabus"("displayOrder");
