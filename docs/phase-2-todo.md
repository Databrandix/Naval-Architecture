# Phase 2 — Pending Items

Items surfaced across Phase 1 sub-steps that were intentionally
deferred to Phase 2 (typically because they need new DB schema or
larger feature scope). Each line notes the CP that first surfaced
it. This file is the running input for the Phase 2 master prompt
when it gets written.

Add new entries here as future sub-steps surface them. Do not
remove items once landed in Phase 2 — instead, strike through with
the Phase 2 commit hash that resolved them.

## DB schema additions (singletons / single-table augmentation)

- **`DepartmentIdentity.heroImage{1,2,3}Alt`** — per-image alt
  text for accessibility. HERO_ALTS array stays in
  `src/components/sections/HeroSection.tsx` as a code constant
  until a column exists. Without these columns, super_admin
  cannot describe a replacement hero image accurately for screen
  readers — the alt describes the SLOT, not the new image.
  Surfaced: CP1.1.

- **`ResearchArea.featured` + featured-card content columns**
  (`featuredImageUrl`, `featuredImagePublicId`, `featuredTitle`,
  `featuredDescription`, `featuredCtaHref`). Exactly one row at
  a time may be flagged featured; `MajorResearchSection`
  right-side card reads from it instead of the current hardcoded
  "Robotics & Industrial Automation" content. Surfaced: CP1.3.

- **`Program.ctaHref`** (or similar) — current Programs cards
  link to a hardcoded `/admission/requirements` regardless of
  which program. Per-program href lets super_admin route Graduate
  apply flow somewhere different from Undergraduate. Surfaced:
  CP1.3.

## DB list / new table additions

- **Navbar nav structure** — three list shapes hardcoded in
  `src/components/layout/Navbar.tsx`:
  - `topLinks` (Virtual Tour, IQAC, Career, Archive, Contact)
  - `quickAccess` grid (Library, Admission, Photo, Virtual Tour,
    Archive, Notice, ERP, IQAC, Skill Jobs, Convoc. Reg.,
    Verification)
  - `navLinks` with named groups + children (About / Faculty
    Member / Admission / Student Society / Contact)

  Suggested tables: `nav_top_link`, `nav_quick_access_item`,
  `nav_group` + `nav_group_item`. Surfaced: CP1.1.

- **Footer hardcoded link sections** — three list arrays in
  `src/components/layout/Footer.tsx`:
  - `usefulLinks` (Tuition Fee, Faculty Staff, Alumni, Career,
    Event, Our Blogs)
  - `getInTouch` (Contact, Meet With Us, Privacy Statement,
    Newsletters, Location Map, FAQ)
  - `quickLinks` (SU News, Forum, Students, Parents, Teachers,
    Administration)

  Plus the footer-bottom row of Privacy Statement / Terms of Use
  / Sitemap links (3 hardcoded `<a>` tags). Surfaced: CP1.2.

## Bigger feature scopes

- **About pages content tables** — `/about/overview`,
  `/about/mission-vision`, `/about/message-from-head`,
  `/about/laboratory-facility`, `/about/lab-facility`,
  `/about/mecha-club`, `/about/deans-message`. Each currently
  reads from hardcoded data in `src/lib/*-data.ts` files or has
  inline content. Likely needs a flexible `Page` table with
  rich-text blocks, OR per-page-specific tables.

- **Faculty system** — the big one. A `Faculty` table + per-member
  records (slug, name, role, photoUrl, photoPublicId, qualifications,
  areasOfInterest, contact, etc.) drives `/faculty-member`,
  `/faculty-member/[slug]`, plus Dean's-message and
  Head-of-Department surfaces. Currently from
  `src/lib/faculty-data.ts` (38+ static entries). This also
  drives the Phase 0 admin tech-debt "Faculty CRUD UI" gap.

- **Labs** — `ResearchLabsSection` (carousel of lab cards) reads
  from hardcoded `src/lib/labs-data.ts`. A `Lab` table (slug,
  name, tagline, heroImage, description, equipment, gallery,
  etc.) would drive both the homepage carousel and the
  `/about/lab-facility` deep page.

- **News / Events / Notices / Gallery** — homepage sections
  (`NewsSection`, `EventsSection`, `NoticesSection`), public deep
  pages (`/news`, `/news/[slug]`, `/student-society/events`,
  `/student-society/events/[slug]`, `/student-society/notice-board`,
  `/gallery`). Currently each from a separate hardcoded
  `src/lib/{news,events,notices,gallery}-data.ts`. Each needs a
  table; News + Events also need `[slug]` detail pages.

- **Alumni / Clubs / FAQ / Visitors / Transport / Syllabus** —
  remaining `/student-society/*` surfaces from hardcoded
  `src/lib/{alumni,clubs,faq,visitors,transport}-data.ts`.

## Phase 1 deferred (not Phase 2 schema work, but tracked)

- Local-only edit on `src/app/admission/requirements/page.tsx` —
  owner-managed, intentional through Phase 0 + Phase 1.

## Process notes for the eventual Phase 2 master prompt

- Carry forward Phase 1's discipline: surface-before-execute on
  every sub-step, ranked hypotheses on debug rounds,
  verify-git-state-before-following-instructions.
- Each new table should have a parallel admin section under
  `/admin/*` mirroring the existing CMS pattern (list, new, edit
  with `[id]`, server-side super_admin gating where appropriate).
- `revalidatePath` on the relevant public route(s) is part of
  the contract for every admin write action (the CP1.4 pattern).
