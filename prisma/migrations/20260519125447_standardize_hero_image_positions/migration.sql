-- Phase 13 — Standardize hero image vertical position to Int 0-100
--
-- Three-phase migration in one file, applied atomically:
--   1. ADD new Int columns (NOT NULL DEFAULT 50)
--   2. UPDATE: data fill from the existing String columns (parsing
--      'center top' → 0, 'center bottom' → 100, 'center N%' → N,
--      anything else / NULL → keep the 50 default)
--   3. DROP the old String columns
--
-- Verified before run: every existing String value (8 singletons +
-- 2 Faculty Dean/Head rows) is one of the parseable forms.

-- ─── 1. ADD new Int columns ─────────────────────────────────────

ALTER TABLE "department_identity"
  ADD COLUMN "heroImage1VerticalPercent" INT NOT NULL DEFAULT 50,
  ADD COLUMN "heroImage2VerticalPercent" INT NOT NULL DEFAULT 50,
  ADD COLUMN "heroImage3VerticalPercent" INT NOT NULL DEFAULT 50;

ALTER TABLE "faculty"
  ADD COLUMN "messageHeroImageVerticalPercent" INT NOT NULL DEFAULT 50;

ALTER TABLE "about_overview"
  ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;

ALTER TABLE "about_mission_vision"
  ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;

ALTER TABLE "about_mecha_club"
  ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;

ALTER TABLE "lab_facility_landing"
  ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;

ALTER TABLE "laboratory_facility_landing"
  ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;

ALTER TABLE "contact_page_content"
  ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;

ALTER TABLE "journey_cta_content"
  ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;

-- ─── 2. UPDATE — parse existing String values to Int ────────────

-- Faculty Dean/Head (only rows with messageHeroImagePosition set)
UPDATE "faculty"
SET "messageHeroImageVerticalPercent" = CASE
  WHEN "messageHeroImagePosition" = 'center top'    THEN 0
  WHEN "messageHeroImagePosition" = 'center bottom' THEN 100
  WHEN "messageHeroImagePosition" = 'center center' THEN 50
  WHEN "messageHeroImagePosition" ~ '^center\s+\d+%$' THEN
    GREATEST(0, LEAST(100,
      CAST(REGEXP_REPLACE("messageHeroImagePosition", '[^0-9]', '', 'g') AS INT)
    ))
  ELSE 50
END
WHERE "messageHeroImagePosition" IS NOT NULL;

-- About / Lab / Contact / Journey singletons (one row each, id='singleton')
UPDATE "about_overview"              SET "heroImageVerticalPercent" = 3   WHERE id = 'singleton';
UPDATE "about_mission_vision"        SET "heroImageVerticalPercent" = 3   WHERE id = 'singleton';
UPDATE "about_mecha_club"            SET "heroImageVerticalPercent" = 45  WHERE id = 'singleton';
UPDATE "lab_facility_landing"        SET "heroImageVerticalPercent" = 25  WHERE id = 'singleton';
UPDATE "laboratory_facility_landing" SET "heroImageVerticalPercent" = 25  WHERE id = 'singleton';
UPDATE "contact_page_content"        SET "heroImageVerticalPercent" = 30  WHERE id = 'singleton';
UPDATE "journey_cta_content"         SET "heroImageVerticalPercent" = 50  WHERE id = 'singleton';

-- ─── 3. DROP old String columns ─────────────────────────────────

ALTER TABLE "faculty"                     DROP COLUMN "messageHeroImagePosition";
ALTER TABLE "about_overview"              DROP COLUMN "heroImagePosition";
ALTER TABLE "about_mission_vision"        DROP COLUMN "heroImagePosition";
ALTER TABLE "about_mecha_club"            DROP COLUMN "heroImagePosition";
ALTER TABLE "lab_facility_landing"        DROP COLUMN "heroImagePosition";
ALTER TABLE "laboratory_facility_landing" DROP COLUMN "heroImagePosition";
ALTER TABLE "contact_page_content"        DROP COLUMN "heroImagePosition";
ALTER TABLE "journey_cta_content"         DROP COLUMN "heroImagePosition";
