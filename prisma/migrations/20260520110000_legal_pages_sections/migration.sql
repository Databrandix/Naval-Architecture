-- Phase 17 (continued) — switch LegalPagesContent body storage from
-- raw HTML Text columns to structured Json sections. Admin form now
-- edits prose-only fields; section headings stay distinct from
-- paragraphs, but the chair never writes HTML markup.

ALTER TABLE "legal_pages_content"
  ADD COLUMN "privacySections" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "termsSections"   JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "legal_pages_content"
  DROP COLUMN "privacyBody",
  DROP COLUMN "termsBody";
