# Phase 18 — Public page ISR (route group restructure + revalidate)

Cross-region public TTFB went from ~2-3s warm down to **~0.19s** by moving every public page out from under a `headers()`-calling root layout (which forced dynamic rendering on the entire tree) into a `(public)/` route group with its own layout, then exporting `revalidate = 3600` from that layout.

The Phase 1 admin-vs-public chrome conditional that lived in `src/app/layout.tsx` was the root cause: any `headers()` call in a layout opts the whole route segment into dynamic rendering in Next.js 15 App Router. With it gone, public pages now cache at the Vercel Edge globally and serve from the `bom1` (Mumbai) POP for visitors in Dhaka — cross-region Vercel(iad1) ↔ Neon(ap-southeast-1) latency completely bypassed on cache hits.

---

## CP18.1 findings

| Item | Status |
|---|---|
| Phase 17 precheck | Clean merge, no new dynamic dependencies on public pages |
| Hard blocker | `src/app/layout.tsx:96` `await headers()` — forced every public route into dynamic rendering |
| revalidatePath coverage | Comprehensive — every Phase 0+ admin save action already calls `revalidatePath` on the affected public path(s). No gaps. |
| Detail routes | Faculty / News / Events `[slug]` already had `generateStaticParams` returning current DB slugs + Next.js default `dynamicParams: true` — kept unchanged |
| Excluded from ISR | `/admin/*` (still `ƒ` dynamic, intended), `/api/*` (handlers, never cached), `/news` (still `ƒ` because of `searchParams` pagination — single-route loss) |

### Pre-Phase-18 baseline (Dhaka → prod, 3-run median warm)

| Route | TTFB | `x-vercel-cache` |
|---|---|---|
| `/` | 3.4s (cold 10.7s) | empty |
| `/faculty-member` | 2.8-3.0s | empty |
| `/news` | 2.3-3.2s | empty |
| `/about/overview` | 2.1-2.4s | empty |
| `/contact` | 2.1-3.0s | empty |

The empty cache header confirmed nothing was being cached at the edge — every request hit the Vercel function and re-rendered through the cross-region DB batch.

---

## CP18.2 implementation

### Route group restructure (35 files moved via `git mv`)

```
src/app/page.tsx                                  → src/app/(public)/page.tsx
src/app/loading.tsx                               → src/app/(public)/loading.tsx
src/app/about/                                    → src/app/(public)/about/
src/app/admission/                                → src/app/(public)/admission/
src/app/contact/                                  → src/app/(public)/contact/
src/app/faculty-member/                           → src/app/(public)/faculty-member/
src/app/gallery/                                  → src/app/(public)/gallery/
src/app/news/                                     → src/app/(public)/news/
src/app/privacy-policy/                           → src/app/(public)/privacy-policy/
src/app/research/                                 → src/app/(public)/research/
src/app/student-society/                          → src/app/(public)/student-society/
src/app/terms-and-conditions/                     → src/app/(public)/terms-and-conditions/
src/app/transport-service/                        → src/app/(public)/transport-service/
```

URL impact: **zero** — route groups are URL-invisible. `/about/overview` still resolves the same way.

### Layout rewrites

- **`src/app/layout.tsx`** (rewritten, minimal): only `<html>`, `<body>`, `next/font` setup, and the DB-driven brand-color CSS vars on `<html>` from `getDepartmentIdentity`. **No `headers()` call.** Removed the admin-vs-public conditional + the 11-query `Promise.all` for chrome data.
- **`src/app/(public)/layout.tsx`** (new): all the previous public chrome — `Navbar`, `JourneyCTASection`, `Footer`, Phase 15 `InitialSplash` + `PublicNavigationOverlay`, and the `.page-fade-in` wrapper. Exports `revalidate = 3600` which cascades to every child page. No conditional needed since this layout only mounts for public routes.
- **`src/components/layout/PageFadeWrapper.tsx`** (new client component): tiny `usePathname()`-keyed wrapper around `{children}` that re-triggers the 250ms opacity fade-in on every navigation. Replaces the prior server-side keyed wrapper that needed `headers()`.

### Connection pool bump (mid-phase incident fix)

First deploy attempt failed at static pre-generation with `PrismaClientKnownRequestError P2024` (connection pool timeout). Vercel build runs 28+ static page renders in parallel, each calling 11 layout-level queries through cross-region latency — Prisma's default serverless `connection_limit=3` couldn't keep up.

Fixed in [`src/lib/db.ts`](src/lib/db.ts): augment `DATABASE_URL` with `connection_limit=15&pool_timeout=20`. The pgbouncer pooler endpoint multiplexes the extra connections without strain on Neon. Both build pass and steady-state runtime now have comfortable headroom.

---

## Build output (verified)

| Indicator | Count | Routes |
|---|---|---|
| `○` Static (ISR-cached, 1h revalidate + 1y expire) | 25 | `/`, `/about/*` (7), `/admission/*` (6), `/contact`, `/faculty-member`, `/gallery`, `/privacy-policy`, `/research`, `/student-society/*` (7 of 8 — events excluded), `/terms-and-conditions`, `/transport-service` |
| `●` SSG with revalidate (per-slug pre-rendered + ISR) | 3 | `/faculty-member/[slug]` (41 slugs), `/news/[slug]` (6), `/student-society/events/[slug]` (7) |
| `ƒ` Dynamic | 1 (public) + admin/api | `/news` (uses `searchParams` for pagination); all `/admin/*`; all `/api/*` |

**Total: 28 public routes ISR-cached, 1 public route legitimately dynamic, admin/api untouched.**

---

## Production measurement

After warm-up (one curl per cached route to populate the edge), measured 3-run median from Dhaka:

| Route | Pre | Post (cache HIT) | Δ | x-vercel-cache | Edge POP |
|---|---|---|---|---|---|
| `/` | 3.4s | **0.19s** | **−94%** | HIT | `bom1` (Mumbai) |
| `/faculty-member` | 2.8-3.0s | **0.19s** | **−94%** | HIT | `bom1` |
| `/about/overview` | 2.1-2.4s | **0.19s** | **−91%** | HIT | `bom1` |
| `/contact` | 2.1-3.0s | **0.18s** | **−92%** | HIT | `bom1` |
| `/news` | 2.3-3.2s | 1.6-4.6s | unchanged | MISS | `iad1` (origin) |

Cache-hit responses include `X-Nextjs-Prerender: 1`, `X-Nextjs-Stale-Time: 300`, served from Mumbai (`bom1`) POP — near-zero RTT from Dhaka, no Vercel function invocation, no Neon round-trip.

---

## File inventory (single feature commit `856b8af` + connection-pool fix `a00cd0d`)

| File | Type | Why |
|---|---|---|
| `src/app/layout.tsx` | Rewrite | Minimal root: html/body/fonts + brand CSS vars. No `headers()`. |
| `src/app/(public)/layout.tsx` | New | All public chrome moved here; `export const revalidate = 3600` |
| `src/components/layout/PageFadeWrapper.tsx` | New | Client `usePathname()`-keyed wrapper for the .page-fade-in re-key |
| `src/lib/db.ts` | Edit | Augment `DATABASE_URL` with `connection_limit=15&pool_timeout=20` for build-time static-gen headroom |
| ~33 public page files | Moved | `git mv` into `src/app/(public)/...` — no logic change |

**Total: 4 net new/edited files + ~33 moves, +191 LOC / −127 LOC, two commits on `feat/phase-18-public-isr`.**

---

## Verification log

| Stage | Verification |
|---|---|
| Schema | No migration |
| Local typecheck | `npx tsc --noEmit` clean |
| Local `npm run build` | All public routes show ISR indicators, admin still `ƒ`, no warnings |
| Local curl sanity | 29 public routes 200, admin routes 307 (auth redirect), detail slugs 200 |
| First deploy attempt | Failed at `Generating static pages (52/209)` with P2024 (pool timeout) → fixed with `connection_limit=15` |
| Successful deploy | `dpl_GXYxFuygWWFgYUEktQCg92dqx5xx` aliased to `mechanical-engineering-olive.vercel.app` |
| Production warm-up | 18 public routes hit via curl, all 200 |
| Production TTFB | Cache HIT for static routes, MISS for `/news` — see measurement table above |
| Chair production browser | Verified post-warm-up — admin still works, public pages instant, Phase 15 splash + overlay + page-fade intact |

---

## Out of scope / deferred

- **`/news` pagination as ISR** — currently uses `?page=N` searchParams which Next.js treats as dynamic. Could be migrated to path-based pagination (`/news/page/2`) to enable ISR — small follow-up if /news traffic grows.
- **`unstable_cache` on identity getters** — connection_limit bump solved the immediate problem; further structural improvement (cross-build dedup via Next.js Data Cache) deferred unless prod measurements show a need.
- **`revalidateTag` on admin actions** — current `revalidatePath` invalidations are sufficient for ISR. Tag-based invalidation would be needed only if we move chrome data into `unstable_cache` later.
- **Edge runtime** — current deploy stays on Node runtime (Prisma compatibility). Edge runtime would require a Prisma adapter (e.g., `@prisma/adapter-neon`); not needed for ISR.
- **Vercel Pro region migration** — Phase 16 deferred this; Phase 18 ISR makes it irrelevant for cached pages. Cache misses + admin routes still pay the cross-region penalty but admin Phase 16 optimizations stand.

---

## Test plan checklist (for PR review)

- [ ] Pull branch + `npm install` (no new deps)
- [ ] `npx tsc --noEmit` clean; `npx prisma migrate status` clean (no Phase 18 migration)
- [ ] `npm run build` — verify build output shows public routes as `○ Static` or `● SSG` with `1h` revalidate, admin/api as `ƒ Dynamic`
- [ ] `npm run dev`:
  - [ ] All 29 public routes render correctly (chrome intact, hero images, body content)
  - [ ] Public route URLs unchanged (no `/(public)/` visible)
  - [ ] Admin routes still gated + redirect to /admin/login when unauthed
- [ ] Production smoke (post-deploy):
  - [ ] `curl -sI https://…/about/overview | grep -i x-vercel-cache` shows `HIT` after warm-up
  - [ ] `curl -sI https://…/admin/login | grep -i x-vercel-cache` shows `MISS` or absent (admin always dynamic)
  - [ ] DevTools Network on `/`, `/faculty-member`, `/contact` — TTFB <300ms, response served from `bom1` or another close POP
- [ ] revalidatePath test:
  - [ ] Edit a faculty member's name in `/admin/faculty/<id>` → save → reload `/faculty-member` → updated name visible
  - [ ] Same for News, Events, About pages
- [ ] Regression:
  - [ ] Phase 17 Legal pages CMS still works (save in `/admin/legal-pages` → reload `/privacy-policy`)
  - [ ] Phase 15 first-visit splash + per-navigation overlay still functional
  - [ ] Phase 14 quality radio on admin uploads
  - [ ] Phase 13 hero positions intact

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
