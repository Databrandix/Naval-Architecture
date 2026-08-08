# PageSpeed Optimization — Design Spec

**Date:** 2026-05-12
**Status:** Approved, ready for implementation plan
**Project:** Sonargaon University — Mechanical Engineering Department site (Next.js 15, Vercel)

---

## 1. Goal & Success Criteria

Push Google PageSpeed Insights score to **95+ on both mobile and desktop** across all major pages, without changing visual design, image resolution, or animation behavior.

### Hard constraints (must not change)
- No layout, spacing, color, or typography hierarchy changes
- Image resolution intact (e.g., a 1920×1080 hero stays 1920×1080)
- All existing animations continue to work (hero ken-burns, fade-in stagger, hover transitions, carousel rotation)
- Carousel keeps 3 images rotating every 5s
- No new visual artifacts on any image (faces, text, gradients)

### Soft targets
- `public/assets` folder: 264 MB → ~30-40 MB
- Largest single image: 14 MB → <500 KB
- Initial JS bundle: ~50 KB+ reduction (gzipped)
- Hero LCP: sub-second on desktop, ~1-1.2s on mobile

### Measurement
- Vercel preview deploy after each phase → PageSpeed Insights (mobile + desktop)
- 7-8 representative pages: home, faculty list, faculty-member detail, news list, news detail, admission requirements, gallery, lab facility
- Baseline measured before Phase 1 starts

---

## 2. Current State Findings

- Next.js 15.1 + React 19, Tailwind v4, Vercel deploy
- `next/image` used throughout (no raw `<img>` tags)
- `font-display: swap` already configured
- **Bottleneck — images**: 264 MB of assets. Top offenders:
  - `alumni-hero.jpg` — 14 MB
  - `hero-2.jpg` — 13 MB
  - `mecha-hero.jpg` — 8 MB
  - `notice-board-hero.jpg` — 7.4 MB
  - `syllabus-hero.jpg` — 6.9 MB
  - Plus ~30 more files in the 1-6 MB range
- **Bottleneck — JS**: `motion/react` (framer-motion successor) imported in nearly every section component; entire home page is a stack of `'use client'` sections all eagerly loading motion
- **Bottleneck — fonts**: 3 Google Font families with 4 weights each = 12 font files (`Poppins`, `Montserrat`, `Hind_Siliguri` with bengali subset)
- Hero carousel sets `priority` only on first image (good), but the 3 images include a 13 MB JPG and 2 multi-MB PNGs

---

## 3. Approach: Phased by Impact

Three phases. Each phase ends with a measurement gate before proceeding. Each phase is a separate commit for clean rollback.

### Why phased (vs. big bang)
- Image phase alone is expected to lift score from ~50-60 to ~85-90
- Phasing lets us measure per-change ROI and rollback cleanly if something regresses
- Total wall-clock effort: ~1.5-2 hours including measure cycles

---

## 4. Phase 1 — Image Overhaul

### 4.1 Tooling
- `sharp` (Node.js library)
- One-time scripts (committed to repo, runnable again later):
  - `scripts/optimize-images.mjs` — converts assets to WebP
  - `scripts/update-image-paths.mjs` — updates references in source

### 4.2 Conversion rules (`optimize-images.mjs`)
- Recursively scan `public/assets`
- For each `.png`, `.jpg`, `.jpeg`:
  - Convert to WebP, quality 82, effort 6
  - Preserve original resolution (no resize)
  - Preserve alpha channel for transparent PNGs
  - Write `<name>.webp` and delete the original
- Skip:
  - Files already `.webp`
  - PDFs
  - Files under 50 KB (icons/logos already small)
- Before running: copy `public/assets/` → `assets-original-backup/` (git-ignored) for safety

### 4.3 Path update (`update-image-paths.mjs`)
- Scan `src/**/*.{ts,tsx,js,jsx}`
- Regex match `/assets/...\.(png|jpe?g)` (with quote boundaries)
- Replace extension with `.webp`
- External URLs (unsplash, picsum) untouched
- Covers `src/lib/<feature>-data.ts` shared data files (the source of truth for faculty/news/notices/events/labs)
- Verification: `npm run build` + `npm run typecheck` must pass

### 4.4 next.config.ts updates
```ts
images: {
  formats: ['image/webp'],
  minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  remotePatterns: [...existing]
}
```
AVIF is skipped because the source is already WebP — Next.js still generates responsive size variants at request time.

### 4.5 HeroSection priority fix
- Only `index === 0` gets `priority`
- Indexes 1 and 2 get `loading="lazy"` and `priority={false}`
- 5-second carousel rotation animation unchanged
- LCP image becomes a small WebP (~200-400 KB) instead of 2.4 MB PNG

### 4.6 OG image
- `layout.tsx` already references `/assets/hero-campus-2021.webp` — untouched

### 4.7 Special cases
- Faculty cutout PNGs (transparent background) — sharp's WebP encoder preserves alpha; spot check 2-3 visually
- Already-WebP files (`hero-campus-2021.webp`, `hero-img.webp`, `site-school-1024x576.webp`) — left alone, not re-encoded

### 4.8 Validation
1. Backup folder created
2. Run conversion script — log size before/after
3. Run path-update script — git diff reviewed
4. Visual spot check: 5-7 random images (hero, faculty, news, lab, gallery) side-by-side before/after
5. `npm run dev` → click through home, faculty, news, admission, gallery, lab pages
6. `npm run build` clean
7. Commit + Vercel preview deploy → PageSpeed measure (mobile + desktop)

### 4.9 Expected outcome
- Assets size: 264 MB → ~30-40 MB
- PageSpeed: baseline → ~85-90 mobile, ~90-95 desktop

---

## 5. Phase 2 — JS Bundle Optimization

### 5.1 Goal
Reduce initial JS payload by deferring `motion/react` (and below-the-fold section components) until needed.

### 5.2 Home page (`src/app/page.tsx`) refactor
- `HeroSection` stays as static import (above-the-fold)
- All other sections become `next/dynamic` imports:
  - `OverviewSection`
  - `ProgramsSection`
  - `QuickLinksSection`
  - `NoticesSection`
  - `ResearchLabsSection`
  - `MajorResearchSection`
  - `EventsSection`
  - `NewsSection`
  - `ServicesSection`
- Each dynamic section gets a minimal CSS-only skeleton with matching min-height to prevent CLS

### 5.3 HeroSection itself
- Stays fully `'use client'` (required for carousel state + motion)
- Already optimized in Phase 1 (priority on first image only)
- Internal split into server/client subcomponents is **out of scope** — refactor risk vs. small win

### 5.4 Lucide icons audit
- Grep verify all imports use named imports: `import { ChevronRight } from 'lucide-react'`
- No barrel/star imports

### 5.5 List pages (faculty, news, events, gallery)
- Initial scope: home page only
- If any list page measures below 95 after Phase 3, apply the same dynamic-import pattern to that page's heavy sections (deferred decision based on measurement)

### 5.6 Validation
1. Smooth scroll-through on home — no "pop" or flash as sections mount
2. CLS score audit on PageSpeed (must stay <0.1)
3. Network tab: confirm motion chunk loads only on scroll
4. Commit + preview deploy → PageSpeed measure

### 5.7 Expected outcome
- Initial JS bundle: ~50-80 KB smaller (gzipped)
- TTI 1-2s faster on mobile
- PageSpeed: ~85-90 → ~92-95

---

## 6. Phase 3 — Fonts, Cache Headers, Image Sizing

### 6.1 Font weight audit
- Grep all source for `font-bold`, `font-semibold`, `font-medium`, `font-light`, and explicit weight classes
- Trim `layout.tsx` Google Font config to weights actually used
- Bengali subset on `Hind_Siliguri` preserved
- No speculative cuts — only remove what grep confirms unused

### 6.2 Cache headers (`next.config.ts`)
```ts
async headers() {
  return [
    {
      source: '/assets/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ];
}
```
Satisfies PageSpeed's "Serve static assets with efficient cache policy" audit.

### 6.3 `next/image` sizes prop audit
- Grep `<Image` usages
- Add or fix `sizes` prop where it's missing or naively `100vw`:
  - Faculty card thumbnails — `sizes="(max-width: 768px) 50vw, 200px"` (or actual rendered px)
  - News/event thumbnails — based on grid breakpoints
  - Hero — `100vw` is correct
  - Gallery — based on masonry breakpoints
- Effect: on mobile, smaller variants served instead of largest one

### 6.4 Misc cleanup
- Strip any `console.log` left in production paths (grep audit)
- Keep `eslint.ignoreDuringBuilds: true` (build speed)

### 6.5 Final measurement
- Full preview deploy
- PageSpeed run on 7-8 representative pages, mobile + desktop
- Target: all 95+
- Any page below 95 → dedicated page-specific optimization (Phase 4 if needed)

---

## 7. Out of Scope

- Service worker / PWA
- Critical CSS inlining (Tailwind v4 already handles well)
- Server Component refactor of existing client components
- Swapping `motion/react` for hand-rolled CSS (only if Phase 2 doesn't reach 95)
- CDN image proxy (cloudinary/imgix) — disk-WebP is sufficient
- PDF compression (intentional — users download these)

---

## 8. Risks & Mitigation

| Risk | Mitigation |
|---|---|
| WebP conversion visually degrades an image | Backup folder + visual spot check; retry that file at quality 90 |
| Transparent PNG artifacts (faculty cutouts) | Verify sharp's WebP alpha handling; spot check 2-3 |
| Dynamic-imported section "pops" on scroll | min-height skeleton matching section height |
| Path-replace script touches the wrong files | Strict regex on `/assets/...`; git diff review before commit |
| Font-weight removal breaks a place we missed | Grep exhaustively; monitor build for font-load warnings |
| Faculty list page can't hit 95 (many images) | Per-card lazy + tuned `sizes` prop; Phase 4 if needed |
| Vercel preview cache pollution | Each phase = new commit = fresh preview URL |

---

## 9. Rollback Plan

- Each phase = separate commit. `git revert <sha>` reverts cleanly.
- Original images backed up locally (git-ignored).
- Phase 1 alone delivers ~85-90 score — if Phase 2/3 fail, meaningful improvement remains.

---

## 10. Success Criteria (Final Gate)

- [ ] PageSpeed mobile + desktop ≥ 95 on 7-8 representative pages
- [ ] No visual regression (design, animations, image resolution all intact)
- [ ] `npm run build` clean
- [ ] `npm run typecheck` clean
- [ ] Site works on Chrome, Firefox, mobile Edge

---

## 11. Estimated Effort

- Phase 1: 30-45 min (most automated)
- Phase 2: 15-20 min
- Phase 3: 20-30 min
- Measurement cycles included
- **Total: ~1.5-2 hours**
