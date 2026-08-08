# Phase 11 — Admin UI responsive + branding logo + sticky sidebar + login redesign

**Third demand-driven phase post-CMS-complete.** Pure UI/UX — zero schema changes, zero new dependencies, public site untouched. Bounded to admin chrome + login page after chair flagged three concrete signals:

1. Admin UI not responsive — sidebar + forms broke on smaller viewports
2. University logo missing from admin chrome
3. Login page bare — no logo, no branding hierarchy

---

## Decisions A–D — outcome

| # | Decision | Outcome |
|---|---|---|
| **A** | Admin chrome logo hierarchy | Sidebar header gets the DB-driven SU brand banner (`DepartmentIdentity.logoUrl` — same source the public Navbar uses on white backgrounds). Login page gets a hardcoded compact crest (`/assets/su-logo.png`, chair-supplied 16 KB PNG). Final placement settled after one mid-phase iteration — see "Logo source iteration" below. |
| **B** | Sidebar responsive pattern | `lg:hidden` off-canvas drawer mirroring the Phase 3 public Navbar pattern. Desktop (≥1024px) persistent sidebar unchanged. <1024px: hamburger at `top-3 left-3 z-70`, drawer at z-60 (w-72 mobile, w-64 desktop), backdrop at z-55 with `bg-black/40`. Body scroll-lock while open. Closes on backdrop click, Escape, X button, or route change. Zero new dependencies — pure useState + useEffect + Tailwind transforms. |
| **C** | Admin form responsive sweep | Surgical, not redesign. Main padding scales `p-4 sm:p-6 md:p-8 lg:p-10` (was `p-6 md:p-10` — uncomfortable on phone). `pt-16 lg:pt-10` to clear the fixed hamburger. `min-w-0` on `<main>` so long-content children don't push past the column. Drag handles bumped to `p-2 lg:p-1` + `touch-none` on both SortableList and FormSortableList. Spot-fix of 5 forms / ~10 ungated 2-col & 3-col grids that would have stayed multi-column on phone (Faculty, Department-Identity, University-Identity, Programs, Users). 124 other `max-w-*` occurrences across Phase 0-10 admin forms were already mobile-first. |
| **D** | Login page redesign | Centered `max-w-md` card on subtle `primary/5 → accent/5` diagonal gradient. Compact crest at top (h-16 `object-contain`), "MECHANICAL ENGINEERING · ADMIN PANEL" kicker, "Sign in" heading, helper copy. Form lifted to `LoginForm.tsx` client child — Better Auth integration + error handling untouched (constraint #11). No "Forgot password?" link (omitted as cleaner — chair's hint). |

Plus chair-requested mid-phase: **sticky sidebar** — `lg:sticky lg:top-0 lg:h-screen` on the `<aside>`. Dashboard content scrolls; sidebar stays at viewport top. Internal `flex-1 overflow-y-auto` on the nav handles long-list overflow when the Phase 8c/10 nav exceeds one viewport.

---

## Logo source iteration — recorded for future readers

The field names on the two identity singletons are misleading. The codebase splits the two SU brand logo URLs by **background color**, not by entity:

- `DepartmentIdentity.logoUrl` → `/assets/su-colour-logo.webp` (~102 KB) — the **colored** SU mark used on white backgrounds. Public Navbar uses this.
- `UniversityIdentity.logoUrl` → `/assets/footer-logo.webp` (~6.7 KB) — the **white** variant used on the dark public Footer.

CP11.2's initial Decision A read "use UniversityIdentity.logoUrl" by field name → produced a white-on-white invisible logo on the login card. Chair caught it via browser-verify. Iteration:

1. Initial wire → white-on-white invisible. Fixed by switching to `DepartmentIdentity.logoUrl`.
2. Wide colored banner now visible on login card but felt awkward in the tight space. Chair supplied `su-logo.png` (compact crest).
3. Brief intermediate state had `su-logo.png` in both login + sidebar. Chair corrected: login should keep the banner.
4. Chair final call (after seeing both placements): **swap** — compact crest reads better on the focused login moment, the wider banner reads as ambient brand presence in the always-visible sidebar.

Captured as a project memory entry (`project_logo_sources.md`) so future phases don't re-trip the misleading-field-names trap. Verification rule reinforced: never trust schema field name semantics for visual rendering — verify asset content first.

---

## File inventory (1 commit, single-track UI work per constraint #9)

| Layer | Files | Notes |
|---|---|---|
| Sidebar chrome | `src/components/admin/Sidebar.tsx` | drawer state + hamburger + backdrop + body-scroll-lock + pathname-close + Escape close + sticky/h-screen at lg + logo header |
| Authed layout | `src/app/admin/(authed)/layout.tsx` | `lg:flex` (not always-flex) + scaled padding + min-w-0 main + parallel DB fetch (counts + dept + uni) |
| Login page | `src/app/admin/login/page.tsx` (server component now) + `src/app/admin/login/LoginForm.tsx` (NEW client child) | gradient bg + hardcoded compact crest + Better Auth wire preserved |
| Drag handles | `src/components/admin/SortableList.tsx`, `src/components/admin/FormSortableList.tsx` | tap-friendly p-2 mobile / p-1 lg + touch-none |
| Form responsive sweep | 5 form files — `FacultyForm.tsx`, `DepartmentForm.tsx`, `UniversityForm.tsx`, `ProgramForm.tsx`, `EditUserForm.tsx` | ~10 ungated grid-cols-2/3 patterns made mobile-first |
| Assets | `public/assets/su-logo.png` (NEW, 16 KB) | chair-supplied compact crest for login card |

**Total: 12 files changed, +250 / −137**

---

## Verification log

| Stage | Verification |
|---|---|
| Typecheck | Clean throughout iterative pass |
| Local curl | `/admin/login` 200 with `su-logo.png` (3 refs in HTML), admin routes 307 auth-gated, public regression `/`, `/contact`, `/faculty-member` all 200 |
| Local browser (chair) | Desktop layout no regression. Tablet/mobile drawer + hamburger + backdrop + close-on-route-change all functional. Sticky sidebar verified (dashboard scroll, sidebar stays). Logo placement confirmed after the iteration described above. |
| Production deploy | `dpl_6KM5SBCVnCgALL67yzscUfTH5azp` READY at `https://mechanical-engineering-olive.vercel.app` |
| Production curl | `/admin/login` 200 + `su-logo.png` 3x + 16 KB asset 200. Admin routes 307. 4/4 regression (`/`, `/contact`, `/faculty-member`, `/admission/notice`) 200. Phase 9 POST `/api/contact/submit` 200 (1 sanity row inserted as `Phase 11 sanity`). |
| Chair production browser | Verified across desktop + mobile widths. |

---

## Memory entries added during Phase 11

| Entry | Purpose |
|---|---|
| `feedback_json_textarea_pattern.md` (Phase 10 leftover, reinforced) | JSON textarea = tech debt; build structured editor instead |
| `project_logo_sources.md` (NEW this phase) | Logo field names are misleading; pick by background color, not field name. Documents the CP11.2 mid-phase fix so the trap doesn't repeat. |

---

## Out of scope (Phase 12+ if demand emerges)

- **Color palette / typography redesign** — Phase 11 was layout/responsive/branding only
- **Auth flow changes** — password reset, 2FA, etc.
- **Public site visual changes** — no responsive gap surfaced in CP11.1 discovery; Phase 1-10 verifications still hold
- **Admin permission model changes**
- **The 11 JSON-form retro candidates** from the Phase 8b PR doc tech-debt inventory still in queue
- **Per-program tuition fee deep wiring** and other Phase 8c-listed items

---

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install` (no new deps to verify; `package-lock.json` unchanged)
- [ ] `npx tsc --noEmit` clean
- [ ] Static asset: `public/assets/su-logo.png` present (16 188 bytes)
- [ ] `npm run dev`:
  - [ ] `/admin/login` — compact crest on gradient bg, no overlap of card chrome with viewport edges down to ~320px
  - [ ] Sign in — sidebar header shows wide colored banner above "ME Admin / Mechanical Engineering" text
  - [ ] Dashboard scroll — sidebar stays at viewport top (sticky), only main content scrolls
- [ ] Resize browser to <1024px:
  - [ ] Hamburger appears top-left; sidebar collapses to off-canvas
  - [ ] Tap hamburger → drawer slides in with bg-black/40 backdrop + body scroll lock
  - [ ] Tap backdrop / Escape / X icon / any sidebar link → drawer closes
  - [ ] Hamburger icon flips to X while open
- [ ] Mobile viewport (~375px):
  - [ ] No horizontal scroll on dashboard, contact-page singleton form, faculty list, faculty edit form, department-identity (color picker + stats), university-identity (social URLs), program edit, scholarships
  - [ ] Drag handles in SortableList + structured editors are tap-accessible (≥32px touch target)
- [ ] Regression spot-checks:
  - [ ] Public `/`, `/contact`, `/faculty-member`, `/admission/notice`, `/student-society/alumni` unchanged
  - [ ] Phase 9 form submit still 200 via prod `/api/contact/submit`
  - [ ] All Phase 8c admin pages (admission notices, transfer credits, waiver scholarship, etc.) render unchanged
- [ ] Cleanup post-merge: delete the `Phase 11 sanity` test row from `/admin/contact-submissions`

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
