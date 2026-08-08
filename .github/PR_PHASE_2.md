# Phase 2 — Faculty system (schema → admin CRUD → public pages)

## Scope

Adds the `Faculty` table, its admin CMS surface, and wires the four
public Faculty surfaces (`/faculty-member` list, `/faculty-member/[slug]`
detail, `/about/deans-message`, `/about/message-from-head`) to read
from DB. **One migration, one new table, zero new dependencies.**

- **Schema + migration** — `prisma/schema.prisma` adds the `Faculty`
  model with 8 `Json` content-block columns
  (`researchInterests`, `education`, `experience`, `publications`,
  `awards`, `professionalMemberships`, `administrativeRoles`,
  `coursesTaught`) plus `personalInfo` (Json), `messageParagraphs`
  (Json string[]), and the role enum `FacultyRole`
  (`DEAN | HEAD | PROFESSOR | ASSOCIATE_PROFESSOR | ASSISTANT_PROFESSOR | LECTURER | OFFICER`).
  Migration `20260516045228_add_faculty`.
- **Seed** — `scripts/seed.ts` extended to ingest all 41 rows from
  `src/lib/faculty-data.ts`. Same DB serves local + prod so the
  Faculty rows existed in production before any code shipped.
- **Identity helpers** — `src/lib/identity.ts` adds
  `getFaculty()`, `getFacultyBySlug()`, `getDean()`, `getHead()` —
  all `React.cache()`-wrapped, same pattern as Phase 1's
  `getDepartmentIdentity` / `getUniversityIdentity`.
- **API routes** — `src/app/api/admin/faculty/` adds list+create
  (`route.ts`), get+update+delete (`[id]/route.ts`), and
  `reorder/route.ts` for drag-sort. All Better-Auth gated through
  the existing admin middleware.
- **Admin UI** — `/admin/faculty` list page (filter chips with
  count badges, dnd-kit reorder, role-coloured rows),
  `/admin/faculty/new` + `/admin/faculty/[id]` edit forms.
  Conditional Dean/Head visibility on the role dropdown enforces
  the singleton invariant client-side; server-side atomic swap is
  the source of truth.
- **Four custom Json editors** sitting inside `FacultyForm.tsx`:
  - `PersonalInfoEditor` — 2-column key/value add-row editor for
    the `personalInfo` Json blob.
  - `ParagraphsEditor` — multi-textarea editor for
    `messageParagraphs` (Dean/Head only). Up/down arrow buttons
    substitute for a drag handle (textareas grow too tall for
    drag-handle UX).
  - `SectionContentEditor` — nested heading+items editor used by
    all 8 `Json` section fields. Round-trips degenerate shapes
    (e.g. flat `string[]`, single-heading-no-items) without
    coercion so existing seed data survives a no-op edit.
  - `ImageUploader` — existing component, gets a `kind="faculty"`
    branch added to `src/lib/cloudinary.ts` for the upload folder.
- **Public list page** — `/faculty-member/page.tsx` reads
  `getFaculty()`, groups by role for the on-page sections, renders
  cards with photo + name + designation + slug link.
- **Public detail page** — `/faculty-member/[slug]/page.tsx` reads
  `getFacultyBySlug()`, renders the 8 section blocks via
  `SectionContent` component, personalInfo via a 2-column dl.
  Office address pulled from `getUniversityIdentity().address`,
  department label from `getDepartmentIdentity().shortName`.
  `generateStaticParams` returns all 41 slugs.
- **Dean & Head message pages** — `/about/deans-message` and
  `/about/message-from-head` now read the singleton Dean / Head
  row, render `messageParagraphs` through the new
  `MessageParagraphs` section component. Each pulls its own photo:
  Dean message + Head message render the **message-context photo**
  (`message-dean.webp`, `head-mostofa-hossain.webp`), distinct
  from the `[slug]` page photo (`faculty-dean.webp`,
  `faculty-head-mostofa.webp`). Both photo URLs live as separate
  columns on the row so a single human can have one face on
  `/faculty-member/<slug>` and another, more formal portrait on
  the dedicated message page.
- **Build script fix** — `package.json` build script becomes
  `prisma generate && next build`. Vercel caches `node_modules`
  between deploys and `postinstall` does not run on the cache-hit
  path, so the Prisma client must be regenerated at build time to
  match the deployed schema. See *Deployment notes* below for the
  incident that surfaced this.

## Out of scope (deferred to Phase 3+)

The Phase 2 tracker entries that did **not** ship this PR — all
still queued from [`docs/phase-2-todo.md`](../docs/phase-2-todo.md):

- **Labs** — `ResearchLabsSection` (homepage carousel) and
  `/about/lab-facility` still read `src/lib/labs-data.ts`.
- **News / Events / Notices / Gallery** — each still reads its
  own hardcoded `*-data.ts`; some need `[slug]` detail wired too.
- **About pages content** — `/about/overview`,
  `/about/mission-vision`, `/about/mecha-club`, etc. still
  hardcoded.
- **Alumni / Clubs / FAQ / Visitors / Transport / Syllabus** —
  the remaining `/student-society/*` surfaces.
- **Navbar nav structure tables** — `top_links`, `quick_access`,
  `nav_group` + items. Carried forward from Phase 1.
- **Footer hardcoded link sections** — `useful_links`,
  `get_in_touch`, `quick_links`, footer-bottom row. Carried
  forward from Phase 1.
- **`Program.ctaHref`** — Program CTAs still all link to
  `/admission/requirements`. Carried forward.
- **Automated tests** — still nil. Highest payoff candidates
  noted in *Tech debt* below.

Also still out:
- The local-only edit on `src/app/admission/requirements/page.tsx`
  — same owner-managed file that stayed unstaged through Phase 1.
  Stashed during deploy, popped after.

## Architectural decisions

### Eight `Json` columns for the section blocks (A)

The 8 section fields (`researchInterests` … `coursesTaught`) hold
mixed shapes across the seed: flat `string[]`, `{ heading, items }[]`,
and a couple of degenerate one-off cases. Modeling each as its own
relational table would have meant 8 join tables + 8 join queries
per detail page render. `Json` columns keep each row a single
fetch and let the admin authoring shape stay loose. The validation
trade-off (no DB-level shape enforcement) is accepted; the
`SectionContentEditor` round-trips whatever shape it reads so a
no-op edit can never corrupt seed data.

### `SectionContentEditor` round-trips degenerate shapes

A naive editor would coerce `["item1", "item2"]` into
`[{ heading: "", items: ["item1", "item2"] }]` on first read,
saving back a different shape than what the seed wrote. The
editor instead detects and preserves: flat `string[]` stays flat,
single-heading-with-items stays nested, mixed shapes stay mixed.
This means an author can open + save a row without unintentionally
restructuring it.

### `messageParagraphs` as flat string[] + inline HTML via `dangerouslySetInnerHTML` (J1)

Dean and Head messages contain inline `<strong>` markup for
emphasized phrases (e.g.
`<strong class="text-button-yellow">BUET, KUET, and RUET</strong>`).
Modeling rich text properly would have meant a richtext editor or
a markdown pipeline; the seed already had hand-authored HTML and
the audience for the admin form is the chair / dean themselves.
`MessageParagraphs` renders each string via
`dangerouslySetInnerHTML`. Author trust is the operational
control. Future Phase 3+ can layer a sanitizer when the editor
audience widens.

### Drop-cap render-side, not in DB (J2)

Both message pages open with a typographic drop-cap on the first
letter of the first paragraph. The DB stores plain text; the
component extracts the first letter via regex and wraps it in
`<span class="drop-cap">`. Keeps `messageParagraphs` as
clean paragraph strings; no author needs to know about
typography wrapping.

### Office address from `UniversityIdentity`, dept label from `DepartmentIdentity` (J3)

`/faculty-member/[slug]` shows the office address line and a
department label below each faculty's contact block. Neither
belongs on the `Faculty` row (every faculty member sits in the
same building under the same department), so they read through
the existing Phase 1 helpers. Net zero added Faculty columns,
and a department rename flows through the chrome **and** every
faculty page on the next revalidate.

### Dean & Head — atomic swap inside `$transaction`, browser `confirm()` before submit (D)

`FacultyRole.DEAN` and `FacultyRole.HEAD` are conceptually
unique. A naive create/update would let two rows hold `DEAN`
simultaneously, breaking `getDean()`. The admin server action
runs inside `prisma.$transaction`: if the incoming role is DEAN
or HEAD and another row already holds it, that row is demoted
to `PROFESSOR` in the same transaction before the target row is
written. The admin form runs a `confirm()` prompt before
submitting when the swap would trigger, surfacing the change to
the chair.

### Filter chips with count badges on `/admin/faculty` list (E)

Filter UI is a row of role chips, each carrying a `(N)` count
badge computed from the same `getFaculty()` fetch the list
already needs. No extra query per filter, no client-side
recount.

### Public revalidation from admin

All faculty mutation actions in `src/lib/admin-actions/faculty.ts`
call `revalidatePath('/faculty-member')`,
`revalidatePath('/faculty-member/${slug}')`, and (when role is
DEAN/HEAD) `revalidatePath('/about/deans-message')` or
`/about/message-from-head`. Same pattern Phase 1 established
for Programs and Research Areas.

### `prisma generate` in the build script (the deploy-day fix)

Standard Prisma + Next.js + Vercel pattern. Vercel reuses
`node_modules` from a previous successful deploy when no
manifest changes, and `npm install`'s `postinstall` doesn't fire
on the cache-hit path — so the Prisma client cached inside
`node_modules` keeps whatever schema the previous deploy was
generated against. `prisma generate && next build` guarantees
the client matches the current schema regardless of cache state.

## Verification

All testing was **manual** (curl smoke + browser) — same as
Phase 0 and Phase 1; no automated suite in scope.

### Per-sub-step curl smoke (local, before push)

- **CP2.1** — `npx prisma migrate dev` applied
  `20260516045228_add_faculty`; `npx prisma db seed` populated 41
  rows; Faculty table row count `41`; Dean + Head singletons
  present.
- **CP2.2** — admin API: `POST /api/admin/faculty` with DEAN
  role correctly demotes the existing DEAN to PROFESSOR inside
  a single transaction; `PATCH /api/admin/faculty/[id]` with
  HEAD does the same for the head slot; `POST /api/admin/faculty/reorder`
  persists `displayOrder` mutations; admin UI filter chips show
  per-role counts that sum to total.
- **CP2.3** — public pages: `/faculty-member` lists 41 cards
  grouped by role; `/faculty-member/<slug>` renders all 8
  section blocks for the seeded shapes; `/about/deans-message`
  + `/about/message-from-head` render `messageParagraphs` with
  drop-cap on first letter, `<strong>` markup preserved, photo
  URL from the message-context column (not the `[slug]` photo
  column).

### Production browser end-to-end

After `vercel deploy --prod` from branch HEAD (retry, see
*Deployment notes*):

| Test | Result |
|------|--------|
| `/faculty-member` — 41 seeded cards visible, photos load, slug links navigate | ✓ |
| `/faculty-member/habibur-rahman-kamal` — 8 section blocks render, office address from UniversityIdentity, dept label from DepartmentIdentity | ✓ |
| `/about/deans-message` — drop-cap "W", `<strong class="text-button-yellow">BUET, KUET, and RUET</strong>` preserved, paragraphs flow | ✓ |
| `/about/message-from-head` — drop-cap "M", "Valuable Club Partner" highlighted, `head-mostofa-hossain.webp` (message photo) present, distinct from `faculty-head-mostofa.webp` ([slug] page photo) | ✓ |
| Admin → `/admin/faculty` → filter chip counts match total | ✓ |
| Admin → edit a faculty bio → save → public detail page reflects change (revalidation magic moment) | ✓ |
| Admin → role change to DEAN → confirm prompt → atomic swap of existing DEAN to PROFESSOR | ✓ |
| DevTools console clean across all 4 public surfaces + `/admin/faculty` | ✓ |
| Existing `/admin/*` and Phase 1 public flows — no regression | ✓ |

## Tech debt notes

In addition to the Phase 3 deferrals above:

- **Leftover `shanti-bhai` row in production DB** — surfaced
  by post-deploy slug-count check (42 vs expected 41). Created
  via the admin UI during CP2.2 testing and not cleaned up
  before deploy. Same Neon DB serves local + prod, so it shows
  on production. Either delete via `/admin/faculty` (the chair
  decides during browser verification) or formalize the row.
- **No DB-level shape validation on the 8 `Json` columns** —
  trade-off accepted (see *Architectural decisions*). A bad
  shape from a hand-edited DB row would render as nothing
  rather than crashing thanks to defensive checks in
  `SectionContent`, but a Zod-at-read-boundary pass would catch
  it explicitly.
- **`dangerouslySetInnerHTML` in `MessageParagraphs`** — Dean
  and Head are the only authors today, so author trust is the
  control. When the editor audience widens, layer DOMPurify or
  switch to a markdown pipeline.
- **`package.json#prisma` deprecation warning** — Prisma 7 will
  drop the `package.json` config block in favour of
  `prisma.config.ts`. Warning prints on every build; harmless
  until v7 lands.
- **Highest-payoff automated tests** — same as Phase 1:
  Playwright smoke for the
  super_admin → public revalidation flow ("magic moment"),
  Vitest for `SectionContentEditor` round-trip shape preservation
  and for the Dean/Head atomic swap.

## Commit list

```
492c799 fix(phase-2): add prisma generate to build script for fresh Vercel builds
daff692 feat(phase-2): CP2.3 — Faculty public pages wired from DB (list, detail, Dean message, Head message)
7c8a6e1 feat(phase-2): CP2.2 — Faculty API routes + admin UI (list, CRUD, reorder, filter, conditional Dean/Head fields)
df2fd50 feat(phase-2): CP2.1 — Faculty schema, migration, 41-row seed from faculty-data.ts
```

4 commits — 3 `feat` for the planned CPs + 1 `fix` for the
build-script regression caught by the first prod deploy attempt
(see *Deployment notes*). No mid-flight bugs surfaced in the
feat commits themselves.

Diff vs `main`: **28 files changed, +2,183 / -141**.

## Deployment notes

- Production deploy: `vercel deploy --prod` from this feature
  branch, same stash → deploy → pop pattern Phase 0 and Phase 1
  used (the local-only `src/app/admission/requirements/page.tsx`
  edit stays out of production).
- Production deployment ID: `dpl_FNbC2nBSHc5BKtfD9vnxbQMhBDGv`.
- Production alias `mechanical-engineering-olive.vercel.app`
  attached automatically by Vercel.
- Schema migration `20260516045228_add_faculty` was applied to
  the Neon DB during local CP2.1 work. Same Neon DB serves
  local + production, so the Faculty table + 41 seeded rows
  existed in production **before** any Phase 2 code reached
  prod. Nothing extra ran at deploy time.
- **First prod deploy attempt failed** at the type-check step
  with `Property 'faculty' does not exist on type
  'DynamicClientExtensionThis<…>'`. Vercel reused the cached
  `node_modules` from the Phase 1 deploy ("up to date in 697ms"
  in the build log), so the Prisma client cached inside was the
  pre-Faculty schema version. Local `tsc` had passed only
  because `npx prisma generate` ran after the schema edit;
  Vercel never ran it. Root cause was the missing
  `prisma generate` in the build chain — `package.json` had no
  `postinstall` script either. Fixed by commit `492c799`
  changing `"build": "next build"` to `"build": "prisma generate && next build"`.
  Retry deploy succeeded; build log confirms
  `✔ Generated Prisma Client (v6.19.3) to ./node_modules/.prisma/client in 160ms`.
- No env-var changes. The Phase 0 set fully covers Phase 2.
- Vercel build time after the fix: ~17s compile + ~57s total
  build / ~1m end-to-end (comparable to Phase 1).
