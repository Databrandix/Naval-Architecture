-- CreateEnum
CREATE TYPE "FacultyType" AS ENUM ('leadership', 'full_time', 'part_time');

-- CreateTable
CREATE TABLE "faculty" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "secondaryTitle" TEXT,
    "badge" TEXT,
    "type" "FacultyType" NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "photoUrl" TEXT,
    "photoPublicId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "suId" TEXT,
    "personalInfo" JSONB,
    "academicQualification" JSONB,
    "trainingExperience" JSONB,
    "teachingArea" JSONB,
    "publications" JSONB,
    "research" JSONB,
    "awards" JSONB,
    "membership" JSONB,
    "previousEmployment" JSONB,
    "isDean" BOOLEAN NOT NULL DEFAULT false,
    "isHead" BOOLEAN NOT NULL DEFAULT false,
    "messageOverline" TEXT,
    "messageHeading" TEXT,
    "messageParagraphs" TEXT[],
    "messagePhotoUrl" TEXT,
    "messagePhotoPublicId" TEXT,
    "messageTitleLine1" TEXT,
    "messageTitleLine2" TEXT,
    "messageHeroImageUrl" TEXT,
    "messageHeroImagePublicId" TEXT,
    "messageHeroImagePosition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faculty_slug_key" ON "faculty"("slug");

-- CreateIndex
CREATE INDEX "faculty_type_displayOrder_idx" ON "faculty"("type", "displayOrder");

-- CreateIndex
CREATE INDEX "faculty_isDean_idx" ON "faculty"("isDean");

-- CreateIndex
CREATE INDEX "faculty_isHead_idx" ON "faculty"("isHead");
