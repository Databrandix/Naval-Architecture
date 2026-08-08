# Phase 10 — `/contact` page CMS (close the Phase 8c declaration gap)

**Second demand-driven phase after PROJECT CMS-COMPLETE was declared in Phase 8c.** The declaration was overstated at the time — `/contact` was the one user-facing public page whose content was still hardcoded. Phase 9 wired the form backend (DB log + Resend email); Phase 10 makes everything else on the page admin-editable.

After this merge, **every user-facing public surface on the site is genuinely CMS-driven**. The Phase 8c claim is now accurate.

---

## What was still hardcoded after Phase 9

The `/contact/page.tsx` server component contained:

- Hero image path (`/assets/contact-hero.webp`) + position string
- Intro paragraph copy
- Three section headings (Quick Contact Information / Send Us a Message / Campus Locations)
- 4 Quick Contact cards (Phone / Email / Website / Facebook) as a literal `const`
- 3 Campus Locations (Permanent / Green Road / Mohakhali) as a literal `Campus[]` array
- Form's "We typically respond within 1–2 business days." hint hardcoded inside `ContactForm.tsx`

All of the above now live in `ContactPageContent` (singleton) + `CampusLocation` (multi-row). The Phase 9 form-submit pipeline is untouched.

---

## Schema additions (one migration: `add_contact_page_content`)

### `ContactPageContent` (singleton)
- Hero — `heroTitle`, `heroOverline?`, `heroImageUrl`, `heroImagePublicId?`, `heroImagePosition?`
- `introBody` (HTML allowed, single block)
- 4 section headings (`quickContactHeading`, `formHeading`, `formSubheading`, `campusesHeading`) — defaults pre-seeded to existing copy
- `responseTimeNote` — the "respond within 1–2 business days" hint
- `quickContactCards` — Json `[{ iconName, title, primaryValue, primaryHref?, secondaryValue?, secondaryHref?, hint? }]`. Editable via the new **QuickContactCardsEditor** (see CP10.x below).

### `CampusLocation` (multi-row, 3 seeded)
- `slug` (unique) · `name` · `tag?` · `address` · `phone?` · `email` · `displayOrder`
- Drag-reorderable via the standard SortableList pattern
- Permanent Campus has no tag + no phone; the other two have both

### `UniversityIdentity` — no change
- The Phase 9 `contactSubmissionEmail` field is untouched

### Cloudinary
- New `Kind` literal: `'contact-hero'` → subfolder `contact/hero`
- Wired through `uploadKindSchema` (validation), `KIND_TO_SUBFOLDER` (cloudinary lib), and the `Kind` union in `ImageUploader.tsx`

---

## CP10.x follow-up — QuickContactCardsEditor

Mid-phase, the initial implementation used a JSON textarea for the `quickContactCards` Json column. Chair feedback: same UX issue as Phase 8b's original ShiftsEditor / OverviewStatsEditor JSON textareas — unusable for non-tech admins. A second commit on the same branch replaced it with a structured editor following the **Phase 8b refactor pattern**.

### `src/components/admin/QuickContactCardsEditor.tsx`

- FormSortableList drag-reorder via the shared dnd-kit primitive
- Per-card UI:
  - Live icon preview circle (left) — renders the typed `iconName` against an `ICON_PREVIEW` map that mirrors the public page's `ICON_MAP` so admin sees what `/contact` will render
  - Top row: `iconName` (with Lucide-name helper text) + `title`
  - Primary row: `primaryValue` + `primaryHref` (with `tel:` / `mailto:` / `https://` helper)
  - Collapsible "Secondary contact (optional)" — auto-expands when data exists; collapsed state shows a small accent dot indicator
  - Collapsible "Hint (optional)" — same auto-expand behavior
  - Trash button per card
- Bottom-of-list `+ Add card`
- **Unknown-icon UX**: if the typed name isn't in `ICON_PREVIEW`, an amber AlertCircle warning notes that the public page will render the HelpCircle fallback
- **Output**: hidden input named `quickContactCards` carrying the JSON-stringified array — same shape consumed by `parseJsonArray` in the server action; the Zod schema (`contactPageContentUpdateSchema`) is unchanged
- **Filter**: cards missing `iconName` / `title` / `primaryValue` are dropped from the serialized output so accidental empties don't pollute public render

### Constraint #4 reinterpretation (re-applied)

Phase 8b first relaxed the no-new-editors constraint when the existing editors didn't fit a genuinely new shape. CP10.x is the second application of that pattern — `{ iconName, title, primaryValue, primaryHref?, secondaryValue?, secondaryHref?, hint? }` doesn't match any existing editor and the 7-field-per-row collapsible-optional-section shape is distinctly new.

### Process signal

This is the **second** post-CMS-complete demand-driven UX correction. The first was Phase 8b's shifts JSON → structured. The pattern is now well-established and the 11 remaining JSON-textarea candidates from the Phase 8b PR doc tech-debt inventory remain valid; they'll get attention case-by-case as admins use the forms in the wild and flag friction.

---

## Admin sidebar + dashboard

- New collapsible **"Contact Page"** group (Contact icon) placed AFTER the Admission group and BEFORE the Phase 9 top-level "Contact Submissions" entry. Two children: `Page Content` (singleton form) and `Campus Locations` (multi-row).
- Phase 9's "Contact Submissions" stays top-level so its unread badge keeps surfacing without expanding a group.
- Dashboard gains 2 stat cards (`Contact Page Content: Configured` / `Campus Locations: N`) + 2 ActionCards.

---

## Public `/contact/page.tsx` rewrite

- Full server component now, reads both entities via `React.cache()`-wrapped fetchers (`getContactPageContent` + `getCampusLocations`)
- `ICON_MAP` resolves `quickContactCards.iconName` against a curated Lucide set (Phone / Mail / Globe / Facebook / Instagram / Youtube / Linkedin / Twitter / MessageCircle / Send / MapPin / Building2 / Clock) with `HelpCircle` fallback (same defensive pattern as Phase 7 `TransportLanding.instructions`)
- `coerceCards` defensively reads the Json column at render time — same pattern as the Phase 6/7/8 coerce helpers
- `introBody` rendered via `dangerouslySetInnerHTML` (Phase 4 J1 pattern, author-trusted admin input)
- `ContactForm` now takes an optional `responseTimeNote` prop — default preserves Phase 9 copy so the component still works in any other render context

---

## File inventory (2 commits)

| Commit | Files | Notes |
|---|---|---|
| **`feca160`** Phase 10 main | 20 | 2 new Prisma models + migration + seed (4 cards + 3 campuses extracted from the prior hardcoded page) + Cloudinary `contact-hero` kind across 3 files + 2 identity fetchers + 2 admin-actions + 6 admin UI files + new sidebar group + 2 dashboard cards / 2 actions + `/contact/page.tsx` full rewrite + `ContactForm` prop |
| **`f1feb4d`** CP10.x follow-up | 2 | `QuickContactCardsEditor` component + `ContactPageForm` wired to it (JSON textarea removed) |

**Total: 22 files changed, +1555 / −208**

### Files NOT changed (deliberate)

| File | Why |
|---|---|
| `src/lib/search-index.ts` | `/contact` page is already in the static-pages list. The new admin-side entities (`ContactPageContent` singleton, `CampusLocation` multi-row) are **not** search-indexed — campus addresses + quick-contact cards are page-chrome, not searchable content. |
| `src/app/sitemap.ts` | `/contact` already listed; no new public routes were introduced. |
| `prisma/schema.prisma` Phase 0–9 tables | Phase 10 is purely additive; no existing column touched. |

---

## Verification log

| Stage | Verification |
|---|---|
| Schema | `npx prisma migrate dev --name add_contact_page_content` applied clean on Neon prod DB. Migration SQL preview matched expectations (2 new tables + 1 unique slug index + 1 displayOrder index). |
| Seed | `npm run db:seed` idempotent — existing rows untouched; `ContactPageContent` singleton + `CampusLocation` 3 rows inserted on first run; re-run skipped via upsert. |
| Local typecheck | Clean both pre- and post-CP10.x (one fix required: explicit `LucideIcon \| undefined` annotation on the icon-preview lookup because `tsconfig.json` doesn't enable `noUncheckedIndexedAccess`). |
| Local curl | `/contact` 200 with all 6 content fingerprints + hero overline + title present. `/admin/contact-page`, `/admin/campus-locations`, `/admin/campus-locations/new` all 307 auth-gated. |
| Chair local browser | Round-trip tests passed: edit/save/reload all 3 entity types; drag-reorder campuses; new CP10.x editor produced/serialized the same shape as the original textarea. |
| Production deploy | `vercel deploy --prod` → `dpl_A9BESziQigMJYYU6Fm1DTPDMEj4W` READY at `https://mechanical-engineering-olive.vercel.app`. |
| Production curl | `/contact` 200 + all fingerprints. Admin routes 307. Phase 9 POST `/api/contact/submit` still 200 (regression-checked). 4/4 cross-phase regression spot-checks 200 (`/`, `/faculty-member`, `/admission/notice`, `/student-society/alumni`). |
| Chair production browser | All 6 magic moments verified live. |

---

## Closing note — CMS-COMPLETE, this time for real

The Phase 8c PR called the project CMS-complete. That was true for the 6 admission pages it covered, but the broader site-wide claim was overstated: `/contact` was still hardcoded. Phase 9 fixed the functional gap (the form backend); Phase 10 fixes the content gap.

**Every user-facing public surface on the Department of Mechanical Engineering site is now admin-editable.** No hardcoded content remains on any public page. The previously-listed Phase 8c tech-debt items (11 JSON-form retro candidates, news cursor pagination, ResearchArea featured wiring, gallery albums, test suite, DOMPurify hardening, `*-data.ts` cleanup, `server-only` markers, `SectionContent` type relocation, per-program tuition fee deep wiring) all remain valid and demand-driven.

🎉 — Project CMS-complete (genuinely, this time).

---

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install && npx prisma migrate status` clean
- [ ] `npm run db:seed` — idempotent, reports `ContactPageContent seeded (singleton)` + `CampusLocation seeded (3 rows)`
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run dev`:
  - [ ] `/contact` visually pixel-identical to pre-Phase-10 (constraint #7)
  - [ ] `/admin/contact-page` — structured QuickContactCardsEditor (no JSON textarea); 4 seeded cards visible with icon previews; Phone card's Hint section auto-expanded; E-mail card's Secondary contact section auto-expanded
  - [ ] Drag-reorder a card → Save → toast success → reload → order persisted
  - [ ] `+ Add card` → fill `iconName=Instagram`, `title=Instagram`, `primaryValue=@yourdept`, `primaryHref=https://...` → Save → reload → 5 cards
  - [ ] Type `NotARealIcon` as iconName → amber unknown-icon warning + HelpCircle preview
  - [ ] Remove a card via trash button → Save → reload → card gone; remaining count drops by 1
  - [ ] `/admin/campus-locations` — 3 rows; drag-reorder works; add/edit/delete round-trip
  - [ ] Edit hero image via ImageUploader (`contact-hero` Cloudinary kind) → uploads to `contact/hero` subfolder
- [ ] Sidebar shows new "Contact Page" collapsible group with `Page Content` + `Campus Locations` children
- [ ] Dashboard: `Contact Page Content: Configured` + `Campus Locations: 3` stat cards present; 2 new ActionCards in Quick actions
- [ ] Regression spot-checks:
  - [ ] Phase 9 `/contact` form submit → DB row, email dispatch path unchanged
  - [ ] All Phase 8c admission pages render unchanged
  - [ ] Faculty / events / news / alumni / etc. unchanged
- [ ] Global search:
  - [ ] `/contact` page itself still in static-page results
  - [ ] ContactPageContent + CampusLocation rows do **not** appear in search (privacy-style exclusion, same as ContactSubmission)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
