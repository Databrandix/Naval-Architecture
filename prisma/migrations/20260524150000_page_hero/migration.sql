-- Generic per-page hero CMS. One row per public page that previously
-- had its hero hardcoded; seeded with the exact title / overline /
-- image / vertical-percent that lived in the page file so first
-- deploy is byte-equivalent. Chair edits via /admin/page-heroes.

CREATE TABLE "page_hero" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "pageLabel" TEXT NOT NULL,
    "publicPath" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL,
    "heroSubtitle" TEXT,
    "heroOverline" TEXT,
    "heroImageUrl" TEXT NOT NULL,
    "heroImagePublicId" TEXT,
    "heroImageVerticalPercent" INTEGER NOT NULL DEFAULT 50,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_hero_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "page_hero_pageKey_key" ON "page_hero"("pageKey");

-- Seed every page that previously had a hardcoded hero. Hand-picked
-- prefixed ids (seed_pageHero_*) so the migration is repeatable / re-
-- runnable in lower envs without sequence drift; admin edits later
-- preserve the id.
INSERT INTO "page_hero" ("id", "pageKey", "pageLabel", "publicPath", "heroTitle", "heroOverline", "heroImageUrl", "heroImageVerticalPercent", "updatedAt") VALUES
  ('seed_pageHero_faculty_member',          'faculty-member',          'Faculty Members List', '/faculty-member',          'Faculty Members',             'Department',       '/assets/faculty-hero.webp',         0,  NOW()),
  ('seed_pageHero_transport_service',       'transport-service',       'Transport Service',    '/transport-service',       'Transport Service',           'Campus Services',  '/assets/transport/dsc01671.webp',   50, NOW()),
  ('seed_pageHero_research',                'research',                'Research Publications','/research',                'Research Publications',       'Academic Excellence', '/assets/site-school-1024x576.webp', 50, NOW()),
  ('seed_pageHero_gallery',                 'gallery',                 'Photo Gallery',        '/gallery',                 'Photo Gallery',               'Campus Life',      '/assets/mission-vision-hero.webp',  3,  NOW()),
  ('seed_pageHero_admission_tuition_fees',  'admission-tuition-fees',  'Tuition Fees',         '/admission/tuition-fees',  'Tuition Fees',                'Admission',        '/assets/admission-hero.webp',       0,  NOW()),
  ('seed_pageHero_admission_transfer',      'admission-transfer-credits', 'Transfer Credits',  '/admission/transfer-credits', 'Transfer Credits',         'Admission',        '/assets/admission-hero.webp',       0,  NOW()),
  ('seed_pageHero_admission_requirements',  'admission-requirements',  'Admission Requirements','/admission/requirements', 'Admission Requirements',      'Admission',        '/assets/admission-hero.webp',       0,  NOW()),
  ('seed_pageHero_admission_waiver',        'admission-waiver-scholarship', 'Waiver & Scholarship', '/admission/waiver-scholarship', 'Waiver & Scholarship', 'Admission',     '/assets/admission-hero.webp',       0,  NOW()),
  ('seed_pageHero_admission_prospectus',    'admission-prospectus',    'Prospectus',           '/admission/prospectus',    'Prospectus',                  'Admission',        '/assets/admission-hero.webp',       0,  NOW()),
  ('seed_pageHero_admission_notice',        'admission-notice',        'Admission Notice',     '/admission/notice',        'Admission Notice',            'Admission',        '/assets/admission-hero.webp',       0,  NOW()),
  ('seed_pageHero_ss_events',               'student-society-events',  'Events List',          '/student-society/events',  'Events',                      'Student',          '/assets/events-hero.webp',          50, NOW()),
  ('seed_pageHero_ss_alumni',               'student-society-alumni',  'Alumni',               '/student-society/alumni',  'Our Alumni',                  'Student Society',  '/assets/alumni-hero.webp',          50, NOW()),
  ('seed_pageHero_ss_club_list',            'student-society-club-list', 'Student Clubs',      '/student-society/club-list', 'Student Clubs',             'Student Society',  '/assets/club-list-hero.webp',       50, NOW()),
  ('seed_pageHero_ss_faq',                  'student-society-faq',     'FAQ',                  '/student-society/faq',     'Frequently Asked Questions',  'Student Society',  '/assets/faq-hero.webp',             35, NOW()),
  ('seed_pageHero_ss_notice_board',         'student-society-notice-board', 'Notice Board',    '/student-society/notice-board', 'Notice Board',           'Student',          '/assets/notice-board-hero.webp',    50, NOW()),
  ('seed_pageHero_ss_syllabus',             'student-society-syllabus','Syllabus',             '/student-society/syllabus','Syllabus',                    'Student',          '/assets/syllabus-hero.webp',        50, NOW()),
  ('seed_pageHero_ss_visitor',              'student-society-visitor', 'Visitors',             '/student-society/visitor', 'Visitors',                    'Student Society',  '/assets/mission-vision-hero.webp',  3,  NOW());
