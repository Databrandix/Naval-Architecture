# Phase 4 — About pages content (Overview, Mission & Vision, Mecha Club)

## Scope

Phase 4 begins the **content-additive** phase of the CMS — making
narrative About pages super_admin-editable. The structural CMS
sweep closed in Phase 3 (chrome — Navbar/Footer/Hero/Programs/
MajorResearch is all DB-driven now); from Phase 4 onward,
remaining work is content table additions only, no more
structural retrofits.

Three singleton About pages migrated from hardcoded JSX to DB —
**one migration, three new tables, zero new dependencies**.

- **Schema additions** (one migration: `add_about_pages`):
  - `AboutOverview` — hero + `paragraphs String[]`
  - `AboutMissionVision` — hero + flat mission/vision pair
    (overline + heading + body cols per card)
  - `AboutMechaClub` — hero + intro (with image + 2 body
    paragraphs + HTML-allowed heading) + `stats Json` (variable
    `{value, label}` list) + activities section + `activities
    Json` (variable list of `{iconName, imageUrl,
    imagePublicId?, category, title, description}`) + 2-CTA
    network section

- **Seed extension** (`scripts/seed.ts`) — idempotent
  `upsert(update={})` per singleton: re-running seed never
  overwrites admin edits. Create-path values transcribed verbatim
  from each pre-Phase-4 hardcoded page (4 paragraphs for
  Overview; mission + vision bodies; intro + 4 stats + 6
  activities + network for Mecha Club).

- **Admin server actions** (`src/lib/admin-actions/about-*.ts`)
  — three thin upsert actions, one per singleton. Stats +
  activities Json fields read via `parseJsonArray` helper (the
  editor components serialize the array client-side into a
  single hidden input). All revalidate
  `/admin + /admin/<route> + /about/<route>`.

- **API routes** (`src/app/api/admin/about-*/route.ts`) — three
  sets of GET + PUT singleton handlers, same shape as Phase 0
  `/api/admin/department` + `/api/admin/university`.

- **Editors** (`src/components/admin/`):
  - `ParagraphsEditor` — moved from
    `src/app/admin/(authed)/faculty/` to `src/components/admin/`
    (shared). Generalized to take `name` + `helpText` props.
    Faculty form updated to pass `name="messageParagraphs"`
    explicitly. Default behavior unchanged for Faculty.
  - `StatsEditor` — new. Reorderable `{value, label}` rows
    serialized to a single hidden input as JSON.
  - `ActivitiesEditor` — new. Reorderable cards each with
    `iconName` (datalist hint of curated Lucide names) +
    embedded `ImageUploader` + category/title/description text
    fields. Uses the new `ImageUploader.onChange` callback so
    each row's image upload can be tracked in the parent
    component's state, then the whole array serializes to one
    hidden input.

- **`ImageUploader` extension**: optional
  `onChange?: (url, publicId) => void` prop. When provided,
  hidden form inputs are skipped and the callback fires on
  upload + clear. Backward-compatible — every existing call site
  omits `onChange` and gets the same hidden-input behavior as
  before.

- **Cloudinary**: `'about-image'` kind added to
  `KIND_TO_SUBFOLDER` → `about` subfolder.

- **Admin pages** (`src/app/admin/(authed)/`):
  - `about-overview/` — Hero card + Paragraphs card
  - `about-mission-vision/` — Hero card + Mission card + Vision
    card
  - `about-mecha-club/` — Hero + Intro (with HTML-allowed
    heading note) + Stats + Activities (with curated Lucide
    `ICON_HINTS`) + Network (4 CTA fields)
  - All forms use `useActionState` + Card/TextField/TextAreaField
    helpers, same shape as Phase 0 `DepartmentForm`

- **Sidebar** (`src/components/admin/Sidebar.tsx`): collapsible
  "About Pages" group with 3 children (Overview, Mission &
  Vision, Mecha Club). Auto-opens when active route is inside
  the group. Outer wrapper made scrollable to accommodate the
  expanded group + future Phase 5/6/7 entries.

- **Dashboard** (`src/app/admin/(authed)/page.tsx`): 3 new
  Quick Action cards mirror the sidebar children, keeping the
  dashboard surface in sync with the sidebar (same convention
  the Phase 3 `chore` commit established for Navigation +
  Footer Links).

- **Public wiring** (`src/app/about/<route>/page.tsx`):
  - All 3 pages become `async` server components, read via
    new `cache()`-wrapped helpers in `src/lib/identity.ts`
    (`getAboutOverview`, `getAboutMissionVision`,
    `getAboutMechaClub`)
  - Overview paragraphs render via
    `dangerouslySetInnerHTML` per paragraph (HTML-allowed
    body, same author-trust pattern as Phase 2
    messageParagraphs)
  - Mecha Club `introHeading` renders via
    `dangerouslySetInnerHTML` to preserve the gradient span on
    "Mechanical Engineers"
  - Mecha Club activities use a curated `IconMap` for Lucide
    resolution; unknown names fall back to `Sparkles` (same
    defensive pattern as Phase 1 `MajorResearchSection`
    `FlaskConical` fallback)
  - Stats + activities Json coerced with defensive shape
    checks (`coerceStats` / `coerceActivities` — filter rows
    missing required fields)
  - Network section's secondary CTA collapses conditionally
    when secondary fields are null
  - Conditional overline rendering everywhere (when null,
    skip the element entirely instead of empty wrapper)

## Out of scope (deferred to Phase 5+)

The Phase 4 closeout completes the *singleton* About surface.
Multi-row entities and the remaining hardcoded sections move
forward:

- **Lab pages** — `/about/lab-facility` AND
  `/about/laboratory-facility` deferred to Phase 5 **in their
  entirety** (per chair confirmation). Both are intentionally
  separate concepts with distinct content; both stay. Phase 5
  will build **two parallel Lab systems**:
  - `LabFacilityLanding` singleton (intro text) + `Lab` list
    table (slug-based detail UX with `slug`, `name`, `tagline`,
    `description`, `heroImageUrl`, `gallery String[]`,
    `displayOrder`) driving `/about/lab-facility`
  - `LaboratoryFacilityLanding` singleton (intro + 3 features
    Json) + `LaboratoryLab` list table (grid format with
    `iconName`, `title`, `description`, `keyLabel`, `keyItems`,
    `focus`, `displayOrder`) driving `/about/laboratory-facility`
  - Two migrations of schema, two admin sections, two parallel
    public wirings. Deferring both halves together avoids any
    half-DB-half-hardcoded intermediate state.

- **Content hubs (Phase 6)** — News, Events, Notices, Gallery
  — each with list + `[slug]` detail pages, currently sourced
  from hardcoded `*-data.ts`.

- **Student Society sub-pages (Phase 7+)** — Alumni, Clubs,
  FAQ, Visitors, Transport, Syllabus pages under
  `/student-society/*` — still hardcoded.

- **Homepage content sections** that aren't structural chrome
  — `QuickLinksSection`, `NoticesSection`,
  `ResearchLabsSection`, `EventsSection`, `NewsSection`,
  `ServicesSection`, `OverviewSection` — still read their own
  hardcoded arrays. Phase 5+ migrates these alongside the
  matching content hubs.

- **Automated tests** — still nil, same as Phases 1–3.

## Architectural decisions

### Singleton-per-page over one-table-per-content-type

Each About page got its own model
(`AboutOverview`/`AboutMissionVision`/`AboutMechaClub`) rather
than a single `AboutPage` table with a Json blob column. Each
page has a fixed, distinct content shape; flat columns give
better admin form ergonomics, queryability, and field-level
validation than wrapping everything in a single Json column.
The downside (more migrations as About pages grow) is
acceptable — About pages don't proliferate often, and adding
one is one PR's worth of schema + admin + public wiring.

### Mission/Vision pair as flat columns (Decision B from CP4.1)

Pair is fixed (always exactly 2 cards). Flat columns are
queryable, give clearer admin form (2 sections with explicit
heading per side), and avoid Json over-flex for a known-shape
pair.

### Stats + Activities as Json arrays (Decision C from CP4.1)

Both are variable-length lists the chair may grow or shrink.
Json columns avoid the FK overhead and join queries of a
relational sub-table. Validation at the read-boundary
(`coerceStats` / `coerceActivities`) defends against accidental
shape drift if a row gets hand-edited via the DB; defensive
filtering drops malformed rows rather than crashing the render.

### `introHeading` stored as raw HTML (Decision A from CP4.1)

The pre-Phase-4 page rendered
`Building Industry-Ready <span class="text-gradient">Mechanical Engineers</span>`
— the gradient on the last two words was load-bearing visual.
Preserving zero visual regression on launch required either
storing the heading as HTML (rendered via
`dangerouslySetInnerHTML`) or splitting it into two columns
(awkward for one-off). Chose HTML storage with the same
author-trust caveat as Phase 2 messageParagraphs. Audience is
the chair; layer DOMPurify when the editor audience widens.

### Lab pages deferred together (Decision D refinement from chair)

CP4.1 surfaced both `/about/lab-facility` and
`/about/laboratory-facility` as multi-row. Chair confirmed both
are intentionally separate concepts with distinct shapes. To
avoid any "half-Phase-4 half-Phase-5" state on the Lab
surface, Phase 4 leaves **both pages entirely untouched**, and
Phase 5 will deliver both Lab systems together (each with its
own Landing singleton + Lab list table + admin section + public
wiring).

### `ImageUploader.onChange` callback for embedded uploads

`ActivitiesEditor` needs each activity row to own its own
image upload, but the row's image URL/publicId must be
serialized into the parent component's JSON-encoded hidden
input rather than colliding `${name}Url`/`${name}PublicId`
hidden inputs at the form level. Solution: an optional
`onChange?: (url, publicId) => void` callback on
`ImageUploader`. When provided, hidden inputs are skipped and
the parent owns the persistence. Backward-compatible — every
existing call site omits `onChange` and behaves as before.

### `ParagraphsEditor` moved to `src/components/admin/`

CP4.2 needed the editor in two unrelated feature folders
(Faculty messageParagraphs + AboutOverview paragraphs). Moved
to `src/components/admin/` and generalized to take `name` +
`helpText` props. Faculty form updated to pass
`name="messageParagraphs"` explicitly. Avoids importing
across feature folders.

### Public wiring fail-loud on missing singleton

Each public page has an explicit
`if (!row) throw new Error(... Run npm run db:seed)` guard.
If a singleton row gets deleted from Neon (no admin path
allows this, but DB hand-edits could), the corresponding
`/about/*` route 500s loudly rather than silently rendering a
broken hero. Acceptable risk for the production safety net.

### Chrome revalidate scope: page-only, not layout

About admin actions call `revalidatePath('/about/<route>')`
(page scope) rather than `revalidatePath('/', 'layout')`. The
About content doesn't feed the root layout chrome — it's
self-contained to its own route. Saves a layout-wide
invalidation per About save.

## Verification

All testing was **manual** (curl smoke + browser) — same as
Phases 0–3; no automated suite in scope.

### Per-sub-step curl smoke (local, before push)

- **CP4.1** — `npx prisma migrate dev --name add_about_pages`
  applied; `npx prisma db seed` confirmed 3 singleton rows
  created with all fields populated; sample dump verified
  paragraphsCount=4, statsCount=4, activitiesCount=6,
  introHeading contains `<span class="text-gradient">` markup.
- **CP4.2** — typecheck clean; 3 new admin paths return 307
  (auth redirect) when unauthenticated; 6 public About routes
  unchanged 200 (3 new wirings deferred to CP4.3 — still
  rendering from hardcoded source at this checkpoint).
- **CP4.3** — typecheck clean; 5 about routes 200; curl HTML
  fingerprint confirms Department Overview title, mission
  body snippet, Mission + Vision headings, gradient span
  markup preserved on "Mechanical Engineers", all 4 stats
  values present, all 6 activity titles present.

### Production browser end-to-end

After `vercel deploy --prod` from branch HEAD (one deploy, no
retry):

| Test | Result |
|------|--------|
| `/about/overview` visual identical to pre-Phase-4 prod | ✓ |
| `/about/mission-vision` visual identical | ✓ |
| `/about/mecha-club` visual identical (gradient, stats, activities, CTAs all rendering) | ✓ |
| `/about/lab-facility` + `/about/laboratory-facility` zero regression (Phase 5 scope) | ✓ |
| Admin → `/admin/about-overview` → edit paragraph → save → `/about/overview` updated without hard refresh | ✓ |
| Admin → `/admin/about-mecha-club` → edit stat → `/about/mecha-club` updated | ✓ |
| Admin → `/admin/about-mission-vision` → edit Mission heading → updated | ✓ |
| Phase 2/3 regression sample (Faculty list, /admin/nav, /admin/footer-links) unchanged | ✓ |
| DevTools console clean across all tested public + admin pages | ✓ |

## Tech debt notes

In addition to the Phase 5+ deferrals above:

- **No DB-level shape validation on `stats` + `activities`
  Json columns** — Zod validates at the write boundary,
  `coerceStats`/`coerceActivities` defend at the read
  boundary. Acceptable trade-off; DB-level shape enforcement
  would require either splitting Json into FK tables or a
  Postgres check constraint with hand-written JSON schema.
- **`dangerouslySetInnerHTML` in
  `introHeading + paragraphs[]`** — carried-forward Phase 2
  author-trust caveat. Layer DOMPurify when editor audience
  widens beyond the chair.
- **`IconMap` in Mecha Club is curated** — 16 Lucide icons
  cover the seed + datalist hints; admin can type any
  Lucide name and get a `Sparkles` fallback (same Phase 1
  ResearchArea pattern). Either expand to all Lucide or
  constrain the admin form to the curated set.
- **`package.json#prisma` deprecation warning** — carried
  forward from Phases 2/3; harmless until Prisma 7.
- **`ImageUploader.onChange` doesn't fire the "best-effort
  Cloudinary delete on clear"** for the parent state path —
  wait, it does (`clearImage` runs the same `try/swallow`
  delete before calling `onChange?.('', '')`). Documented
  here for future-me reading the diff.
- **No automated tests** — same as prior phases. Highest-
  payoff additions for Phase 4: a Playwright smoke for the
  super_admin → public revalidation flow on all 3 About
  pages, Vitest for `coerceStats`/`coerceActivities` shape
  drift defenses.

## Commit list

```
decdba6 feat(phase-4): CP4.3 — About pages wired from DB (Overview, Mission & Vision, Mecha Club)
5d3581d feat(phase-4): CP4.2 — admin layer for 3 About pages (server actions + API routes + admin UI + sidebar group)
06fb568 feat(phase-4): CP4.1 — About pages schema + seed from current hardcoded content
```

3 commits — all `feat`, one per CP. No `fix` mid-flight
(unlike Phases 2 + 3); the Phase 3 hydration learnings carried
forward and combined admin pages here (only the Mecha Club
form has 5 cards but no SortableList instances at the form
level, so the useId fix wasn't needed in this phase). No
`chore` either — the hygiene items shipped in Phase 3 covered
the deferred Phase-spanning work.

Diff vs `main`: **28 files changed, +1,761 / −203**.

## Deployment notes

- Production deploy: `vercel deploy --prod` from this feature
  branch. Working tree clean throughout (no stash → deploy →
  pop dance; admission/requirements local edit was finally
  committed in Phase 3).
- Production deployment ID:
  `dpl_Dkjsqy76oKqyRNUVwsAzeiPJkAx3`.
- Production alias `mechanical-engineering-olive.vercel.app`
  attached automatically by Vercel.
- Schema migration `20260516103221_add_about_pages` was
  applied to the Neon DB during local CP4.1 work. Same Neon
  DB serves local + production, so all 3 new tables + seeded
  singleton rows existed in production **before** any Phase 4
  code reached prod. Nothing extra ran at deploy time.
- No env-var changes. The Phase 0 set fully covers Phase 4.
- Build log: `prisma generate` 291ms, `next build` compile
  15.4s, **121 static pages** (up from Phase 3's 115 — the 3
  new `/admin/about-*` pages + 3 new `/api/admin/about-*`
  routes), ~2m end-to-end.
- **First deploy attempt succeeded** — no retry needed (the
  Phase 2 build-chain fix carries forward).
