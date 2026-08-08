# Phase 1 — Frontend integration (public pages → DB)

## Scope

Wires the public Next.js pages to read content from the Phase 0
Prisma DB, replacing hardcoded reads from `src/lib/*-data.ts`.
Stays inside the existing schema — **zero migrations, zero new
tables or columns, zero new dependencies**.

- **Identity helpers** — `src/lib/identity.ts` exposes
  `getDepartmentIdentity()` + `getUniversityIdentity()` for
  singletons and `getPrograms()` + `getResearchAreas()` for the
  two content lists. All four are `React.cache()`-wrapped so the
  root layout + page + sections share one DB hit per request.
- **Brand colors as CSS custom properties** — root layout reads
  `DepartmentIdentity` and injects `--color-primary`,
  `--color-accent`, `--color-button-yellow` on `<html style>`.
  Cascade overrides the Tailwind v4 `@theme` defaults in
  `globals.css` so every utility class (`text-primary`,
  `bg-accent`, …) and the two gradient classes
  (`.gradient-blue-magenta`, `.text-gradient`) picks up the live
  values without a rebuild.
- **Hero** — three images + breadcrumb label come from
  `DepartmentIdentity`. Per-image `alt` text stays as a code
  constant (`HERO_ALTS`) — schema has no `alt` column.
- **Navbar** — logo from `DepartmentIdentity.logoUrl`, ERP +
  apply URLs from `UniversityIdentity.{erpUrl,applyUrl}`. The
  navbar's hardcoded literal `bg-[#2B3175]` swapped to
  `bg-primary` so the navy bar tracks brand changes too. Nav
  structure (top links, quick access grid, main nav groups)
  stays hardcoded for Phase 2.
- **Footer** — logo, address, copyright, map embed URL, 8
  socials, and variable-count phone + email arrays all from
  `UniversityIdentity`. Pinterest icon component fully removed
  (not in schema). WhatsApp icon component added (inline SVG
  matching X / Threads / TikTok pattern) — renders only when
  `whatsappUrl` is set in DB.
- **Programs section** — `Program` table replaces hardcoded
  `programs` array. Em-dash split convention on `programName`
  reconstructs the old "overline + heading" visual without a
  schema change. `cta` null → "View More" default. `imageUrl`
  null → `/assets/program-undergraduate.webp` fallback.
- **Major Research section** — `ResearchArea` table replaces
  hardcoded `researchAreas`. Icon resolution chain:
  `iconUrl` (Cloudinary `<Image>`) → `IconMap[iconName]`
  (expanded from 7 to 21 Lucide icons covering common research
  domains) → `FlaskConical` fallback.
- **Public revalidation from admin** — every mutation action in
  `src/lib/admin-actions/{department,university,programs,research-areas}.ts`
  adds the matching public-route `revalidatePath` so a CMS save
  surfaces on the next public page load without a hard refresh.
  Identity actions use `revalidatePath('/', 'layout')` (brand
  colors + Navbar + Footer live on the root layout); list
  actions use `revalidatePath('/')` (homepage sections only).
- **`next.config.ts`** — `res.cloudinary.com` added to
  `images.remotePatterns`. Phase 0 admin uploads to Cloudinary
  but no public page rendered those URLs until CP1.1 wired hero
  images from DB — surfaced the gap.

## Out of scope (deferred to Phase 2)

A consolidated tracker lives at
[`docs/phase-2-todo.md`](../docs/phase-2-todo.md). The list keeps
growing as each Phase 1 sub-step surfaces something:

- **`DepartmentIdentity.heroImage{1,2,3}Alt`** — per-image alt
  text columns. Surfaced CP1.1.
- **`ResearchArea.featured` + featured-card content columns** —
  the right-side "Robotics & Industrial Automation" card stays
  hardcoded in `MajorResearchSection`. Surfaced CP1.3.
- **`Program.ctaHref`** — Program CTA buttons all link to
  `/admission/requirements`. Surfaced CP1.3.
- **Navbar nav structure tables** — `top_links`,
  `quick_access`, and `nav_group` + items. Surfaced CP1.1.
- **Footer hardcoded link sections** — `useful_links`,
  `get_in_touch`, `quick_links`, and the footer-bottom Privacy /
  Terms / Sitemap row. Surfaced CP1.2.
- **About pages content** — `/about/*` from hardcoded data files.
- **Faculty system** — the biggest one. `Faculty` table drives
  `/faculty-member`, `[slug]`, Dean's-message, Head pages.
- **Labs** — `ResearchLabsSection` (homepage carousel) and
  `/about/lab-facility` from `labs-data.ts`.
- **News / Events / Notices / Gallery** — each section currently
  reads from its own hardcoded `*-data.ts`. Some need `[slug]`
  detail pages too.
- **Alumni / Clubs / FAQ / Visitors / Transport / Syllabus** —
  the remaining `/student-society/*` surfaces.

Also still out:
- The local-only edit on `src/app/admission/requirements/page.tsx`
  (owner-managed; intentionally unstaged through CP3 → CP1.4).
- A `Lab` schema (the homepage `ResearchLabsSection` renders a
  different concept than `ResearchArea` — the Phase 1 master
  prompt initially named the wrong component; corrected to
  `MajorResearchSection` in CP1.3).

## Architectural decisions

### Server Component fetches with `React.cache()` dedup, props down to client components

All identity / list reads happen in **server components**
(`src/app/layout.tsx`, `src/app/page.tsx`) and pass via props to
the existing `'use client'` sections (Navbar, Footer,
HeroSection, ProgramsSection, MajorResearchSection). Each
section already has its own client-side concerns (scroll,
motion, carousel) — keeping them as client components and
feeding them props was the minimum-invasive path.

`React.cache()` on the four helpers means the root layout's call
to `getDepartmentIdentity()` and the homepage's separate call
to the same helper resolve to one DB query per request.

### CSS variable injection over Tailwind config

The project uses Tailwind v4 CSS-first config (no
`tailwind.config.*` file — `globals.css` `@theme` block defines
brand colors). Injecting DB values via `<html style={{ '--color-primary': … }}>`
overrides the `@theme` defaults at runtime through normal CSS
cascade. No rebuild needed for color changes.

### `Navbar` logo from `DepartmentIdentity`, `Footer` logo from `UniversityIdentity`

The Phase 1 master prompt's CP1.1 spec said the navbar logo
should come from `UniversityIdentity`. The DB seed and the
existing visual told a different story: the navbar shows
`/assets/su-colour-logo.webp` (which is in
`DepartmentIdentity.logoUrl`); the footer shows
`/assets/footer-logo.webp` (in `UniversityIdentity.logoUrl`).
Schema semantics + visual reality both pointed to
`DepartmentIdentity` for the navbar. The deviation was surfaced
and approved before code landed.

### Em-dash split convention on `programName`

The Programs card template has two display slots (small uppercase
overline + large heading); the `Program` table has one
`programName` column. CMS authoring convention: write
`"<overline> — <heading>"` with em-dash + spaces as separator;
the section splits on `' — '`. Missing separator → overline
omitted, heading-only fallback (e.g. the user-added "Graduate"
row).

### Icon resolution chain on `ResearchArea`

`iconUrl` (Cloudinary `<Image>`) → `IconMap[iconName]` (Lucide)
→ `FlaskConical` fallback. `IconMap` expanded from the seed's 7
entries to 21 covering common mechanical-engineering research
domains (Atom, Cpu, Microscope, Brain, Zap, Activity,
FlaskConical, Dna, Cog, Lightbulb, Rocket, Database, BookOpen,
Gauge + the original 7). Admin can type any of these strings
without a code change; unknown names render the fallback.

### `revalidatePath('/', 'layout')` vs `revalidatePath('/')`

Identity rows feed `<html style>` and the chrome — they need
**`'layout'` scope** to invalidate every route. List rows
(Programs, Research Areas) only feed the homepage today, so
**`'/'` page scope** is enough. When Phase 2 wires a `/research`
deep page, its actions need additional `revalidatePath('/research')`
entries.

### Cloudinary host in `next.config.ts`

`res.cloudinary.com` added to `images.remotePatterns`. Hostname
allowlist only (no per-cloud path scoping) so future clones with
a different `CLOUDINARY_CLOUD_NAME` need no config tweak.

## Verification

All testing was **manual** (curl smoke + browser) — same as
Phase 0; no automated test suite in scope.

### Per-sub-step curl smoke (local, before push)

Each CP verified with hard-load + targeted `grep -o … | wc -l`
checks (occurrence counts, not `grep -c` line counts — Next.js
collapses HTML to long lines):

- **CP1.1** — `<html style>` has the three CSS vars from DB;
  Navbar logo srcset uses `su-colour-logo.webp`; hero images
  `hero-1/2/3.webp` all present; breadcrumb label `ME` rendered;
  no admin-chrome leak on `/`.
- **CP1.2** — copyright, address, 2 phones, 1 email, 7 social
  aria-labels (no Pinterest, WhatsApp-slot present but no `<a>`
  when null), map iframe `src` from DB; `>Google Maps<` heading
  renders when `mapEmbedUrl` is truthy; PinterestIcon SVG path
  string absent from HTML.
- **CP1.3** — both program cards render (BSc-ME + the
  user-added Graduate via admin earlier — *the magic moment*);
  Row 1 em-dash split produces the "Undergraduate" overline +
  "B.Sc in Mechanical Engineering" heading; Row 2 ("Graduate")
  heading-only; Cloudinary URL for the Graduate program image
  present in HTML; 7 research area names rendered with the
  correct Lucide SVG class per icon; featured "Robotics &
  Industrial Automation" card still present (hardcoded);
  specialization bullets count 7 (4 + 3 across both rows).
- **CP1.4** — code-shape audit: every admin mutation now
  carries the matching public `revalidatePath`. Behavioral check
  comes through the production browser test below.

### Production browser end-to-end

After `vercel deploy --prod` from branch HEAD:

| Test | Result |
|------|--------|
| Visit `/` — Programs section shows BSc-ME + Graduate, 7 research areas, 8 socials in footer (WhatsApp now in DB), no Pinterest | ✓ |
| Admin → Department Identity → change primary color → save → navigate to `/` (no hard refresh) → color reflected through Navbar/Hero/everything (the `revalidatePath('/', 'layout')` proof) | ✓ |
| Admin → Programs → edit BSc-ME description → save → navigate to `/` → new description visible (the `revalidatePath('/')` proof) | ✓ |
| DevTools console clean across `/`, `/about/overview`, `/contact` — no hydration warnings | ✓ |
| Existing `/admin/*` flows (login, dashboard, content edits, user management) — no regression | ✓ |

## Tech debt notes

In addition to the Phase 2 items above:

- **Schema-vs-template mismatch on `Program`** — only one
  `programName` column. CP1.3 worked around it with the em-dash
  split convention, but a clean fix would be separate columns.
- **`IconMap` is curated, not exhaustive** — 21 Lucide icons.
  Admin can type a Lucide name not in the map and get
  `FlaskConical` instead. Either expand to all Lucide or
  constrain the admin form to the curated set.
- **`Program.specializations` uses the spec string itself as
  React key** — duplicate spec text within one program would
  warn. DB-side uniqueness not enforced; cheap.
- **`HERO_ALTS` describes the slot, not the image** — once an
  admin replaces a hero image, the alt is stale until either
  the alt-column lands (Phase 2) or the convention is updated.
- **No automated tests** — carried forward from Phase 0. Highest
  payoff candidates: a Playwright smoke for the
  super_admin → public revalidation flow (the "magic moment"),
  Vitest for the em-dash split logic.

## Commit list

```
63bf4b7 feat(phase-1): CP1.4 — admin server actions revalidate public routes after mutation
0a107f7 feat(phase-1): CP1.3 — homepage Programs + Research Areas wired from DB (em-dash split convention, 21-icon IconMap with FlaskConical fallback)
577d692 feat(phase-1): CP1.2 — footer wired from UniversityIdentity (Pinterest removed, WhatsApp slot added)
5f9fd31 feat(phase-1): CP1.1 — identity helpers, brand colors, hero, navbar logo wired from DB
```

4 commits — all `feat`, none `fix` (no mid-flight bugs surfaced
that needed a separate commit; the one stale-action-ID issue
mid-way was a Next.js dev-cache artifact, not a code bug; the
Cloudinary `next.config.ts` entry was bundled into CP1.1).

Diff vs `main`: **15 files changed, +577 / -194**.

## Deployment notes

- Production deploy: `vercel deploy --prod` from this feature
  branch, same stash → deploy → pop pattern Phase 0 used (the
  local-only `src/app/admission/requirements/page.tsx` edit stays
  out of production).
- Deployment ID: `dpl_DWVCsg8iU3mSxYGPmCutF4wNqJEu`.
- Production alias `mechanical-engineering-olive.vercel.app`
  attached automatically by Vercel.
- No env-var changes. The Phase 0 set (Cloudinary keys,
  Better Auth, DB URLs across Production / Preview / Development)
  fully covers Phase 1.
- No schema migration. The Neon DB stays at the Phase 0
  `20260514064905_init` migration; no `prisma migrate` step ran.
- Build cache reuse vs Phase 0 deploys reduced cold build to
  ~14s compile + 44s total Vercel build / ~1m end-to-end.
