# Phase 17 — Privacy Policy + Terms & Conditions (CMS-driven)

Two new public routes — `/privacy-policy` and `/terms-and-conditions` — backed by one combined `LegalPagesContent` singleton. Both pages share the project-wide PageShell hero + Container width convention; bodies are structured sections rendered as `<h2>` + `<p>` blocks. One admin form drives both pages.

Mid-phase pivot drove a schema change: the initial implementation stored body as a single HTML `Text` column with a monospace textarea in the admin form. Chair surfaced that they wanted field-based admin UX, not raw HTML. Pivoted to `Json` sections + a new `SectionsEditor` so the chair only writes prose; section headings stay distinct from paragraphs without any HTML markup.

---

## Decisions — outcomes

| Area | Outcome |
|---|---|
| Page count | Two public routes, one combined singleton model. Avoids two near-identical singletons + two admin forms; each public page picks its own half of the row. |
| URL slugs | `/privacy-policy` and `/terms-and-conditions` (chair-named, displayed on the footer too). |
| Admin route | Single page at `/admin/legal-pages` containing both Page 1 and Page 2 sections, separated by a kicker label. One save updates both. |
| Body storage | `Json` array of `{ heading?: string \| null, paragraphs: string[] }`. Stored as JSONB. Each item renders as `<section><h2>…</h2><p>…</p></section>` on the public side. |
| Admin editor | New `SectionsEditor` — per-section card with optional heading + per-paragraph textarea; reorderable both at the section and paragraph level. Serializes to one hidden JSON input; the action `JSON.parses` + Zod-validates against `legalSectionsSchema`. |
| Public renderer | New `LegalSections` — tolerant `coerceSections` reader, plain-text paragraph output (no `dangerouslySetInnerHTML`). |
| Prose styling | Reuses the `.legal-body` Tailwind utilities (h2 / p / a / ul / li) already in `globals.css`. |
| Hero | Same hero pattern as About / Contact pages — PageShell title + overline + image + vertical-percent slider. Seed placeholder is `/assets/contact-hero.webp` for both pages; chair can upload dedicated heroes via the new `legal-hero` Cloudinary kind. |
| Footer rename | Both `FooterLegalLink` (bottom row) and `FooterGetInTouchLink` (Get in Touch column) had their "Privacy Statement" / "Terms of Use" entries renamed to "Privacy Policy" / "Terms & Conditions" and pointed at the new internal routes. One-off patch script applied the change to the live Neon row; seed defaults updated for future fresh installs. Admin can still override either via `/admin/footer-links`. |

---

## File inventory (single commit `7112f4f`)

| File | Type | Why |
|---|---|---|
| `prisma/schema.prisma` | Edit | + `LegalPagesContent` singleton with hero columns + `privacySections` / `termsSections` JSONB columns |
| `prisma/migrations/20260520100000_legal_pages_content/migration.sql` | New | CREATE TABLE with hero columns + initial Text body columns |
| `prisma/migrations/20260520110000_legal_pages_sections/migration.sql` | New | Mid-phase pivot — drop Text body columns, add JSONB sections columns |
| `scripts/seed.ts` | Edit | + `seedLegalPagesContent`, footer rename in `FooterLegalLink` + `FooterGetInTouchLink` |
| `src/lib/validation.ts` | Edit | + `legalSectionSchema` + `legalSectionsSchema` + `legalPagesUpdateSchema`; + `legal-hero` in `uploadKindSchema` |
| `src/lib/identity.ts` | Edit | + `getLegalPagesContent` (React.cache wrapped) |
| `src/lib/cloudinary.ts` | Edit | + `legal-hero` → `legal/hero` folder mapping |
| `src/lib/admin-actions/legal-pages.ts` | New | `updateLegalPagesContentAction` — parses sections JSON, Zod-validates, upserts singleton, revalidates both public + admin routes |
| `src/components/admin/SectionsEditor.tsx` | New | Per-section card UI with optional heading + per-paragraph textarea; serializes to single hidden JSON input |
| `src/components/sections/LegalSections.tsx` | New | Public renderer — tolerant `coerceSections` + map to `<section><h2>` + `<p>` blocks |
| `src/components/admin/ImageUploader.tsx` | Edit | + `legal-hero` in Kind union type |
| `src/components/admin/Sidebar.tsx` | Edit | + Legal Pages entry (ShieldCheck icon) in primary nav |
| `src/app/admin/(authed)/page.tsx` | Edit | + dashboard StatCard (`Configured` / `Not configured`) + ActionCard for `/admin/legal-pages` |
| `src/app/admin/(authed)/legal-pages/page.tsx` | New | Server page — auth gate + fetch + render form |
| `src/app/admin/(authed)/legal-pages/LegalPagesForm.tsx` | New | Client form — two sections (Page 1 / Page 2), each with hero card + SectionsEditor |
| `src/app/privacy-policy/page.tsx` | New | Public route — PageShell + Container + LegalSections (privacySections) |
| `src/app/terms-and-conditions/page.tsx` | New | Public route — same shape, picks termsSections |
| `src/app/globals.css` | Edit | + `.legal-body` prose styling (h2 / p / strong / em / a / ul / li) |

**Total: 18 files changed, +1,003 LOC / −5 LOC, single commit `7112f4f`.**

---

## Mid-phase pivots

### Pivot 1 — width
Initial public pages used `mx-auto max-w-3xl` on the body wrapper. Chair pointed out the content was narrower than the rest of the site. Replaced with full Container width to match the established convention (see `feedback_workflow.md` memory entry).

### Pivot 2 — admin UX (HTML textarea → structured editor)
Initial admin form had one monospace textarea per page accepting raw HTML, similar to the AboutMechaClub `introBody` pattern. Chair asked for field-based input — separate fields per paragraph, no HTML markup. Pivoted to a new `SectionsEditor` (per-section card with optional heading + per-paragraph textarea), changed the schema from `Text` body to `Json` sections via a second migration, and updated the renderer to map structured data to `<section><h2>` + `<p>` blocks.

### Pivot 3 — footer rename
Chair pointed at the bottom-bar legal row ("Privacy Statement | Terms of Use") and asked for it to be renamed to match the new page titles. Updated both `FooterLegalLink` (bottom row) and `FooterGetInTouchLink` (Get in Touch column) — the latter had its own external "Privacy Statement" link that would have stayed inconsistent. One-off patch script applied the rename + relink to Neon immediately; seed defaults updated for future installs.

### Discovery — page slug vs footer label
Chair tested by editing the `FooterLegalLink` row in the admin to name = "Privacy Statement" and href = "/privacy-statement", which produced a 404. Surfaced that the page slug is fixed at the filesystem level (`src/app/privacy-policy/page.tsx`) while the footer href is admin-editable. Documented the separation: label is free-form, href must match an existing route. Chair confirmed "all ok" after putting the href back at `/privacy-policy`.

---

## Verification log

| Stage | Verification |
|---|---|
| Schema | Two migrations applied to Neon (additive then column swap); chair tested the admin form save after the swap, all green |
| Local typecheck | `npx tsc --noEmit` clean across all three iterations |
| Local curl sanity | Privacy + Terms pages 200 with correct `<h2>` section headings; existing public surfaces 200 |
| Browser verify | Section card UI with heading + paragraph fields, both pages render full Container width with brand-styled section headings, footer shows new labels pointing at the internal routes |
| Production deploy | `dpl_…` aliased to `mechanical-engineering-olive.vercel.app`. Build clean; new routes 200 on prod sanity curl |
| Prod sanity | 8 routes 200 (homepage + both legal pages + admin login + 4 representative public surfaces); footer href + label confirmed in prod HTML; Phase 14 image regression check identical (562,878 B JPEG) |

---

## Out of scope / deferred

- **Page slug as CMS field** — currently filesystem-only. Would require either a dynamic `[slug]` catch-all that reads slug-keyed CMS rows, or per-page custom slug columns + redirect handling. Deferred until a chair-driven need surfaces; current scheme is conventional and short.
- **Rich text editor (TipTap / Lexical)** — SectionsEditor produces structured sections + plain-text paragraphs. Inline links / emphasis would need either a typed-block model on top of SectionsEditor or reintroducing a controlled subset of HTML. Deferred — chair currently fine with plain prose.
- **Bullet lists** — the original Terms content had a `<ul>` under "How we use your information". With prose-only paragraphs, the bullets are flattened into individual paragraphs. If real list semantics are needed later, add a `type: 'paragraph' | 'list'` discriminator to the section item shape.
- **Page metadata as CMS** — page title (`metadata.title` in the public route file) is currently hardcoded ("Privacy Policy — Sonargaon University"). Hero title is admin-editable; HTML `<title>` is not. Low-priority — could be derived from `privacyHeroTitle` if chair wants alignment.

---

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install` (no new deps)
- [ ] `npx prisma migrate status` clean (Phase 17 migrations present + applied)
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run db:seed` idempotent — existing rows untouched, fresh install gets the new footer labels
- [ ] `npm run dev`:
  - [ ] `/privacy-policy` renders with PageShell hero + section headings + paragraphs at full Container width
  - [ ] `/terms-and-conditions` renders the same shape with its own sections
  - [ ] Footer shows "Privacy Policy" + "Terms & Conditions" pointing at the new internal routes (in BOTH the bottom-bar legal row AND the Get in Touch column)
- [ ] Admin:
  - [ ] `/admin/legal-pages` reachable from Sidebar primary nav (ShieldCheck icon)
  - [ ] Form shows two Page sections; each has hero card + sections card
  - [ ] SectionsEditor: add section, remove section, reorder section, add paragraph, remove paragraph, reorder paragraph — all work
  - [ ] Save persists the new shape; toast shows "Legal pages saved"
  - [ ] Dashboard "At a glance" shows Legal Pages: Configured; Quick Actions shows the card
- [ ] Regression: Phase 15 splash + per-nav overlay still working on `/`; Phase 14 quality radio works on admin upload forms (including the new `legal-hero` kind); Phase 13 hero positions unchanged.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
