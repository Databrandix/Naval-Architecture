# Phase 6 — Content hubs (News / Events / Notices / Gallery) + search-index migration

## Scope

Closes out the four "ongoing content" entities the department
publishes regularly: news posts, events with status / category
filters, notices with PDF-or-image attachments, and a photo
gallery. Same playbook as Phase 2-5 — hardcoded `*-data.ts`
sources move to Prisma-backed CMS, admin sections built, public
pages re-wired against DB rows.

This phase also folds in the **`src/lib/search-index.ts`
migration**: previously file-based reads of `faculty-data` and
`labs-data` (stale since Phase 2 / Phase 5 made those entities
DB-driven) and the in-scope four new entities all flow through
a single server-side aggregator that's passed to the client
search overlay as a prop. **Decision F2 architecture — server
fetch, ship to client, filter locally.**

After Phase 6, every multi-row structural content entity AND
every content hub the department publishes regularly is
DB-driven. Phase 7+ shrinks to the Student Society sub-pages
(Alumni, Clubs, FAQ, Visitors, Transport, Syllabus).

- **Schema additions** (one migration: `add_content_hubs`) — 4
  new models:
  - `News` — `slug @unique`, title, shortTitle, category (6-enum
    validated by Zod), `publishedAt DateTime` (sort key) +
    optional `displayDate String` override, summary, cover
    image, **`body Json`** (`string[]` paragraphs), **`meta Json`**
    (`{label,value}[]` for participants / location / organiser).
  - `Event` — `slug @unique`, title, shortTitle, category
    (6-enum), status (Past / Current / Upcoming — admin-set),
    `eventDate DateTime?` (nullable, sort key) +
    `displayDate String?` override, time, venue, image,
    summary, **`description Json`** (`string[]`), focus,
    **`details Json`** (`{label,value}[]` for chief guest /
    chairperson rows), optional CTA (`label / href / external`).
  - `Notice` — `slug @unique`, title, category (3-enum:
    Academic / Holiday / Transport), department, `publishedAt`
    + `displayDate?`, description; **file attachment** as
    `fileUrl / filePublicId / fileType / fileName` (all nullable
    so metadata-only saves work). Image AND PDF accepted via
    Cloudinary `auto/upload`.
  - `GalleryImage` — flat masonry (Decision A — no album
    hierarchy). `imageUrl / imagePublicId / alt / width / height`,
    `displayOrder` for admin drag-reorder.

- **Seed extension** (`scripts/seed.ts`) — idempotent
  `count > 0` skip on each table; create-path values transcribed
  verbatim from each pre-Phase-6 hardcoded source:
  - News: 5 rows from `news-data.ts` — `isoDate → publishedAt`,
    raw `date` preserved as `displayDate` so the public render
    is byte-identical until admin edits.
  - Events: 6 rows from `events-data.ts` — best-effort date
    parse via `"DD Mon, YYYY"` regex; null / `"2024"` / `"20 Apr"`
    keep `eventDate = null` with `displayDate` populated;
    status preserved.
  - Notices: 6 rows from `notices-data.ts` — `fileUrl` points
    at existing `/assets/notices/<slug>.<ext>` so live notices
    keep working until admin re-uploads to Cloudinary;
    `filePublicId = null` flags "not yet on Cloudinary".
  - Gallery: 27 rows from `gallery-data.ts` (programmatically
    generated 27-entry dimensions array) — `imageUrl`
    `/assets/gallery/<NN>.webp`, `imagePublicId = null`.

- **Admin layer** — 4 sections under `/admin/{news,events,notices,gallery}`:
  - **Server actions** (4 files in `src/lib/admin-actions/`) —
    create / update / delete per entity + reorder for Gallery
    (others use date-field sort, no drag UI). `revalidatePath`
    targets per entity: News revalidates `/news` + `/news/<slug>`
    + `/` (homepage NewsSection); Events revalidates
    `/student-society/events` + `/<slug>` + `/`; Notices
    revalidates `/student-society/notice-board` + `/`; Gallery
    revalidates `/gallery` only.
  - **API routes** (9 files in `src/app/api/admin/`) — list +
    create POST, per-id GET / PUT / DELETE, plus
    `gallery/reorder` POST. Matches Phase 5 pattern.
  - **Admin UI** (20 files) — each entity: `page.tsx` (list,
    server) + `XList.tsx` (client, edit + delete + optional
    reorder) + `XForm.tsx` (`useActionState`) + `new/page.tsx`
    + `[id]/page.tsx`. Sidebar gains a "Content Hubs"
    collapsible group with 4 children (Newspaper / CalendarDays
    / Megaphone / Image icons). Dashboard gains 4 new stat cards
    + 4 new action cards.

- **Cloudinary** — 4 new `kind` entries: `news-cover`,
  `event-image`, `notice-file`, `gallery-image`. Folder layout
  follows the Phase 0 convention (`<root>/<sub>`). PDF uploads
  for `notice-file` use the same `auto/upload` endpoint;
  `format` field in the response disambiguates image vs PDF
  client-side.

- **Reused components**:
  - `ImageUploader` — extended with optional `accept` prop
    (default `'image/*'` preserves all Phase 0-5 usages;
    `'image/*,application/pdf'` enables `notice-file`) + a
    `UploadMeta` extension with `fileType / fileName / width /
    height` so Notice forms can persist 4 paired fields without
    forking the component (Decision B no-fork) and Gallery forms
    can auto-populate width / height from the Cloudinary
    response.
  - `ParagraphsEditor` — reused as-is for `News.body` and
    `Event.description`.
  - `SortableList` — reused for `/admin/gallery` drag-reorder.

- **New shared component**:
  - `KeyValueListEditor` — `{label, value}[]` editor with
    add / remove / reorder. Used by `News.meta` and
    `Event.details`. Single JSON-encoded hidden input pattern,
    matches Phase 4 `StatsEditor` / `ActivitiesEditor`.

- **Public pages re-wired** (8 surfaces, all server-side reads
  via `cache()`-wrapped `lib/identity` fetchers):
  - Homepage NewsSection (top 5 by `publishedAt DESC`),
    EventsSection (top 3 by `eventDate DESC NULLS LAST,
    createdAt DESC`), NoticesSection (top 5 by `publishedAt
    DESC`).
  - `/news` — offset pagination `?page=N` (12 per page).
    Pagination nav rendered when `totalPages > 1`.
  - `/news/[slug]` — `generateStaticParams` from
    `getNewsSlugs()`; defensive `coerceParagraphs` +
    `coerceKeyValueList` on the `body` / `meta` Json columns;
    related fetched live (top 3 newest excluding current).
  - `/student-society/events` + `/[slug]` — split server (fetch)
    + client (`EventsClient.tsx` filter pills). Static params
    from `getEventSlugs()`. Display date uses `displayDate`
    when set, falls back to `eventDate` formatted server-side.
  - `/student-society/notice-board` — split server + client
    (`NoticesClient.tsx` filter pills). File buttons render
    conditionally based on `fileUrl` / `fileType`.
  - `/gallery` — `GalleryGrid` refactored to accept `images`
    prop (drops `gallery-data.ts` import). Masonry + lightbox
    preserved 1:1.

- **search-index — Decision F2 architecture**:
  - `getSearchIndex()` (server-only, `cache()` wrapped) —
    aggregates 8 DB tables (Faculty, Programs, ResearchArea,
    Lab, News, Event, Notice, GalleryImage) + 5 still-file-
    based arrays (FAQs, Clubs, Alumni, Research Papers,
    Transport) + 26 static page entries.
  - Root `layout.tsx` calls `getSearchIndex()` once per
    request, skips on `/admin/*` where Navbar isn't rendered
    anyway. Passes `SearchItem[]` down through Navbar →
    SearchOverlay.
  - Client-side `search(query, items, limit)` lives in
    `src/lib/search.ts` (pure module, no Prisma) so client
    bundles don't pull the server-only `search-index.ts`
    chain. `SearchItem.type` extended with Notice / Program /
    ResearchArea / Gallery.

## Out of scope (deferred / forbidden)

- **`/admission/notice`** — single hardcoded JSX notice
  (Summer-2026 admission ceremony). Decision G — out of Phase
  6 scope. Future micro-phase OR chair-driven redesign call
  (could become an `AdmissionNotice` singleton like the About
  pages, or fold into Notice with a featured flag).
- **Phase 7+ entities** — FAQs, Clubs, Alumni, Research Papers,
  Transport routes (bus routes) remain file-based. The
  search-index keeps reading their `*-data.ts` files as a
  transitional shim until those entities migrate.
- **`faculty-data.ts` / `labs-data.ts` file deletion** — stale
  since Phase 2 / Phase 5 respectively, no consumers remain
  after Phase 6 (search-index now reads from DB). Files are
  kept on disk as no-ops; deletion is a one-line cleanup left
  for a Phase 7 hygiene pass.
- **Pagination on Events / Notices / Gallery** — Decision E
  applied: News only, 12/page offset. Other lists stay
  unpaginated until row counts warrant the UI complexity.
- **Explicit `isFeatured` flag on News** — surfaced mid-phase,
  chair chose Option A (default — `publishedAt DESC` selects
  the homepage featured slot). Non-breaking to add later as a
  micro-phase.
- **Rich-text rendering on `News.body` / `Event.description`** —
  stays plain `string[]` paragraphs (Decision C). Future
  upgrade to HTML or rich blocks Json is non-breaking; defer
  until admin asks.
- **Student Society sub-pages** — Phase 7+: Alumni, Clubs,
  FAQ, Visitors, Transport, Syllabus.

## Architectural decisions

### Decision A — Gallery flat, not Album + Photo

Current data is 27 ungrouped photos with no album hierarchy
intent in the UI. Adding `Album` scaffolding before the user
asks for it is premature abstraction. Flat `GalleryImage` table
with `displayOrder` + drag-reorder admin UX is sufficient. Album
hierarchy is non-breaking to add later.

### Decision B — `notice-file` reuses `ImageUploader`, no fork

Chair override of my initial sketch (which proposed a separate
`FileUploader`). Stays inside Phase 6 constraint #4. Extension
mechanics:
- `accept` prop (default `'image/*'`) — kept backward-compat by
  default; `notice-file` uploads pass `'image/*,application/pdf'`.
- `onChange` callback grows an optional 3rd-arg `UploadMeta`
  shape (`{fileType, fileName, width?, height?}`) so the Notice
  form can persist 4 paired fields and the Gallery form can
  auto-populate width / height. Existing callers that ignore
  the 3rd arg keep working unchanged.
- Preview branch on `fileType === 'pdf'` renders a `FileText`
  icon + filename + "Open PDF" link instead of an `<img>` —
  Cloudinary's raw-resource `secure_url` doesn't render as an
  image.

### Decision C — News body as `Json` `string[]`, not HTML

Plain paragraph array matches the legacy `news-data.ts` shape
1:1 and reuses the Phase 2 `ParagraphsEditor` admin UX. Future
upgrade path (HTML or rich blocks Json) is non-breaking.

### Decision D — Event hybrid date model

```prisma
eventDate    DateTime?  // structured, nullable (sort key)
displayDate  String?    // admin-set override
status       String     // Past | Current | Upcoming — admin sets
```

Sort: `[{ eventDate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }]`.

The legacy `events-data.ts` carried free-form date strings —
`"01 Sep, 2025"`, `"20 Apr"`, `"2024"`, or `null`. Best-effort
parse on seed: `"DD Mon, YYYY"` → `DateTime`, everything else →
`eventDate = null` with the original string preserved as
`displayDate`. The public render prefers `displayDate` then
falls back to `eventDate` formatted, then hides the pill —
matches pre-Phase-6 behaviour exactly.

`status` stays admin-set (not auto-derived from `eventDate`)
because the legacy data has events with null dates that are
correctly marked `Current` (e.g. ongoing partnerships,
recurring tournaments).

### Decision E — Pagination on News only

News is the entity most likely to grow past one screen of
cards. Offset pagination via `?page=N` (12 per page) is the
simplest cursor for a CMS where row counts will likely stay
under a few hundred. Events / Notices / Gallery stay
unpaginated; admin can switch them later without a schema
change.

### Decision F2 — search-index = server fetch, client filter

`getSearchIndex()` runs server-side once per page (cached via
`React.cache`), returns `SearchItem[]` (~100-200 items × small
object = ~30-50 KB raw, much less gzipped). Root layout passes
it as a prop down through Navbar → SearchOverlay. Client filters
locally via the pure `search(query, items, limit)` function.

Trade-offs vs the alternative (per-keystroke API endpoint):
- ✅ Sub-millisecond filtering on keystroke after first paint.
- ✅ No new API surface, no new auth boundary.
- ✅ Same data freshness model as everything else — server
  fetch happens per request, `revalidatePath` invalidates the
  layout on mutations.
- ⚠️ ~30-50 KB of additional payload on every public page load.
  Acceptable for a department site; would not scale to a
  university-wide search index.

### Decision G — No Phase 6a / 6b scope split

Gallery is flat (no album hierarchy), Notice file uploads reuse
the existing Cloudinary helper, News body / Event description /
News meta / Event details all map cleanly to two reused Phase
patterns (`ParagraphsEditor`, `KeyValueListEditor`). No genuine
complexity warranted splitting the phase.

### Server boundary: `search-index.ts` is server-only (mid-phase hotfix)

The initial CP6.3 commit put both `getSearchIndex()` (Prisma)
and `search()` (pure) in the same module, which client
components imported for the `SearchItem` type + `search()`
function. Webpack pulled the full chain into the client
bundle. Curl-200 sanity passed because the *server-render* was
fine; the failure was strictly client hydration:

    PrismaClient is unable to run in this browser environment,
    or has been bundled for the browser (running in ``).
    src/lib/db.ts (18:22) @ basePrismaClient

Memory rule "curl/HTML-fingerprint is NOT visual verification"
played out verbatim. Fix in `d079f2e`:

- NEW `src/lib/search.ts` — `SearchItem` type + `search()`
  function. Pure module, no Prisma. Safe for client imports.
- `src/lib/search-index.ts` — keeps `getSearchIndex()` only,
  re-exports `SearchItem` from `./search` for server consumers'
  backward compat. Header comment marks the module as
  server-only by convention.
- `SearchOverlay` + `Navbar` import from `@/lib/search`.

Client bundle for `/` dropped from 3576 → 2602 modules after
the split. The `import 'server-only'` belt-and-suspenders
marker would catch this class of bug at build time but
requires the `server-only` npm package — deferred per Phase 6
constraint #2 (no new dependencies).

### Decision A "no `isFeatured` flag" — explicit non-decision

Mid-phase the chair asked how the homepage NewsSection picks
the big-left-image article. Answered: `publishedAt DESC` →
first item is the featured slot. Surfaced Option B (explicit
`isFeatured Boolean` column + admin checkbox + "only-one"
transaction). Chair chose Option A (default). Non-breaking to
add Option B later if a specific use case demands a
date-independent pin.

### `revalidatePath` scope per entity

| Entity | Public surfaces invalidated on mutation |
|---|---|
| News | `/news`, `/news/<slug>`, `/` (homepage NewsSection), `/admin/news`, `/admin` |
| Events | `/student-society/events`, `/<slug>`, `/`, `/admin/events`, `/admin` |
| Notices | `/student-society/notice-board`, `/`, `/admin/notices`, `/admin` |
| Gallery | `/gallery`, `/admin/gallery`, `/admin` |

News / Events / Notices revalidate `/` because their homepage
sections cross-reference the same rows; Gallery does not (no
homepage section).

## Verification

### Per-checkpoint local

CP6.1 — Migration applied, 44 seed rows total
(News 5 + Events 6 + Notices 6 + Gallery 27). Date parser
verified: `"01 Sep, 2025"` → DateTime; `"20 Apr"` / `"2024"` /
null → null + `displayDate` preserved. Typecheck clean.

CP6.2 — Dev server boots; all 9 admin pages 307 → `/admin/login`
(auth-gated); 4 API routes 401 unauthenticated. No compile
errors. Typecheck clean.

CP6.3 — Public curl sanity (8 routes) all 200. Module count
sanity confirmed the search-index hotfix landed cleanly
(client `/` bundle 3576 → 2602 modules).

### Production browser end-to-end

Chair verified on `mechanical-engineering-olive.vercel.app`:
- Homepage NewsSection / EventsSection / NoticesSection render
  from DB; featured news slot picks the newest `publishedAt`.
- `/news` pagination + `/news/[slug]` detail render with related
  cards.
- `/student-society/events` filter pills + `[slug]` detail with
  sidebar + description + focus + CTA. The exact URL that hit
  the Prisma-in-browser bug pre-hotfix
  (`/student-society/events/cricket-tournament-2026`) renders
  clean post-hotfix.
- `/student-society/notice-board` filter pills + "View Full
  Notice" / "Download" buttons. PDF + image notices both
  render the right icon.
- `/gallery` masonry + lightbox (Esc + arrow keys).
- Navbar search overlay returns DB results across all entities
  with correct type-badge colors.
- Admin save → public refresh chain verified per entity.

## Tech debt notes

- **`*-data.ts` legacy files**: `faculty-data.ts`,
  `labs-data.ts`, `news-data.ts`, `events-data.ts`,
  `notices-data.ts`, `gallery-data.ts` all still on disk. The
  Phase 6 four are only read by `scripts/seed.ts` (which only
  runs on `npm run db:seed`); `faculty-data` / `labs-data` have
  zero consumers after the search-index migration. One-line
  cleanup deferred to Phase 7 hygiene.
- **Phase 7-blocked search-index reads**: `faqs`, `clubs`,
  `alumni`, `researchPapers`, `busRoutes` keep file-based reads
  in `search-index.ts`. Removing these imports is a 5-line
  follow-up once Phase 7 migrates those entities.
- **No `server-only` marker**: see Decision F2 hotfix notes.
  Convention-only documentation in the header comment until
  the package gets installed.
- **No DB-level shape validation on `body` / `meta` /
  `description` / `details` Json columns** — Zod validates at
  the write boundary, `coerceParagraphs` + `coerceKeyValueList`
  defend at the read boundary. Acceptable trade-off, matches
  Phase 4 / Phase 5 Json patterns.
- **`dangerouslySetInnerHTML`** — not added in Phase 6.
  `News.body` and `Event.description` render via plain `<p>`
  tags. Future HTML upgrade should layer DOMPurify if the
  editor audience widens beyond super_admin.
- **No explicit "pin to homepage" mechanism on News** — chair
  picked Option A (publishedAt-based). If a date-independent
  feature article comes up, add `isFeatured Boolean` micro-
  migration. See Decision A "no isFeatured flag" note above.
- **`/admission/notice`** stays hardcoded JSX. Future
  micro-phase or fold into Notice with a `category =
  'Admission'` extension.
- **No automated tests** — same as prior phases. Highest-
  payoff additions for Phase 6: Playwright smoke for the
  admin-publish → public-revalidate chain per entity,
  Vitest for `coerceParagraphs` + `coerceKeyValueList` +
  `parseLooseEventDate` seed-time date parser.
- **`package.json#prisma` deprecation warning** — carried
  forward; harmless until Prisma 7.

## Commit list

```
d079f2e fix(phase-6): split pure search.ts from server-only search-index.ts (Prisma-in-browser bug)
2f59017 feat(phase-6): CP6.3 — public wiring + search-index migration (8 surfaces DB-driven)
3693d75 feat(phase-6): CP6.2 — admin layer for 4 content hubs (News/Events/Notices/Gallery)
998d586 feat(phase-6): CP6.1 — content hubs schema + seed (News 5, Events 6, Notices 6, Gallery 27)
```

4 commits — 3 `feat` (one per CP) + 1 `fix` (mid-flight
search-index server-boundary fix). No `chore`.

Diff vs `main`: **61 files changed, +4,371 / −602**.

## Deployment notes

- Production deploy: `vercel deploy --prod` from this feature
  branch at `d079f2e`. Working tree clean throughout.
- Production deployment ID:
  `dpl_7oU9d2NndWuxc4ZwLj1ybMrPNJCE`.
- Production alias `mechanical-engineering-olive.vercel.app`
  re-pointed automatically by Vercel.
- Schema migration `20260517052523_add_content_hubs` was
  applied to the Neon DB during local CP6.1 work. Same Neon
  DB serves local + production, so all 4 new tables + seeded
  rows (5 News + 6 Events + 6 Notices + 27 Gallery = 44 total)
  existed in production **before** any Phase 6 code reached
  prod. Nothing extra ran at deploy time.
- No env-var changes. The Phase 0 set fully covers Phase 6
  (Cloudinary kinds are config-side; the four new ones plug
  into the existing signed-upload flow).
- Build log: `prisma generate` ~300ms, `next build` ~2m
  end-to-end. Static page count went up by the new admin
  routes + the four content-hub list / detail pages (News and
  Events `[slug]` pages prerender via `generateStaticParams`).
- **First deploy attempt succeeded** — the Phase 2 build-chain
  fix (`prisma generate && next build`) carries forward.

## Pipeline forward

- **Phase 7+** — Student Society sub-pages: Alumni, Clubs,
  FAQ, Visitors, Transport, Syllabus. Each entity migrates from
  its remaining `src/lib/<feature>-data.ts` file to a Prisma
  model + admin section. The search-index aggregator already
  has placeholder reads for these — the migration just swaps
  the import lines.
- **`/admission/notice` micro-phase** — chair decides whether
  to add an `AdmissionNotice` singleton model, fold into the
  Notice table with a featured flag, or keep hardcoded.
- **Hygiene pass** — delete the now-stale `*-data.ts` files
  for entities that fully migrated (`faculty-data`,
  `labs-data`, `news-data`, `events-data`, `notices-data`,
  `gallery-data` — kept only by `scripts/seed.ts`'s initial
  bootstrap). Once admin-curated data is the source of truth
  in production, the seed-time bootstrap files become
  removable.
