// quickLinks — Navbar mobile drawer no longer reads this (Phase 3:
// derives from main_nav 'Admission' group); kept here for the
// homepage QuickLinksSection content card, which Phase 5+ will
// migrate to its own DB table along with the rest of the homepage
// content sections.
export const quickLinks: { name: string; href: string; external?: boolean; disabled?: boolean }[] = [
  { name: 'Admission Requirements', href: '/admission/requirements' },
  { name: 'Tuition Fees', href: '/admission/tuition-fees' },
  { name: 'Transfer Credits', href: '/admission/transfer-credits' },
  { name: 'Waiver & Scholarship', href: '/admission/waiver-scholarship' },
  { name: 'ERP', href: 'http://sue.su.edu.bd:5081/sonargaon_erp/', external: true },
  { name: 'Admission Notice', href: '/admission/notice' },
  { name: 'Library', href: 'http://lib.su.edu.bd', external: true },
];

export const campusServices: { name: string; description: string; image: string; href?: string }[] = [
  { name: 'Transport Service', description: 'Free buses on 10 routes covering Dhaka & nearby areas.', image: '/assets/transport/dsc01671.webp', href: '/transport-service' },
  { name: 'Scholarships & Waivers', description: 'Merit grants up to 100% + need-based aid calculator.', image: '/assets/scholarship-cover.webp', href: '/admission/waiver-scholarship' },
  { name: 'Student Life', description: '50+ clubs, festivals, sports & volunteering.', image: '/assets/student-life-cover.webp', href: '/student-society/club-list' }
];
