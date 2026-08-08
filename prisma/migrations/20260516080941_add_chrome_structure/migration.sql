-- AlterTable
ALTER TABLE "department_identity" ADD COLUMN     "heroImage1Alt" TEXT,
ADD COLUMN     "heroImage2Alt" TEXT,
ADD COLUMN     "heroImage3Alt" TEXT;

-- AlterTable
ALTER TABLE "program" ADD COLUMN     "ctaHref" TEXT;

-- AlterTable
ALTER TABLE "research_area" ADD COLUMN     "featuredCtaHref" TEXT,
ADD COLUMN     "featuredDescription" TEXT,
ADD COLUMN     "featuredHeading" TEXT,
ADD COLUMN     "featuredImagePublicId" TEXT,
ADD COLUMN     "featuredImageUrl" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "top_link" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "href" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "top_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quick_access_item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "href" TEXT,
    "iconName" TEXT NOT NULL,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_access_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main_nav_group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "href" TEXT,
    "hasDropdown" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "main_nav_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main_nav_item" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "main_nav_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_useful_link" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "href" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_useful_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_get_in_touch_link" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "href" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_get_in_touch_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_quick_link" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "href" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_quick_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_legal_link" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "href" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_legal_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "top_link_displayOrder_idx" ON "top_link"("displayOrder");

-- CreateIndex
CREATE INDEX "quick_access_item_displayOrder_idx" ON "quick_access_item"("displayOrder");

-- CreateIndex
CREATE INDEX "main_nav_group_displayOrder_idx" ON "main_nav_group"("displayOrder");

-- CreateIndex
CREATE INDEX "main_nav_item_groupId_displayOrder_idx" ON "main_nav_item"("groupId", "displayOrder");

-- CreateIndex
CREATE INDEX "footer_useful_link_displayOrder_idx" ON "footer_useful_link"("displayOrder");

-- CreateIndex
CREATE INDEX "footer_get_in_touch_link_displayOrder_idx" ON "footer_get_in_touch_link"("displayOrder");

-- CreateIndex
CREATE INDEX "footer_quick_link_displayOrder_idx" ON "footer_quick_link"("displayOrder");

-- CreateIndex
CREATE INDEX "footer_legal_link_displayOrder_idx" ON "footer_legal_link"("displayOrder");

-- CreateIndex
CREATE INDEX "research_area_isFeatured_idx" ON "research_area"("isFeatured");

-- AddForeignKey
ALTER TABLE "main_nav_item" ADD CONSTRAINT "main_nav_item_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "main_nav_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
