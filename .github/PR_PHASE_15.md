# Phase 15 — Public website preloader (branded, real-loading, admin-excluded)

Visible UX polish only. Three-tier preloader for the public site, with `/admin/*` fully excluded via file placement + server-header detection.

- **Tier 1** — `src/app/loading.tsx` renders `BrandedLoader` for any route segment that suspends on data; `src/app/admin/loading.tsx` returns `null` so admin pages never inherit the public loader.
- **Tier 2** — `InitialSplash` (client) shows the loader once per browser tab on the cold first load, gated by a `sessionStorage` flag. Server renders `null` so returning visitors never see a hydration flash.
- **Tier 2b** — `PublicNavigationOverlay` (client, added mid-phase) intercepts internal-link clicks and keeps the loader visible **for exactly the duration of the navigation** — captures `pathname` at click time, hides the moment `usePathname()` reports a different value. No fixed minimum; no early-fade gap.
- **Tier 3** — a `.page-fade-in` 250ms opacity keyframe wraps the public branch of `{children}` in the root layout, re-keyed by pathname so each public navigation re-triggers the fade.

All three tiers are gated by the existing `x-pathname` server header (Phase 1 pattern) — no client `usePathname` in the layout server tree, no hydration mismatch surface area.

Zero new dependencies, zero schema impact.

---

## Decisions A–F — outcomes

| # | Decision | Outcome |
|---|---|---|
| **A** | Logo source | A-png path. Uses the App Router auto-favicon at `src/app/icon.png` (512×512 PNG, 158 KB), served at `/icon.png` and embedded via plain `<img>` (next/image fill mode override memory entry → safer for overlay components) |
| **B** | Loader visual | Mid-phase pivot per chair request: replaced the initial rotating-ring concept with the classic loading.io 4-dot ellipsis (recreated in pure CSS — no embed, no external library). Logo stacked above; primary blue + accent magenta dots; 0.7s loop, cubic-bezier easing |
| **C** | Tier 1 placement | `src/app/loading.tsx` → `<BrandedLoader />`; `src/app/admin/loading.tsx` → `return null` (file-placement override blocks the public loader on the entire `/admin/*` subtree) |
| **D** | Splash strategy | Client-render (SSR returns `null`, client `useEffect` mounts overlay only for first-visit gated by `sessionStorage`). Returning visitors never see a hydration flash; first-time visitors see ~50–100 ms of content then the 600 ms brand moment + 300 ms fade |
| **E** | Page transition | `@keyframes page-fade-in` in `globals.css` under `@layer utilities`; root layout wraps `{children}` in `<div key={pathname} className="page-fade-in">{children}</div>` on the public branch only. `key={pathname}` from the `x-pathname` server header forces a fresh React mount on every public navigation, retriggering the 250 ms opacity fade |
| **F** | Admin exclusion | File-placement (`admin/loading.tsx`) + server-header conditional mounts (`!isAdmin && <InitialSplash />`, `!isAdmin && <PublicNavigationOverlay />`) + page-fade wrapper applied only on public branch. **Zero** client `usePathname` in the layout server tree; Phase 1 trap respected |
| **G** | Real-loading philosophy | Honoured strictly: Tier 1 is Next.js native (no synthetic delay), Tier 2 has only a `sessionStorage` first-visit gate, Tier 2b matches actual navigation duration via pathname-change detection (no minimum cap after chair surfaced that the fixed 400 ms felt fake when actual load was longer), Tier 3 is mount-time CSS |

---

## Mid-phase pivots (two)

### Pivot 1 — visual: ring → dot ellipsis
Originally planned a rotating ring with the favicon centred inside. Chair pointed at loading.io asset 811727 (a 4-dot horizontal ellipsis in the loading.io ldloader gallery). loading.io blocked WebFetch (403) and search couldn't ID the exact asset, but the screenshot the chair shared was unambiguous. Recreated the same animation pattern in pure CSS (three keyframes — `grow`, `shrink`, `slide` — applied to four dots in three slots) under brand primary + accent. No embed code, no external dep. Logo kept stacked above the dots so the brand moment survives.

### Pivot 2 — timing: fixed minimum → pathname-synced
Initial `PublicNavigationOverlay` used a 400 ms minimum-visible window. Chair tested and reported that on slow loads the preloader hid before the new page arrived — "fake mone hoy" (feels fake). Rewrote the hide logic to wait for `usePathname()` to differ from the snapshot taken at click time. Result: preloader duration matches the actual navigation duration with no artificial cap and no early hide. 15 s safety timeout for hung navigations / redirect-to-same-path edge cases.

---

## File inventory (single commit `b89859e`)

| File | Type | Why |
|---|---|---|
| `src/components/common/BrandedLoader.tsx` | NEW | Server component. Fullscreen overlay (`fixed inset-0 z-50 bg-white`), logo above, 4-dot ellipsis below. CSS-only animation. |
| `src/components/common/InitialSplash.tsx` | NEW | Client component. `sessionStorage` first-visit gate + 600 ms minimum-visible + 300 ms fade. Renders `null` on SSR. |
| `src/components/common/PublicNavigationOverlay.tsx` | NEW | Client component. Internal-anchor click interceptor + `usePathname` snapshot/diff for pathname-synced hide. |
| `src/app/loading.tsx` | NEW | Tier 1 fallback — renders `BrandedLoader`. |
| `src/app/admin/loading.tsx` | NEW | Returns `null` — blocks the public loader from inheriting into `/admin/*`. |
| `src/app/globals.css` | EDIT | `@keyframes page-fade-in` + `.page-fade-in` utility; `@keyframes lds-ellipsis-{grow,shrink,slide}` + `.ellipsis-{grow,shrink,slide}` utilities. |
| `src/app/layout.tsx` | EDIT | `+ pathname` captured from headers; `+ <InitialSplash />` and `+ <PublicNavigationOverlay />` conditional mounts; `<main>` wrapper splits admin (raw `{children}`) vs public (`<div key={pathname} className="page-fade-in">{children}</div>`). |

**Total: 5 new files + 2 edits, ~280 LOC, single commit `b89859e`.**

---

## Verification log

| Stage | Verification |
|---|---|
| Schema | No migration — purely frontend chrome |
| Local typecheck | `npx tsc --noEmit` clean |
| Local curl sanity | 9 public surfaces + `/admin/login` + `/student-society/events` + `/news` + `/faculty-member` all 200; admin HTML contains no `role="status"`, no `aria-label="Loading"`, no `class="page-fade-in"` |
| Browser verify (chair) | First-visit splash on fresh private window. Reload → no splash (sessionStorage). Per-navigation preloader visible for the exact load duration on every internal link click. Admin pages fully clean — no preloader artifacts anywhere. Mid-phase pivots both verified by chair before commit |
| Production deploy | `dpl_9kkJwbajDdZtciBNP6nEZxZtFDRK` → aliased to `mechanical-engineering-olive.vercel.app`. Build clean — 206 pages, no warnings |
| Prod sanity | 9 public surfaces 200; admin routes 200; admin HTML cleanly excludes all Phase 15 markers; Phase 14 hero image regression check identical (562,878 B JPEG); Phase 13 hero position fingerprints all preserved (Dean 3%, Head 0%, Overview 3%, Contact 30%) — the only difference was streaming order (Tier 1 Suspense fallback pushes JourneyCTASection's 50% earlier in the stream than the page hero) |
| Chair prod browser | Verified post-deploy on live URL |

---

## Out of scope (deferred)

- View Transitions API (Phase 16+ if desired — Phase 15 stayed CSS-simple per scope)
- Top-of-page progress bar
- Route-specific skeleton screens
- Animated logo (only the spinner animates per chair spec; logo is static)
- Service Worker / offline mode
- Browser back/forward preloader (anchor-click only; `popstate` not yet wired)
- Form submit / programmatic `router.push()` preloader (anchor-click only)
- Analytics on perceived load time

---

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install` (no new deps)
- [ ] `npx tsc --noEmit` clean
- [ ] `prisma migrate status` clean (no Phase 15 migration)
- [ ] `npm run dev`:
  - [ ] **First-visit splash** — fresh private/incognito window → logo + dot ellipsis ~600 ms → fade → homepage
  - [ ] Same window reload → **no splash** (sessionStorage flag working)
  - [ ] **Per-navigation overlay** — click navbar Link to About / Faculty / News / Contact / Events → preloader visible **for the actual nav duration** (no early hide, no artificial extension)
  - [ ] Network throttle Slow 3G → preloader stays the full duration of the slow load
  - [ ] **Tier 3 fade** — each new public page fades in over 250 ms (subtle but visible)
- [ ] **Admin exclusion**:
  - [ ] `/admin/login` → no splash, no overlay, no fade wrapper. DevTools Elements: no `role="status"`, no `class="page-fade-in"` anywhere
  - [ ] Log in → `/admin` and all admin sub-routes → no public preloader, no fade transitions
- [ ] **Console clean** — DevTools console shows no hydration warnings or errors on either public or admin routes
- [ ] **Mobile** (DevTools 375 px) — splash + per-nav overlay fullscreen, dots and logo sized appropriately, no horizontal scroll
- [ ] **No regression on prior phases**:
  - [ ] Phase 14 — admin ImageUploader still shows "Delivery quality" radio; new uploads still bake `f_auto,q_auto:*` into the URL
  - [ ] Phase 13 — Dean (3%), Head (0%), Overview (3%), Contact (30%) hero positions all visually unchanged
  - [ ] Existing pre-Phase-14 images load identically (`Content-Length` byte-match)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
