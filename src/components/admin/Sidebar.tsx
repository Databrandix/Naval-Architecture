'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  University,
  BookOpen,
  GraduationCap,
  Microscope,
  Users,
  UsersRound,
  Key,
  Navigation,
  PanelBottom,
  Info,
  ChevronDown,
  FlaskConical,
  Newspaper,
  CalendarDays,
  Megaphone,
  Image as ImageIcon,
  FolderOpen,
  UserCircle2,
  Users2,
  HelpCircle,
  Sparkles,
  BookText,
  Bus,
  Map as MapIcon,
  Library,
  FileText,
  Scroll,
  ClipboardList,
  CircleDollarSign,
  ArrowLeftRight,
  Layers,
  HeartHandshake,
  Trophy,
  Mail,
  Contact,
  Building,
  Rocket,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useConfirm } from './ConfirmDialogProvider';

type SidebarUser = {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin';
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const PRIMARY_NAV: NavItem[] = [
  { href: '/admin',                     label: 'Dashboard',           icon: LayoutDashboard },
  { href: '/admin/department-identity', label: 'Department Identity', icon: Building2 },
  { href: '/admin/university-identity', label: 'University Identity', icon: University },
  { href: '/admin/programs',            label: 'Programs',            icon: GraduationCap },
  { href: '/admin/program-curriculum',  label: 'Course Curriculum',   icon: BookOpen },
  { href: '/admin/research-areas',      label: 'Research Areas',      icon: Microscope },
  { href: '/admin/faculty',             label: 'Faculty',             icon: UsersRound },
  { href: '/admin/nav',                 label: 'Navigation',          icon: Navigation },
  { href: '/admin/footer-links',        label: 'Footer Links',        icon: PanelBottom },
  { href: '/admin/journey-cta',         label: 'Journey CTA',         icon: Rocket },
  { href: '/admin/legal-pages',         label: 'Legal Pages',         icon: ShieldCheck },
  { href: '/admin/page-heroes',         label: 'Page Heroes',         icon: ImageIcon },
];

const ABOUT_PAGES_NAV: NavItem[] = [
  { href: '/admin/about-overview',        label: 'Overview',         icon: Info },
  { href: '/admin/about-mission-vision',  label: 'Mission & Vision', icon: Info },
  { href: '/admin/about-club',      label: 'Department Club',  icon: Info },
  { href: '/admin/department-layout',  label: 'Department Layout', icon: MapIcon },
];

const LAB_SYSTEMS_NAV: NavItem[] = [
  { href: '/admin/lab-facility',        label: 'Lab Facility',        icon: FlaskConical },
  { href: '/admin/laboratory-facility', label: 'Laboratory Facility', icon: FlaskConical },
];

const CONTENT_HUBS_NAV: NavItem[] = [
  { href: '/admin/news-landing', label: 'News Landing', icon: Newspaper },
  { href: '/admin/news',         label: 'News',         icon: Newspaper },
  { href: '/admin/events',       label: 'Events',       icon: CalendarDays },
  { href: '/admin/notices',      label: 'Notices',      icon: Megaphone },
  { href: '/admin/gallery',      label: 'Gallery',      icon: ImageIcon },
];

const NEWSLETTER_NAV: NavItem[] = [
  { href: '/admin/newsletter',             label: 'Page Content', icon: Info },
  { href: '/admin/newsletter-subscribers', label: 'Subscribers',  icon: Mail },
];

const STUDENT_SOCIETY_NAV: NavItem[] = [
  { href: '/admin/alumni',          label: 'Alumni',          icon: UserCircle2 },
  { href: '/admin/clubs',           label: 'Clubs',           icon: Users2 },
  { href: '/admin/faqs',            label: 'FAQs',            icon: HelpCircle },
  { href: '/admin/visitors',        label: 'Visitors',        icon: Sparkles },
  { href: '/admin/research-papers', label: 'Research Papers', icon: Library },
  { href: '/admin/syllabus',        label: 'Syllabus',        icon: BookText },
];

const CAMPUS_SERVICES_NAV: NavItem[] = [
  { href: '/admin/bus-routes',        label: 'Bus Routes',        icon: Bus },
  { href: '/admin/transport-landing', label: 'Transport Landing', icon: MapIcon },
];

const CONTACT_PAGE_NAV: NavItem[] = [
  { href: '/admin/contact-page',       label: 'Page Content',     icon: Info },
  { href: '/admin/campus-locations',   label: 'Campus Locations', icon: Building },
];

const ADMISSION_NAV: NavItem[] = [
  { href: '/admin/admission-notices',          label: 'Admission Notices',     icon: Scroll },
  { href: '/admin/prospectus-entries',         label: 'Prospectus',            icon: FileText },
  { href: '/admin/admission-requirements',     label: 'Admission Requirements',icon: ClipboardList },
  { href: '/admin/program-fee-structures',     label: 'Program Fee Structures',icon: CircleDollarSign },
  { href: '/admin/admission-transfer-credits', label: 'Transfer Credits',      icon: ArrowLeftRight },
  { href: '/admin/waiver-scholarship-landing', label: 'Waiver/Scholarship Landing', icon: Layers },
  { href: '/admin/waiver-categories',          label: 'Waiver Categories',     icon: HeartHandshake },
  { href: '/admin/scholarships',               label: 'Scholarships',          icon: Trophy },
];

export default function Sidebar({
  user,
  newSubmissionCount,
  logoUrl,
  logoAlt,
}: {
  user: SidebarUser;
  newSubmissionCount: number;
  logoUrl: string;
  logoAlt: string;
}) {
  const pathname = usePathname();
  const isSuperAdmin = user.role === 'super_admin';
  // Auto-open the About Pages group when the active route is inside it.
  const aboutActive = ABOUT_PAGES_NAV.some((n) => pathname?.startsWith(n.href));
  const [aboutOpen, setAboutOpen] = useState<boolean>(aboutActive);
  const labSystemsActive = LAB_SYSTEMS_NAV.some((n) => pathname?.startsWith(n.href));
  const [labSystemsOpen, setLabSystemsOpen] = useState<boolean>(labSystemsActive);
  const contentHubsActive = CONTENT_HUBS_NAV.some((n) => pathname?.startsWith(n.href));
  const [contentHubsOpen, setContentHubsOpen] = useState<boolean>(contentHubsActive);
  const studentSocietyActive = STUDENT_SOCIETY_NAV.some((n) => pathname?.startsWith(n.href));
  const [studentSocietyOpen, setStudentSocietyOpen] = useState<boolean>(studentSocietyActive);
  const campusServicesActive = CAMPUS_SERVICES_NAV.some((n) => pathname?.startsWith(n.href));
  const [campusServicesOpen, setCampusServicesOpen] = useState<boolean>(campusServicesActive);
  const admissionActive = ADMISSION_NAV.some((n) => pathname?.startsWith(n.href));
  const [admissionOpen, setAdmissionOpen] = useState<boolean>(admissionActive);
  const contactPageActive = CONTACT_PAGE_NAV.some((n) => pathname?.startsWith(n.href));
  const [contactPageOpen, setContactPageOpen] = useState<boolean>(contactPageActive);
  const newsletterActive = NEWSLETTER_NAV.some((n) => pathname?.startsWith(n.href));
  const [newsletterOpen, setNewsletterOpen] = useState<boolean>(newsletterActive);

  // Phase 11 — mobile/tablet drawer state. Persistent sidebar on
  // desktop (≥lg); off-canvas drawer with backdrop on smaller
  // viewports. Drawer state intentionally ignored at lg+ (the
  // sidebar is `lg:translate-x-0` regardless of `drawerOpen`).
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const confirm = useConfirm();

  // Close the drawer whenever the route changes — admin click-throughs
  // shouldn't require manual close on each navigation.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Body scroll-lock while the drawer is open. Mirror the Phase 3
  // public Navbar pattern. Only effective at <lg viewports since the
  // drawer is the only thing that visibly opens there.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  // Escape closes the drawer too — keyboard parity with the close
  // button + backdrop click.
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  async function handleLogout() {
    // Use the provider's pending-aware callback path so the modal
    // stays open showing "Logging out…" while the sign-out fetch is
    // in flight, instead of vanishing the instant the user clicks.
    await confirm({
      title: 'Log out?',
      message: 'Are you sure you want to log out of the admin panel?',
      confirmLabel: 'Log out',
      cancelLabel: 'Cancel',
      pendingLabel: 'Logging out…',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/auth/sign-out', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          });
          if (res.ok) {
            window.location.href = '/admin/login';
            return;
          }
          toast.error('Sign-out failed — try the /admin/logout link');
        } catch {
          toast.error('Network error during sign-out');
        }
      },
    });
  }

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-accent/10 text-accent' : 'text-gray-700 hover:bg-gray-50'
    }`;

  // Use prefix-with-slash so sibling routes that share a string prefix
  // (e.g. /admin/news vs /admin/news-landing) don't both light up.
  const isActive = (href: string) =>
    href === '/admin'
      ? pathname === '/admin'
      : pathname === href || (pathname?.startsWith(href + '/') ?? false);

  return (
    <>
      {/* Hamburger — visible only at <lg. Sits at z-[70] so it stays
          above both backdrop (z-55) and drawer (z-60). Toggles the
          drawer; the icon flips to X while open so the user has a
          consistent close affordance in the same visual slot. */}
      <button
        type="button"
        onClick={() => setDrawerOpen((v) => !v)}
        aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={drawerOpen}
        className="lg:hidden fixed top-3 left-3 z-[70] p-2 bg-white border border-gray-200 rounded-lg text-primary shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        {drawerOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Backdrop — Phase 3 public Navbar pattern. Click closes. */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={() => setDrawerOpen(false)}
        className={`lg:hidden fixed inset-0 bg-black/40 z-[55] transition-opacity duration-200 ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:w-64 lg:z-auto lg:transition-none`}
      >
      <div className="px-6 pt-14 pb-5 border-b border-gray-100 lg:pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={logoAlt}
          className="h-10 w-auto mb-3 object-contain"
        />
        <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">
          Dept. of
        </div>
        <div className="text-base font-display font-bold text-primary mt-1 leading-tight">
          Electrical and Electronics Engineering
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={linkClass(!!isActive(href))}>
            <Icon size={16} />
            {label}
          </Link>
        ))}

        {/* About Pages — collapsible group */}
        <button
          type="button"
          onClick={() => setAboutOpen((v) => !v)}
          aria-expanded={aboutOpen}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            aboutActive ? 'text-accent' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-3">
            <Info size={16} />
            About Pages
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform ${aboutOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {aboutOpen && (
          <div className="pl-6 space-y-1">
            {ABOUT_PAGES_NAV.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(!!isActive(href))}>
                <span className="text-[10px] leading-none">●</span>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Lab Systems — collapsible group */}
        <button
          type="button"
          onClick={() => setLabSystemsOpen((v) => !v)}
          aria-expanded={labSystemsOpen}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            labSystemsActive ? 'text-accent' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-3">
            <FlaskConical size={16} />
            Lab Systems
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform ${labSystemsOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {labSystemsOpen && (
          <div className="pl-6 space-y-1">
            {LAB_SYSTEMS_NAV.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(!!isActive(href))}>
                <span className="text-[10px] leading-none">●</span>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Content Hubs — collapsible group (Phase 6) */}
        <button
          type="button"
          onClick={() => setContentHubsOpen((v) => !v)}
          aria-expanded={contentHubsOpen}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            contentHubsActive ? 'text-accent' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-3">
            <FolderOpen size={16} />
            Content Hubs
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform ${contentHubsOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {contentHubsOpen && (
          <div className="pl-6 space-y-1">
            {CONTENT_HUBS_NAV.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(!!isActive(href))}>
                <span className="text-[10px] leading-none">●</span>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Student Society — collapsible group (Phase 7) */}
        <button
          type="button"
          onClick={() => setStudentSocietyOpen((v) => !v)}
          aria-expanded={studentSocietyOpen}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            studentSocietyActive ? 'text-accent' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-3">
            <Users2 size={16} />
            Student Society
          </span>
          <ChevronDown size={14} className={`transition-transform ${studentSocietyOpen ? 'rotate-180' : ''}`} />
        </button>
        {studentSocietyOpen && (
          <div className="pl-6 space-y-1">
            {STUDENT_SOCIETY_NAV.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(!!isActive(href))}>
                <span className="text-[10px] leading-none">●</span>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Campus Services — collapsible group (Phase 7) */}
        <button
          type="button"
          onClick={() => setCampusServicesOpen((v) => !v)}
          aria-expanded={campusServicesOpen}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            campusServicesActive ? 'text-accent' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-3">
            <Bus size={16} />
            Campus Services
          </span>
          <ChevronDown size={14} className={`transition-transform ${campusServicesOpen ? 'rotate-180' : ''}`} />
        </button>
        {campusServicesOpen && (
          <div className="pl-6 space-y-1">
            {CAMPUS_SERVICES_NAV.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(!!isActive(href))}>
                <span className="text-[10px] leading-none">●</span>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Admission — collapsible group (Phase 8a, will host 8b + 8c) */}
        <button
          type="button"
          onClick={() => setAdmissionOpen((v) => !v)}
          aria-expanded={admissionOpen}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            admissionActive ? 'text-accent' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-3">
            <Scroll size={16} />
            Admission
          </span>
          <ChevronDown size={14} className={`transition-transform ${admissionOpen ? 'rotate-180' : ''}`} />
        </button>
        {admissionOpen && (
          <div className="pl-6 space-y-1">
            {ADMISSION_NAV.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(!!isActive(href))}>
                <span className="text-[10px] leading-none">●</span>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Contact Page — Phase 10 collapsible group (page content +
            campus location cards). Clustered with Contact Submissions
            below, but a separate group so the unread badge can stay
            top-level (collapsed groups hide the badge). */}
        <button
          type="button"
          onClick={() => setContactPageOpen((v) => !v)}
          aria-expanded={contactPageOpen}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            contactPageActive ? 'text-accent' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-3">
            <Contact size={16} />
            Contact Page
          </span>
          <ChevronDown size={14} className={`transition-transform ${contactPageOpen ? 'rotate-180' : ''}`} />
        </button>
        {contactPageOpen && (
          <div className="pl-6 space-y-1">
            {CONTACT_PAGE_NAV.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(!!isActive(href))}>
                <span className="text-[10px] leading-none">●</span>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Contact Submissions — Phase 9 top-level (operational; the
            badge surfaces unread submissions without forcing a click). */}
        <Link
          href="/admin/contact-submissions"
          className={`${linkClass(!!pathname?.startsWith('/admin/contact-submissions'))} justify-between`}
        >
          <span className="flex items-center gap-3">
            <Mail size={16} />
            Contact Submissions
          </span>
          {newSubmissionCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-accent text-white">
              {newSubmissionCount}
            </span>
          )}
        </Link>

        {/* SUEEC join applications — operational inbox, mirrors
            the Contact Submissions placement (no badge wired yet). */}
        <Link
          href="/admin/club-applications"
          className={linkClass(!!pathname?.startsWith('/admin/club-applications'))}
        >
          <Wrench size={16} />
          SUEEC Applications
        </Link>

        {/* Newsletter — page CMS + subscriber list. Grouped together so
            content edits and the audience view live side by side. */}
        <button
          type="button"
          onClick={() => setNewsletterOpen((v) => !v)}
          aria-expanded={newsletterOpen}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            newsletterActive ? 'text-accent' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-3">
            <Mail size={16} />
            Newsletter
          </span>
          <ChevronDown size={14} className={`transition-transform ${newsletterOpen ? 'rotate-180' : ''}`} />
        </button>
        {newsletterOpen && (
          <div className="pl-6 space-y-1">
            {NEWSLETTER_NAV.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(!!isActive(href))}>
                <span className="text-[10px] leading-none">●</span>
                {label}
              </Link>
            ))}
          </div>
        )}

        {isSuperAdmin && (
          <Link
            href="/admin/users"
            className={linkClass(!!pathname?.startsWith('/admin/users'))}
          >
            <Users size={16} />
            Manage Admins
          </Link>
        )}

        <div className="border-t border-gray-100 mt-4 pt-4">
          <Link
            href="/admin/change-password"
            className={linkClass(pathname === '/admin/change-password')}
          >
            <Key size={16} />
            Change Password
          </Link>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-gray-100 space-y-3">
        <div className="text-sm">
          <div className="font-medium text-gray-900 truncate">{user.name}</div>
          <div className="text-xs text-gray-500 truncate">{user.email}</div>
          <div className="mt-1">
            <RoleBadge role={user.role} />
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
      </aside>
    </>
  );
}

export function RoleBadge({ role }: { role: 'super_admin' | 'admin' }) {
  return (
    <span
      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
        role === 'super_admin' ? 'bg-accent text-white' : 'bg-primary text-white'
      }`}
    >
      {role === 'super_admin' ? 'Super Admin' : 'Admin'}
    </span>
  );
}
