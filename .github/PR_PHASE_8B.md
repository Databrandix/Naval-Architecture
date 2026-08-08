# Phase 8b — Admission CMS Part 2 (Requirements + Tuition Fees with structured editors)

**Part 2 of 3-part Admission CMS migration.** Phase 8a (Admission Notices + Prospectus) merged in #9; Phase 8c (Transfer Credits + Waiver/Scholarship) follows.

This PR migrates `/admission/requirements` (163 LOC) and `/admission/tuition-fees` (296 LOC) from hardcoded React to fully DB-driven CMS surfaces. The tuition-fees data has 3-level nested structure (shifts → background groups → fee tiers) plus per-program overview stats + policies cards — content that no existing admin editor could cover. So this PR also ships **4 new structured editor components** to make the admin UX usable for non-tech staff (full rationale in §"Constraint #4 interpretation").

After this PR merges, 4 of 6 `/admission/*` pages will be CMS-controlled. Remaining for Phase 8c:
- `/admission/transfer-credits` (~250 LOC) — policy singleton
- `/admission/waiver-scholarship` (~400 LOC) — policy singleton + Scholarship multi-row

## Scope summary

| Surface | Before | After |
|---|---|---|
| `/admission/requirements` | Hardcoded single-component page (1 intro + 8 UG bullets + 2 alert notes + 2 diploma bullets + combined-GPA paragraph + 2 quick-ref criteria) | Server component reading `AdmissionRequirements` singleton; same 3-section layout, empty-state fallback |
| `/admission/tuition-fees` | Hardcoded for B.Sc. ME — intro pill + 4 overview stats + 3 shifts × multi-group × multi-tier tables + 3 policy cards | Server component reading `ProgramFeeStructure[]` with `program` relation; renders one full section per program (multi-program ready), empty-state fallback |
| Admin | — | `/admin/admission-requirements` (singleton edit) + `/admin/program-fee-structures` (list + per-program upsert) |
| Sidebar Admission group | 2 children (Phase 8a) | 4 children (added Admission Requirements · Program Fee Structures) |
| Dashboard | 18 stat cards · 22 action cards | 20 / 24 (added stringValue "Configured/Not configured" for singleton · count for fee structures · 2 new action cards) |
| Search index | 17 entity sources (Phase 8a) | 18 sources (+ `Fees` type — per-program entries) |

## 8b within the 3-part Admission CMS migration

| Phase | Pages | Pattern | Status |
|---|---|---|---|
| **8a** | Admission Notices · Prospectus | Multi-row (Notices) + per-Program slug (Prospectus) | Merged in #9 |
| **8b** | Requirements · Tuition Fees | Singleton (universal policy) + 1:1 with Program (per-program fee tree) | **This PR** |
| **8c** | Transfer Credits · Waiver/Scholarship | Policy singleton + multi-row Scholarship | Pending |

## Decisions A–F — surfaced before execution, chair-approved

Discovery contradicted master prompt assumptions twice in this phase. Surface-before-execute discipline caught both.

### Decision A — Requirements: per-Program vs SINGLETON
**Resolution: Singleton `AdmissionRequirements` table.** Master prompt's Path A/B/C frame assumed per-Program. Discovery showed `/admission/requirements` renders universal university policy (UG section + Diploma section) with **no program-specific differentiation in current copy**. Singleton matches discovered behavior; if per-program eligibility emerges later (MSc requires GRE, etc.), a `ProgramRequirement` overlay child table can be added — additive.

### Decision B — Tuition Fees: Path A vs B vs C
**Resolution: Path B (separate `ProgramFeeStructure` table linked 1:1 to Program via `programId @unique`, onDelete: Cascade).**

- **Not Path A** (extend Program with admission columns): Phase 8c will add Scholarship pivoting on Program too. Mixing all admission domain into Program → 25+ column model with most nullable. Constraint #12 anticipated this.
- **Not Path C** (relational sub-tables `FeeShift → FeeGroup → FeeTier`): too granular for current scope; admin UX would need 3 levels of nested CRUD. Json columns with structured editors keep complexity tractable.
- **`1:1` via `programId @unique`**: Discovery shows 1 program → 1 fee structure. Future expansion path (multiple intake schedules) → drop `@unique` and add `intakeYear`.

### Decision C — Intro/overview/policies bundling
**Resolution: Bundled into `ProgramFeeStructure` (per-program).** Overview stats ("Total Credits: 160") and policies (Golden A+ Waiver) reference B.Sc. ME specifically — they're program-specific, not universal. One row per program covers everything; renderer loops programs.

### Decision D — Cloudinary kinds
**Resolution: None added.** Neither page has images/PDFs.

### Decision E — Admin UX
**Resolution: 2 new admin pages under existing Admission sidebar group.** `/admin/admission-requirements` (singleton edit form, like `/admin/transport-landing` from Phase 7) and `/admin/program-fee-structures` (list of Programs with configured/not-configured indicator; click → per-Program upsert form).

### Decision F — Seeding plan
**Resolution: Extract verbatim from current pages.** All sections preserved including inline `<strong class="text-primary">` HTML in `combinedGpaBody`.

## Constraint #4 interpretation update

The original constraint reads: *"Reuse all existing components — NO new ones."* Chair clarified mid-CP8b.2:

> "The JSON textarea ship was conservative on constraint #4 ('no new components for same UX'), but this is genuinely new UX — no existing fee structure editor exists. Constraint #4 doesn't apply to genuinely new component patterns."

Updated reading: **constraint #4 forbids forking when an existing editor already covers the UX shape; it does not forbid building editors for shapes the existing editor set can't cover.** Phase 8b's 3-level nested fee data was such a case — no existing editor handles deep nesting. JSON textarea would have shipped, but admin team can't be expected to hand-edit nested JSON.

This interpretation will guide Phase 8c+ as well: surface "is this genuinely new UX or a forkable variant?" as a discovery-level question, not at code time.

## Schema additions

One migration: `20260518055057_add_admission_8b_requirements_fees`. Two new tables; Program table gains the back-relation field only (no SQL column added).

```prisma
model AdmissionRequirements {
  id                         String   @id @default("singleton")
  intro                      String   @db.Text
  undergraduateRequirements  Json     // string[]
  additionalNotes            Json     // string[]
  diplomaRequirements        Json     // string[]
  combinedGpaBody            String   @db.Text   // HTML-allowed inline <strong>
  diplomaQuickCriteria       Json     // [{label, value}]
  updatedAt                  DateTime @updatedAt
  @@map("admission_requirements")
}

model ProgramFeeStructure {
  id              String   @id @default(cuid())
  programId       String   @unique
  program         Program  @relation(fields: [programId], references: [id], onDelete: Cascade)
  introOverline   String                  // "B.Sc. in Mechanical Engineering (ME)"
  introHeading    String   @default("Tuition Fee Structure")
  introBody       String   @db.Text
  overviewStats   Json     // [{iconName, label, value}]
  shifts          Json     // 3-level nested — see Json shape below
  policies        Json     // [{iconName, title, text}]
  displayOrder    Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([displayOrder])
  @@map("program_fee_structure")
}

// In existing Program model:
//   feeStructure  ProgramFeeStructure?
```

### `shifts` Json shape (3-level nested)
```ts
shifts: Array<{
  iconName: string;    // Lucide name (Sun / Moon / Star)
  name: string;        // SUN / MOON / STAR
  shiftLabel: string;  // "Morning Shift"
  description: string;
  groups: Array<{
    background: string;  // "SSC + HSC" / "Diploma"
    tiers: Array<{
      gpa: string;       // "5.00 – 8.99"
      perCredit: number;
      total: number;
    }>;
  }>;
}>;
```

### Seeded rows
- `AdmissionRequirements` (1 singleton): all sections extracted verbatim from `/admission/requirements/page.tsx` — 8 UG bullets, 2 additional notes, 2 diploma bullets, combinedGpaBody with text-primary `<strong>` classes preserved, 2 quickCriteria.
- `ProgramFeeStructure` (1 row): linked to BSc-ME Program. 4 overviewStats, 3 shifts (SUN/MOON/STAR — SUN has 1 group/3 tiers; MOON + STAR each have 2 groups × 3+2 tiers nested), 3 policies.

## Structured editor build (4 new components)

| File | Purpose |
|---|---|
| `src/components/admin/FormSortableList.tsx` | Controlled drag-reorder list for in-form use. Silent (no toast), sync `onReorder`. Each instance creates its own `DndContext` (via `useId()`), so nested usage doesn't leak drag interactions across levels. Distinct from the Phase 0+ `SortableList` which toasts + persists on every drag (right for list pages, wrong for unsaved form state). |
| `src/components/admin/OverviewStatsEditor.tsx` | `{iconName, label, value}[]` editor. Drag-reorder + add/remove. Serializes to a single JSON-encoded hidden input. |
| `src/components/admin/PoliciesEditor.tsx` | `{iconName, title, text}[]` editor. `text` field is a `<textarea rows={3}>` (HTML allowed). Same serialization pattern. |
| `src/components/admin/ShiftsEditor.tsx` | 3-level nested editor: shifts → groups → tiers. Single source-of-truth state at the top with id-keyed rows for stable React keys + drag identity. Numbers (`perCredit`, `total`) kept as strings in state for controlled input; coerced to `Number` on serialize (Zod expects `z.number()`; falsy → 0). 424 LOC. |

All four use **only existing project dependencies** (dnd-kit + lucide-react + Tailwind). No new npm dependencies added.

## File inventory (26 files changed, +2346 / −357)

### CP8b.1 — schema + seed (commit `83ea0bf`)
- `prisma/schema.prisma` — 2 new models + back-relation on Program
- `prisma/migrations/20260518055057_add_admission_8b_requirements_fees/migration.sql`
- `scripts/seed.ts` — `seedAdmissionRequirements` + `seedProgramFeeStructures` (idempotent upserts; ProgramFeeStructure looks up BSc-ME by `degreeCode`)

### CP8b.2 — admin layer + structured editors (commit `63fcbbb`)
- `src/lib/validation.ts` — `admissionRequirementsUpdateSchema` + `programFeeStructureCreate/UpdateSchema` with deep shape validation for `shifts`
- `src/lib/admin-actions/admission-requirements.ts` + `program-fee-structures.ts` (`upsert` keyed by `programId`)
- `src/app/api/admin/admission-requirements/route.ts` (GET/PUT)
- `src/app/api/admin/program-fee-structures/{route, [programId]/route}.ts`
- `src/app/admin/(authed)/admission-requirements/{page, AdmissionRequirementsForm}.tsx`
- `src/app/admin/(authed)/program-fee-structures/{page, [programId]/page, [programId]/ProgramFeeStructureForm}.tsx`
- `src/components/admin/{FormSortableList, OverviewStatsEditor, PoliciesEditor, ShiftsEditor}.tsx` (NEW)
- `src/components/admin/Sidebar.tsx` — Admission group grows 2 → 4 children
- `src/app/admin/(authed)/page.tsx` — 2 stat cards + 2 action cards

### CP8b.3 — public wiring + search-index (commit `9873bf5`)
- `src/lib/identity.ts` — `getAdmissionRequirements` + `getProgramFeeStructures` (both `cache()`-wrapped)
- `src/app/admission/requirements/page.tsx` — full rewrite as server component (empty-state fallback)
- `src/app/admission/tuition-fees/page.tsx` — full rewrite as server component with `ICON_MAP` (Lucide names → components, `Info` fallback for unknowns) + defensive `coerce*` helpers for each Json shape (overview, groups, tiers, shifts, policies)
- `src/lib/search.ts` — `'Fees'` added to `SearchItem.type` union
- `src/lib/search-index.ts` — `prisma.programFeeStructure.findMany` + map to `'Fees'` entries pointing to `/admission/tuition-fees`. AdmissionRequirements **not double-indexed** — the static "Admission Requirements" page entry covers it.
- `src/components/layout/SearchOverlay.tsx` — `green-100/green-800` badge for Fees

## Component reuse vs new

| Component | Used by Phase 8b |
|---|---|
| ParagraphsEditor (existing) | AdmissionRequirements `undergraduateRequirements` · `additionalNotes` · `diplomaRequirements` |
| KeyValueListEditor (existing) | AdmissionRequirements `diplomaQuickCriteria` |
| FormSortableList (NEW) | All three new editors below |
| OverviewStatsEditor (NEW) | ProgramFeeStructure `overviewStats` |
| PoliciesEditor (NEW) | ProgramFeeStructure `policies` |
| ShiftsEditor (NEW) | ProgramFeeStructure `shifts` (3-level nested) |

## Visual deltas vs the hardcoded source

- **`/admission/requirements`** — pixel-identical (fixed section labels like "Undergraduate Programs" / "For Diploma (Engineering) Students" / "Eligibility" / "Combined GPA Criteria" / "Quick Reference" stay hardcoded as page chrome, since they're layout not content).
- **`/admission/tuition-fees`** — pixel-identical when seeded data matches current hardcoded. Unknown icon names fall back to a generic `Info` icon (graceful, no crash).

## Local + production verification

### CP8b.1
- ✅ `prisma migrate dev` clean; 2 rows seeded
- ✅ Sample dump verified shape: 8 UG bullets · 3-level shifts (SUN 3 tiers, MOON 2 groups, STAR 2 groups) · 3 policies

### CP8b.2
- ✅ Typecheck 0 errors
- ✅ Chair browser-verified locally: round-trip drag-reorder at all 3 shift levels persists; add/remove at each level persists; numeric coercion clean; KeyValueListEditor + ParagraphsEditor reuse on AdmissionRequirements form verified

### CP8b.3
- ✅ Typecheck 0 errors
- ✅ Local curl: 7/7 routes 200; hard fingerprints match

### CP8b.4 (production)
- Deploy READY at https://mechanical-engineering-olive.vercel.app (deployment id `dpl_4NXzUWzBQaPZFL7x2abMi4V2WyDv`, commit `9873bf5`)
- Note: first deploy attempt failed at Vercel's `/v2/files` upload endpoint with "Internal Server Error" (transient API hiccup, not a build issue); single retry succeeded.
- Production curl 10/10 routes 200; hard fingerprints verified:
  - `/admission/requirements` → `Combined GPA Criteria` (≥1) + `Minimum GPA 2.5` (≥1)
  - `/admission/tuition-fees` → `B.Sc. in Mechanical Engineering` + `Golden A+ Waiver` + `BDT 264,500`
  - Homepage HTML carries `Fees` type token (2 occurrences) + `Tuition fee structure` description + `B.Sc. in Mechanical Engineering` title in search-index payload
- Chair production-verified magic moments:
  - Admin → `/admin/admission-requirements` → edit UG bullet → `/admission/requirements` reflects
  - Admin → `/admin/program-fee-structures/<BSc-ME id>` → drag-reorder shift / add a tier → `/admission/tuition-fees` reflects
  - Icon name fallback (gibberish → `Info` icon)
  - Global search "Mechanical" → Fees badge returns the entry

## Tech debt — JSON-shape admin retro candidates for Phase 9+

The structured editors shipped here (drag-reorder via `dnd-kit`) raise the bar for admin UX. Several existing admin forms across Phases 0–8a use the **arrow-based reorder** pattern (ParagraphsEditor / KeyValueListEditor / FeaturesEditor / ActivitiesEditor / StatsEditor) which works but is slower than drag-handle UX. These are NOT broken — they were considered acceptable at the time — and should NOT be fixed retroactively in this PR. Flagged for chair priority decision in Phase 9+ if the admin team requests:

| Form | File | Editor | Json column |
|---|---|---|---|
| About — Mecha Club | `about-mecha-club/AboutMechaClubForm.tsx` | ActivitiesEditor + StatsEditor | `activities`, `stats` |
| About — Overview | `about-overview/AboutOverviewForm.tsx` | (heroImage alts, etc.) | — |
| Laboratory Facility | `laboratory-facility/LaboratoryFacilityLandingForm.tsx` | FeaturesEditor | `features` |
| Lab Facility — Labs | `lab-facility/labs/LabForm.tsx` | GalleryEditor | (gallery + altText pairs) |
| Faculty | `faculty/FacultyForm.tsx` | PersonalInfoEditor + SectionContentEditor + ParagraphsEditor | 9 Json columns |
| News | `news/NewsForm.tsx` | ParagraphsEditor (body) + KeyValueListEditor (meta) | `body`, `meta` |
| Events | `events/EventForm.tsx` | ParagraphsEditor + KeyValueListEditor | `description`, `details` |
| Visitors | `visitors/VisitorForm.tsx` | ParagraphsEditor | `quote` |
| Transport Landing | `transport-landing/TransportLandingForm.tsx` | FeaturesEditor | `instructions` |
| Admission Notices | `admission-notices/AdmissionNoticeForm.tsx` (Phase 8a) | ParagraphsEditor × 2 | `bodyParagraphs`, `ccList` |
| Admission Requirements | `admission-requirements/AdmissionRequirementsForm.tsx` (this PR) | ParagraphsEditor × 3 + KeyValueListEditor | 4 Json columns |

A Phase 9 retro would unify these around `FormSortableList` (drag) while preserving the inner editor field layouts. ~1 day of work; no schema or seed changes needed (output JSON shape stays identical).

## Phase 8c preview

| Page | LOC | Pattern |
|---|---|---|
| `/admission/transfer-credits` | ~250 | Policy singleton (similar to AdmissionRequirements) |
| `/admission/waiver-scholarship` | ~400 | Policy singleton + Scholarship multi-row — multi-row likely has eligibility + amount + duration per scholarship, possibly with deep nesting requiring another structured editor build |

The structured-editor pattern established here is the template for Phase 8c if waiver-scholarship data turns out to need similar nested editing.

After Phase 8c merges, **the entire `/admission/*` tree (6 pages) will be CMS-controlled**, closing out the last hardcoded surface tree on the public site.

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install && npm run db:seed` — should idempotently report `AdmissionRequirements seeded (singleton)` and `ProgramFeeStructure seeded (1 row — BSc-ME)` without errors
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run dev`:
  - [ ] `/admission/requirements` renders all 3 sections (intro, UG numbered bullets + alert notes, Diploma 2-column with inline HTML in Combined GPA paragraph)
  - [ ] `/admission/tuition-fees` renders intro + 4 overview cards + 3 shift cards (SUN 1 group / MOON 2 groups / STAR 2 groups) + 3 policy cards
  - [ ] `/admin/admission-requirements` form loads with seeded data; round-trip: edit UG bullet → save → public page reflects
  - [ ] `/admin/program-fee-structures` list shows BSc-ME row with ✓ green check + "Configured"
  - [ ] `/admin/program-fee-structures/<BSc-ME id>` form:
    - [ ] OverviewStatsEditor: drag-reorder a stat row; edit value; remove + add a row
    - [ ] ShiftsEditor: drag a shift; drag a group within a shift; drag a tier within a group; add new tier/group/shift at each level; remove at each level
    - [ ] PoliciesEditor: drag-reorder; edit title + body textarea
    - [ ] Save → reload → all changes (including reorder + numeric coercion) persist correctly
  - [ ] Global search "Mechanical" → **Fees** badge (green) returns the fee structure entry; clicking goes to `/admission/tuition-fees`
- [ ] DevTools console clean on `/admission/requirements` and `/admission/tuition-fees`
- [ ] Regression: `/admission/notice`, `/admission/prospectus` (Phase 8a) + `/student-society/*` + `/faculty-member/<slug>` + `/news/<slug>` all render normally

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
