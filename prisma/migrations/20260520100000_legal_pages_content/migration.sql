-- Phase 17 — LegalPagesContent singleton (Privacy Policy + Terms & Conditions)

CREATE TABLE "legal_pages_content" (
    "id" TEXT NOT NULL DEFAULT 'singleton',

    "privacyHeroTitle" TEXT NOT NULL DEFAULT 'Privacy Policy',
    "privacyHeroOverline" TEXT DEFAULT 'Legal',
    "privacyHeroImageUrl" TEXT NOT NULL,
    "privacyHeroImagePublicId" TEXT,
    "privacyHeroImageVerticalPercent" INTEGER NOT NULL DEFAULT 50,
    "privacyBody" TEXT NOT NULL,

    "termsHeroTitle" TEXT NOT NULL DEFAULT 'Terms & Conditions',
    "termsHeroOverline" TEXT DEFAULT 'Legal',
    "termsHeroImageUrl" TEXT NOT NULL,
    "termsHeroImagePublicId" TEXT,
    "termsHeroImageVerticalPercent" INTEGER NOT NULL DEFAULT 50,
    "termsBody" TEXT NOT NULL,

    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_pages_content_pkey" PRIMARY KEY ("id")
);
