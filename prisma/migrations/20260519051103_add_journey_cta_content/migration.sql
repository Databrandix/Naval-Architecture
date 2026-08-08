-- CreateTable
CREATE TABLE "journey_cta_content" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroImageUrl" TEXT NOT NULL,
    "heroImagePublicId" TEXT,
    "heroImagePosition" TEXT,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "primaryCtaLabel" TEXT NOT NULL,
    "primaryCtaHref" TEXT NOT NULL,
    "primaryCtaExternal" BOOLEAN NOT NULL DEFAULT true,
    "secondaryCtaLabel" TEXT NOT NULL,
    "secondaryCtaHref" TEXT NOT NULL,
    "secondaryCtaExternal" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journey_cta_content_pkey" PRIMARY KEY ("id")
);
