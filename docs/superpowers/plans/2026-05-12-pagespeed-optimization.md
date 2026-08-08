# PageSpeed Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise Google PageSpeed Insights score to 95+ on mobile and desktop across all major pages of the Sonargaon University ME site, without changing visual design, image resolution, or animations.

**Architecture:** Three measured phases — (1) Image overhaul: convert PNG/JPG assets to WebP at quality 82, preserve resolution, update all source paths; (2) JS bundle optimization: defer below-the-fold sections with `next/dynamic`; (3) Fonts, cache headers, and image `sizes` audit. Each phase is a separate commit with a Vercel preview deploy + PageSpeed measurement gate.

**Tech Stack:** Next.js 15, React 19, Tailwind v4, `motion/react`, `sharp` (added for image conversion), Vercel hosting.

**Spec:** [docs/superpowers/specs/2026-05-12-pagespeed-optimization-design.md](../specs/2026-05-12-pagespeed-optimization-design.md)

**Project root:** `c:\Databrandix HQ\Mechanical-Engineering` — all paths below are relative to this root.

**Note:** This codebase has no automated test suite. "Verification" steps use `npm run build`, `npm run typecheck`, `npm run dev`, and manual visual checks instead of unit tests. Each task is a commit checkpoint.

---

## Phase 0: Baseline

### Task 0: Capture baseline PageSpeed score

**Files:**
- Create: `docs/superpowers/plans/pagespeed-baseline.md`

- [ ] **Step 1: Identify current Vercel production URL**

Run: `git remote -v` to find the GitHub repo, then check the live URL (memory note: `https://mechanical-engineering-olive.vercel.app`).

- [ ] **Step 2: Run PageSpeed Insights on key pages**

Open https://pagespeed.web.dev in a browser and run, recording score for **both mobile and desktop**:
- `/` (home)
- `/faculty-member`
- `/news`
- `/admission/requirements`
- `/gallery`
- `/about/lab-facility`

- [ ] **Step 3: Write baseline file**

Create `docs/superpowers/plans/pagespeed-baseline.md` with a table:

```markdown
# PageSpeed Baseline — 2026-05-12

| Page | Mobile | Desktop | LCP (mobile) | CLS |
|------|--------|---------|--------------|-----|
| /    | XX     | XX      | X.Xs         | X.XX |
| /faculty-member | ... |
...
```

- [ ] **Step 4: Commit baseline**

```bash
git add docs/superpowers/plans/pagespeed-baseline.md docs/superpowers/specs/2026-05-12-pagespeed-optimization-design.md docs/superpowers/plans/2026-05-12-pagespeed-optimization.md
git commit -m "docs: add pagespeed optimization design, plan, and baseline measurements"
```

---

## Phase 1: Image Overhaul

### Task 1: Set up sharp + backup originals

**Files:**
- Modify: `package.json` (add sharp as devDependency)
- Modify: `.gitignore` (ignore `assets-original-backup/`)
- Create: `assets-original-backup/` (local backup, git-ignored)

- [ ] **Step 1: Install sharp**

Run: `npm install --save-dev sharp`
Expected: package added to `devDependencies`, no errors.

- [ ] **Step 2: Add backup folder to .gitignore**

Read the existing `.gitignore` first. Append this line at the end (preserve existing content):

```
# Local-only backup of pre-optimization images (Phase 1 of pagespeed work)
/assets-original-backup/
```

- [ ] **Step 3: Create the backup**

PowerShell:

```powershell
Copy-Item -Path "public/assets" -Destination "assets-original-backup" -Recurse -Force
```

Expected: `assets-original-backup/` exists at project root with same contents as `public/assets/`. Verify with `ls assets-original-backup | Measure-Object` — should report same item count as `ls public/assets`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add sharp dependency and ignore image backup folder"
```

---

### Task 2: Write the image-conversion script

**Files:**
- Create: `scripts/optimize-images.mjs`

- [ ] **Step 1: Create the conversion script**

Write `scripts/optimize-images.mjs` with this exact content:

```js
#!/usr/bin/env node
/**
 * Convert all PNG/JPG/JPEG assets in public/assets to WebP at quality 82.
 * Preserves resolution. Deletes originals. Skips files <50KB and already-WebP.
 *
 * Usage: node scripts/optimize-images.mjs
 */
import { readdir, stat, unlink } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = 'public/assets';
const MIN_SIZE_BYTES = 50 * 1024; // 50 KB
const QUALITY = 82;
const EFFORT = 6;
const TARGET_EXT = new Set(['.png', '.jpg', '.jpeg']);

let totalBefore = 0;
let totalAfter = 0;
let converted = 0;
let skipped = 0;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    const ext = extname(entry.name).toLowerCase();
    if (!TARGET_EXT.has(ext)) {
      continue;
    }
    const info = await stat(path);
    if (info.size < MIN_SIZE_BYTES) {
      console.log(`skip (small): ${path} (${(info.size / 1024).toFixed(1)} KB)`);
      skipped++;
      continue;
    }
    const outPath = path.replace(/\.(png|jpe?g)$/i, '.webp');
    try {
      await sharp(path, { failOn: 'none' })
        .webp({ quality: QUALITY, effort: EFFORT, alphaQuality: 90 })
        .toFile(outPath);
      const outInfo = await stat(outPath);
      totalBefore += info.size;
      totalAfter += outInfo.size;
      converted++;
      console.log(
        `${path} -> ${outPath}  ${(info.size / 1024).toFixed(0)}KB -> ${(outInfo.size / 1024).toFixed(0)}KB`
      );
      await unlink(path);
    } catch (err) {
      console.error(`FAILED: ${path}`, err.message);
    }
  }
}

await walk(ROOT);

console.log('\n--- Summary ---');
console.log(`Converted: ${converted}`);
console.log(`Skipped (small): ${skipped}`);
console.log(`Total before: ${(totalBefore / 1024 / 1024).toFixed(1)} MB`);
console.log(`Total after:  ${(totalAfter / 1024 / 1024).toFixed(1)} MB`);
console.log(`Saved:        ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(1)} MB`);
```

- [ ] **Step 2: Run the script**

Run: `node scripts/optimize-images.mjs`
Expected: stream of conversion lines, then a summary showing **~80%+ size reduction** (e.g., 250 MB → 30-40 MB). Should complete in 1-5 minutes depending on machine.

- [ ] **Step 3: Verify originals deleted, WebP created**

Run: `Get-ChildItem public/assets -Recurse -Include *.png,*.jpg,*.jpeg | Measure-Object`
Expected: count is small (only files under 50 KB threshold remain — icons/logos).

Run: `Get-ChildItem public/assets -Recurse -Include *.webp | Measure-Object`
Expected: large count matching the number of converted files plus pre-existing WebP files.

- [ ] **Step 4: Visual spot check**

Open these WebP files in an image viewer and compare visually against the same files in `assets-original-backup/`:
- `public/assets/hero-1.webp` vs `assets-original-backup/hero-1.png`
- `public/assets/hero-2.webp` vs `assets-original-backup/hero-2.jpg`
- `public/assets/alumni-hero.webp` vs `assets-original-backup/alumni-hero.jpg`
- `public/assets/faculty-head-mostofa.webp` vs `assets-original-backup/faculty-head-mostofa.png` (transparent PNG — check alpha intact)
- `public/assets/program-undergraduate.webp` vs `assets-original-backup/program-undergraduate.png`

Expected: no visible quality degradation, transparency preserved.

If any image looks degraded: note its name. Re-run sharp manually for that file at quality 90:
```js
import sharp from 'sharp';
await sharp('assets-original-backup/PROBLEM.png').webp({ quality: 90, alphaQuality: 95 }).toFile('public/assets/PROBLEM.webp');
```

- [ ] **Step 5: Commit script + converted assets**

```bash
git add scripts/optimize-images.mjs public/assets
git commit -m "perf(images): convert PNG/JPG assets to WebP @ quality 82"
```

---

### Task 3: Write the path-update script and update source files

**Files:**
- Create: `scripts/update-image-paths.mjs`
- Modify: many files under `src/` (paths changed from `.png`/`.jpg`/`.jpeg` to `.webp`)

- [ ] **Step 1: Create the path-update script**

Write `scripts/update-image-paths.mjs`:

```js
#!/usr/bin/env node
/**
 * Replace /assets/...png|.jpg|.jpeg references with .webp across src/.
 * Only matches paths inside string literals (after a quote char).
 * Leaves external URLs (unsplash, picsum) untouched.
 *
 * Usage: node scripts/update-image-paths.mjs
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = 'src';
const TARGET_EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);

// Match: ('|"|`)/assets/...something.(png|jpg|jpeg) before another quote or whitespace
const RE = /(['"`])(\/assets\/[^'"`]+?)\.(png|jpe?g)(\1)/gi;

let filesChanged = 0;
let replacements = 0;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!TARGET_EXT.has(extname(entry.name).toLowerCase())) {
      continue;
    }
    const content = await readFile(path, 'utf8');
    let localCount = 0;
    const updated = content.replace(RE, (_match, openQ, pathPart, _ext, closeQ) => {
      localCount++;
      return `${openQ}${pathPart}.webp${closeQ}`;
    });
    if (localCount > 0) {
      await writeFile(path, updated, 'utf8');
      filesChanged++;
      replacements += localCount;
      console.log(`${path}: ${localCount} replacement(s)`);
    }
  }
}

await walk(ROOT);

console.log('\n--- Summary ---');
console.log(`Files changed: ${filesChanged}`);
console.log(`Total replacements: ${replacements}`);
```

- [ ] **Step 2: Run the path-update script**

Run: `node scripts/update-image-paths.mjs`
Expected: list of files changed (most will be under `src/lib/`, `src/app/`, `src/components/sections/`), and a summary count.

- [ ] **Step 3: Review git diff**

Run: `git diff --stat src/`
Then: `git diff src/ | head -200` to spot-check that only extension portions changed.

Expected: only `.png|.jpg|.jpeg` → `.webp` changes inside `/assets/...` string literals. No external URL changes, no logic changes.

- [ ] **Step 4: Verify no broken references**

Run a grep to confirm no remaining `/assets/...png|jpg|jpeg` references in source:
Use Grep tool with pattern `/assets/[^'"\` ]+\.(png|jpe?g)` across `src/`.
Expected: 0 matches.

- [ ] **Step 5: Build verify**

Run: `npm run typecheck`
Expected: passes.

Run: `npm run build`
Expected: build succeeds. Watch for any "image not found" warnings — investigate any that appear.

- [ ] **Step 6: Dev server visual check**

Run: `npm run dev` (in background or separate terminal)
Open in browser and verify images load on these pages:
- http://localhost:3000/ — hero carousel rotates, all sections show images
- http://localhost:3000/faculty-member — faculty cards show photos
- http://localhost:3000/news — news thumbnails visible
- http://localhost:3000/about/lab-facility — lab images visible
- http://localhost:3000/gallery — gallery loads

Stop dev server (Ctrl+C) when verified.

- [ ] **Step 7: Commit**

```bash
git add scripts/update-image-paths.mjs src/
git commit -m "perf(images): update all asset references from PNG/JPG to WebP"
```

---

### Task 4: Configure next.config.ts for WebP + cache

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Update next.config.ts**

Replace the existing file content with:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
```

- [ ] **Step 2: Build verify**

Run: `npm run build`
Expected: build succeeds with no warnings about image config.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "perf(images): set Next.js image format to WebP, cache 1y"
```

---

### Task 5: Fix HeroSection — only first slide is priority

**Files:**
- Modify: `src/components/sections/HeroSection.tsx`

- [ ] **Step 1: Read current HeroSection**

Read the file. Locate the `<Image>` element inside the `heroImages.map` (currently around line 49-57). It uses `priority={index === 0}` which is already correct, but the file does not pass an explicit `loading` prop. Add explicit `loading` for non-first slides so the browser truly defers them.

- [ ] **Step 2: Update the Image element**

Find this block:

```tsx
<Image
  src={image.src}
  alt={image.alt}
  fill
  sizes="100vw"
  priority={index === 0}
  className="object-cover"
  referrerPolicy={image.src.startsWith('http') ? 'no-referrer' : undefined}
/>
```

Replace with:

```tsx
<Image
  src={image.src}
  alt={image.alt}
  fill
  sizes="100vw"
  priority={index === 0}
  loading={index === 0 ? 'eager' : 'lazy'}
  fetchPriority={index === 0 ? 'high' : 'low'}
  className="object-cover"
  referrerPolicy={image.src.startsWith('http') ? 'no-referrer' : undefined}
/>
```

- [ ] **Step 3: Build verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Dev verify**

Run: `npm run dev`. Open http://localhost:3000/, open browser DevTools Network tab, hard refresh. Verify:
- Only `hero-1.webp` shows `fetchpriority=high` and loads immediately
- `hero-2.webp` and `hero-3.webp` load lazily (later, lower priority)
- Carousel still rotates every 5 seconds
- Ken-burns animation still works

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/HeroSection.tsx
git commit -m "perf(hero): defer non-first carousel slides to lazy/low priority"
```

---

### Task 6: Phase 1 measurement gate

**Files:**
- Modify: `docs/superpowers/plans/pagespeed-baseline.md` (append Phase 1 results)

- [ ] **Step 1: Push and wait for Vercel preview**

```bash
git push
```

Wait for Vercel preview deploy to complete. Open the preview URL from the Vercel dashboard or PR comment.

- [ ] **Step 2: Run PageSpeed Insights on preview**

For the same 6 pages as the baseline, record mobile + desktop scores from https://pagespeed.web.dev on the preview URL.

- [ ] **Step 3: Append results to baseline file**

Append to `docs/superpowers/plans/pagespeed-baseline.md`:

```markdown
## Phase 1 Results — Image Overhaul

| Page | Mobile | Desktop | LCP (mobile) | CLS |
|------|--------|---------|--------------|-----|
| /    | XX     | XX      | X.Xs         | X.XX |
...

Delta vs baseline: +XX mobile, +XX desktop average.
```

- [ ] **Step 4: Decision gate**

- If most pages are **already 95+** on both mobile and desktop → Phases 2-3 may be unnecessary; jump to Phase 3 cache headers + sizes audit only, then re-measure.
- If most pages are 80-94 → continue to Phase 2.
- If most pages are still <80 → investigate which images are still large; some may need re-encoding at lower quality or check if they're being served at full size (sizes prop).

- [ ] **Step 5: Commit measurement**

```bash
git add docs/superpowers/plans/pagespeed-baseline.md
git commit -m "docs: record Phase 1 pagespeed results"
git push
```

---

## Phase 2: JS Bundle Optimization

### Task 7: Convert home page to dynamic imports

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Read current home page**

Read `src/app/page.tsx`. Current state: 10 static imports + a JSX tree rendering them in order.

- [ ] **Step 2: Replace with dynamic imports for below-the-fold sections**

Replace the entire file content with:

```tsx
import dynamic from 'next/dynamic';
import HeroSection from '@/components/sections/HeroSection';

const SECTION_SKELETON_CLASS = 'min-h-[400px] bg-white';

function sectionSkeleton(minHeight: string) {
  return function Skeleton() {
    return <div className={`${minHeight} bg-white`} aria-hidden="true" />;
  };
}

const OverviewSection = dynamic(() => import('@/components/sections/OverviewSection'), {
  loading: sectionSkeleton('min-h-[500px]'),
});
const ProgramsSection = dynamic(() => import('@/components/sections/ProgramsSection'), {
  loading: sectionSkeleton('min-h-[500px]'),
});
const QuickLinksSection = dynamic(() => import('@/components/sections/QuickLinksSection'), {
  loading: sectionSkeleton('min-h-[300px]'),
});
const NoticesSection = dynamic(() => import('@/components/sections/NoticesSection'), {
  loading: sectionSkeleton('min-h-[400px]'),
});
const ResearchLabsSection = dynamic(() => import('@/components/sections/ResearchLabsSection'), {
  loading: sectionSkeleton('min-h-[500px]'),
});
const MajorResearchSection = dynamic(() => import('@/components/sections/MajorResearchSection'), {
  loading: sectionSkeleton('min-h-[500px]'),
});
const EventsSection = dynamic(() => import('@/components/sections/EventsSection'), {
  loading: sectionSkeleton('min-h-[500px]'),
});
const NewsSection = dynamic(() => import('@/components/sections/NewsSection'), {
  loading: sectionSkeleton('min-h-[500px]'),
});
const ServicesSection = dynamic(() => import('@/components/sections/ServicesSection'), {
  loading: sectionSkeleton('min-h-[400px]'),
});

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <OverviewSection />
      <ProgramsSection />
      <QuickLinksSection />
      <NoticesSection />
      <ResearchLabsSection />
      <MajorResearchSection />
      <EventsSection />
      <NewsSection />
      <ServicesSection />
    </>
  );
}
```

Note: `next/dynamic` in Next.js 15 App Router defaults to SSR-enabled. We keep SSR on (do **not** add `ssr: false`) so HTML still ships with the section content for SEO and initial paint. The JS chunk for each section is split off and loads asynchronously, which is what gives the bundle win.

- [ ] **Step 3: Build verify**

Run: `npm run build`
Expected: build succeeds. In build output, observe that each section is now its own chunk under `.next/static/chunks/`.

- [ ] **Step 4: Dev verify — scroll-through**

Run: `npm run dev`. Open http://localhost:3000/.
- Open DevTools Network tab, filter "JS"
- Hard refresh
- Verify hero loads with minimal JS
- Scroll down slowly — observe additional JS chunks loading as sections come into view
- All animations still play correctly
- No visible "pop" or layout shift as sections mount (skeleton min-height should match)

If any section produces a visible layout shift on mount, adjust its `min-h-[XXXpx]` value in the skeleton to better match the rendered height.

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "perf(home): dynamically import below-the-fold sections"
```

---

### Task 8: Audit lucide-react imports

**Files:**
- Audit only (no expected changes unless issues found)

- [ ] **Step 1: Grep for star/barrel lucide imports**

Use the Grep tool: pattern `from ['"]lucide-react['"]` across `src/`.

Expected: every import line is a named import like `import { ChevronRight, Home } from 'lucide-react'` — never `import * as Icons from 'lucide-react'`.

- [ ] **Step 2: Fix any star imports if found**

If any `import * from 'lucide-react'` is found, change it to named imports for only the icons used in that file. (Based on initial audit, none expected.)

- [ ] **Step 3: Commit if changes made**

If any file was modified:

```bash
git add src/
git commit -m "perf: ensure lucide-react uses named imports for tree-shaking"
```

If nothing changed, skip this commit.

---

### Task 9: Phase 2 measurement gate

**Files:**
- Modify: `docs/superpowers/plans/pagespeed-baseline.md`

- [ ] **Step 1: Push and wait for Vercel preview**

```bash
git push
```

Wait for preview deploy.

- [ ] **Step 2: Run PageSpeed Insights**

Same 6 pages, mobile + desktop.

- [ ] **Step 3: Append results**

Append to `docs/superpowers/plans/pagespeed-baseline.md`:

```markdown
## Phase 2 Results — JS Bundle

| Page | Mobile | Desktop | LCP (mobile) | TBT |
|------|--------|---------|--------------|-----|
| /    | XX     | XX      | X.Xs         | XXms |
...

Delta vs Phase 1: +XX mobile, +XX desktop average.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/pagespeed-baseline.md
git commit -m "docs: record Phase 2 pagespeed results"
git push
```

---

## Phase 3: Fonts, Cache Headers, Image Sizes

### Task 10: Font weight audit and trim

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Grep for explicit font-weight usage**

Use Grep tool across `src/` for:
- pattern: `font-(bold|semibold|medium|light|extrabold|black|thin|extralight|normal)`
- pattern: `font-(?:weight|\\[)` (catches arbitrary weight classes)

Record which weight classes are actually used in the codebase.

- [ ] **Step 2: Map Tailwind weight class to numeric**

Tailwind defaults:
- `font-light` → 300
- `font-normal` → 400
- `font-medium` → 500
- `font-semibold` → 600
- `font-bold` → 700

Cross-reference findings with current `layout.tsx`:
- Poppins: currently `['400', '500', '600', '700']`
- Montserrat: currently `['300', '400', '500', '600']`
- Hind_Siliguri: currently `['400', '500', '600', '700']`

Identify weights not referenced anywhere. Be careful: default body text inherits `font-normal` (400), and headings often use `font-bold` (700) — these may not appear in grep but are needed.

- [ ] **Step 3: Update layout.tsx with trimmed weights**

Edit `src/app/layout.tsx`. Replace each font config's `weight: [...]` array with only the weights confirmed used by grep + the body default (400). Keep `subsets`, `variable`, and `display` unchanged.

Example (actual values depend on grep findings — do not copy blindly):

```ts
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // dropped 500 if unused
  variable: '--font-poppins',
  display: 'swap',
});
```

- [ ] **Step 4: Build + visual verify**

Run: `npm run build`
Expected: succeeds.

Run: `npm run dev`. Open home, faculty, news pages. Visually scan headings, body text, buttons — all text should render identically. If any text suddenly looks thinner/heavier than before, that weight was needed — add it back.

Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "perf(fonts): drop unused font weights from Google Fonts config"
```

---

### Task 11: Add long-cache headers for static assets

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add `headers()` to next.config.ts**

Update `next.config.ts` to include the `headers` async function:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
  },
};

export default nextConfig;
```

- [ ] **Step 2: Build verify**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "perf: long immutable cache for /assets and /_next/static"
```

---

### Task 12: `sizes` prop audit for next/image

**Files:**
- Modify: various `src/**/*.tsx` files where Image lacks an accurate `sizes` prop

- [ ] **Step 1: Grep all `<Image` usages**

Use Grep tool across `src/`:
- pattern: `<Image\\b` (with multiline mode if needed)
- output_mode: `content`, `-A` 8 to see the surrounding props

List all `<Image>` elements and note which ones have:
- No `sizes` prop at all
- `sizes="100vw"` but rendered at fixed/small size (suspicious — over-fetching on desktop)

Hero uses `fill` + `sizes="100vw"` which is correct (it really is 100vw).

- [ ] **Step 2: Fix faculty card thumbnails**

Locate the faculty-member list page card image (`src/app/faculty-member/page.tsx` or its sub-component). Faculty cards typically render at ~200-300px wide on desktop, ~50vw on mobile.

If the card Image lacks `sizes` or is `sizes="100vw"`, change it to:

```tsx
sizes="(max-width: 768px) 50vw, 300px"
```

(Adjust the px value to match the actual rendered max width — read the Tailwind classes to determine.)

- [ ] **Step 3: Fix news/event card thumbnails**

Same approach for:
- `src/components/sections/NewsSection.tsx`
- `src/components/sections/EventsSection.tsx`
- `src/app/news/page.tsx`
- `src/app/student-society/events/page.tsx`

Use `sizes` proportional to actual rendered width — read the surrounding `className` to determine.

- [ ] **Step 4: Fix gallery thumbnails**

`src/components/gallery/GalleryGrid.tsx` and `src/app/gallery/page.tsx` — gallery is typically a multi-column masonry. Use:

```tsx
sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

(Adjust column counts to match actual breakpoints in the code.)

- [ ] **Step 5: Build + dev verify**

Run: `npm run build`
Expected: succeeds.

Run: `npm run dev`. Open the pages whose Images you modified. In DevTools Network tab, filter "Img" and look at the URLs — Next.js image URLs include `&w=XXX`. On mobile viewport (DevTools device toolbar), the `w=` should be smaller than on desktop. Verify visually no images appear blurry or pixelated.

Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "perf(images): tune next/image sizes prop on faculty, news, events, gallery"
```

---

### Task 13: Strip stray console.log

**Files:**
- Audit only (no expected changes unless found)

- [ ] **Step 1: Grep for console.log/warn/error in src**

Use Grep tool: pattern `console\\.(log|warn|debug)` across `src/`.

`console.error` is fine to leave (production debugging).

- [ ] **Step 2: Remove stray logs if found**

Delete any `console.log`/`console.warn`/`console.debug` calls that aren't behind a `process.env.NODE_ENV === 'development'` check.

- [ ] **Step 3: Commit if changes**

If anything changed:

```bash
git add src/
git commit -m "chore: remove stray console.log statements"
```

---

### Task 14: Phase 3 measurement and final gate

**Files:**
- Modify: `docs/superpowers/plans/pagespeed-baseline.md`

- [ ] **Step 1: Push and wait for Vercel preview**

```bash
git push
```

- [ ] **Step 2: Full PageSpeed run**

Run PageSpeed Insights on **all 6 baseline pages plus**:
- `/news/[any-slug]` (a news detail page)
- `/faculty-member/[any-slug]` (a faculty detail page)

Record mobile + desktop for each.

- [ ] **Step 3: Append final results**

Append to `docs/superpowers/plans/pagespeed-baseline.md`:

```markdown
## Phase 3 Results — Final

| Page | Mobile | Desktop | LCP | CLS | TBT |
|------|--------|---------|-----|-----|-----|
...

## Summary
- Baseline avg mobile: XX  →  Final avg mobile: XX
- Baseline avg desktop: XX  →  Final avg desktop: XX
- Pages meeting 95+ goal: X / X
```

- [ ] **Step 4: Address any page still below 95**

If any page is <95:
- Re-check that page's largest image — is it really WebP? Is `sizes` accurate?
- Check that page's JS chunk size — does it use a heavy client component that could be dynamic-imported?
- Check PageSpeed's "Opportunities" section for specific actionable suggestions

Apply targeted fix, commit, re-measure. Loop until target met.

- [ ] **Step 5: Final commit and merge**

```bash
git add docs/superpowers/plans/pagespeed-baseline.md
git commit -m "docs: record final pagespeed results — target achieved"
git push
```

Production deploy follows the existing workflow (merge to main / push to main, whichever this repo uses).

- [ ] **Step 6: Cleanup**

After production deploy is verified, optionally delete the local `assets-original-backup/` folder to reclaim disk space:

```powershell
Remove-Item -Recurse -Force assets-original-backup
```

(Folder is git-ignored, so this is purely local.)

---

## Out of Scope (Not in This Plan)

- Service worker / PWA installation
- Critical CSS inlining (Tailwind v4 handles)
- React Server Components refactor of existing client components
- Replacing `motion/react` with hand-rolled CSS (revisit only if Phase 2 doesn't reach 95)
- CDN image proxy (cloudinary/imgix)
- PDF file compression (intentional — users download these)
