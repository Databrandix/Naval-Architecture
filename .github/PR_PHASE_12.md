# Phase 12 — JourneyCTASection CMS + text-left visual revert + vertical-position slider

Fourth demand-driven phase post-CMS-complete (after Phase 9 form backend, Phase 10 `/contact` page content, Phase 11 admin UI polish). Closes the **last layout-level chrome gap** — the "Shape Your Future with Excellence" section between page content and the footer was fully hardcoded; now DB-driven via a `JourneyCTAContent` singleton.

---

## Why this exists — audit gap acknowledged (again)

The Phase 8c PR declared the project CMS-complete. Phase 10 corrected that re: `/contact`. **This phase corrects the correction**: Phase 10's audit was page-level (`find src/app -name "page.tsx"` + grep), so section-level chrome components imported from the root layout never showed up. `JourneyCTASection` is one such component — used by every public page via `app/layout.tsx`, missed by both Phase 9 + Phase 10 audits.

Going forward, the CMS-completeness audit pattern adds **section-level component scan** to the page-level scan. Recorded inline in the commit message + here for future readers.

---

## CP12.0 — visual revert (text-left)

Before the migration, chair noticed the right-aligned layout (`justify-end` + `text-right` + `bg-gradient-to-l`) didn't read well against the photo subjects. Reverted in `JourneyCTASection.tsx` to:
- `justify-start` (Container)
- `text-left` (motion.div)
- `justify-start` (buttons row)
- `bg-gradient-to-r from-primary` (dark overlay on left, image fades to right)

DB seed captures these defaults so first deploy is pixel-identical to the reverted state.

---

## Schema additions (one migration: `add_journey_cta_content`)

### `JourneyCTAContent` (singleton)

| Column | Type | Notes |
|---|---|---|
| `heroImageUrl` / `heroImagePublicId` | `String` / `String?` | Cloudinary-paired, kind `journey-cta-hero` → folder `journey-cta/hero` |
| `heroImagePosition` | `String?` | CSS object-position value. Admin slider emits `center {N}%`; renderer reads the literal string. Defensive parse on form load with center-50 fallback for legacy/null values. |
| `heading` | `String` | "Shape Your Future with Excellence" seeded |
| `body` | `String @db.Text` | HTML allowed via dangerouslySetInnerHTML (Phase 4 J1 author-trusted pattern) |
| `primaryCtaLabel` / `primaryCtaHref` / `primaryCtaExternal` | `String` / `String` / `Boolean` | "Apply Now" / ERP URL / external=true seeded |
| `secondaryCtaLabel` / `secondaryCtaHref` / `secondaryCtaExternal` | `String` / `String` / `Boolean` | "Request for Information" / `/contact` / external=false seeded |

Seed mirrors the prior hardcoded values exactly.

---

## Vertical-position slider — chair-requested UX

Hero image position is stored as a CSS `object-position` string (e.g. `center 32%`). Without a friendly control, the admin would have to type raw CSS — unusable.

The form has a 0-100 range slider + paired number input. Slider value `N` serializes to `center {N}%` via a hidden input. Defensive `parsePositionPercent` on load handles legacy/null values with a center-50 fallback.

This is the **third post-CMS-complete UX correction** following the pattern: dedicated structured editor instead of raw-CSS / JSON input (Phase 8b ShiftsEditor, Phase 10 QuickContactCardsEditor, Phase 12 vertical slider).

---

## Bug caught during prod sanity — next/image fill override

The slider serialized correctly to DB but the public renderer always showed `object-position: 50% 50%`. Root cause: `next/image` in `fill` mode injects its own object-position default into the inline `style` attribute, overriding what we passed via `style={{ objectPosition: ... }}`.

**Fix**: swapped `<Image fill />` for a plain `<img className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: ... }} />`. Inline style now reflects the DB value. Trade-off: lose next/image's automatic srcset/optimization for this single hero image. Acceptable — the asset is already webp and not on the critical LCP path for most public routes.

This bug + fix is captured in commit `dbceaf0`. Worth a memory entry — "next/image fill mode overrides inline style; use plain img for DB-driven object-position".

---

## Admin layer

- `/admin/journey-cta` (singleton form):
  - Hero image card: ImageUploader (`journey-cta-hero` kind) + vertical position slider/number paired input + helper copy
  - Content card: heading + body (HTML allowed)
  - Primary CTA card: label / href / external checkbox
  - Secondary CTA card: label / href / external checkbox
- **Sidebar**: new top-level "Journey CTA" entry (Rocket icon) after "Footer Links" — operational singleton like Phase 7 TransportLanding
- **Dashboard**: new StatCard (`Journey CTA: Configured`) + new ActionCard

`revalidatePath('/', 'layout')` on save — the section renders on every public route via the root layout, so layout-scope invalidation refreshes everything.

---

## Hotfix forward-port (PR #15 superseded)

Phase 12 branch was cut from `main` before the desktop-width hotfix `fix/admin-desktop-width` (PR #15) merged. Mid-phase, chair caught that localhost on Phase 12 had regressed to the pre-hotfix admin wide-screen layout. Folded PR #15's 3 changes into Phase 12 directly:

- `(authed)/layout.tsx`: `max-w-6xl` → `max-w-screen-2xl` (1536px)
- `(authed)/page.tsx`: StatCard grid adds `2xl:grid-cols-5`
- `(authed)/page.tsx`: `Syllabi` label → `Syllabus` (matches sidebar nav + ActionCard title)

Once this PR merges, **PR #15 becomes redundant** — same diff already in `main` via this merge. Chair can close PR #15 as superseded, or merge #15 first (Phase 12 will then have nothing new on those two files).

---

## File inventory (3 commits)

| Commit | Files | Notes |
|---|---|---|
| **`08e8c6d`** Phase 12 main | 14 | Schema + migration + seed + Cloudinary kind across 3 files + validation + identity fetcher + admin-action + 2 admin UI files + sidebar/dashboard updates + JourneyCTASection rewrite (props) + app/layout.tsx wiring |
| **`dbceaf0`** next/image fix | 1 | Swap to plain `<img>` so inline `objectPosition` survives |
| **`ea17de1`** hotfix forward-port | 2 | Brings PR #15's max-w-screen-2xl + 2xl:grid-cols-5 + Syllabus label changes |

**Total: 17 files changed, ~510 / ~30**

### Files NOT changed (deliberate)
- `src/lib/search-index.ts` — JourneyCTAContent is chrome content, not search-indexed
- `src/app/sitemap.ts` — no new public routes
- Phase 0-11 tables — Phase 12 purely additive

---

## Verification log

| Stage | Verification |
|---|---|
| Schema | Migration applied clean on Neon prod DB |
| Seed | Idempotent — first run inserts singleton with exact prior hardcoded values |
| Local typecheck | Clean throughout iterative pass |
| Local curl | Homepage 7/7 content fingerprints; admin route 307 auth-gated; regression `/contact`, `/faculty-member`, `/admission/notice` all 200 |
| Chair local browser | Visual revert verified; admin form + slider tested; round-trip save → public reflects |
| Production deploy | Two prod deploys this phase — `dpl_BcoAxu34F5Qg5RUdyQfH1T1UZoNH` (initial, ECONNRESET on CLI but Vercel completed server-side, alias resolved), then `dpl_2o5w2XbQLtHxz3nzJru8iRUkoFpF` (next/image → plain img fix). Final live deploy carries the hotfix forward-port too. |
| Production curl | Homepage 200 + 7/7 fingerprints; admin routes 307; 4/4 regression spot-checks 200 |
| Chair production browser | Slider magic moment + wide-screen UI restored after forward-port. |

---

## Out of scope (Phase 13+ if demand emerges)

- Search-indexing chrome sections (intentionally excluded for now)
- The 11 JSON-form retro candidates from the Phase 8b PR doc tech-debt inventory
- Per-program tuition fee deep wiring + other Phase 8c-listed items
- Auth flow changes (password reset, 2FA)
- Public site color/typography redesign

---

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install` (no new deps)
- [ ] `npx prisma migrate status` clean
- [ ] `npm run db:seed` reports `✓ JourneyCTAContent seeded (singleton)` (idempotent on re-run)
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run dev`:
  - [ ] Homepage `/` shows JourneyCTASection above footer with text on **LEFT** side, gradient dark overlay on left, two CTA buttons left-aligned
  - [ ] DevTools → Elements: `<img>` tag (plain, not `_next/image`) with `style="object-position:center {N}%"` reflecting DB value
  - [ ] Sign in → sidebar shows "Journey CTA" top-level entry (Rocket icon) after Footer Links
  - [ ] Dashboard: `Journey CTA: Configured` stat card + ActionCard present
  - [ ] `/admin/journey-cta`:
    - [ ] Hero image card with uploader + vertical position slider (range + number input)
    - [ ] Move slider to e.g. 25 → Save → reload `/` → image visibly shifts up (top of image more visible)
    - [ ] Move slider to e.g. 75 → Save → reload `/` → image shifts down
    - [ ] Edit heading → save → reload `/` → new heading on banner
    - [ ] Edit body (try HTML `<strong>`) → save → reload `/` → renders bolded
    - [ ] Edit primary CTA href → save → reload `/` → button links to new URL
    - [ ] Toggle external checkbox → save → button gets / loses `target="_blank"`
- [ ] Wide-screen admin (≥1920px):
  - [ ] Dashboard 5-col stat grid (forward-port from PR #15)
  - [ ] No right whitespace ~22% gone
  - [ ] Syllabus label (was "Syllabi") matches sidebar
- [ ] Regression:
  - [ ] All Phase 0-11 admin pages render unchanged
  - [ ] Phase 9 contact form submit still works
  - [ ] Phase 10 `/contact` content + CampusLocations unchanged
  - [ ] Phase 11 sticky sidebar + drawer behavior preserved

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
