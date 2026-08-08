# Phase 8a — Admission CMS Part 1 (Notices + Prospectus)

**Part 1 of 3-part Admission CMS migration.** Phase 8b and 8c follow.

This PR migrates two of the six `/admission/*` pages — `/admission/notice` and `/admission/prospectus` — from hardcoded React to fully DB-driven CMS surfaces. Both pages are now editable end-to-end from `/admin` with the same admin UX as Phase 6/7 (multi-row tables, drag-reorder, ImageUploader for image + PDF).

After this PR merges, the remaining four `/admission/*` pages are in Phase 8b/8c scope:
- **Phase 8b** — `/admission/requirements` + `/admission/tuition-fees` (Program-linked)
- **Phase 8c** — `/admission/transfer-credits` + `/admission/waiver-scholarship` (policy singletons + Scholarship multi-row)

## Scope summary

| Surface | Before | After |
|---|---|---|
| `/admission/notice` | Single hardcoded Summer-2026 letterhead (141 LOC) | Server component reading the latest `isActive=true` `AdmissionNotice` row; empty state when no active row |
| `/admission/prospectus` | Client component with 1 hardcoded program PDF (179 LOC) | Server fetches `ProspectusEntry[]`, passes to `ProspectusClient.tsx` (same search + UG/PG filter UX) |
| Admin | — | `/admin/admission-notices` (CRUD + reorder + PDF/image upload) and `/admin/prospectus-entries` (CRUD + reorder + cover/PDF upload) |
| Sidebar | 5 collapsible groups | 6 collapsible groups (new "Admission" group, will host Phase 8b/8c) |
| Dashboard | 16 stat cards | 18 stat cards (+ AdmissionNotice count, + ProspectusEntry count) + 2 new action cards |
| Search index | 15 entity sources | 17 entity sources (+ AdmissionNotice latest-active, + ProspectusEntry full list) |

## Decisions A–E (+ B1) — surfaced before execution, chair-approved

The master prompt for Phase 8a proposed two table shapes that **did not match what the discovered pages actually rendered**. Surface-before-execute discipline caught both before any code was written.

### Decision A — Phase 6 Notice table reuse vs separate `AdmissionNotice`
**Resolution: separate table.** The Phase 6 `Notice` table is a flat notice-board card (title + description + file). `/admission/notice` is a formal Registrar letter with 6 additional structured fields (`refNo`, `subject`, `signatoryPreamble`, `signatoryName`, `signatoryDesignation`, `ccList`). Reusing the `Notice` table would have forced 6 nullable columns onto rows that never use them, or stored letterhead semantics in a Json blob (losing admin UX clarity). Cleaner separation.

### Decision B — Singleton-style vs multi-row with archive
**Resolution: multi-row + `isActive` flag.** The current page renders one notice, but the admin "publish a new notice" UX needs replacement-by-publish semantics. Multi-row with `isActive` toggle lets the admin queue/swap notices and (later) opens an archive route without schema changes.

### Decision B1 — Archive detail page `/admission/notice/[slug]` in 8a?
**Resolution: skip in 8a.** Older notices stay in the DB but have no public route. Admin toggles `isActive` to swap visibility. Defer the archive page to Phase 9 if archive demand surfaces.

### Decision C — Prospectus singleton (master prompt) vs multi-row (discovery)
**Resolution: multi-row `ProspectusEntry` table.** The master prompt proposed `AdmissionProspectus (singleton)` with hero/intro/program-highlights/brochure-PDF/CTAs. **Discovery contradicted:** the current `/admission/prospectus` page has no hero copy, no intro paragraphs, no CTAs — it's purely a multi-row program PDF grid with client-side search + UG/PG filter (1 row currently, UI built for many). A singleton with marketing copy would have broken visual parity (constraint #7). YAGNI — defer landing chrome to Phase 8b/9 when there's actual copy demand.

### Decision D — Reuse Phase 7 `Syllabus` table?
**Resolution: separate `ProspectusEntry`.** Same field shape (slug/title/shortTitle/department/level/cover/pdf/IDs), but semantically distinct documents. A program may have both a syllabus and a prospectus → slug collision risk. Slight duplication is cheaper than adding a `documentType` discriminator and breaking Phase 7 admin UX.

### Decision E — Cloudinary kind naming
**Resolution: revised 4 kinds.** Master prompt assumed prospectus singleton with hero/brochure. With multi-row Prospectus, the kinds become:
- `admission-notice-hero` / `admission-notice-file` → `admission/notices`
- `prospectus-cover` / `prospectus-pdf` → `admission/prospectus/{covers,pdfs}`

## Schema additions

One migration: `20260518045941_add_admission_8a_notice_prospectus`. Two new tables, no foreign keys, no touches to Phase 0–7 tables.

```prisma
model AdmissionNotice {
  id                    String   @id @default(cuid())
  slug                  String   @unique
  title                 String
  refNo                 String
  subject               String
  publishedAt           DateTime
  displayDate           String?

  headerOverline        String   @default("Office of the Registrar")
  bodyParagraphs        Json     // string[] — HTML-allowed paragraphs
  signatoryPreamble     String?
  signatoryName         String
  signatoryDesignation  String
  ccLabel               String   @default("Copy for Kind Information (not according to seniority)")
  ccList                Json     // string[] — plain text recipients

  heroImageUrl          String?
  heroImagePublicId     String?
  fileUrl               String?
  filePublicId          String?
  fileName              String?

  isActive              Boolean  @default(true)
  displayOrder          Int
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([publishedAt])
  @@index([isActive, publishedAt])
  @@map("admission_notice")
}

model ProspectusEntry {
  id            String   @id @default(cuid())
  slug          String   @unique
  title         String
  shortTitle    String
  department    String
  level         String   // 'Undergraduate' | 'Postgraduate'
  coverUrl      String
  coverPublicId String?
  pdfUrl        String?
  pdfPublicId   String?
  pdfFileName   String?
  displayOrder  Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([displayOrder])
  @@index([level])
  @@map("prospectus_entry")
}
```

### Seeded rows
- `AdmissionNotice` — 1 (Summer-2026 Inauguration Ceremony, extracted verbatim from the previous hardcoded page including all 4 body paragraphs with inline `<strong>` / `<em>` and the 5-entry Cc list)
- `ProspectusEntry` — 1 (B.Sc. in Mechanical Engineering, Undergraduate, with the same cover + PDF assets)

## File inventory (33 files, +1850 / −275)

### CP8a.1 — schema + seed (commit `8f1a85b`)
- `prisma/schema.prisma` — 2 new models
- `prisma/migrations/20260518045941_add_admission_8a_notice_prospectus/migration.sql`
- `scripts/seed.ts` — `seedAdmissionNotice` + `seedProspectusEntries` (idempotent upserts)
- `src/lib/cloudinary.ts` — 4 new kinds in `KIND_TO_SUBFOLDER`
- `src/components/admin/ImageUploader.tsx` — 4 new kinds on the `Kind` union

### CP8a.2 — admin layer (commit `5a41138`)
- `src/lib/validation.ts` — `admissionNoticeCreate/UpdateSchema`, `prospectusEntryCreate/UpdateSchema`, `prospectusLevelEnum`, `ccListSchema`; `uploadKindSchema` extended
- `src/lib/admin-actions/admission-notices.ts` — `create/update/delete/reorder`
- `src/lib/admin-actions/prospectus-entries.ts` — same
- `src/app/api/admin/admission-notices/{route,[id]/route,reorder/route}.ts`
- `src/app/api/admin/prospectus-entries/{route,[id]/route,reorder/route}.ts`
- `src/app/admin/(authed)/admission-notices/{page,AdmissionNoticeList,AdmissionNoticeForm,new/page,[id]/page}.tsx`
- `src/app/admin/(authed)/prospectus-entries/{page,ProspectusList,ProspectusForm,new/page,[id]/page}.tsx`
- `src/components/admin/Sidebar.tsx` — new `ADMISSION_NAV` group + collapsible state
- `src/app/admin/(authed)/page.tsx` — 2 stat cards + 2 action cards

### CP8a.3 — public wiring + search-index (commit `bc2ddd7`)
- `src/lib/identity.ts` — `getActiveAdmissionNotice` + `getProspectusEntries` (both `cache()`-wrapped)
- `src/app/admission/notice/page.tsx` — full rewrite as server component
- `src/app/admission/prospectus/page.tsx` — server component, fetches DB
- `src/app/admission/prospectus/ProspectusClient.tsx` — client filter UX (new)
- `src/lib/search.ts` — 2 new `SearchItem.type` union members
- `src/lib/search-index.ts` — 2 new query branches + mapping blocks
- `src/components/layout/SearchOverlay.tsx` — yellow / sky badge colors

## Component reuse

Per constraint #4 (no new components), Phase 8a reuses all existing pieces:

| Component | Used by |
|---|---|
| `ImageUploader` (`accept='image/*,application/pdf'`) | AdmissionNotice file attachment + hero, Prospectus cover + PDF |
| `ParagraphsEditor` | AdmissionNotice `bodyParagraphs` and `ccList` (Json string[] columns) |
| `SortableList` | Both list pages (drag-reorder) |
| `PageShell` / `Container` | Both public pages |

No new editor / uploader / form primitive was added. `bodyParagraphs` is a string[] paragraph editor (HTML allowed); `ccList` is the same editor used for plain-text recipient lines — same shape so the same component fits both.

## Visual deltas vs the hardcoded source

- **`/admission/notice` paragraph 4** ("All concerned are requested…") was `font-semibold text-primary` in the hardcoded page. The DB-driven render wraps the entire paragraph in inline `<strong>` (per the HTML-allowed convention) → renders as bold (700) instead of semibold (600), and the primary color is lost. Acceptable per architecture; the renderer is uniform and the structure of the letter is preserved.
- **`/admission/prospectus`** — pixel-identical (search bar, filter pills, card grid, level badge colors, empty states).

## Search index extension

| New entity | Filter | Render link |
|---|---|---|
| `AdmissionNotice` | `where: { isActive: true }`, `orderBy: { publishedAt: 'desc' }`, `take: 1` | `/admission/notice` (single row = no desync between search and rendered page) |
| `ProspectusEntry` | all rows | `/admission/prospectus` (all rows render simultaneously on the same page) |

Two new badge colors: yellow (`AdmissionNotice`), sky (`Prospectus`).

## What stayed out of Phase 8a

| Item | Why |
|---|---|
| Phase 6 `Notice` table | Decision A — kept separate, no touches |
| Phase 7 `Syllabus` table | Decision D — same shape but different domain, no touches |
| Phase 0 `Program` table | Constraint #11 — Phase 8b territory |
| `/admission/requirements`, `/admission/tuition-fees` | Phase 8b |
| `/admission/transfer-credits`, `/admission/waiver-scholarship` | Phase 8c |
| `/admission/notice/[slug]` archive route | Decision B1 — defer to Phase 9 if demand |
| `AdmissionProspectus` singleton landing (hero/intro/CTAs) | Decision C — none exists on the current page, YAGNI |

## Local verification (chair, pre-deploy)

- ✅ Typecheck: `npx tsc --noEmit` — 0 errors
- ✅ Curl sanity (CP8a.2): 8/8 admin + public routes respond correctly (admin 307 redirects to login when unauth)
- ✅ Curl sanity (CP8a.3): 6/6 public surfaces 200
- ✅ Admin browser verify (CP8a.2): list pages, edit forms, delete, sidebar Admission group, dashboard stats
- ✅ Public browser verify (CP8a.3): `/admission/notice` letterhead + `/admission/prospectus` filter UX

## Production verification (chair, post-deploy `bc2ddd7`)

- ✅ Deploy READY at https://mechanical-engineering-olive.vercel.app
- ✅ Curl 10/10 public surfaces 200
- ✅ Hard fingerprints in production HTML:
  - `/admission/notice` has `SU/Reg/Notice/2026/74` + `Office of the Registrar` + `S. M. Nurul Huda` + `Summer-2026 Admission Fair`
  - `/admission/prospectus` has `B. Sc. in Mechanical Engineering` + `Undergraduate`
  - Homepage search-index payload carries `AdmissionNotice` + `Prospectus` type tokens + `SU/Reg/Notice` + `Inauguration` substrings
- ✅ Magic moments:
  - Admin publishes a new notice → `/admission/notice` swaps to it; toggling `isActive=false` restores the previous notice
  - Admin adds a PG prospectus row → `/admission/prospectus` filters correctly between UG / PG / All
  - Global search "Summer 2026" returns AdmissionNotice; "Mechanical Engineering" returns Prospectus

## Remaining hardcoded admission surfaces (Phase 8b/8c queue)

| Page | LOC | Phase | Pattern |
|---|---|---|---|
| `/admission/requirements` | ~600 | 8b | Program-linked (eligibility per program) |
| `/admission/tuition-fees` | ~150 | 8b | Program-linked (fee table per program) |
| `/admission/transfer-credits` | ~250 | 8c | Policy singleton |
| `/admission/waiver-scholarship` | ~400 | 8c | Policy singleton + Scholarship multi-row |

After 8b + 8c merge, the entire `/admission/*` tree will be CMS-controlled.

## Test plan checklist (for PR review)

- [ ] Pull branch locally and run `npm install && npm run db:seed` — should idempotently report `AdmissionNotice seeded (1 row)` and `ProspectusEntry seeded (1 row)` without errors
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run dev` and verify the four core surfaces:
  - [ ] `/admission/notice` renders the Summer-2026 letterhead from DB
  - [ ] `/admission/prospectus` renders the B.Sc. ME card with the UG/PG filter
  - [ ] `/admin/admission-notices` lists 1 row, edit form prefills all 7 cards
  - [ ] `/admin/prospectus-entries` lists 1 row, edit form prefills cover + PDF
- [ ] Smoke search: type "Summer 2026" in navbar search → AdmissionNotice badge appears; "Mechanical Engineering" → Prospectus badge appears alongside other matches
- [ ] DevTools console clean on both public surfaces
- [ ] Regression spot-check: `/faculty-member`, `/news/<slug>`, `/student-society/syllabus`, `/transport-service` render normally

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
