-- CreateTable
CREATE TABLE "news_landing" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroTitle" TEXT NOT NULL,
    "heroSubtitle" TEXT,
    "heroOverline" TEXT,
    "heroImageUrl" TEXT NOT NULL,
    "heroImagePublicId" TEXT,
    "heroImageVerticalPercent" INTEGER NOT NULL DEFAULT 50,
    "introBody" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_landing_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row so prod doesn't crash on first read.
INSERT INTO "news_landing" (
    "id",
    "heroTitle",
    "heroSubtitle",
    "heroOverline",
    "heroImageUrl",
    "heroImageVerticalPercent",
    "introBody",
    "updatedAt"
) VALUES (
    'singleton',
    'Latest News',
    'Department of Mechanical Engineering',
    'News',
    '/assets/site-school-1024x576.webp',
    50,
    'Stay updated with the recent breakthroughs, campus highlights, and academic achievements from the heart of our community.',
    NOW()
);
