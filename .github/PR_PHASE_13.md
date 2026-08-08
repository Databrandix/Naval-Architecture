# Phase 13 — Hero image position unification (Int 0-100 + shared slider)

Standardization phase, not a feature phase. Every hero image across the project now uses the same shape:

- **Storage**: `Int 0-100, default 50, NOT NULL` on every entity that has a hero (or three, in DepartmentIdentity's case)
- **Admin**: single shared `HeroImagePositionSlider` component (range + paired number input) — same UX everywhere
- **Renderer**: callers convert `Int → \`center {N}%\`` and pass to the existing PageShell / JourneyCTASection prop; HeroSection (homepage 3-image carousel) uses plain `<img>` with inline `objectPosition` so the DB value survives next/image's fill-mode default override

Zero feature additions, zero new dependencies, zero visual change to existing rendered positions.

---

## Decisions A–G — outcomes

| # | Decision | Outcome |
|---|---|---|
| **A** | Position storage | `Int 0-100, default 50, non-nullable` — replaces the previous `String?` CSS-fragment storage |
| **B** | Migration strategy | One migration `standardize_hero_image_positions` with hand-edited three-phase SQL: ADD new columns → UPDATE-parse old String values into new Int columns → DROP old columns. Atomic application |
| **C** | Entities without position | DepartmentIdentity gains 3 fields (one per hero image, chair's call for separate sliders). Lab + AdmissionNotice **skipped** — their hero fields are card-thumbnail context, not full-bleed banners with `object-position` |
| **D** | Shared admin component | `src/components/admin/HeroImagePositionSlider.tsx` — range slider + paired number input + helper copy; serializes to hidden Int input. Used across all 9 admin forms |
| **E** | DepartmentIdentity | 3 separate sliders (heroImage1/2/3VerticalPercent) with per-image labels |
| **F** | Faculty messageHero | Standardized same way — `messageHeroImageVerticalPercent` Int + slider in the Dean/Head conditional Card |
| **G** | Renderer consistency | Caller-converts pattern: each public page does `imagePosition={\`center ${row.heroImageVerticalPercent}%\`}` and passes the CSS string to the existing PageShell/JourneyCTASection prop. No new `<HeroImage>` wrapper. HeroSection (homepage 3 carousel) switches to plain `<img>` so DB-driven position survives next/image fill-mode default |

---

## Migration details

`prisma/migrations/20260519125447_standardize_hero_image_positions/migration.sql`

```sql
-- Phase 1 — ADD (9 entities, 11 columns)
ALTER TABLE "department_identity"        ADD COLUMN "heroImage1VerticalPercent" INT NOT NULL DEFAULT 50, ...;  -- + 2/3
ALTER TABLE "faculty"                    ADD COLUMN "messageHeroImageVerticalPercent" INT NOT NULL DEFAULT 50;
ALTER TABLE "about_overview"             ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;
ALTER TABLE "about_mission_vision"       ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;
ALTER TABLE "about_mecha_club"           ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;
ALTER TABLE "lab_facility_landing"       ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;
ALTER TABLE "laboratory_facility_landing" ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;
ALTER TABLE "contact_page_content"       ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;
ALTER TABLE "journey_cta_content"        ADD COLUMN "heroImageVerticalPercent" INT NOT NULL DEFAULT 50;

-- Phase 2 — UPDATE-parse (one CASE/regex SQL for Faculty since its 2 rows have varied values;
-- straight-value SET for the 7 singletons because each had exactly one known string)
UPDATE "faculty" SET "messageHeroImageVerticalPercent" =
  CASE "messageHeroImagePosition"
    WHEN 'center top' THEN 0
    WHEN 'center bottom' THEN 100
    WHEN 'center center' THEN 50
    WHEN "messageHeroImagePosition" ~ '^center\s+\d+%$' THEN
      GREATEST(0, LEAST(100, CAST(REGEXP_REPLACE("messageHeroImagePosition", '[^0-9]', '', 'g') AS INT)))
    ELSE 50
  END
  WHERE "messageHeroImagePosition" IS NOT NULL;

UPDATE "about_overview"              SET "heroImageVerticalPercent" = 3   WHERE id = 'singleton';
UPDATE "about_mission_vision"        SET "heroImageVerticalPercent" = 3   WHERE id = 'singleton';
UPDATE "about_mecha_club"            SET "heroImageVerticalPercent" = 45  WHERE id = 'singleton';
UPDATE "lab_facility_landing"        SET "heroImageVerticalPercent" = 25  WHERE id = 'singleton';
UPDATE "laboratory_facility_landing" SET "heroImageVerticalPercent" = 25  WHERE id = 'singleton';
UPDATE "contact_page_content"        SET "heroImageVerticalPercent" = 30  WHERE id = 'singleton';
UPDATE "journey_cta_content"         SET "heroImageVerticalPercent" = 50  WHERE id = 'singleton';

-- Phase 3 — DROP (8 old String columns)
ALTER TABLE "faculty"                    DROP COLUMN "messageHeroImagePosition";
ALTER TABLE "about_overview"             DROP COLUMN "heroImagePosition";
ALTER TABLE "about_mission_vision"       DROP COLUMN "heroImagePosition";
ALTER TABLE "about_mecha_club"           DROP COLUMN "heroImagePosition";
ALTER TABLE "lab_facility_landing"       DROP COLUMN "heroImagePosition";
ALTER TABLE "laboratory_facility_landing" DROP COLUMN "heroImagePosition";
ALTER TABLE "contact_page_content"       DROP COLUMN "heroImagePosition";
ALTER TABLE "journey_cta_content"        DROP COLUMN "heroImagePosition";
```

Hand-edited because Prisma's interactive data-loss prompt isn't available in this environment. Verified post-migration with a Prisma query script that every value parsed correctly into its expected Int.

---

## Mid-phase incident — destructive migration ordering

Caught during the prod handoff:

1. CP13.1 applied the migration via `npx prisma migrate deploy` against the Neon DB. The Neon DB is shared between dev and prod.
2. The migration dropped the old `heroImagePosition` String columns. The Phase 13 code (which reads the new Int columns) was committed locally but **not yet deployed** to Vercel.
3. Production was still serving the pre-Phase-13 code, which Prisma-generated to expect the now-dropped String columns. Every page that touched a hero throws a server-side exception (digest 2368442793).
4. Chair caught it visually. Forward-fix deploy (push CP13.2 commits + `vercel deploy --prod`) restored prod within minutes.

Captured as a `feedback_destructive_migration_ordering.md` memory entry so the trap doesn't repeat. **Future rule for DROP/RENAME on a shared DB:** code deploys first, migration applies second; or split into two migrations (add+populate now, drop later after a code deploy).

This is the second new memory entry from Phase 13 (the first was the unsurprising `next/image` fill repeat — already captured in Phase 12's memory).

---

## File inventory (2 commits)

| Commit | Files | Notes |
|---|---|---|
| **`e516abd`** CP13.1 | 5 | Schema rewrite (8 → 11 hero position columns) + migration SQL + new HeroImagePositionSlider component + validation schemas + seed.ts Ints |
| **`570b408`** CP13.2 | 31 | 9 admin actions + 9 admin forms wired to slider + 8 public renderers + HeroSection plain-img switch + layout.tsx wiring + app/page.tsx wiring + faculty API routes |

**Total: ~36 files, +350 / −200**

---

## Verification log

| Stage | Verification |
|---|---|
| Schema | Migration applied clean on Neon DB; verified each Int matches expected parse output (Faculty Dean 3, Head 0; About Overview/MV 3; Mecha 45; Lab/Lab2 25; Contact 30; Journey 50; Dept 3× default 50) |
| Local typecheck | Clean |
| Local curl | 9 public surfaces 200; object-position fingerprints match pre-migration values exactly |
| Production | Initial deploy gap caused crash (see incident above) → emergency deploy `dpl_…ae0x4xsig` restored prod with 8/8 routes 200 + identical positions live |
| Chair production browser | Verified post-incident on prod live URL |

---

## Out of scope (deferred)

- Horizontal `object-position` control — chair only requested vertical
- Lab + AdmissionNotice hero positions — not full-bleed banner contexts
- Image cropping / resize controls
- Phase 8b's 11 JSON-textarea retro candidates still in queue

---

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install` (no new deps)
- [ ] `npx prisma migrate status` clean (this PR's migration shows applied)
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run db:seed` idempotent — existing rows untouched (Int seed values match what's in DB)
- [ ] `npm run dev`:
  - [ ] Public surfaces visually identical to pre-Phase-13 (hero crops unchanged)
  - [ ] DevTools → Elements: every hero `<img>` has `style="...object-position:center {N}%..."` reflecting DB value
- [ ] Admin sliders:
  - [ ] `/admin/department-identity` shows 3 sliders, each below its respective Hero ImageUploader + Alt text
  - [ ] `/admin/about-overview` / `mission-vision` / `mecha-club` — slider replaces former CSS-string text input
  - [ ] `/admin/lab-facility` + `/admin/laboratory-facility` — slider
  - [ ] `/admin/contact-page` — slider
  - [ ] `/admin/journey-cta` — slider (now using shared component, no behavioral change)
  - [ ] `/admin/faculty/<dean-or-head-id>` — slider in Dean/Head message Card
- [ ] Round-trip:
  - [ ] Move slider, save, reload — value persists, public reflects the new framing
  - [ ] DepartmentIdentity 3 sliders each control their own hero independently (verify slide 1 doesn't change slide 2/3)
- [ ] Regression spot-checks:
  - [ ] Phase 9 contact form submission still works
  - [ ] Phase 10 contact page content + campus locations unchanged
  - [ ] Phase 11 admin chrome (sticky sidebar + responsive drawer + login)
  - [ ] Phase 12 JourneyCTA editing flow unchanged in feel (visual identical, internals swapped)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
