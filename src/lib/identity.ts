import { cache } from 'react';
import { prisma } from '@/lib/db';

// React.cache() makes the per-request fetch deduplicated across
// every Server Component that calls it during a single render
// pass. Layout + page + sections share ONE DB hit.

export const getDepartmentIdentity = cache(async () => {
  const dept = await prisma.departmentIdentity.findUnique({
    where: { id: 'singleton' },
  });
  if (!dept) {
    throw new Error(
      'DepartmentIdentity row missing (id="singleton"). Run `npm run db:seed`.',
    );
  }
  return dept;
});

export const getUniversityIdentity = cache(async () => {
  const uni = await prisma.universityIdentity.findUnique({
    where: { id: 'singleton' },
  });
  if (!uni) {
    throw new Error(
      'UniversityIdentity row missing (id="singleton"). Run `npm run db:seed`.',
    );
  }
  return uni;
});

// List entities — return arrays (possibly empty; no throw). Sorted by
// displayOrder ascending; admin reorder UI writes this column. The
// explicit `select` keeps the payload narrow (drops createdAt /
// updatedAt Date fields that would otherwise need serialization
// when these arrays cross into client components).

export const getPrograms = cache(async () => {
  return prisma.program.findMany({
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      programName: true,
      degreeCode: true,
      duration: true,
      description: true,
      imageUrl: true,
      specializations: true,
      cta: true,
    },
  });
});

export const getResearchAreas = cache(async () => {
  return prisma.researchArea.findMany({
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      iconName: true,
      iconUrl: true,
      areaName: true,
      description: true,
      isFeatured: true,
      featuredHeading: true,
      featuredImageUrl: true,
      featuredDescription: true,
      featuredCtaHref: true,
    },
  });
});

// Programs — extended in Phase 3 to include ctaHref. The
// original getPrograms select stays narrow (drops ctaHref) for
// backward compat where callers only need the visible content;
// new helper getProgramsForHome includes ctaHref for the
// homepage Programs CTA render.
export const getProgramsWithCta = cache(async () => {
  return prisma.program.findMany({
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      programName: true,
      degreeCode: true,
      duration: true,
      description: true,
      imageUrl: true,
      specializations: true,
      cta: true,
      ctaHref: true,
    },
  });
});

// ─────────────────────────────────────────────────────────────────
//  Chrome — Phase 3
//    Navbar (top_link, quick_access_item, main_nav_group + items)
//    Footer (4 link tables)
//    All cache()-wrapped so layout + children share one DB hit each.
// ─────────────────────────────────────────────────────────────────

export const getTopLinks = cache(async () => {
  return prisma.topLink.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, href: true, isExternal: true, isDisabled: true },
  });
});

export const getQuickAccessItems = cache(async () => {
  return prisma.quickAccessItem.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, href: true, iconName: true, isExternal: true, isDisabled: true },
  });
});

export const getMainNav = cache(async () => {
  return prisma.mainNavGroup.findMany({
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      name: true,
      href: true,
      hasDropdown: true,
      title: true,
      items: {
        orderBy: { displayOrder: 'asc' },
        select: { id: true, name: true, href: true, isExternal: true, isDisabled: true },
      },
    },
  });
});

export const getFooterUsefulLinks = cache(async () => {
  return prisma.footerUsefulLink.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, href: true, isExternal: true, isDisabled: true },
  });
});

export const getFooterGetInTouchLinks = cache(async () => {
  return prisma.footerGetInTouchLink.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, href: true, isExternal: true, isDisabled: true },
  });
});

export const getFooterQuickLinks = cache(async () => {
  return prisma.footerQuickLink.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, href: true, isExternal: true, isDisabled: true },
  });
});

export const getFooterLegalLinks = cache(async () => {
  return prisma.footerLegalLink.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, href: true, isExternal: true, isDisabled: true },
  });
});

export const getFooterCampusLinks = cache(async () => {
  return prisma.footerCampusLink.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, href: true, isExternal: true, isDisabled: true },
  });
});

export const getNewsletterPage = cache(async () => {
  return prisma.newsletterPage.findUnique({ where: { id: 'singleton' } });
});

// Generic per-page hero CMS. Each public page that doesn't have its
// own singleton looks up its hero by a stable pageKey. The seed
// migration creates a row for every page that previously had a
// hardcoded hero, so a missing row is a developer error (new page
// added without seeding) — public pages can fall back gracefully.
export const getPageHero = cache(async (pageKey: string) => {
  return prisma.pageHero.findUnique({ where: { pageKey } });
});

// ─────────────────────────────────────────────────────────────────
//  About pages — Phase 4 (3 singletons)
//    Each is a full row including the Json content fields so the
//    public page can render without further DB calls.
// ─────────────────────────────────────────────────────────────────

export const getAboutOverview = cache(async () => {
  return prisma.aboutOverview.findUnique({ where: { id: 'singleton' } });
});

export const getAboutMissionVision = cache(async () => {
  return prisma.aboutMissionVision.findUnique({ where: { id: 'singleton' } });
});

export const getAboutDepartmentClub = cache(async () => {
  return prisma.aboutDepartmentClub.findUnique({ where: { id: 'singleton' } });
});

// ─────────────────────────────────────────────────────────────────
//  Lab systems — Phase 5 (2 singletons + 2 multi-row)
// ─────────────────────────────────────────────────────────────────

export const getLabFacilityLanding = cache(async () => {
  return prisma.labFacilityLanding.findUnique({ where: { id: 'singleton' } });
});

export const getLabs = cache(async () => {
  return prisma.lab.findMany({
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      description: true,
      heroImageUrl: true,
      gallery: true,
    },
  });
});

export const getLaboratoryFacilityLanding = cache(async () => {
  return prisma.laboratoryFacilityLanding.findUnique({ where: { id: 'singleton' } });
});

export const getLaboratoryLabs = cache(async () => {
  return prisma.laboratoryLab.findMany({
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      iconName: true,
      title: true,
      description: true,
      keyLabel: true,
      keyItems: true,
      focus: true,
      location: true,
      capacity: true,
      equipmentCount: true,
      software: true,
      inCharge: true,
      safety: true,
    },
  });
});

// Faculty (Phase 2). Full rows are returned — including Json
// section content + Dean/Head message extras — so the public
// pages can render every section without per-page Prisma calls.
// React.cache wraps each helper so multiple Server Components
// in the same request share a single DB hit.

export const getFacultyList = cache(async () => {
  return prisma.faculty.findMany({
    orderBy: { displayOrder: 'asc' },
  });
});

export const getFacultyBySlug = cache(async (slug: string) => {
  return prisma.faculty.findUnique({ where: { slug } });
});

export const getFacultySlugs = cache(async () => {
  const rows = await prisma.faculty.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
});

export const getDean = cache(async () => {
  return prisma.faculty.findFirst({ where: { isDean: true } });
});

export const getHead = cache(async () => {
  return prisma.faculty.findFirst({ where: { isHead: true } });
});

// ─────────────────────────────────────────────────────────────────
//  Content hubs — Phase 6 (News, Events, Notices, GalleryImage)
//    News + Notices sort by publishedAt DESC (newest first).
//    Events sort by eventDate DESC NULLS LAST, then createdAt DESC.
//    Gallery sorts by displayOrder ASC (admin drag-reorder).
// ─────────────────────────────────────────────────────────────────

// Hero/intro singleton for /news. Optional row — public page
// falls back to hardcoded defaults if the row is absent (e.g.
// fresh DB before the seed runs).
export const getNewsLanding = cache(async () => {
  return prisma.newsLanding.findUnique({ where: { id: 'singleton' } });
});

// News list (paginated). `take`/`skip` callers compute from ?page=N.
// Returns the full row so callers can render cards + detail pages
// from the same shape; Json columns (body, meta) are read defensively
// at render time via coerceParagraphs / coerceKeyValueList.
export const getNews = cache(async (opts?: { skip?: number; take?: number }) => {
  return prisma.news.findMany({
    orderBy: { publishedAt: 'desc' },
    skip: opts?.skip,
    take: opts?.take,
  });
});

export const getNewsCount = cache(async () => {
  return prisma.news.count();
});

export const getNewsBySlug = cache(async (slug: string) => {
  return prisma.news.findUnique({ where: { slug } });
});

export const getNewsSlugs = cache(async () => {
  const rows = await prisma.news.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
});

// Homepage NewsSection — top 5 (main + 4 sides).
export const getNewsHomeTop = cache(async () => {
  return prisma.news.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 5,
  });
});

export const getEvents = cache(async () => {
  return prisma.event.findMany({
    orderBy: [{ eventDate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
  });
});

export const getEventBySlug = cache(async (slug: string) => {
  return prisma.event.findUnique({ where: { slug } });
});

export const getEventSlugs = cache(async () => {
  const rows = await prisma.event.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
});

// Homepage EventsSection — top 3 (same sort as full list).
export const getEventsHomeTop = cache(async () => {
  return prisma.event.findMany({
    orderBy: [{ eventDate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: 3,
  });
});

export const getNotices = cache(async () => {
  return prisma.notice.findMany({ orderBy: { publishedAt: 'desc' } });
});

// Homepage NoticesSection — top 5 (date descending).
export const getNoticesHomeTop = cache(async () => {
  return prisma.notice.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 5,
  });
});

export const getGalleryImages = cache(async () => {
  return prisma.galleryImage.findMany({ orderBy: { displayOrder: 'asc' } });
});

// ─────────────────────────────────────────────────────────────────
//  Student Society + Campus Services — Phase 7
//    Last batch of multi-row content. Closes out the *-data.ts
//    file-based reads everywhere except scripts/seed.ts bootstrap.
// ─────────────────────────────────────────────────────────────────

export const getAlumni = cache(async () => {
  return prisma.alumni.findMany({ orderBy: { displayOrder: 'asc' } });
});

export const getClubs = cache(async () => {
  return prisma.club.findMany({ orderBy: { displayOrder: 'asc' } });
});

export const getFaqs = cache(async () => {
  return prisma.faq.findMany({ orderBy: { displayOrder: 'asc' } });
});

export const getVisitors = cache(async () => {
  return prisma.visitor.findMany({ orderBy: { displayOrder: 'asc' } });
});

/** Paged: the list runs to a few hundred entries on a department with history. */
export const getResearchPapers = cache(async (opts?: { skip?: number; take?: number }) => {
  return prisma.researchPaper.findMany({
    orderBy: { displayOrder: 'asc' },
    skip: opts?.skip,
    take: opts?.take,
  });
});

export const getResearchPaperCount = cache(async () => {
  return prisma.researchPaper.count();
});

/**
 * The years the whole list spans, not just the page being shown — the sentence
 * above the list describes the department's record, which does not change when
 * somebody turns to page three.
 */
export const getResearchYearSpan = cache(async () => {
  const [oldest, newest] = await Promise.all([
    prisma.researchPaper.findFirst({
      where: { publicationYear: { not: null } },
      orderBy: { publicationYear: 'asc' },
      select: { publicationYear: true },
    }),
    prisma.researchPaper.findFirst({
      where: { publicationYear: { not: null } },
      orderBy: { publicationYear: 'desc' },
      select: { publicationYear: true },
    }),
  ]);

  if (!oldest?.publicationYear || !newest?.publicationYear) return null;
  return { from: oldest.publicationYear, to: newest.publicationYear };
});

/** Offices and the level each is on, for the department layout page. */
export const getOfficeLocations = cache(async () => {
  return prisma.officeLocation.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, level: true, building: true, isDepartment: true },
  });
});

export const getBusRoutes = cache(async () => {
  return prisma.busRoute.findMany({ orderBy: { displayOrder: 'asc' } });
});

export const getSyllabi = cache(async () => {
  return prisma.syllabus.findMany({ orderBy: { displayOrder: 'asc' } });
});

export const getTransportLanding = cache(async () => {
  return prisma.transportLanding.findUnique({ where: { id: 'singleton' } });
});

// ─────────────────────────────────────────────────────────────────
//  Admission CMS Part 1 — Phase 8a
//    /admission/notice renders the single latest active notice
//    (Decision B1 — no archive route in 8a).
//    /admission/prospectus renders all entries with a UG/PG filter.
// ─────────────────────────────────────────────────────────────────

export const getActiveAdmissionNotice = cache(async () => {
  return prisma.admissionNotice.findFirst({
    where: { isActive: true },
    orderBy: { publishedAt: 'desc' },
  });
});

export const getProspectusEntries = cache(async () => {
  return prisma.prospectusEntry.findMany({ orderBy: { displayOrder: 'asc' } });
});

// ─────────────────────────────────────────────────────────────────
//  Admission CMS Part 2 — Phase 8b
//    /admission/requirements reads the singleton.
//    /admission/tuition-fees reads ProgramFeeStructure[] with Program
//    info attached (degreeCode used for stable per-program section
//    keys when multiple programs are added later).
// ─────────────────────────────────────────────────────────────────

export const getAdmissionRequirements = cache(async () => {
  return prisma.admissionRequirements.findUnique({ where: { id: 'singleton' } });
});

export const getProgramFeeStructures = cache(async () => {
  return prisma.programFeeStructure.findMany({
    orderBy: { displayOrder: 'asc' },
    include: {
      program: {
        select: { id: true, programName: true, degreeCode: true },
      },
    },
  });
});

/**
 * A program by its degree code, matched case-insensitively so the URL can be
 * the lowercased code (`BSc-NAME` → /programs/bsc-name).
 *
 * Both of these took a slug and ignored it, returning `findFirst()` — the
 * first program in the table whatever was asked for. That was invisible while
 * a department offered exactly one program and silently wrong the moment it
 * offered two: every program page showed the same one, with the fees of that
 * one attached.
 */
export const getProgramBySlug = cache(async (slug: string) => {
  return prisma.program.findFirst({
    where: { degreeCode: { equals: slug, mode: 'insensitive' } },
  });
});

/** Course structure and credit distribution for a program page. */
export const getProgramCurriculumBySlug = cache(async (slug: string) => {
  const program = await prisma.program.findFirst({
    where: { degreeCode: { equals: slug, mode: 'insensitive' } },
    select: { id: true },
  });
  if (!program) return null;
  return prisma.programCurriculum.findUnique({ where: { programId: program.id } });
});

export const getProgramFeeStructureBySlug = cache(async (slug: string) => {
  const program = await prisma.program.findFirst({
    where: { degreeCode: { equals: slug, mode: 'insensitive' } },
    select: { id: true },
  });
  if (!program) return null;
  return prisma.programFeeStructure.findUnique({
    where: { programId: program.id },
  });
});

// ─────────────────────────────────────────────────────────────────
//  Admission CMS Part 3 — Phase 8c
//    /admission/transfer-credits reads the singleton.
//    /admission/waiver-scholarship reads landing singleton +
//    WaiverCategory[] (Part 01) + Scholarship[] (Part 02).
// ─────────────────────────────────────────────────────────────────

export const getAdmissionTransferCredits = cache(async () => {
  return prisma.admissionTransferCredits.findUnique({ where: { id: 'singleton' } });
});

export const getWaiverScholarshipLanding = cache(async () => {
  return prisma.waiverScholarshipLanding.findUnique({ where: { id: 'singleton' } });
});

export const getWaiverCategories = cache(async () => {
  return prisma.waiverCategory.findMany({ orderBy: { displayOrder: 'asc' } });
});

export const getScholarships = cache(async () => {
  return prisma.scholarship.findMany({ orderBy: { displayOrder: 'asc' } });
});

// ─────────────────────────────────────────────────────────────────
//  Phase 10 — Contact page content + Campus Locations
//    Closes out the last hardcoded content on /contact. Phase 9
//    wired the form backend; Phase 10 makes the page chrome +
//    quick contact cards + campus locations CMS-editable.
// ─────────────────────────────────────────────────────────────────

export const getContactPageContent = cache(async () => {
  return prisma.contactPageContent.findUnique({ where: { id: 'singleton' } });
});

export const getCampusLocations = cache(async () => {
  return prisma.campusLocation.findMany({ orderBy: { displayOrder: 'asc' } });
});

// ─────────────────────────────────────────────────────────────────
//  Phase 12 — JourneyCTAContent (between-content-and-footer chrome).
// ─────────────────────────────────────────────────────────────────

export const getJourneyCTAContent = cache(async () => {
  return prisma.journeyCTAContent.findUnique({ where: { id: 'singleton' } });
});

// Phase 17 — LegalPagesContent singleton. One row, two public pages
// (/privacy-policy and /terms-and-conditions). React.cache so both
// renderers share one DB hit when rendered in the same request
// (they aren't, but the same fetcher is also used by the admin form
// page and the dashboard "configured" check).
export const getLegalPagesContent = cache(async () => {
  return prisma.legalPagesContent.findUnique({ where: { id: 'singleton' } });
});

export const getDepartmentLayouts = cache(async () => {
  return prisma.departmentLayout.findMany({ orderBy: { displayOrder: 'asc' } });
});
