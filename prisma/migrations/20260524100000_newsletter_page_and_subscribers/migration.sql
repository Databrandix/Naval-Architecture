-- Additive — two new tables, no impact on existing rows.

CREATE TABLE "newsletter_page" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroTitle" TEXT NOT NULL,
    "heroSubtitle" TEXT,
    "heroOverline" TEXT,
    "heroImageUrl" TEXT NOT NULL,
    "heroImagePublicId" TEXT,
    "heroImageVerticalPercent" INTEGER NOT NULL DEFAULT 50,
    "introBody" TEXT NOT NULL,
    "advantagesOverline" TEXT,
    "advantagesHeading" TEXT NOT NULL,
    "advantages" JSONB NOT NULL,
    "ctaHeading" TEXT NOT NULL,
    "ctaBody" TEXT,
    "ctaButtonLabel" TEXT NOT NULL,
    "emailPlaceholder" TEXT NOT NULL,
    "privacyNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_page_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "newsletter_subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "newsletter_subscriber_email_key" ON "newsletter_subscriber"("email");
CREATE INDEX "newsletter_subscriber_createdAt_idx" ON "newsletter_subscriber"("createdAt");
CREATE INDEX "newsletter_subscriber_status_createdAt_idx" ON "newsletter_subscriber"("status", "createdAt");

-- Seed the singleton with a sensible default so /newsletter renders
-- on first deploy without a manual admin step. Chair edits via
-- /admin/newsletter afterwards.
INSERT INTO "newsletter_page" (
  "id", "heroTitle", "heroSubtitle", "heroOverline",
  "heroImageUrl", "heroImageVerticalPercent",
  "introBody",
  "advantagesOverline", "advantagesHeading", "advantages",
  "ctaHeading", "ctaBody", "ctaButtonLabel", "emailPlaceholder",
  "privacyNote",
  "updatedAt"
) VALUES (
  'singleton',
  'Stay in the Loop',
  'Department of Mechanical Engineering',
  'Newsletter',
  '/assets/site-school-1024x576.webp',
  50,
  'Get monthly updates on departmental events, research highlights, admission notices, student achievements, and upcoming workshops — straight to your inbox.',
  'Why Subscribe',
  'What You''ll Get',
  '[
    {"iconName":"Newspaper","title":"Latest News","description":"Departmental announcements and milestone coverage before they hit the website."},
    {"iconName":"CalendarDays","title":"Events & Workshops","description":"Early access to seminar registrations, industrial visits, and project exhibitions."},
    {"iconName":"GraduationCap","title":"Admission Updates","description":"Notice releases, application deadlines, and waiver opportunities, delivered first."},
    {"iconName":"Trophy","title":"Student Achievements","description":"Read about competition wins, research publications, and convocation highlights."},
    {"iconName":"Lightbulb","title":"Research Spotlights","description":"Faculty research focus areas, lab updates, and new collaboration opportunities."},
    {"iconName":"ShieldCheck","title":"No Spam, Ever","description":"One monthly digest. Unsubscribe link in every email — your inbox stays clean."}
  ]'::jsonb,
  'Join the Newsletter',
  'Drop your email below and you''re in. We only use it to send the monthly digest.',
  'Subscribe',
  'you@example.com',
  'We''ll never share your email with anyone. See our Privacy Statement.',
  NOW()
);
