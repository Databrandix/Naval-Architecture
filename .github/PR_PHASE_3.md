# Phase 3 — Chrome structure DB-driven (full sweep)

## Scope

Closes out Phase 1's accumulated chrome leftovers plus the Phase 2
hygiene items in a single sweep. After this PR, **no site chrome
(header, footer, hero, programs, research featured slot) is
hardcoded** — every visual structural element is super_admin-editable.
**One migration, eight new tables + nine column additions, zero new
dependencies.**

- **Schema additions** (one migration: `add_chrome_structure`):
  - `DepartmentIdentity`: 3 nullable text columns
    `heroImage1Alt`, `heroImage2Alt`, `heroImage3Alt`
  - `Program`: 1 nullable text column `ctaHref` (null → renderer
    falls back to `/admission/requirements`)
  - `ResearchArea`: `isFeatured Bool` + `featuredHeading`,
    `featuredImageUrl`, `featuredImagePublicId`,
    `featuredDescription`, `featuredCtaHref` + index on `isFeatured`
  - **8 new tables**: `top_link`, `quick_access_item`,
    `main_nav_group`, `main_nav_item`, `footer_useful_link`,
    `footer_get_in_touch_link`, `footer_quick_link`,
    `footer_legal_link`

- **Seed extension** — backfills nulls on existing singleton rows
  (DepartmentIdentity hero alts, ResearchArea featured-* on
  "Robotics & Automation"), bulk-inserts the chrome tables when
  empty:
  - 5 `top_link` rows from the hardcoded `topLinks` array in
    `Navbar.tsx`
  - 11 `quick_access_item` rows from `quickAccess` array
  - 5 `main_nav_group` + 19 `main_nav_item` rows from `navLinks`
  - 6 `footer_useful_link` + 6 `footer_get_in_touch_link` +
    6 `footer_quick_link` + 3 `footer_legal_link` rows from
    `Footer.tsx`
  - All inserts skipped when table non-empty (idempotent)
  - Backfills never overwrite existing values (admin edits survive
    re-seed)

- **Admin server actions** (`src/lib/admin-actions/`):
  - `chrome-nav.ts` — `TopLink`, `QuickAccessItem`,
    `MainNavGroup`, `MainNavItem` (CRUD + reorder, nested item
    operations bound to `groupId`, cascade-delete on group via
    Prisma FK)
  - `chrome-footer.ts` — 4 footer link tables (CRUD + reorder per
    table; one concrete action per table because Prisma model
    delegates don't merge into a callable union)
  - `_link-actions.ts` — shared `FormData` helpers (no
    `'use server'` — helpers only)
  - Existing actions extended in place: `department.ts` reads 3
    alt fields, `programs.ts` reads `ctaHref`,
    `research-areas.ts` reads 6 featured fields + runs atomic
    `$transaction` demote of any existing featured row when a
    different row claims it (same pattern as Phase 2 Dean/Head
    uniqueness)

- **Admin UI** — extends existing pages with new fields + adds two
  combined pages for the new link entities:
  - `DepartmentForm`: 3 alt-text inputs paired below each hero
    uploader
  - `ProgramForm`: `ctaHref` input + fallback hint
  - `ResearchAreaForm`: featured toggle with browser `confirm()`
    prompt on promote (warns about demote), 5 conditional fields
    below (heading override, image uploader, description,
    `ctaHref`)
  - `/admin/nav` — `NavAdmin` orchestrates 3 sections:
    `TopLink` + `QuickAccessItem` via shared `LinkListSection`;
    `MainNav` via custom `MainNavSection` (expandable groups
    with nested item lists)
  - `/admin/footer-links` — `FooterLinksAdmin` renders 4
    `LinkListSection` instances
  - `LinkListSection` — shared inline expand-edit pattern. Each
    row toggles between view (name + badges + actions) and form
    (name, href, `isExternal`, `isDisabled` + optional
    `extraField` like `iconName`). `SortableList` for
    drag-reorder. Toast on success/failure.
  - `MainNavSection` — supports `hasDropdown` toggle (when on,
    `href` is optional and `title` is editable; when off, `href`
    required), nested `LinkListSection` inside expanded group
  - Sidebar gains 2 entries — Navigation + Footer Links
  - Dashboard Quick Actions gains 2 cards (Manage Navigation +
    Manage Footer Links) so the entry surface stays in sync

- **Public wiring**:
  - 7 new `cache()`-wrapped helpers in `src/lib/identity.ts`:
    `getTopLinks`, `getQuickAccessItems`, `getMainNav` (groups +
    items via Prisma `include`), `getFooterUseful/GetInTouch/
    Quick/LegalLinks`, plus `getProgramsWithCta` (extended select)
  - Root layout parallel-fetches the 10 chrome reads alongside
    existing dept + uni identity, passes arrays to Navbar +
    Footer
  - **Navbar**: removed `navLinks`, `topLinks`, `quickAccess`
    hardcoded arrays. Renders top-bar items, scrolled-nav main
    nav, bottom-bar main nav, mobile drawer main nav from props.
    `IconMap` resolves `QuickAccessItem.iconName` → Lucide
    component with `Globe` fallback. ERP + Convoc. Reg.
    middle-bar buttons read href from `quickAccessItems` by name.
    Mobile drawer "Quick Links" derives from `main_nav`
    "Admission" group children (Decision 3 — no separate table).
  - **Footer**: removed `usefulLinks`, `getInTouch`, `quickLinks`
    hardcoded arrays. All 4 columns + legal-row links render from
    props. Disabled links render with `opacity-50` +
    `aria-disabled`. Legal row collapses when `legalLinks` empty.
  - **HeroSection**: alts pulled from
    `DepartmentIdentity.heroImage{N}Alt` via new `imageAlts`
    prop; `HERO_ALTS` constant kept as `FALLBACK_ALTS` (used when
    DB alt is null).
  - **ProgramsSection**: per-program `ctaHref` with
    `/admission/requirements` fallback when null.
  - **MajorResearchSection**: featured card driven by
    `ResearchArea` row flagged `isFeatured=true`. Heading falls
    back to `areaName`; image, description, `ctaHref` each fall
    back to the previous hardcoded values. When no row is
    featured, the right slot collapses and the grid takes
    `lg:w-full` (graceful fallback).

- **Phase-spanning hygiene** (folded into this sweep):
  - `src/app/admission/requirements/page.tsx` — the
    owner-managed local edit (freedom-fighter eligibility line
    removal) that has been stashed across every Phase 0–2 deploy
    is finally committed.
  - `.gitattributes` — `text=auto` baseline, forced LF for
    `.sh`, `.toml`, Prisma `.sql` migrations, explicit binary
    markers for images/fonts. Eliminates the recurring "LF will
    be replaced by CRLF" warning on every Windows checkout add.
  - `scripts/seed.ts` — Faculty Json column casts refined from
    `as object | undefined` (which lies — `string` isn't an
    `object`) to `as Prisma.InputJsonValue | undefined` (the
    contract the Prisma boundary actually takes). No runtime
    change.

- **In-flight fix**:
  - `fix(phase-3): SortableList useId() to DndContext` —
    surfaced during CP3.2 browser verify. `@dnd-kit/core` uses a
    module-level counter for accessibility ids; combined admin
    pages with 4–9 `SortableList` instances on one route produced
    SSR↔hydration mismatched `aria-describedby` attributes.
    Passing React's `useId()` to `DndContext` roots all internal
    ids in a stable, tree-position-derived prefix.

## Out of scope (deferred to Phase 4+)

The Phase 3 closeout means the structural CMS is done. Everything
remaining is **content-additive**, not structural:

- **About pages** (`/about/overview`, `/about/mission-vision`,
  `/about/mecha-club`, `/about/lab-facility`) — Phase 4.
- **Content hubs** — News, Events, Notices, Gallery, each with
  list + `[slug]` detail pages, all currently sourced from
  hardcoded `*-data.ts` — Phase 5.
- **Student Society surfaces** — Alumni, Clubs, FAQ, Visitors,
  Transport, Syllabus pages under `/student-society/*` — Phase 6+.
- **Homepage content sections** that aren't structural chrome —
  `QuickLinksSection`, `NoticesSection`, `ResearchLabsSection`,
  `EventsSection`, `NewsSection`, `ServicesSection`,
  `OverviewSection` — still read their own hardcoded arrays from
  `data.ts` / individual data files. Phase 4–6 migrate these.
- **JSON API routes for chrome entities** — CP3.2 spec asked for
  "6 new sets of API routes (CRUD + reorder per new entity)";
  skipped because admin UI uses server actions exclusively (same
  pattern as Phase 1 Programs/ResearchArea forms) and no external
  consumer exists today. Tech-debt note below.
- **Automated tests** — still nil, same as Phases 1 + 2.

## Architectural decisions

### Eight `Json` columns? No — relational + Phase 2 stayed Json

Phase 2 chose `Json` columns for Faculty's variable-shape section
content; Phase 3 chose **relational** for nav + footer link lists
(`top_link`, `quick_access_item`, `main_nav_group + main_nav_item`,
4× footer tables) because:
- The link shape is fixed (`name`, `href`, `isExternal`,
  `isDisabled`, `displayOrder` + optional `iconName` for
  QuickAccess) — no shape drift.
- Per-row CRUD + drag-reorder is the natural admin UX; a
  relational row gives a stable id, server-side reorder, and FK
  cascade.
- `MainNavGroup ↔ MainNavItem` parent/child needed a FK relation
  anyway (cascade delete on group), which a `Json` column can't
  enforce.

### Spec evolution — added a 3rd table (`FooterGetInTouchLink`) and a 4th (`FooterLegalLink`)

CP3.1 spec listed `footer_useful_link` + `footer_quick_link` (2
tables). The actual `Footer.tsx` has **3 visible columns** (the
spec missed "Get in Touch") and a bottom-bar legal row. To
deliver "no part of the footer is hardcoded," CP3.1 added
`FooterGetInTouchLink` (chair approved) and `FooterLegalLink`
(chair's addition during approval). Result: full footer parity,
no "Phase 4 creep" for the remaining hardcoded column.

### Mobile drawer Quick Links — derived, not its own table

The mobile drawer had a "Quick Links" section sourcing
`quickLinks` from `src/lib/data.ts` (7 items, mostly admission
sub-pages + ERP + Library). Rather than adding a 9th table for
near-duplicate content, the new Navbar renders this section
from the `main_nav` "Admission" group's children (`mobileQuickLinks`
selector). One fewer table, admin only edits in one place,
mobile drawer auto-syncs when the chair reorders Admission items.

### Featured ResearchArea uniqueness — server-side atomic swap

Same pattern as Phase 2 Dean/Head: when a `ResearchArea` row is
saved with `isFeatured=true`, `$transaction` first
`updateMany`s any other row holding the flag to `false`, then
saves the target row. The admin form additionally runs a
browser `confirm()` prompt on promote ("Promoting this row will
demote whichever row is currently featured. Continue?") so the
chair sees the swap before submitting.

### `featuredHeading` separate from `areaName` (override semantics)

CP3.1 override from chair: keep `ResearchArea.areaName`
unchanged (grid card visual identical) and add an optional
`featuredHeading` override for the featured card's `<h3>`. The
renderer falls back to `areaName` when `featuredHeading` is null
— so future featured rows don't need both fields populated.
Trade-off accepted: phase constraint #7 demanded zero visual
regression on the grid.

### `ctaHref` null → fallback in renderer, not seed

`Program.ctaHref` is left null on the existing two program rows
during seed. The renderer falls back to
`/admission/requirements` (the previous hardcoded literal). Net
result: zero behavior change for current rows, but the chair
can override per-row without touching code. Same fallback
pattern for `ResearchArea.featuredImageUrl`/`featuredCtaHref`.

### Apply Online — literal-seed, not identity-sync

The `Apply Online` MainNavItem's `href` is seeded with the
literal `UniversityIdentity.applyUrl` value at seed time. If
the chair later edits `UniversityIdentity.applyUrl`, this
MainNavItem's `href` will **not** auto-sync — they must update
both places. Chose this over a `useApplyUrlFromIdentity Boolean`
discriminator column (schema bloat for one row). Tech-debt note
below.

### Chrome revalidate scope: `revalidatePath('/', 'layout')`

Every chrome admin action invalidates the root layout (where
Navbar + Footer live), so any save lands on the next public
page load across every route — same "magic moment" Phase 1
proved for brand colors. Per-mutation revalidate keeps the
public cache warm; no full deploy needed.

### `useId()` on `DndContext` — required when multiple `SortableList`s on one page

`@dnd-kit/core` uses a module-level counter for its internal
accessibility ids (`DndDescribedBy-N`). Phase 1's admin pages
each had one SortableList per route (Programs, ResearchAreas,
Faculty on dedicated pages), so the counter race was dormant.
CP3.2's combined pages (`/admin/nav` mounts 3–9 instances,
`/admin/footer-links` mounts 4) make the order between SSR and
client hydration non-deterministic. Passing React's `useId()`
as `DndContext id` roots all internal ids in a stable,
tree-position-derived prefix.

## Verification

All testing was **manual** (curl smoke + browser) — same as
Phases 0–2; no automated suite in scope.

### Per-sub-step curl smoke (local, before push)

- **CP3.1** — `npx prisma migrate dev --name add_chrome_structure`
  applied; `npx prisma db seed` confirmed
  3 alts backfilled, Robotics featured set, 5+11+5+19+6+6+6+3
  rows seeded; sample dump verified Admission group's 7 items
  with literal `applyUrl` on "Apply Online".
- **CP3.2** — typecheck clean; 7 admin paths return 307 (auth
  redirect) when unauthenticated; existing 6 public paths
  unchanged 200.
- **CP3.3** — typecheck clean; 8 public paths 200; curl HTML
  fingerprint confirms 5 main_nav groups rendered, 4 top_link
  visible, all 4 footer columns + legal row text present, hero
  alts pulled from DB, featured card heading "Robotics &
  Industrial Automation".

### Production browser end-to-end

After `vercel deploy --prod` from branch HEAD (one deploy, no
retry — Phase 2 fix for `prisma generate` in build chain
carried forward):

| Test | Result |
|------|--------|
| `/` — homepage chrome visually identical to Phase 2 prod | ✓ |
| `/admin/login` → log in → dashboard Quick Actions shows 9 cards (7 prior + Navigation + Footer Links) | ✓ |
| Admin → `/admin/nav` → drag-reorder a `main_nav_group` → save → `/` → main navbar reflects new order | ✓ |
| Admin → `/admin/research-areas` → toggle `isFeatured` to a different row → save → `/` → featured card swapped | ✓ |
| Admin → `/admin/footer-links` → add a Useful Link → save → `/` → row appears in footer | ✓ |
| Featured card renders image + heading + description + Read More button on `/` | ✓ |
| `/admission/requirements` — freedom-fighter line absent in production (committed in this phase) | ✓ |
| Mobile drawer (375px width) — Quick Links derives from main_nav Admission group; Services from quick_access | ✓ |
| Existing Phase 1 + Phase 2 flows — no regression | ✓ |

## Tech debt notes

In addition to the Phase 4+ deferrals above:

- **JSON API routes for chrome entities** — CP3.2 spec asked
  for 6 sets; admin UI ships with server actions only. Add the
  routes when an external consumer appears (programmatic
  integration, CLI tool, mobile app).
- **`Apply Online` href sync gap** — admin must update
  `UniversityIdentity.applyUrl` AND the `MainNavItem.href` for
  "Apply Online" if the URL changes. A future
  `useApplyUrlFromIdentity Boolean` discriminator would fix
  this for one row at the cost of schema branch logic.
- **`IconMap` in Navbar is curated** — 11 Lucide icons cover
  the seed; admin can type a Lucide name not in the map and
  get the `Globe` fallback. Either expand to the full Lucide
  set or constrain the admin form to the curated subset (same
  trade-off as Phase 1 `ResearchArea.iconName`).
- **`dangerouslySetInnerHTML` in `MessageParagraphs`** —
  carried forward from Phase 2; layer DOMPurify when the
  editor audience widens beyond Dean/Head.
- **`package.json#prisma` deprecation warning** — carried
  forward from Phase 2; harmless until Prisma 7.
- **No automated tests** — same as prior phases. Highest-
  payoff additions: a Playwright smoke for the super_admin →
  public revalidation flow ("magic moment"), Vitest for the
  Featured ResearchArea atomic swap and the `MainNavSection`
  hasDropdown form toggle.

## Commit list

```
c7bec70 chore(phase-3): refine Json column casts in seed to Prisma.InputJsonValue
9b22f73 chore(phase-3): .gitattributes for cross-platform line endings
3f5e095 chore(phase-3): apply admission/requirements edit (freedom-fighter line removal)
499cfba feat(phase-3): CP3.3 — public components wired from DB (Navbar, Footer, Hero, Programs, MajorResearch)
0be73cb chore(phase-3): add Manage Navigation + Manage Footer Links to dashboard Quick Actions
5778cf5 fix(phase-3): pass stable useId() to DndContext to prevent SSR↔hydration aria-describedby mismatch
4c9509d feat(phase-3): CP3.2 — admin layer for chrome structure (server actions + inline-edit admin pages)
6925936 feat(phase-3): CP3.1 — chrome structure schema + seed from current hardcoded values
```

8 commits — 3 `feat` for the planned CPs, 1 `fix` for the dnd-kit
hydration mismatch surfaced mid-verify, 4 `chore` for hygiene
(dashboard sync, admission/requirements, .gitattributes,
InputJsonValue refinement).

Diff vs `main`: **33 files changed, +2,755 / −385**.

## Deployment notes

- Production deploy: `vercel deploy --prod` from this feature
  branch. **No stash → deploy → pop dance this time** — the
  admission/requirements local edit was committed in
  `3f5e095` as part of the phase, so the working tree was
  already clean.
- Production deployment ID: `dpl_2aBk1BkZyoCyfutK3YeS7C9LaYoo`.
- Production alias `mechanical-engineering-olive.vercel.app`
  attached automatically by Vercel.
- Schema migration `20260516080941_add_chrome_structure` was
  applied to the Neon DB during local CP3.1 work. Same Neon DB
  serves local + production, so all 8 new tables + 9 column
  additions + seeded chrome rows existed in production
  **before** any Phase 3 code reached prod. Nothing extra ran
  at deploy time. **Pre-Phase-3 production builds were not
  affected** because Prisma client cached in their
  `node_modules` predated the schema additions; the Phase 2
  fix (`prisma generate && next build`) carried forward and
  Vercel regenerated the client cleanly at deploy time.
- No env-var changes. The Phase 0 set fully covers Phase 3.
- Build log: `prisma generate` 266ms, `next build` compile
  15.3s, 115 static pages, ~2m end-to-end.
- **First deploy attempt succeeded** — no fix-up commit was
  needed at deploy time (the build-chain regression that hit
  Phase 2's first deploy was fixed in `492c799`, carried
  forward).
- Apparent curl-fingerprint mismatches during prod sanity
  ("Graduate" 0 hits, "Robotics" 1 hit) were stale-spec
  artifacts: the second Program row was chair-renamed from
  "Graduate" to "Undergraduate — MSc. in Mechanical Engineering"
  in production at some earlier point, and the `Robotics` grep
  count missed the `&amp;` HTML escape. Production DB inspection
  + raw HTML inspection confirmed correct render in both cases.
