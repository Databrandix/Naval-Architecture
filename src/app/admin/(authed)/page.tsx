import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Building2,
  Bus,
  BookText,
  CalendarDays,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Key,
  Library,
  Map as MapIcon,
  Megaphone,
  Microscope,
  Navigation,
  Newspaper,
  PanelBottom,
  Sparkles,
  University,
  UserCircle2,
  Users,
  Users2,
  UsersRound,
  Scroll,
  FileText,
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
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { RoleBadge } from '@/components/admin/Sidebar';

export const metadata = { title: 'Dashboard' };

export default async function DashboardHome() {
  const session = await getSession();
  if (!session?.user || !session?.session) redirect('/admin/login');

  const role = (session.user.role ?? 'admin') as 'super_admin' | 'admin';
  const isSuperAdmin = role === 'super_admin';

  const [
    programsCount, researchAreasCount, facultyCount,
    labCount, laboratoryLabCount,
    newsCount, eventCount, noticeCount, galleryCount,
    alumniCount, clubCount, faqCount, visitorCount,
    researchPaperCount, busRouteCount, syllabusCount,
    admissionNoticeCount, prospectusEntryCount,
    admissionRequirementsConfigured, programFeeStructureCount,
    admissionTransferCreditsConfigured, waiverScholarshipLandingConfigured,
    waiverCategoryCount, scholarshipCount,
    newSubmissionCount, totalSubmissionCount,
    contactPageContentConfigured, campusLocationCount,
    journeyCTAContentConfigured,
    legalPagesContentConfigured,
    adminUsersCount, previousSession,
  ] = await Promise.all([
    prisma.program.count(),
    prisma.researchArea.count(),
    prisma.faculty.count(),
    prisma.lab.count(),
    prisma.laboratoryLab.count(),
    prisma.news.count(),
    prisma.event.count(),
    prisma.notice.count(),
    prisma.galleryImage.count(),
    prisma.alumni.count(),
    prisma.club.count(),
    prisma.faq.count(),
    prisma.visitor.count(),
    prisma.researchPaper.count(),
    prisma.busRoute.count(),
    prisma.syllabus.count(),
    prisma.admissionNotice.count(),
    prisma.prospectusEntry.count(),
    prisma.admissionRequirements.count(),
    prisma.programFeeStructure.count(),
    prisma.admissionTransferCredits.count(),
    prisma.waiverScholarshipLanding.count(),
    prisma.waiverCategory.count(),
    prisma.scholarship.count(),
    prisma.contactSubmission.count({ where: { status: 'new' } }),
    prisma.contactSubmission.count(),
    prisma.contactPageContent.count(),
    prisma.campusLocation.count(),
    prisma.journeyCTAContent.count(),
    prisma.legalPagesContent.count(),
    isSuperAdmin ? prisma.user.count() : Promise.resolve(null),
    prisma.session.findFirst({
      where: {
        userId: session.user.id,
        createdAt: { lt: session.session.createdAt },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  const previousLoginAt = previousSession?.createdAt ?? null;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-display font-bold text-gray-900">
          Welcome back, {session.user.name}
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <RoleBadge role={role} />
          <span className="text-sm text-gray-500">{session.user.email}</span>
        </div>
      </header>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          At a glance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
          <StatCard label="Total Programs" value={programsCount} />
          <StatCard label="Total Research Areas" value={researchAreasCount} />
          <StatCard label="Total Faculty" value={facultyCount} />
          <StatCard label="Labs" value={labCount} />
          <StatCard label="Laboratories" value={laboratoryLabCount} />
          <StatCard label="News Articles" value={newsCount} />
          <StatCard label="Events" value={eventCount} />
          <StatCard label="Notices" value={noticeCount} />
          <StatCard label="Gallery Images" value={galleryCount} />
          <StatCard label="Alumni" value={alumniCount} />
          <StatCard label="Clubs" value={clubCount} />
          <StatCard label="FAQs" value={faqCount} />
          <StatCard label="Visitors" value={visitorCount} />
          <StatCard label="Research Papers" value={researchPaperCount} />
          <StatCard label="Bus Routes" value={busRouteCount} />
          <StatCard label="Syllabus" value={syllabusCount} />
          <StatCard label="Admission Notices" value={admissionNoticeCount} />
          <StatCard label="Prospectus Entries" value={prospectusEntryCount} />
          <StatCard label="Admission Requirements"
                    value={admissionRequirementsConfigured ? 'Configured' : 'Not configured'}
                    stringValue />
          <StatCard label="Program Fee Structures" value={programFeeStructureCount} />
          <StatCard label="Transfer Credits"
                    value={admissionTransferCreditsConfigured ? 'Configured' : 'Not configured'}
                    stringValue />
          <StatCard label="Waiver/Scholarship Landing"
                    value={waiverScholarshipLandingConfigured ? 'Configured' : 'Not configured'}
                    stringValue />
          <StatCard label="Waiver Categories" value={waiverCategoryCount} />
          <StatCard label="Scholarships (Slabs)" value={scholarshipCount} />
          <StatCard label="New Contact Submissions" value={newSubmissionCount} />
          <StatCard label="Total Contact Submissions" value={totalSubmissionCount} />
          <StatCard label="Contact Page Content"
                    value={contactPageContentConfigured ? 'Configured' : 'Not configured'}
                    stringValue />
          <StatCard label="Campus Locations" value={campusLocationCount} />
          <StatCard label="Journey CTA"
                    value={journeyCTAContentConfigured ? 'Configured' : 'Not configured'}
                    stringValue />
          <StatCard label="Legal Pages"
                    value={legalPagesContentConfigured ? 'Configured' : 'Not configured'}
                    stringValue />
          {isSuperAdmin && (
            <StatCard label="Total Admin Users" value={adminUsersCount!} />
          )}
          <StatCard
            label="Your last login"
            value={
              previousLoginAt
                ? new Date(previousLoginAt).toLocaleString()
                : 'First sign-in'
            }
            stringValue
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard
            href="/admin/department-identity"
            icon={Building2}
            title="Edit Department Identity"
            desc="Brand colors, logo, hero images, faculty name"
          />
          <ActionCard
            href="/admin/university-identity"
            icon={University}
            title="Edit University Identity"
            desc="Contact info, social URLs, footer logo, map"
          />
          <ActionCard
            href="/admin/programs"
            icon={GraduationCap}
            title="Manage Programs"
            desc="Add, edit, reorder, delete programs"
          />
          <ActionCard
            href="/admin/research-areas"
            icon={Microscope}
            title="Manage Research Areas"
            desc="Add, edit, reorder, delete research areas"
          />
          <ActionCard
            href="/admin/faculty"
            icon={UsersRound}
            title="Manage Faculty"
            desc="Faculty members, Dean & Head profiles, photos"
          />
          <ActionCard
            href="/admin/nav"
            icon={Navigation}
            title="Manage Navigation"
            desc="Top bar, quick access, main nav groups & items"
          />
          <ActionCard
            href="/admin/footer-links"
            icon={PanelBottom}
            title="Manage Footer Links"
            desc="Useful, Get in Touch, Quick & Legal columns"
          />
          <ActionCard
            href="/admin/about-overview"
            icon={Info}
            title="About — Overview"
            desc="Hero + paragraph content for /about/overview"
          />
          <ActionCard
            href="/admin/about-mission-vision"
            icon={Info}
            title="About — Mission & Vision"
            desc="Mission card + Vision card content"
          />
          <ActionCard
            href="/admin/about-club"
            icon={Info}
            title="About — SUEEC"
            desc="Hero, intro, stats, activities, network"
          />
          <ActionCard
            href="/admin/lab-facility"
            icon={FlaskConical}
            title="Lab Facility"
            desc="Slug-based lab list with gallery (also feeds homepage)"
          />
          <ActionCard
            href="/admin/laboratory-facility"
            icon={FlaskConical}
            title="Laboratory Facility"
            desc="Grid laboratories + landing features section"
          />
          <ActionCard
            href="/admin/news"
            icon={Newspaper}
            title="Manage News"
            desc="Articles for /news + homepage NewsSection"
          />
          <ActionCard
            href="/admin/events"
            icon={CalendarDays}
            title="Manage Events"
            desc="Events for student-society/events + homepage EventsSection"
          />
          <ActionCard
            href="/admin/notices"
            icon={Megaphone}
            title="Manage Notices"
            desc="Notice board entries with image/PDF attachments"
          />
          <ActionCard
            href="/admin/gallery"
            icon={ImageIcon}
            title="Manage Gallery"
            desc="Photo gallery — reorderable masonry"
          />
          <ActionCard
            href="/admin/alumni"
            icon={UserCircle2}
            title="Manage Alumni"
            desc="Alumni grid for /student-society/alumni"
          />
          <ActionCard
            href="/admin/clubs"
            icon={Users2}
            title="Manage Clubs"
            desc="Student clubs directory for /student-society/club-list"
          />
          <ActionCard
            href="/admin/faqs"
            icon={HelpCircle}
            title="Manage FAQs"
            desc="Q&A pairs — 5-category index"
          />
          <ActionCard
            href="/admin/visitors"
            icon={Sparkles}
            title="Manage Visitors"
            desc="Distinguished visitor quotes"
          />
          <ActionCard
            href="/admin/research-papers"
            icon={Library}
            title="Manage Research Papers"
            desc="Publications for /research"
          />
          <ActionCard
            href="/admin/syllabus"
            icon={BookText}
            title="Manage Syllabus"
            desc="Course-by-course syllabi with PDF download"
          />
          <ActionCard
            href="/admin/bus-routes"
            icon={Bus}
            title="Manage Bus Routes"
            desc="University bus service routes and timings"
          />
          <ActionCard
            href="/admin/transport-landing"
            icon={MapIcon}
            title="Transport Landing"
            desc="Page chrome — intro, banner, instructions"
          />
          <ActionCard
            href="/admin/admission-notices"
            icon={Scroll}
            title="Manage Admission Notices"
            desc="Formal Registrar letters for /admission/notice"
          />
          <ActionCard
            href="/admin/prospectus-entries"
            icon={FileText}
            title="Manage Prospectus"
            desc="Program prospectus PDFs for /admission/prospectus"
          />
          <ActionCard
            href="/admin/admission-requirements"
            icon={ClipboardList}
            title="Admission Requirements"
            desc="University-wide eligibility policy for /admission/requirements"
          />
          <ActionCard
            href="/admin/program-fee-structures"
            icon={CircleDollarSign}
            title="Program Fee Structures"
            desc="Per-program tuition fee tables for /admission/tuition-fees"
          />
          <ActionCard
            href="/admin/admission-transfer-credits"
            icon={ArrowLeftRight}
            title="Transfer Credits"
            desc="Credit transfer policy for /admission/transfer-credits"
          />
          <ActionCard
            href="/admin/waiver-scholarship-landing"
            icon={Layers}
            title="Waiver/Scholarship Landing"
            desc="Page chrome for /admission/waiver-scholarship"
          />
          <ActionCard
            href="/admin/waiver-categories"
            icon={HeartHandshake}
            title="Manage Waiver Categories"
            desc="Tuition fee waiver category cards (Part 01)"
          />
          <ActionCard
            href="/admin/scholarships"
            icon={Trophy}
            title="Manage Scholarships"
            desc="Merit scholarship slab cards (Part 02)"
          />
          <ActionCard
            href="/admin/contact-submissions"
            icon={Mail}
            title="Contact Submissions"
            desc="Form submissions from /contact — read, archive, delete"
          />
          <ActionCard
            href="/admin/contact-page"
            icon={Contact}
            title="Contact Page Content"
            desc="Hero, intro, section headings, quick contact cards for /contact"
          />
          <ActionCard
            href="/admin/campus-locations"
            icon={Building}
            title="Manage Campus Locations"
            desc="Campus address cards rendered on /contact"
          />
          <ActionCard
            href="/admin/journey-cta"
            icon={Rocket}
            title="Journey CTA"
            desc="Hero + heading + body + 2 CTA buttons above the footer"
          />
          <ActionCard
            href="/admin/legal-pages"
            icon={ShieldCheck}
            title="Legal Pages"
            desc="Privacy Policy + Terms & Conditions content (one form, two public pages)"
          />
          {isSuperAdmin && (
            <ActionCard
              href="/admin/users"
              icon={Users}
              title="Manage Admins"
              desc="Add, edit, delete admin users · super_admin only"
            />
          )}
          <ActionCard
            href="/admin/change-password"
            icon={Key}
            title="Change My Password"
            desc="Update your own login password"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  stringValue,
}: {
  label: string;
  value: number | string;
  stringValue?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div
        className={`mt-2 ${
          stringValue
            ? 'text-base font-medium text-gray-900'
            : 'text-3xl font-display font-bold text-primary'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof Building2;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-white rounded-lg border border-gray-200 p-5 hover:border-accent hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-accent/40"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors shrink-0">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-gray-900 leading-tight">
            {title}
          </div>
          <div className="text-xs text-gray-500 mt-1 leading-relaxed">
            {desc}
          </div>
        </div>
      </div>
    </Link>
  );
}
