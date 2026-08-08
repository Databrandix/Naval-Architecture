-- The migration history had fallen behind schema.prisma: the department
-- layout table, a research_paper column and several index names existed in
-- the schema and in the department databases, but no migration ever created
-- them — they were pushed straight to those databases instead.
--
-- The cost lands on the next person to build a database from this repo, which
-- is exactly what starting a new department site does: the build fails on a
-- table that "obviously exists". This is the missing history, written down.

-- AlterTable
ALTER TABLE "about_department_club" RENAME CONSTRAINT "about_mecha_club_pkey" TO "about_department_club_pkey";

-- AlterTable
ALTER TABLE "department_club_application" RENAME CONSTRAINT "mecha_club_application_pkey" TO "department_club_application_pkey";

-- AlterTable
ALTER TABLE "legal_pages_content" ALTER COLUMN "privacySections" DROP DEFAULT,
ALTER COLUMN "termsSections" DROP DEFAULT;

-- AlterTable
ALTER TABLE "research_paper" ADD COLUMN     "links" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "department_layout" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "coverPublicId" TEXT,
    "pdfUrl" TEXT,
    "pdfPublicId" TEXT,
    "pdfFileName" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_layout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_layout_slug_key" ON "department_layout"("slug");

-- CreateIndex
CREATE INDEX "department_layout_displayOrder_idx" ON "department_layout"("displayOrder");

-- RenameIndex
ALTER INDEX "mecha_club_application_status_submittedAt_idx" RENAME TO "department_club_application_status_submittedAt_idx";

-- RenameIndex
ALTER INDEX "mecha_club_application_submittedAt_idx" RENAME TO "department_club_application_submittedAt_idx";

