# Phase 5 — Lab systems (two parallel DB-driven systems)

## Scope

Closes out the multi-row content entities deferred at Phase 4.
Two distinct lab systems — confirmed by stakeholder as
intentionally separate concepts, not duplicates — both move from
hardcoded data files to DB-backed CMS in a single phase. **One
migration, four new tables, zero new dependencies.**

After Phase 5, every multi-row structural content entity is
DB-driven. Phase 6+ becomes purely content-additive (News /
Events / Notices / Gallery, then Student Society sub-pages).

- **Schema additions** (one migration: `add_lab_systems`) — 4
  new models:

  System 1 — `/about/lab-facility` (slug-based detail UX):
  - `LabFacilityLanding` (singleton) — hero + intro (HTML-allowed)
  - `Lab` (multi-row) — `slug @unique`, name, tagline,
    description, `heroImageUrl/PublicId`, **paired**
    `gallery String[]` + `galleryPublicIds String[]` (same length,
    Cloudinary cleanup on remove), `displayOrder`

  System 2 — `/about/laboratory-facility` (grid + features):
  - `LaboratoryFacilityLanding` (singleton) — hero + intro +
    "Why Our Labs Matter" section (overline + heading +
    `features Json` of variable `{iconName, title, description}[]`)
  - `LaboratoryLab` (multi-row) — `iconName` (Lucide),
    `title`, `description`, `keyLabel`, `keyItems`
    (single String per Discovery #2, not String[]), `focus`,
    `displayOrder`

- **Seed extension** (`scripts/seed.ts`) — idempotent:
  `upsert(update={})` on both singletons; `count > 0` skip on
  both multi-row tables. Create-path values transcribed verbatim
  from each pre-Phase-5 hardcoded source:
  - System 1 Lab rows from `src/lib/labs-data.ts` (10 entries,
    paired-empty `galleryPublicIds: []` since local `/assets/`
    paths have no Cloudinary id)
  - System 2 LaboratoryLab rows from the local `labs` const in
    `/about/laboratory-facility/page.tsx` (6 entries; iconNames
    mapped from Icon component refs: Flame, Droplets, Wrench,
    Hammer, PenTool, Zap)
  - System 2 Landing's `features` Json seeded with the 3-item
    "Why Our Labs Matter" array (Cog, ShieldCheck, FlaskConical)

- **Admin server actions** (`src/lib/admin-actions/`):
  - `lab-facility.ts` — Landing upsert + Lab CRUD + reorder.
    `revalidateLabSurfaces()` invalidates **both**
    `/about/lab-facility` AND `/` (homepage), per Decision B
    override (see below).
  - `laboratory-facility.ts` — Landing upsert (with `features
    Json` cast to `Prisma.InputJsonValue`) + LaboratoryLab CRUD
    + reorder. `revalidateLab2Surfaces()` invalidates only
    `/about/laboratory-facility` (no homepage cross-reference).
  - Lab gallery + galleryPublicIds arrive as JSON-encoded hidden
    inputs each, parsed via `parseStringArray`. Defensive.

- **API routes** (8 files, same shape as Phase 1 Programs/
  ResearchAreas pattern):
  - `/api/admin/lab-facility/` (GET + PUT landing)
  - `/api/admin/lab-facility/labs/` (GET list + POST create)
  - `/api/admin/lab-facility/labs/[id]/` (GET + PUT + DELETE)
  - `/api/admin/lab-facility/labs/reorder/` (POST)
  - Same 4-set under `/api/admin/laboratory-facility/`

- **New editor components** (`src/components/admin/`):
  - `GalleryEditor` — paired-array editor for Lab.gallery +
    galleryPublicIds. Thumbnail grid with per-item reorder
    arrows + remove; "Add gallery image" reveals
    `ImageUploader` using the Phase 4 `onChange` callback to
    push into the parent array. Two JSON-encoded hidden inputs
    on submit.
  - `FeaturesEditor` — variable list of `{iconName, title,
    description}` rows with reorder + datalist icon hints.
    Same JSON-encoded hidden-input pattern as Phase 4
    `StatsEditor`/`ActivitiesEditor`.

- **Cloudinary** (`src/lib/cloudinary.ts`): `'lab-image'`
  subfolder added → `labs`. `uploadKindSchema` extended.

- **Admin UI** (`src/app/admin/(authed)/`):
  - `lab-facility/` — combined landing form + lab list page;
    separate `labs/new` + `labs/[id]` edit pages; shared
    `LabForm` (Basics + Hero image + Gallery cards).
  - `laboratory-facility/` — combined landing form (with
    `FeaturesEditor`) + LaboratoryLab grid list page; separate
    `labs/new` + `labs/[id]` edit pages; shared
    `LaboratoryLabForm` (Card content + Equipment block —
    `iconName` datalist hint, `keyItems` as single textarea per
    Discovery #2).
  - **Sidebar** — new collapsible "Lab Systems" group with 2
    children (Lab Facility + Laboratory Facility). Auto-opens
    when active route is inside the group.
  - **Dashboard** — 2 new "At a glance" stat cards (Labs N +
    Laboratories N), 2 new Quick Action cards. Stat row goes
    from 4 cards to 6.

- **Public wiring**:
  - 4 new `cache()`-wrapped helpers in `src/lib/identity.ts`:
    `getLabFacilityLanding`, `getLabs` (narrow select),
    `getLaboratoryFacilityLanding`, `getLaboratoryLabs`.
  - `/about/lab-facility/page.tsx` becomes async server
    component (was 'use client'). Fetches landing + labs.
    Renders PageShell + intro via
    `dangerouslySetInnerHTML`, then delegates to
    `<LabFacilityClient labs={labs} />` (new file) which owns
    the selected-state + URL-hash sync UX **unchanged from
    pre-Phase-5**. Drop-in data-source swap per Decision F
    constraint.
  - `/about/laboratory-facility/page.tsx` reads landing + labs
    server-side. Features rendered from `landing.features` via
    `coerceFeatures` shape guard (same pattern as Phase 4
    `coerceStats`/`coerceActivities`). Curated 18-item Lucide
    `IconMap` covers seed + admin datalist hints, with
    `FlaskConical` fallback for unknown names.
  - **`ResearchLabsSection` (homepage carousel) wired from DB
    via Decision B override** — see Architectural decisions
    below. `src/app/page.tsx` now fetches labs alongside dept
    + programs + researchAreas and passes to the section as a
    prop. Section internals untouched (scroll/pause/wrap logic
    preserved); only the data source changed.

## Out of scope (deferred to Phase 6+)

After Phase 5, remaining work is purely **content-additive**:

- **Content hubs (Phase 6)** — News, Events, Notices, Gallery
  — each with list + `[slug]` detail pages, currently sourced
  from hardcoded `*-data.ts`. **Folded into Phase 6 alongside
  global-search-index migration** (see Tech debt).
- **Student Society sub-pages (Phase 7+)** — Alumni, Clubs,
  FAQ, Visitors, Transport, Syllabus pages under
  `/student-society/*` — still hardcoded.
- **Homepage content sections not yet structural chrome** —
  `QuickLinksSection`, `NoticesSection`, `EventsSection`,
  `NewsSection`, `ServicesSection`, `OverviewSection` — read
  their own hardcoded arrays. Phase 6+ migrates these
  alongside the matching content hubs.
- **`src/lib/search-index.ts`** — still imports `labs` from
  `src/lib/labs-data` after Phase 5. Build-time search
  infrastructure with separate redesign considerations. See
  Tech debt below.
- **Automated tests** — still nil, same as Phases 1–4.

## Architectural decisions

### Two parallel systems — intentional separation, not duplication

Stakeholder confirmed during CP5.1 discovery that
`/about/lab-facility` and `/about/laboratory-facility` are
distinct content concepts the chair wants both. Public shapes
differ (slug-based detail UX vs grid + features) and the
content authored under each will diverge over time. Phase 5
delivers two parallel CMS surfaces — separate models, separate
admin sections, separate public render code paths — so future
authoring on one doesn't leak into the other. Constraint #11
forbade DRYing them up.

### Discovery #2: `keyItems` is `String`, not `String[]` (Decision A)

CP5.1 sketch proposed `keyItems String[]`. Actual data in the
pre-Phase-5 page:
`'Multi-cylinder petrol and diesel engines, steam generator
models, and bomb calorimeters.'` — a single comma-separated
sentence rendered as one `<p>`. Schema matches the render
shape (`keyItems String @db.Text`); admin form is one textarea.
If the chair later wants multi-line bullets, migrate to
String[] in a follow-up.

### Decision B override: scope expansion to homepage carousel

CP5.1 sketch proposed leaving
`src/components/sections/ResearchLabsSection.tsx` (homepage
carousel) reading from `labs-data.ts` after Phase 5 — admin
edits to `/admin/lab-facility` would land on the lab page but
**not** the homepage carousel until a later phase migrated the
section. Chair overrode: leaving that divergence would create
a confusing admin UX where a new lab vanishes from the
homepage. Phase 5 expanded to also wire the carousel: section
accepts labs as a prop, homepage's `src/app/page.tsx` fetches
labs and passes them in. `revalidatePath('/')` now lives in
the Lab admin actions alongside `'/about/lab-facility'`.

### Decision F: drop-in data-source swap for the client-component UX

Constraint forbade refactoring the System 1 detail-UX client
component beyond swapping its data source. The selected-state +
URL-hash sync logic moved 1:1 from the old client `page.tsx`
into a new `LabFacilityClient.tsx`. Only adjustments:
- `activeSlug` typed `string | null` (was `string` with
  optimistic `labs[0].slug` initializer — needed for the
  empty-labs guard).
- Field rename `lab.heroImage` → `lab.heroImageUrl` (schema
  column name); same for the homepage carousel.
- `gallery` is always `String[]` from DB (was `String[] |
  undefined` in `labs-data.ts`); the `length > 0` conditional
  still hides the gallery block when empty.

### `features` Json on System 2 landing (Decision C)

Same Json pattern as Phase 4 `AboutMechaClub.activities`. Shape
`{iconName, title, description}`. Defensive coerce on read.
Variable-length so the chair can add a 4th "What Sets Us
Apart" feature later without schema work.

### Singleton-per-page over one-table-per-content-type

Each lab page got its own Landing singleton, matching the
Phase 4 About pages convention. Avoids forcing two different
hero/intro/extras shapes into one table.

### `Lab.slug @unique` (Decision D)

System 1's URL hash deep link (`/about/lab-facility#fluid-
mechanics-lab`) makes `slug` a primary user-facing identifier.
Index + uniqueness enforced. System 2's grid uses position-
based React keys — no slug needed there.

### `gallery` paired with `galleryPublicIds`

Two arrays of equal length. `gallery[i]` is the URL,
`galleryPublicIds[i]` is the Cloudinary public_id for cleanup
when admin removes a gallery image. Seed populates
`gallery` from `labs-data.ts` URLs and leaves
`galleryPublicIds: []` empty (local `/assets/` paths have no
Cloudinary id). New admin uploads populate both arrays in
parallel via `GalleryEditor.onChange` + parent serializer.

### `IconMap` curated, not exhaustive

Both Lab admin forms expose a curated Lucide datalist
(~14–18 names covering current seed + likely future picks).
Admin can type any Lucide name; unknown names fall back to
`FlaskConical` at render time. Same defensive pattern as
Phase 1 `MajorResearchSection`.

### Chrome revalidate scope: page-only for System 2

System 2 admin actions call
`revalidatePath('/about/laboratory-facility')` (page scope).
Only System 1 needs the layout-spanning revalidate (homepage
carousel cross-reference per Decision B).

## Verification

All testing was **manual** (curl smoke + browser) — same as
Phases 0–4; no automated suite in scope.

### Per-sub-step curl smoke (local, before push)

- **CP5.1** — `npx prisma migrate dev --name add_lab_systems`
  applied; `npx prisma db seed` confirmed 2 singletons + 10
  Lab rows (gallery counts: manufacturing-lab=7, ice-lab=2,
  others 0–1) + 6 LaboratoryLab rows (3 distinct keyLabels:
  Key Equipment ×4, Key Software, Key Processes).
- **CP5.2** — typecheck clean; 4 new admin paths return 307
  (auth redirect) when unauthenticated; 4 public lab routes
  unchanged 200 (still rendering from hardcoded source at
  this checkpoint).
- **CP5.3** — typecheck clean; 3 public routes 200; curl HTML
  fingerprint confirms all 10 lab names on
  `/about/lab-facility`, 6 lab titles + 3 features +
  "Why Our Labs Matter" heading on `/about/laboratory-facility`,
  and 10 unique slug-link `<a>` anchors in the homepage
  carousel (Decision B working).

### Production browser end-to-end

After `vercel deploy --prod` from branch HEAD (one deploy, no
retry):

| Test | Result |
|------|--------|
| `/about/lab-facility` visual identical to pre-Phase-5 prod (10 labs, URL-hash deep link) | ✓ |
| `/about/laboratory-facility` visual identical (6 grid cards, 3 features) | ✓ |
| Homepage `/` Research & Labs carousel rendering from DB (10 cards, click navigates to `/about/lab-facility#<slug>`) | ✓ |
| Admin → `/admin/lab-facility/labs/new` → create lab → appears on `/about/lab-facility` AND homepage carousel; delete → both surfaces restore (Decision B magic moment) | ✓ |
| Admin → edit LaboratoryLab `focus` field → save → `/about/laboratory-facility` card updated | ✓ |
| Admin → landing features title edit → "Why Our Labs Matter" section reflects | ✓ |
| Phase 2/3/4 regression sample (Faculty list, /about/overview, /about/mecha-club, /admin/login) unchanged | ✓ |
| DevTools console clean across all tested public + admin pages; mobile drawer URL-hash deep link working | ✓ |

## Tech debt notes

In addition to the Phase 6+ deferrals above:

- **`src/lib/search-index.ts` still reads `labs-data.ts`** —
  the global build-time search infrastructure that maps lab
  rows to searchable items. After Phase 5, this is the **only**
  remaining consumer of `labs-data.ts`. Two reasons it stays
  on hardcoded for now: (1) search-index is build-time
  infrastructure with separate redesign considerations,
  (2) Phase 6's content-hubs work touches multiple search
  surfaces (News, Events, Notices, Gallery) — better to do all
  search-index migration in one consolidated cleanup there.
  **Document in `docs/phase-2-todo.md` or wherever Phase N+
  todos accumulate:** "search-index.ts migrate to DB when
  global search redesign comes into focus, Phase 6 most
  likely." Until then, an admin-added lab won't appear in
  global-search results; the lab pages + homepage carousel
  surface it correctly.
- **`labs-data.ts` itself** stays on disk (one consumer left;
  delete when search migration lands).
- **No DB-level shape validation on `features` Json** — Zod
  validates at the write boundary, `coerceFeatures` defends at
  the read boundary. Acceptable trade-off (same as Phase 4
  Json patterns).
- **`dangerouslySetInnerHTML` on `introBody`** — carried-forward
  author-trust caveat from Phase 2/4. Layer DOMPurify when
  editor audience widens.
- **`IconMap` curated** — admin can type any Lucide name and
  get `FlaskConical` fallback. Same trade-off as Phase 1
  ResearchArea + Phase 4 mecha-club.
- **`package.json#prisma` deprecation warning** — carried
  forward; harmless until Prisma 7.
- **No automated tests** — same as prior phases. Highest-
  payoff additions for Phase 5: Playwright smoke for the
  Decision B revalidation flow (admin lab create → homepage
  carousel +1 card), Vitest for `coerceFeatures` shape drift +
  `parseStringArray` JSON-decode defenses + GalleryEditor's
  paired-array invariants.

## Commit list

```
126f445 feat(phase-5): CP5.3 — Lab systems wired from DB (lab-facility + laboratory-facility + homepage carousel via Decision B override)
33e981b feat(phase-5): CP5.2 — admin layer for 2 lab systems (server actions + 8 API routes + 2 admin sections + sidebar group + dashboard)
3064197 feat(phase-5): CP5.1 — Lab systems schema + seed (2 singletons, 16 lab rows across 2 multi-row tables)
```

3 commits — all `feat`, one per CP. No `fix` mid-flight (the
Phase 3 `useId` hydration fix carried forward and applies to
the new SortableList instances on `/admin/lab-facility` +
`/admin/laboratory-facility` without further changes). No
`chore` either — all hygiene items from earlier phases stay
clean.

Diff vs `main`: **38 files changed, +2,745 / −374**.

## Deployment notes

- Production deploy: `vercel deploy --prod` from this feature
  branch. Working tree clean throughout (no stash → deploy →
  pop dance; admission/requirements local edit committed back
  in Phase 3).
- Production deployment ID:
  `dpl_6by4R73hRYGiVsqBfLSHqwX1LEtg`.
- Production alias `mechanical-engineering-olive.vercel.app`
  attached automatically by Vercel.
- Schema migration `20260516115401_add_lab_systems` was
  applied to the Neon DB during local CP5.1 work. Same Neon
  DB serves local + production, so all 4 new tables + seeded
  rows (2 singletons + 10 Lab + 6 LaboratoryLab) existed in
  production **before** any Phase 5 code reached prod.
  Nothing extra ran at deploy time.
- No env-var changes. The Phase 0 set fully covers Phase 5.
- Build log: `prisma generate` 295ms, `next build` compile
  18.4s, **131 static pages** (up from Phase 4's 121 — 6 new
  `/admin/*lab-facility*` pages + 4 new `/api/admin/*` lab
  routes). ~2m end-to-end.
- **First deploy attempt succeeded** — no retry needed (the
  Phase 2 build-chain fix carries forward).

## Pipeline forward

- **Phase 6** — Content hubs (News, Events, Notices, Gallery)
  with list + `[slug]` detail pages + admin sections. **Folded
  into Phase 6: `search-index.ts` migration to DB** so the
  global search picks up all newly DB-driven content in one
  go.
- **Phase 7+** — Student Society sub-pages (Alumni, Clubs,
  FAQ, Visitors, Transport, Syllabus).
