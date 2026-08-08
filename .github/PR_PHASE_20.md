# Phase 20 — Admin Icon Picker + Dynamic Lucide Rendering

Retires the brittle hardcoded `ICON_MAP` pattern that limited admins to a
small curated set of Lucide icons per surface. Admins can now pick from
the full 2,797-icon Lucide library via a shared visual picker that opens
beside every icon-input field across the admin UI. Public pages render
via a single shared resolver — no more per-surface icon registries to
keep in sync with admin hints.

Pure UX phase: zero schema changes, zero new dependencies, full backward
compatibility with existing `iconName` values in the DB.

---

## What changed

### 3 new shared components

| Component | Type | Purpose |
|---|---|---|
| `DynamicLucideIcon` | Server-renderable (no `'use client'`) | Resolves any Lucide name string to its component at render time. Tries `Foo` then `FooIcon` alias, falls back silently to `HelpCircle`. Used by every public surface that renders DB-driven icons. |
| `LucideIconPicker` | Client, lazy-loaded via `next/dynamic` | Modal with autofocused search, 8-col responsive grid (6 cols mobile), curated 30 institutional defaults + "Browse all" toggle. Esc / backdrop-click closes. |
| `IconInputField` | Client | Free-text input with inline live preview + picker trigger button. Amber warning when typed name doesn't resolve. The picker chunk only enters the browser bundle when the field is opened. |

### 11 admin integration points migrated

**4 top-level entity forms:**
- `ResearchAreaForm` (Lucide vs Uploaded image radio preserved)
- `LaboratoryLabForm`
- `WaiverCategoryForm`
- `NavAdmin` → `QuickAccessItem` (via `LinkListSection.extraField.kind: 'icon'`)

**7 structured JSON editors:**
- `ActivitiesEditor` — `AboutMechaClub.activities[]`
- `FeaturesEditor` — `LaboratoryFacilityLanding.features[]` + `TransportLanding.instructions[]`
- `OverviewStatsEditor` — `ProgramFeeStructure.overviewStats[]`
- `ShiftsEditor` — `ProgramFeeStructure.shifts[]`
- `PoliciesEditor` — `ProgramFeeStructure.policies[]`
- `QuickContactCardsEditor` — `ContactPageContent.quickContactCards[]`

### 8 public ICON_MAP implementations retired

`MajorResearchSection`, `Navbar`, `(public)/contact`, `(public)/transport-service`, `(public)/admission/tuition-fees`, `(public)/admission/waiver-scholarship`, `(public)/about/mecha-club`, `(public)/about/laboratory-facility` (2 maps inside) — all replaced with a single `<DynamicLucideIcon name={...} />` call site.

### Caller cleanups

- `AboutMechaClubForm`, `LaboratoryFacilityLandingForm`, `TransportLandingForm`: dropped their per-form `ICON_HINTS` const + `iconHints` prop pass-through. The picker is the canonical surface now; per-form curated hint lists are gone.
- `LinkListSection`: added `extraField.kind: 'icon'` discriminator so callers can opt into the IconInputField UX without breaking the existing text-field path.

### Dev-only convenience

- Better Auth `trustedOrigins` allowlist for `localhost:3000` / `localhost:3001` — gated on `NODE_ENV !== 'production'`. Production gate stays strict (`baseURL` alone enforces origin). Added because dev workflows that switch the Next.js port were hitting Better Auth's origin check.

---

## Architecture notes

- **Server-renderable resolver:** `DynamicLucideIcon` deliberately has no `'use client'` directive so Phase 18 ISR cached prerenders bake the icon SVG into the HTML. Cache hits ship zero Lucide JS to the client for static public routes.
- **Lazy-loaded picker:** `IconInputField` imports `LucideIconPicker` via `next/dynamic({ ssr: false })`. The picker's full-namespace Lucide import (needed to enumerate all 2,797 icons in the grid) only enters the browser bundle when an admin clicks the **Pick** button — initial admin form load stays light.
- **Backward compatibility:** every existing `iconName` value in the database (e.g., `"Flame"`, `"GraduationCap"`, `"FlaskConical"`) continues to render unchanged. The new resolver covers a strict superset of every prior hardcoded map's contents.
- **Fallback chain:** `Lucide[name] ?? Lucide[${name}Icon] ?? HelpCircle` — covers the `Foo` vs `FooIcon` alias split in the Lucide package, defaults to a visible icon for any unknown input.

---

## Verification performed

| Layer | Method |
|---|---|
| Local typecheck | `npx tsc --noEmit` clean |
| Local build | `npm run build` clean; Phase 18 ISR indicators (`○` / `●` / `ƒ`) preserved on every public route |
| `npm audit` | 0 vulnerabilities maintained (no new deps) |
| Local smoke (`npm run dev`) | 11 sampled routes 200, admin login 200, picker modal opens + searches + selects + autofills |
| Production curl sanity | 10 public routes 200, admin gate 307 to login, `/admin/login` 200, all 9 Phase 19 security headers preserved, X-Powered-By absent, Phase 18 ISR `X-Vercel-Cache: HIT` preserved, inline `<svg class="lucide ..."` markers confirmed in `/research` HTML output |
| Production browser verify (chair) | All admin icon-input forms work with picker, public visual regression clean across 8 surfaces, existing iconName values render unchanged, mobile picker modal usable |

---

## Bundle impact

| Surface | Pre-Phase-20 | Post-Phase-20 |
|---|---|---|
| Shared chunks | 102 KB | **102 KB** (unchanged) |
| Typical public-route chunk | ~2.01 KB | **~1.88 KB** (-130B per route — per-route static Lucide imports gone) |
| Admin route chunks | unchanged | unchanged (picker is a separate lazy chunk) |
| Admin picker chunk | n/a | new, ~50KB lazy-loaded only on **Pick** button click |

Net: slight bundle improvement for public routes, picker overhead deferred until needed.

---

## File inventory

| Type | Count |
|---|---|
| New files | 3 (`DynamicLucideIcon`, `LucideIconPicker`, `IconInputField`) |
| Modified files | 23 (8 public renderers + 12 admin editors/forms + 1 admin shared chrome + 1 auth dev-helper + Navbar + MajorResearchSection) |
| New dependencies | 0 |
| Schema changes | 0 |
| Migrations | 0 |
| Lines of code | **+531 / −348 (net +183)** — net code growth despite retiring 8 hardcoded maps, because the shared components + picker UI carry that weight in one place rather than per-surface |

---

## Documented limitations + future considerations

- **Curated default icon set is a single const** in `LucideIconPicker.tsx`. Future refinement (chair-driven feedback on which 30 icons surface first) is a one-line array edit; no other component needs to change.
- **Search is substring-only** against icon names. Lucide ships keyword metadata (e.g., "Flame" matches "fire") but we don't use it yet. A future enhancement could add `lucide-react/dynamic` keyword search if admins frequently can't find an icon by name alone.
- **Bundle cost of the picker chunk (~50KB)** is justified by the UX win; if it ever becomes a concern, `lucide-react/icons` ESM individual-file imports + a name → lazy-import map would reduce it, at the cost of more complex picker code.

---

## Out of scope / explicitly preserved

- The "Uploaded image" radio option on `ResearchAreaForm` — preserved (admin can still upload custom logos via ImageUploader)
- `Faculty` designation icons — driven by static `FacultyType` enum, not admin-editable
- Top-level chrome models without `iconName` field (`TopLink`, `FooterUsefulLink`, etc.) — out of scope
- Schema changes — none needed; existing `iconName String?` columns accommodate the full library

---

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install` (no new deps; lockfile unchanged from main)
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` — Phase 18 ISR indicators preserved (public routes `○` / `●`, admin `ƒ`)
- [ ] `npm run dev`:
  - [ ] `/admin/research-areas/new` — type a valid Lucide name → preview icon renders; type a fake name → amber warning + HelpCircle preview
  - [ ] Click **Pick** button → modal opens with 30 curated icons; **Browse all 2,797** toggle works; search filters live
  - [ ] Select an icon → modal closes, input autofills, preview updates
  - [ ] Save → public surface (`/research`, etc.) reflects the new icon on next visit
  - [ ] `/admin/contact-page` — Quick Contact card per-row picker works
  - [ ] `/admin/nav` — Quick Access section picker works
  - [ ] `/admin/program-fee-structures/<id>` — OverviewStats / Shifts / Policies editors all have IconInputField
- [ ] Mobile viewport (375px): picker modal 6-col grid, search reachable, backdrop close works
- [ ] Backward compat: navigate to public surfaces with existing iconName values (Research, Mecha Club, Lab Facility, Tuition Fees, Waiver Scholarship, Contact, Transport) — all icons render identically to pre-Phase-20
- [ ] Regression check:
  - [ ] Phase 19 security headers + CSP-Report-Only intact on production HEAD
  - [ ] Phase 18 ISR cache markers preserved
  - [ ] Phase 17 Legal pages CMS intact
  - [ ] Phase 15 preloader + page-fade intact

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
