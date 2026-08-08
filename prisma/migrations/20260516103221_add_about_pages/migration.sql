-- CreateTable
CREATE TABLE "about_overview" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroTitle" TEXT NOT NULL,
    "heroSubtitle" TEXT,
    "heroOverline" TEXT,
    "heroImageUrl" TEXT NOT NULL,
    "heroImagePublicId" TEXT,
    "heroImagePosition" TEXT,
    "paragraphs" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_overview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_mission_vision" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroTitle" TEXT NOT NULL,
    "heroOverline" TEXT,
    "heroImageUrl" TEXT NOT NULL,
    "heroImagePublicId" TEXT,
    "heroImagePosition" TEXT,
    "missionOverline" TEXT,
    "missionHeading" TEXT NOT NULL,
    "missionBody" TEXT NOT NULL,
    "visionOverline" TEXT,
    "visionHeading" TEXT NOT NULL,
    "visionBody" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_mission_vision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_mecha_club" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroTitle" TEXT NOT NULL,
    "heroOverline" TEXT,
    "heroImageUrl" TEXT NOT NULL,
    "heroImagePublicId" TEXT,
    "heroImagePosition" TEXT,
    "introOverline" TEXT,
    "introHeading" TEXT NOT NULL,
    "introBody1" TEXT NOT NULL,
    "introBody2" TEXT NOT NULL,
    "introImageUrl" TEXT NOT NULL,
    "introImagePublicId" TEXT,
    "stats" JSONB NOT NULL,
    "activitiesOverline" TEXT,
    "activitiesHeading" TEXT NOT NULL,
    "activities" JSONB NOT NULL,
    "networkOverline" TEXT,
    "networkHeading" TEXT NOT NULL,
    "networkBody" TEXT NOT NULL,
    "networkPrimaryCtaLabel" TEXT NOT NULL,
    "networkPrimaryCtaHref" TEXT NOT NULL,
    "networkSecondaryCtaLabel" TEXT,
    "networkSecondaryCtaHref" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_mecha_club_pkey" PRIMARY KEY ("id")
);
