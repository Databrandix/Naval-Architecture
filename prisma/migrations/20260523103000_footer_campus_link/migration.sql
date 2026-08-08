-- New table, additive — old code never references it, safe to apply
-- before code deploys.
CREATE TABLE "footer_campus_link" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "href" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT true,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_campus_link_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "footer_campus_link_displayOrder_idx" ON "footer_campus_link"("displayOrder");

-- Seed the three chair-provided campus links so the footer renders
-- on first deploy without a manual admin step. cuid() is unavailable
-- in raw SQL, so we hand-seed deterministic ids.
INSERT INTO "footer_campus_link" ("id", "name", "href", "isExternal", "isDisabled", "displayOrder", "createdAt", "updatedAt")
VALUES
  ('seed_fcl_permanent',  'Permanent Campus',  'https://maps.app.goo.gl/ohMNbdCgJvyXdTpa6', true, false, 0, NOW(), NOW()),
  ('seed_fcl_panthapath', 'Panthapath Campus', 'https://maps.app.goo.gl/L63SDT3h777sMEH1A', true, false, 1, NOW(), NOW()),
  ('seed_fcl_mohakhali',  'Mohakhali Campus',  'https://maps.app.goo.gl/1acukaudzYupXq4BA', true, false, 2, NOW(), NOW());
