# Phase 16 — Admin Performance Diagnostic + Targeted Optimization

Diagnostic-first phase. CP16.1 surfaced the structural bottlenecks; the rest of the phase shipped the Hobby-plan-compatible fixes.

The headline finding (CP16.1) was cross-region misalignment: Vercel functions in `iad1` (Washington DC) talking to Neon Postgres in `ap-southeast-1` (Singapore) added ~270 ms RTT per query batch. The cross-region fix needs Vercel Pro — off the table per chair budget. Everything below is a free win that doesn't depend on the region change.

---

## CP16.1 — Diagnostic findings

| Layer | Item | Status |
|---|---|---|
| Infra | Vercel `iad1` ↔ Neon `ap-southeast-1` | 🚨 Primary bottleneck (~270 ms RTT per query batch) — needs Pro to fix |
| Infra | Neon pooled endpoint (`-pooler`) | ✅ Using pgbouncer correctly |
| DB | Prisma singleton ([db.ts:45-53](src/lib/db.ts#L45-L53)) | ✅ Proper globalThis pattern |
| DB | Schema indexes — Faculty / News / Event / Notice / Gallery + all displayOrder lists + ContactSubmission composite | ✅ Every hot path indexed |
| Auth | `getSession()` ([auth-server.ts:24-26](src/lib/auth-server.ts#L24-L26)) — **not React.cache wrapped** | ❌ Called twice per render (layout + page) → fixed in CP16.3 |
| Auth | Middleware cookie check ([middleware.ts:25-34](src/middleware.ts#L25-L34)) | ✅ Cookie-only, no DB |
| Render | `(authed)` layout: `getSession()` ran **sequentially before** Promise.all | ⚠️ ~270 ms wasted serial → fixed in CP16.NEW |
| Render | Identity / list getters in [identity.ts](src/lib/identity.ts) | ✅ All React.cache wrapped |
| Render | No Suspense boundaries in admin layout — full block before first byte | ⚠️ Sidebar paint deferred → fixed in CP16.4 |
| Bundle | Admin page bundles 133–189 B (server-rendered) | ✅ Tiny |
| Network | Vercel edge close to Dhaka (TCP 14 ms) | ✅ Edge caching working |

**TTFB baseline** (from Dhaka, 3-run median, warm):
- `/admin/login`: 1.36–1.77 s
- Admin authed pages (chair report): **3–5 s**

---

## CP16.3 — React.cache wrap `getSession()`

Single-file patch in [auth-server.ts](src/lib/auth-server.ts) — `cache()` from React dedupes the Better Auth session lookup within a render pass. Layout `getSession()` + page `getSession()` now share one DB roundtrip instead of two.

**Expected save**: ~270 ms per authed page.

---

## CP16.NEW — Parallelize session into admin layout `Promise.all`

The `(authed)` layout used to do:

```ts
const session = await getSession();          // ~270 ms blocking
if (!session?.user) redirect('/admin/login');
const [count, dept, uni] = await Promise.all([...]);  // ~270 ms
```

Two sequential round-trips. Folded the session lookup into the same `Promise.all` so all four resolve together in one batch. Redirect still short-circuits after the await — safe because middleware already cookie-gates `/admin/*` before this layout runs, so the no-session branch is the rare expired-token race; the few wasted-compute queries when it fires don't add wall time (already in flight).

**Expected save**: another ~270 ms per authed page.

---

## CP16.4 — Inline `(authed)/loading.tsx`

`src/app/admin/(authed)/loading.tsx` renders an inline dot-ellipsis loader (reuses Phase 15 keyframes) scoped to the authed admin tree. On intra-admin navigation, the sidebar stays painted while the page's data fetch resolves; the loader appears in the main content area where the page would render, then is replaced when ready.

`src/app/admin/loading.tsx` (Phase 15, returns `null`) is preserved — that's the outer block against the public BrandedLoader leaking into `/admin/login`.

Mid-CP fix: original implementation used `py-32` so flex `items-center` had no height to center within; loader stuck to the top. Replaced with `min-h-[70vh]` — loader now lands in the visual middle of the main area.

**Real TTFB**: unchanged. **Perceived speed**: meaningful improvement on intra-admin navigation, especially on slower networks (which Hobby + cross-region effectively is).

---

## Combined impact

| | Pre-Phase-16 | Post-Phase-16 |
|---|---|---|
| Actual TTFB on authed admin pages (chair report) | 3–5 s | ~2–3 s (−~540 ms from two query round-trips folded) |
| Sidebar paint on navigation | blocks until full page data ready | paints immediately, page area fills in via loader |
| Public site | unchanged | unchanged |

A region change to `sin1` (Pro plan) would drop authed TTFB to ~400–600 ms warm. That's the structural ceiling on the Hobby plan; we hit it without spend.

---

## File inventory (3 commits on `feat/phase-16-admin-performance`)

| Commit | Files | Why |
|---|---|---|
| `3d48d8d` CP16.3 | `src/lib/auth-server.ts` | React.cache the session lookup |
| `4cd34f8` CP16.NEW | `src/app/admin/(authed)/layout.tsx` | Parallelize session into Promise.all |
| `46cc919` + `6db45b3` CP16.4 | `src/app/admin/(authed)/loading.tsx` (new + centering fix) | Inline loader, sidebar stays visible during data fetch |

**Total: 3 files touched, +30 LOC, zero schema impact, zero new deps.**

---

## Verification log

| Stage | Verification |
|---|---|
| Schema | No migration |
| Typecheck | `npx tsc --noEmit` clean across all three CPs |
| Local curl sanity | Public + admin/login 200 between every deploy |
| Production deploys | CP16.3 `dpl_Cmq2FRHbTfxcYDytwSzAtGxWsPDp`; CP16.NEW `dpl_D1hzBo5So3DLEzRTpG3gUbPLX6HT`; CP16.4 `dpl_Ecx8Cm4MkTz23e9WH3CuKWuQCXGP`; loader centering follow-up deploy on top |
| Prod sanity | 9 public surfaces 200 after each deploy; admin/login + student-society/events + news 200 |
| Chair browser verify | Sidebar paints immediately on intra-admin navigation; inline dot loader appears in main area until page data resolves; centered after the `min-h-[70vh]` follow-up |

---

## Out of scope / deferred

- **Cross-region fix (Vercel `sin1`)** — needs Pro upgrade; biggest single win available (~700–900 ms). Deferred per chair budget.
- **Skip unused root layout queries on admin** (`uni`, `topLinks`, `mainNav`, footer×4 fetched but unused when `isAdmin`) — ~50–100 ms saving estimate; chair chose not to include in Phase 16 wrap-up.
- **Streamed `newSubmissionCount` Sidebar island** — perceived-speed only; deferred.
- **Combine 30 dashboard counts into one `UNION ALL` SQL** — ~5–10 ms save, breaks Prisma type-safety, not worth.
- **Prisma Accelerate** — paid; deferred.
- **Cold start mitigation** — Vercel free-tier limit; deferred.

---

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install` (no new deps)
- [ ] `npx tsc --noEmit` clean; `prisma migrate status` clean
- [ ] Production smoke: 9 public surfaces + `/admin/login` 200
- [ ] Log in to admin in DevTools → Network → record TTFB on first request when navigating Dashboard → Faculty → Gallery → Department Identity → Contact Submissions. Should be ~2–3 s warm (down from ~3–5 s pre-Phase-16).
- [ ] Sidebar visible immediately on click, loader visible in main area, page swaps in when ready.
- [ ] Loader is centered vertically in the main area (not stuck at the top).
- [ ] `/admin/login` shows no loader artifact (Phase 15's outer admin/loading.tsx still blocks the public BrandedLoader).
- [ ] Regression: Phase 15 first-visit splash + per-navigation overlay still working on `/`; Phase 14 quality radio still works on admin upload forms; Phase 13 hero positions unchanged.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
