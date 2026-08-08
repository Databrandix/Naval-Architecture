// NOTE: this module imports Prisma — it MUST NOT be imported from
// any client component. Client code (Navbar, SearchOverlay) must
// import SearchItem + search() from '@/lib/search' instead.
import { cache } from 'react';
import { prisma } from '@/lib/db';
import type { SearchItem } from './search';

// Re-export the type from the pure module so existing server-side
// consumers can keep importing it from here. Client components
// must import from '@/lib/search' (no Prisma transitive dep).
export type { SearchItem } from './search';

// ─────────────────────────────────────────────────────────────────
//  Search index — Phase 7 (FINAL — 100% DB-driven)
//
//  The root layout calls getSearchIndex() once per request and
//  passes the SearchItem[] down through Navbar → SearchOverlay as
//  a client prop. Filtering runs locally via search(query, items)
//  defined in '@/lib/search'.
//
//  DB-driven entities (Phase 2/3/5/6/7) — all 15 covered here:
//    Faculty, Programs, Research Areas, Labs, News, Events,
//    Notices, Gallery, Alumni, Club, FAQ, Visitor, ResearchPaper,
//    BusRoute, Syllabus
//
//  Phase 6 had 5 file-based reads (faqs, clubs, alumni,
//  researchPapers, busRoutes). All migrated to DB in Phase 7;
//  Phase 8 hygiene will delete the now-orphaned *-data.ts files
//  (still imported by scripts/seed.ts for bootstrap).
//
//  Static pages: hand-maintained route metadata; cheaper than
//  trying to derive from the router tree.
// ─────────────────────────────────────────────────────────────────

const staticPages: SearchItem[] = [
  // About
  { title: 'Overview', type: 'Page', href: '/about/overview', description: 'Department overview and history' },
  { title: 'Message from Head', type: 'Page', href: '/about/message-from-head', description: "Head of Department's welcome message" },
  { title: "Dean's Message", type: 'Page', href: '/about/deans-message', description: "Dean's welcome message" },
  { title: 'Mission & Vision', type: 'Page', href: '/about/mission-vision', description: "Department's mission and long-term vision" },
  { title: 'Laboratory Facility', type: 'Page', href: '/about/laboratory-facility', description: 'Departmental labs and equipment' },
  { title: 'Lab Facility', type: 'Page', href: '/about/lab-facility', description: 'List of all departmental labs' },
  { title: 'SU Electrical and Electronic Club', type: 'Page', href: '/about/eee-club', description: 'SU Electrical and Electronic Club (SUEEC)' },

  // Faculty
  { title: 'Faculty Members', type: 'Page', href: '/faculty-member', description: 'List of all faculty members' },

  // Admission
  { title: 'Admission Requirements', type: 'Page', href: '/admission/requirements', description: 'Eligibility and requirements for admission' },
  { title: 'Tuition Fees', type: 'Page', href: '/admission/tuition-fees', description: 'Program tuition fees and payment schedule' },
  { title: 'Transfer Credits', type: 'Page', href: '/admission/transfer-credits', description: 'Credit transfer policy and procedure' },
  { title: 'Waiver & Scholarship', type: 'Page', href: '/admission/waiver-scholarship', description: 'Tuition waivers and merit scholarships' },
  { title: 'Admission Notice', type: 'Page', href: '/admission/notice', description: 'Current admission notice and deadlines' },
  { title: 'Prospectus', type: 'Page', href: '/admission/prospectus', description: 'Department prospectus' },

  // Student Society
  { title: 'Notice Board', type: 'Page', href: '/student-society/notice-board', description: 'Department notices and announcements' },
  { title: 'Events', type: 'Page', href: '/student-society/events', description: 'Department events and activities' },
  { title: 'Alumni', type: 'Page', href: '/student-society/alumni', description: 'Notable alumni from the department' },
  { title: 'FAQ', type: 'Page', href: '/student-society/faq', description: 'Frequently asked questions' },
  { title: 'Visitors', type: 'Page', href: '/student-society/visitor', description: 'Distinguished visitors and their quotes' },
  { title: 'Syllabus', type: 'Page', href: '/student-society/syllabus', description: 'Department syllabus and curriculum' },
  { title: 'Club List', type: 'Page', href: '/student-society/club-list', description: 'Student clubs and societies' },

  // Other
  { title: 'Research Publications', type: 'Page', href: '/research', description: 'Research papers and publications' },
  { title: 'News', type: 'Page', href: '/news', description: 'Latest news and updates' },
  { title: 'Gallery', type: 'Page', href: '/gallery', description: 'Campus life photo gallery' },
  { title: 'Transport Service', type: 'Page', href: '/transport-service', description: 'Free university bus service routes and timings' },
  { title: 'Contact Us', type: 'Page', href: '/contact', description: 'Get in touch — phone, email, campus addresses' },
];

// React.cache so callers in the same render tree share one query
// burst. The layout calls getSearchIndex() once per request.
export const getSearchIndex = cache(async (): Promise<SearchItem[]> => {
  const [
    facultyRows,
    programRows,
    researchAreaRows,
    labRows,
    newsRows,
    eventRows,
    noticeRows,
    galleryRows,
    alumniRows,
    clubRows,
    faqRows,
    visitorRows,
    researchPaperRows,
    busRouteRows,
    syllabusRows,
    admissionNoticeRows,
    prospectusEntryRows,
    feeStructureRows,
    transferCreditsRow,
    waiverCategoryRows,
    scholarshipRows,
  ] = await Promise.all([
    prisma.faculty.findMany({
      select: { slug: true, name: true, designation: true, secondaryTitle: true },
    }),
    prisma.program.findMany({
      select: { programName: true, degreeCode: true, description: true },
    }),
    prisma.researchArea.findMany({
      select: { areaName: true, description: true },
    }),
    prisma.lab.findMany({
      select: { slug: true, name: true, tagline: true },
    }),
    prisma.news.findMany({
      select: { slug: true, title: true, shortTitle: true, summary: true },
    }),
    prisma.event.findMany({
      select: { slug: true, shortTitle: true, summary: true },
    }),
    prisma.notice.findMany({
      select: { slug: true, title: true, description: true, fileUrl: true },
    }),
    prisma.galleryImage.findMany({
      select: { alt: true },
    }),
    prisma.alumni.findMany({
      select: { slug: true, name: true, designation: true, company: true },
    }),
    prisma.club.findMany({
      select: { slug: true, name: true, abbreviation: true, description: true },
    }),
    prisma.faq.findMany({
      select: { question: true, answer: true },
    }),
    prisma.visitor.findMany({
      select: { slug: true, name: true, role: true, affiliation: true },
    }),
    prisma.researchPaper.findMany({
      select: { title: true, authors: true, area: true },
    }),
    prisma.busRoute.findMany({
      select: { routeName: true, busNumber: true, contact: true },
    }),
    prisma.syllabus.findMany({
      select: { slug: true, title: true, shortTitle: true, summary: true, pdfUrl: true },
    }),
    // Phase 8a — only the latest active notice; older / inactive ones
    // are not currently rendered anywhere public (Decision B1 — no
    // archive detail page in 8a), so they don't belong in search.
    prisma.admissionNotice.findMany({
      where: { isActive: true },
      orderBy: { publishedAt: 'desc' },
      take: 1,
      select: { subject: true, refNo: true, displayDate: true, slug: true },
    }),
    prisma.prospectusEntry.findMany({
      select: { title: true, shortTitle: true, department: true, level: true, slug: true },
    }),
    // Phase 8b — ProgramFeeStructure search entries. AdmissionRequirements
    // is a singleton already covered by the static "Admission Requirements"
    // page entry, so it's not indexed twice.
    prisma.programFeeStructure.findMany({
      orderBy: { displayOrder: 'asc' },
      select: { introOverline: true },
    }),
    // Phase 8c — TransferCredits singleton entry. Existing static
    // "Transfer Credits" Page entry stays alongside (matches the
    // Phase 8a precedent of leaving static admission entries in
    // place); this DB entry surfaces the more specific subject
    // line so search results read better.
    prisma.admissionTransferCredits.findUnique({
      where: { id: 'singleton' },
      select: { summaryHeading: true },
    }),
    prisma.waiverCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      select: { title: true, items: true },
    }),
    prisma.scholarship.findMany({
      orderBy: { displayOrder: 'asc' },
      select: { name: true, credits: true, base: true },
    }),
  ]);

  // Faculty (Phase 2 — DB)
  const facultyItems: SearchItem[] = facultyRows.map((f) => ({
    title: f.name,
    description: [f.designation, f.secondaryTitle].filter(Boolean).join(' · '),
    href: `/faculty-member/${f.slug}`,
    type: 'Faculty',
  }));

  // Programs (Phase 1 — DB).
  const programItems: SearchItem[] = programRows.map((p) => ({
    title: `${p.programName} (${p.degreeCode})`,
    description: p.description ?? undefined,
    href: '/admission/requirements',
    type: 'Program',
  }));

  // Research areas (Phase 1 — DB).
  const researchAreaItems: SearchItem[] = researchAreaRows.map((r) => ({
    title: r.areaName,
    description: r.description ?? undefined,
    href: '/research',
    type: 'ResearchArea',
  }));

  // Labs (Phase 5 — DB). Hash-fragment for the slug-based detail UX.
  const labItems: SearchItem[] = labRows.map((l) => ({
    title: l.name,
    description: l.tagline,
    href: `/about/lab-facility#${l.slug}`,
    type: 'Lab',
  }));

  // News (Phase 6 — DB)
  const newsItems: SearchItem[] = newsRows.map((n) => ({
    title: n.title,
    description: n.summary,
    href: `/news/${n.slug}`,
    type: 'News',
  }));

  // Events (Phase 6 — DB)
  const eventItems: SearchItem[] = eventRows.map((e) => ({
    title: e.shortTitle,
    description: e.summary,
    href: `/student-society/events/${e.slug}`,
    type: 'Event',
  }));

  // Notices (Phase 6 — DB)
  const noticeItems: SearchItem[] = noticeRows.map((n) => ({
    title: n.title,
    description: n.description,
    href: n.fileUrl ?? '/student-society/notice-board',
    type: 'Notice',
  }));

  // Gallery (Phase 6 — DB)
  const galleryItems: SearchItem[] = galleryRows
    .filter((g) => g.alt && g.alt.trim().length > 0)
    .map((g) => ({
      title: g.alt,
      href: '/gallery',
      type: 'Gallery',
    }));

  // Alumni (Phase 7 — DB)
  const alumniItems: SearchItem[] = alumniRows.map((a) => ({
    title: a.name,
    description: `${a.designation} · ${a.company}`,
    href: '/student-society/alumni',
    type: 'Alumni',
  }));

  // Clubs (Phase 7 — DB)
  const clubItems: SearchItem[] = clubRows.map((c) => ({
    title: `${c.name} (${c.abbreviation})`,
    description: c.description,
    href: '/student-society/club-list',
    type: 'Club',
  }));

  // FAQs (Phase 7 — DB) — question is the search title; answer goes
  // in the description so substring matches in either field hit.
  const faqItems: SearchItem[] = faqRows.map((q) => ({
    title: q.question,
    description: q.answer,
    href: '/student-society/faq',
    type: 'FAQ',
  }));

  // Visitors (Phase 7 — DB)
  const visitorItems: SearchItem[] = visitorRows.map((v) => ({
    title: v.name,
    description: [v.role, v.affiliation].filter(Boolean).join(' · ') || undefined,
    href: '/student-society/visitor',
    type: 'Visitor',
  }));

  // Research papers (Phase 7 — DB)
  const researchItems: SearchItem[] = researchPaperRows.map((r) => ({
    title: r.title,
    description: r.authors,
    href: '/research',
    type: 'Research',
  }));

  // Bus routes (Phase 7 — DB)
  const transportItems: SearchItem[] = busRouteRows.map((r) => ({
    title: r.routeName,
    description: `Bus ${r.busNumber} · Contact ${r.contact}`,
    href: '/transport-service',
    type: 'Transport',
  }));

  // Syllabi (Phase 7 — DB). Link to the PDF when uploaded, else the
  // list page where the "Download" button surfaces alongside others.
  const syllabusItems: SearchItem[] = syllabusRows.map((s) => ({
    title: s.title,
    description: s.summary,
    href: s.pdfUrl ?? '/student-society/syllabus',
    type: 'Syllabus',
  }));

  // Admission Notice (Phase 8a — DB). Only the latest active row is
  // surfaced; clicking goes to /admission/notice which renders the
  // same row.
  const admissionNoticeItems: SearchItem[] = admissionNoticeRows.map((n) => ({
    title: n.subject,
    description: [n.refNo, n.displayDate].filter(Boolean).join(' · '),
    href: '/admission/notice',
    type: 'AdmissionNotice',
  }));

  // Prospectus entries (Phase 8a — DB). All rows surface; they all
  // share the /admission/prospectus list page.
  const prospectusItems: SearchItem[] = prospectusEntryRows.map((p) => ({
    title: p.title,
    description: `${p.department} · ${p.level}`,
    href: '/admission/prospectus',
    type: 'Prospectus',
  }));

  // ProgramFeeStructure (Phase 8b — DB). Per-program fee entries.
  // introOverline carries the user-facing program label (e.g.
  // "B.Sc. in Electrical and Electronics Engineering (EEE)"). All entries link to
  // /admission/tuition-fees — programs render stacked there.
  const feeItems: SearchItem[] = feeStructureRows.map((f) => ({
    title: f.introOverline,
    description: 'Tuition fee structure — per-credit + total + waiver policies',
    href: '/admission/tuition-fees',
    type: 'Fees',
  }));

  // ─── Phase 8c ───
  const transferCreditsItems: SearchItem[] = transferCreditsRow
    ? [{
        title: 'Credit Transfer — Policy & Documents',
        description: 'Minimum grades, transfer limits, fee, required documents',
        href: '/admission/transfer-credits',
        type: 'TransferCredits',
      }]
    : [];

  // WaiverCategory — one entry per category. Description is the
  // first item's heading (admins searching for a specific waiver
  // type land on the right category).
  const waiverCategoryItems: SearchItem[] = waiverCategoryRows.map((c) => {
    const items = Array.isArray(c.items) ? c.items : [];
    const firstHeading = (() => {
      for (const it of items) {
        if (typeof it === 'object' && it !== null && 'heading' in it) {
          const h = (it as { heading?: unknown }).heading;
          if (typeof h === 'string' && h.length > 0) return h;
        }
      }
      return '';
    })();
    return {
      title: c.title,
      description: firstHeading
        ? `Includes: ${firstHeading}${items.length > 1 ? ` (+${items.length - 1} more)` : ''}`
        : 'Tuition fee waiver category',
      href: '/admission/waiver-scholarship',
      type: 'WaiverCategory',
    };
  });

  // Scholarship — one entry per merit slab. Description blends
  // credits descriptor + the base rate so searches like "15 credits"
  // or "Slab 3" both land here.
  const scholarshipItems: SearchItem[] = scholarshipRows.map((s) => ({
    title: `${s.name} — ${s.credits}`,
    description: `Base scholarship: ${s.base}`,
    href: '/admission/waiver-scholarship',
    type: 'Scholarship',
  }));

  return [
    ...staticPages,
    ...facultyItems,
    ...programItems,
    ...researchAreaItems,
    ...labItems,
    ...newsItems,
    ...eventItems,
    ...noticeItems,
    ...galleryItems,
    ...alumniItems,
    ...clubItems,
    ...faqItems,
    ...visitorItems,
    ...researchItems,
    ...transportItems,
    ...syllabusItems,
    ...admissionNoticeItems,
    ...prospectusItems,
    ...feeItems,
    ...transferCreditsItems,
    ...waiverCategoryItems,
    ...scholarshipItems,
  ];
});

// search() lives in '@/lib/search' so client bundles can use it
// without pulling the Prisma transitive dep from this file.
