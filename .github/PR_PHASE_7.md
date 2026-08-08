# Phase 7 — Student Society + Campus Services (final CMS migration)

## Scope

Closes out the last batch of file-based content: Alumni, Clubs,
FAQ, Visitors, Research Papers, Bus Routes, Syllabus, and the
Transport Service page chrome. Same playbook as Phase 2-6 —
hardcoded `*-data.ts` sources move to Prisma-backed CMS, admin
sections built, public pages re-wired against DB rows.

**`src/lib/search-index.ts` declared 100% DB-driven** at the end
of CP7.3. All 5 Phase-6-deferred file-based imports (`faqs`,
`clubs`, `alumni`, `researchPapers`, `busRoutes`) replaced with
Prisma reads across the existing 8 Phase 2/5/6 DB entities + 7
new Phase 7 entities = **15 DB entities indexed**, no file
imports anywhere outside the seed script.

**`src/app/sitemap.ts` fix** — the Phase 6 leftover that kept
reading `faculty-data` / `events-data` / `news-data` from frozen
arrays is now a server-async function with `prisma.faculty/event/
news.findMany({ select: { slug: true } })`. Sitemap counts on
production: 26 static + 41 Faculty + 7 Event + 6 News = **81 URLs**.

After Phase 7, **every visible user-facing surface is DB-driven**
except the 6 `/admission/*` singleton pages (Decision A —
intentionally deferred). The "Project CMS-complete" inventory is
at the bottom of this PR.

### Schema additions (one migration: `add_student_society`) — 8 new models

Multi-row (7):
- `Alumni` — `slug @unique`, studentId, name, department,
  designation, company, optional photo, `displayOrder`
- `Club` — `slug @unique`, name, abbreviation, description,
  imageUrl, `displayOrder`
- `Faq` — category (5-enum Zod-validated), question, answer,
  `displayOrder` + `@@index([category])`
- `Visitor` — `slug @unique`, name, optional role / affiliation,
  photoUrl, **`quote Json`** (`string[]` paragraphs — reuses
  Phase 2 `ParagraphsEditor`), `displayOrder`
- `ResearchPaper` — title, authors, area (all `@db.Text`),
  free-form `date String?` + structured `publicationYear Int?`
  for optional sort (Decision F), `displayOrder` + `@@index
  ([publicationYear])`
- `BusRoute` — `slug @unique`, routeName, busNumber, contact,
  `departureTimes String[]` + `returnTimes String[]` paired
  arrays, `displayOrder`
- `Syllabus` — `slug @unique`, title, shortTitle, department,
  level (UG/PG Zod-validated), coverUrl, **optional `pdfUrl` +
  `pdfPublicId` + `pdfFileName`** (Cloudinary raw via Phase 6's
  `accept='application/pdf'` on ImageUploader — no new
  component), summary, `displayOrder`

Singleton (1):
- `TransportLanding` — `id="singleton"`, introBody, bannerHeading,
  bannerBody (HTML allowed), **`instructions Json`** with shape
  `{iconName, title, description}[]` matching Phase 5
  `LaboratoryFacility.features` 1:1 so `FeaturesEditor` reuses
  with zero new code

### Seed extension (`scripts/seed.ts`) — idempotent count-gated
bulk insert. Source data preserved verbatim from each `*-data.ts`
file (alumni / clubs / faq / visitors / research / transport);
Syllabus + TransportLanding inlined from their hardcoded page
sources:

- Alumni: 6 rows (slug = source `id`)
- Clubs: 13 rows
- FAQs: 33 rows — `displayOrder` by source array index;
  category groups: Admission 9, Programs 6, Campus 6, Rankings
  6, Exams 6
- Visitors: 4 rows; `quote` stored as Json `string[]` (single-
  paragraph rows are length-1 arrays)
- ResearchPapers: 17 rows; `parseYearFromDate` regex extracts
  4-digit year for `publicationYear` ("14 August 2019" → 2019,
  null → null, "January–February 2023" → 2023). All 17 row years
  verified at seed time.
- BusRoutes: 10 rows; String[] times preserved
- Syllabus: 1 row (B.Sc. Mechanical Engineering with current PDF
  path)
- TransportLanding: singleton with intro + banner + 3 instructions
  Json (MapPin / Sparkles / Bus icons)

**Total: 84 multi-row + 1 singleton = 85 rows.**

### Cloudinary helper — 5 new kinds (within ImageUploader
`accept` flexibility, no new component per constraint #4):

- `alumni-photo`, `club-image`, `visitor-photo` — image folders
- `syllabus-cover` — image
- `syllabus-pdf` — uses `accept='application/pdf'`; Cloudinary
  `auto/upload` auto-detects PDF + returns raw resource_type

### Admin layer (CP7.2 — 36 + 22 = 58 files)

- **8 server actions** (`src/lib/admin-actions/`) — 7 multi-row
  with create/update/delete/reorder, 1 singleton with upsert.
  All multi-row mutations call `revalidatePath('/', 'layout')` in
  addition to the entity-specific paths so the cross-cutting
  search-index in the root layout picks up DB changes
  immediately.
- **22 API routes** under `src/app/api/admin/` — list+create POST,
  per-id GET/PUT/DELETE, reorder POST (matches Phase 5/6 pattern).
- **Zod schemas** added to `validation.ts`: 8 create + 8 update
  schemas + 3 enums (`faqCategoryEnum`, `syllabusLevelEnum`,
  `transportInstructionsSchema`).
- **Admin UI** (`src/app/admin/(authed)/`) — each entity:
  `page.tsx` (server-side list) + `XList.tsx` (client
  SortableList + delete) + `XForm.tsx` (`useActionState`) +
  `new/page.tsx` + `[id]/page.tsx`. Singleton transport-landing
  has just `page.tsx` + `TransportLandingForm.tsx`.
- **Sidebar** gains 2 new collapsible groups: "Student Society"
  (6 entities — UserCircle2 / Users2 / HelpCircle / Sparkles /
  Library / BookText icons) and "Campus Services" (2 entities
  — Bus / Map icons). Each auto-opens on active route.
- **Dashboard** gains 7 new stat cards + 8 new action cards.

### Public wiring (CP7.3 — 8 surfaces re-rendered from DB)

- `/student-society/alumni` — flat grid; drops `alumni-data.ts`
  import
- `/student-society/club-list` — directory grid; drops
  `clubs-data.ts`
- `/student-society/faq` — split server (fetch) + client
  (FAQList.tsx refactored to accept `faqs` prop; `openId` typed
  `string | null` to match cuid id)
- `/student-society/visitor` — server-rendered cards with
  `coerceParagraphs` on `Visitor.quote` Json
- `/student-society/syllabus` — split server + client
  (SyllabusClient.tsx; filter + search + UG/PG empty-state UX
  preserved); drops inline JSX const
- `/research` — drops `research-data.ts`; row index used as
  visible numbering 1-N (legacy `paper.id` was the sequential
  number)
- `/transport-service` — fully DB-driven: BusRoute grid from
  `getBusRoutes()` + TransportLanding singleton from
  `getTransportLanding()`. `InstructionIconMap` curates 9
  Lucide names with `Info` fallback. `dangerouslySetInnerHTML`
  on `bannerBody` + instruction descriptions preserves the
  inline HTML (yellow-strong + tel: links) pattern.

### `lib/identity.ts` — 8 new cache()-wrapped fetchers

`getAlumni / getClubs / getFaqs / getVisitors /
getResearchPapers / getBusRoutes / getSyllabi /
getTransportLanding`.

### `src/lib/search-index.ts` — declared 100% DB-driven

- Drops all 5 Phase-6-deferred file imports
- `getSearchIndex()` now aggregates 15 DB tables + 26 static
  page entries
- `SearchItem` type extended with `Visitor` + `Syllabus`;
  `SearchOverlay` TYPE_BADGE_COLOR gets fuchsia + lime entries
- Phase 6 hotfix server-only boundary still holds —
  `src/lib/search.ts` (pure module, no Prisma) is what client
  components import; `search-index.ts` stays server-only

### `src/app/sitemap.ts` — DB read fix

- Drops `faculty-data` / `events-data` / `news-data` stale
  imports
- Now `async function sitemap()` with `prisma.faculty/event/
  news.findMany({ select: { slug: true } })`
- Verified on production: 81 URLs total (26 static + 41 Faculty
  + 7 Event + 6 News)
- Also adds `/student-society/visitor` and `/gallery` to the
  static routes list (were missing pre-Phase-7)

## Out of scope (deferred to Phase 8 hygiene)

- **6 `/admission/*` singleton pages** — Decision A. 1,396 LOC
  of structured hardcoded JSX (fee tables, scholarship rules,
  transfer credit policy). Distinct theme (admission policy ≠
  student society); admin policies change quarterly, not weekly
  — lower CMS urgency than News/Events/Notices. Phase 8 will
  decide whether to: (a) build per-page singleton models, (b)
  fold `/admission/notice` into the existing Notice table with
  `category='Admission'` extension + leave the other 5
  hardcoded, or (c) keep all 6 hardcoded permanently.
- **`*-data.ts` file deletion (12 files)** — Decision H. Still
  imported by `scripts/seed.ts` for first-time bootstrap. Phase
  8 will inline the seed data + delete the files in one atomic
  cleanup commit. Search-index already cut all file reads, so
  the files exist purely as seed shims.
- **`faculty-data.ts SectionContent` type relocation** — the
  `/faculty-member/[slug]/page.tsx` import is type-only,
  tree-shaken out of runtime, no Prisma transitive issue.
  Cosmetic cleanup for Phase 8.

## Architectural decisions

### Decision A — 6 `/admission/*` singletons deferred to Phase 8

See "Out of scope" above. Phase 8 is a chair-driven scope
decision; not technically gated.

### Decision B — TransportLanding singleton, reuse FeaturesEditor

Banner heading + body + 3-item instructions card are hardcoded
JSX wrapping the data-driven `busRoutes` grid. Modeled as a
singleton with `instructions Json` matching Phase 5
`LaboratoryFacility.features` shape 1:1 (`{iconName, title,
description}[]`) so `FeaturesEditor` reuses without forking.

CP7.2 mid-flight detail: the initial seed used `body` as the
description field name; the FeaturesEditor uses `description`.
Pivoted the JSON shape via a one-shot Prisma update on the
existing singleton row (no migration needed — Json column
internal shape is part of the JSON payload, not the schema).
Updated seed + Zod simultaneously so re-seeding gets the
correct shape.

### Decision C — Visitor.quote as Json `string[]`

Same pattern as Phase 6 News.body / Event.description. Reuses
Phase 2 `ParagraphsEditor` + Phase 6 `coerceParagraphs` defense.
Single-paragraph rows store as length-1 arrays; UX supports
multi-paragraph quotes for future visitor entries.

### Decision D — Syllabus multi-row with `slug @unique`

Current data has 1 row. Modeled as multi-row anyway because:
- Existing render has UG/PG filter + "PG coming soon"
  empty-state — structurally expects multi-row growth
- Schema consistent with News/Events/Lab/Notice patterns
- Trivial to single-out by slug if needed

PDF upload reuses `ImageUploader` with `accept='application/pdf'`
(Phase 6 extension) + `onChange` callback owning `pdfUrl`,
`pdfPublicId`, `pdfFileName` as 3 hidden inputs. No new
component (constraint #4).

### Decision E — FAQ cuid + `displayOrder` + category index

Legacy data used sequential `id: number` (1-33). DB uses cuid +
`displayOrder Int` for admin reorder. Category groups stay the
same; render-side category filter unchanged.

Mid-flight client refactor: `FAQList.tsx`'s `openId: number | null`
became `string | null`; the legacy `faqs` + `faqCategories`
imports from `faq-data.ts` replaced with a `faqs` prop +
inline `ALL_CATEGORIES` const.

### Decision F — ResearchPaper.date free-form String? + publicationYear Int?

Source data has 5 inconsistent date shapes — `"14 August 2019"`,
`"January–February 2023"`, `"September 2022"`, `"2023"`, `""`
(empty). No reliable DateTime parse possible. Schema stores
both:
- `date String?` — verbatim free-form display
- `publicationYear Int?` — best-effort 4-digit year regex
  extraction for optional structured sort/filter

Public page render unchanged; admin form has both fields with
guidance text explaining the relationship.

### Decision G — Club.name + Club.abbreviation as separate required columns

Source has both ("SU Debate Club" + "SUDC"). Render uses both.
Both required at admin entry. No name-derived abbreviation
heuristic.

### Decision H — `*-data.ts` deletion deferred to Phase 8

Phase 7 search-index achieves the user-visible goal (100%
DB-driven, no file reads in user-facing paths). The 12
`*-data.ts` files remain on disk solely for `scripts/seed.ts`
bootstrap. Phase 8 hygiene pass:
- Inline seed data directly in seed functions
- Delete 12 files in one atomic commit
- Update memory `project_data_sources.md` accordingly

This is **not** premature cleanup risk because the seed only
runs on `npm run db:seed`, never at runtime.

### Decision (mid-flight) — TransportLanding Json shape pivot

Surfaced inside CP7.2: kept FeaturesEditor (Phase 5) reusable
by renaming the seed's `body` field to `description` to match
the existing Phase 5 `features` shape. Avoided forking
FeaturesEditor; ran a one-shot Prisma update on the existing
singleton row to align the field name in the DB. Documented in
seed.ts comment for future maintainers.

### Decision (mid-flight) — BusRoute String[] via newline textarea

Considered a dedicated client-side `StringListEditor` component
for `departureTimes / returnTimes`. Picked the simpler textarea
+ server-side `parseNewlineList` (split on `\r?\n`) for the 1-3
entries per route. Trade-off: admin can't tell "empty line"
from "typo" but the input volume is too low to warrant the UX
complexity. No new component.

### Decision (mid-flight) — Newline TransportLanding instructions stay HTML-allowed

Same author-trust pattern as Phase 2/4/6 — `dangerouslySetInnerHTML`
on `bannerBody` + `instructions[].description` preserves the
inline `<strong class="text-button-yellow">…</strong>` highlights
and `<a href="tel:…">…</a>` links seeded from the pre-Phase-7
hardcoded markup. Future hardening with DOMPurify if the editor
audience widens.

## Verification

### Per-checkpoint local

CP7.1 — Migration applied (`add_student_society`), 85 seed rows
total (6+13+33+4+17+10+1+1). Sample dumps confirmed slug / Json /
String[] / year-parse all intact. Typecheck clean.

CP7.2 — Dev server boots; 16 new admin pages 307 → `/admin/login`
(auth-gated); 8 API routes 401 unauthenticated. No compile errors.
Typecheck clean. Mid-flight Prisma idle-disconnect surfaced during
chair browser verify — diagnosed as Neon serverless connection
drop after long-running dev session + mid-session Prisma client
regeneration. **Not a Phase 7 code bug**; resolved by dev server
restart. Won't recur in production (Vercel each-invocation
fresh-pool model).

CP7.3 — 9 public routes 200; sitemap.xml DB-driven (Faculty 41 +
Event 7 + News 6 = 81 URLs); content fingerprints verified
(alumni names, transport banner, FAQ category badges, search
overlay). Typecheck clean.

### Production browser end-to-end

Chair verified on `mechanical-engineering-olive.vercel.app`:
- 7 Phase 7 public pages render with DB content
- Admin → public revalidation chain across all 8 entities
- Search overlay returns Phase 7 entities (Alumni / Club / FAQ
  / Visitor (fuchsia badge) / Research / Transport / Syllabus
  (lime badge)) with correct type-badge colors
- Sitemap.xml hits production-current slugs

## Tech debt notes

- **`*-data.ts` legacy files** — Phase 8 hygiene: inline seed
  data, delete 12 files (`faculty-data.ts`, `labs-data.ts`,
  `news-data.ts`, `events-data.ts`, `notices-data.ts`,
  `gallery-data.ts`, `alumni-data.ts`, `clubs-data.ts`,
  `faq-data.ts`, `research-data.ts`, `transport-data.ts`,
  `visitors-data.ts`). Net `+~600 / −~600` LOC inline-vs-import
  swap.
- **6 `/admission/*` singletons** — Phase 8 scope decision per
  Decision A.
- **`faculty-data.ts` SectionContent type re-import** —
  `faculty-member/[slug]/page.tsx` still imports the type as
  type-only; tree-shaken at runtime. Move to `src/types/
  faculty.ts` during Phase 8 hygiene.
- **No `server-only` marker on `search-index.ts`** — Phase 6
  carry-forward. Convention-only documentation in header
  comment until the `server-only` npm package gets installed.
- **No DB-level shape validation on `Visitor.quote` /
  `TransportLanding.instructions` Json columns** — Zod
  validates at write boundary; `coerceParagraphs` /
  `coerceInstructions` defend at read boundary. Acceptable
  trade-off, matches Phase 4/5/6 Json patterns.
- **`dangerouslySetInnerHTML`** carried forward on
  `TransportLanding.bannerBody` + instruction descriptions
  (author-trust caveat).
- **No automated tests** — same as prior phases. Highest-
  payoff additions for Phase 7+: Playwright smoke per entity
  for the admin-publish → public-revalidate chain; Vitest for
  `parseYearFromDate` (the only non-trivial seed-time parser)
  and `coerceInstructions`.
- **`package.json#prisma` deprecation warning** — Prisma 6.19
  warns about config moving to `prisma.config.ts` in Prisma 7.
  Carried forward; harmless until upgrade.

## Commit list

```
d306392 feat(phase-7): CP7.3 — public wiring + search-index 100% DB-driven + sitemap.ts fix
a63725f feat(phase-7): CP7.2 — admin layer for 8 entities (7 multi-row + TransportLanding singleton)
03f1c50 feat(phase-7): CP7.1 — Student Society schema + seed (7 multi-row + 1 singleton, 85 rows)
```

3 commits — all `feat`, one per CP. No `fix` mid-flight (the
Phase 6 Prisma-in-browser hotfix's `src/lib/search.ts` split
held perfectly; Phase 7's search-index expansion stayed
strictly server-side).

Diff vs `main`: **89 files changed, +5,237 / −569**.

## Deployment notes

- Production deploy: `vercel deploy --prod` from this feature
  branch at `d306392`. Working tree clean throughout.
- Production deployment ID: `dpl_FWcmamhfkv8sDe4sXAff2TJbYSQe`.
- Production alias `mechanical-engineering-olive.vercel.app`
  re-pointed automatically by Vercel.
- Schema migration `20260517065524_add_student_society` was
  applied to the Neon DB during local CP7.1 work. Same Neon
  DB serves local + production, so all 8 new tables + seeded
  rows existed in production **before** any Phase 7 code
  reached prod. Nothing extra ran at deploy time.
- TransportLanding instructions Json key pivot (`body` →
  `description`) was a one-shot Prisma update on the existing
  singleton row during CP7.2 — no migration, no admin re-entry
  needed.
- No env-var changes. The Phase 0 set still covers everything.
- Build log: `prisma generate` ~300ms, `next build` ~2m
  end-to-end. Static page count up by 16 new admin routes +
  7 new public-content surfaces (sitemap entries).
- **First deploy attempt succeeded** — Phase 2 build-chain fix
  carries forward.

---

## 🎉 Project CMS-complete declaration

**After Phase 7 merge, every visible user-facing surface on the
Department of Mechanical Engineering site is DB-driven and
super_admin-editable through the admin CMS** — except 6
admission policy pages that are intentionally kept hardcoded
per Decision A.

### Full DB-driven inventory (15 entities, 7 phases)

| Phase | Entities |
|---|---|
| 0 | Auth (User / Session / Account), Cloudinary upload signing |
| 1 | DepartmentIdentity, UniversityIdentity, Program, ResearchArea |
| 2 | Faculty (with Dean + Head message extras) |
| 3 | TopLink, QuickAccessItem, MainNavGroup + MainNavItem, Footer{Useful, GetInTouch, Quick, Legal}Link |
| 4 | AboutOverview, AboutMissionVision, AboutMechaClub |
| 5 | LabFacilityLanding + Lab, LaboratoryFacilityLanding + LaboratoryLab |
| 6 | News, Event, Notice, GalleryImage |
| 7 | Alumni, Club, Faq, Visitor, ResearchPaper, BusRoute, Syllabus, TransportLanding |

**Total: 32 Prisma models** (excluding User/Session/Account).
**Total seeded rows**: ~250+ across all phases.

### User-facing surfaces — all DB-driven

| Path | DB-driven since |
|---|---|
| `/` (hero / programs / research / labs / news / events / notices) | Phase 5/6 |
| `/about/{overview, mission-vision, mecha-club, deans-message, message-from-head, lab-facility, laboratory-facility}` | Phase 2/4/5 |
| `/faculty-member` + `/[slug]` | Phase 2 |
| `/news` + `/[slug]` + pagination | Phase 6 |
| `/student-society/events` + `/[slug]` | Phase 6 |
| `/student-society/notice-board` | Phase 6 |
| `/student-society/alumni` | **Phase 7** |
| `/student-society/club-list` | **Phase 7** |
| `/student-society/faq` | **Phase 7** |
| `/student-society/visitor` | **Phase 7** |
| `/student-society/syllabus` | **Phase 7** |
| `/research` | **Phase 7** |
| `/transport-service` | **Phase 7** |
| `/gallery` | Phase 6 |
| Global search overlay (Navbar) | Phase 6 / **fully DB Phase 7** |
| `/sitemap.xml` | **Phase 7 fix** |

### Remaining hardcoded surfaces (intentional, Phase 8+ decision)

- `/admission/notice` (141 LOC) — single notice document
- `/admission/prospectus` (179 LOC)
- `/admission/requirements` (163 LOC)
- `/admission/transfer-credits` (179 LOC)
- `/admission/tuition-fees` (296 LOC — fee tables)
- `/admission/waiver-scholarship` (438 LOC — eligibility tables)
- `/contact` — static page (no dynamic data shape)

Total: **1,396 LOC of structured admission policy JSX** + 1
static contact page. Chair decision pending whether to model
these or keep static.

## Pipeline forward

### Phase 8 (optional hygiene)

- **`*-data.ts` deletion** — 12 files, atomic commit.
  Inline seed data first, then delete imports. Net LOC neutral.
- **Admission CMS** — chair decides scope per Decision A.
  Likely scope: 6 singleton models with `paragraphs Json` /
  `tables Json` Json columns, single admin section "Admission
  Pages" collapsible group.
- **`faculty-data.ts` SectionContent type relocation** —
  cosmetic 1-file move.
- **`server-only` marker** — `npm install server-only` + add
  imports to `search-index.ts` and any other server-only
  modules. Belt-and-suspenders for future client-bundle
  accidents.

### Optional Phase 9 (deferred features observed during 0-7)

- News pagination cursor → keyset (currently offset-based)
- `News.isFeatured` flag for date-independent homepage feature
  override (Phase 6 Decision A held)
- Album hierarchy on Gallery (Phase 6 Decision A held)
- Playwright smoke + Vitest coverage
- DOMPurify on HTML-allowed columns

None of these are user-facing blockers; the site is fully
operational and admin-controllable for every regularly-changing
content surface as of Phase 7 merge.
