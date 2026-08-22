import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Mail, IdCard, Building2, MapPin, Plus } from 'lucide-react';
import type { Faculty } from '@prisma/client';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import {
  getFacultyBySlug,
  getFacultySlugs,
  getDepartmentIdentity,
  getUniversityIdentity,
  getPageHero,
} from '@/lib/identity';
import { type SectionContent, type SectionItem } from '@/lib/faculty-sections';

// Pre-render every current slug at build time; Next.js defaults to
// dynamicParams=true so admin-added slugs after deploy render
// on-demand. Combined with revalidatePath('/faculty-member/[slug]',
// 'page') from CP2.2, edits propagate to the pre-rendered pages
// too.
export async function generateStaticParams() {
  const slugs = await getFacultySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [member, dept] = await Promise.all([
    getFacultyBySlug(slug),
    getDepartmentIdentity(),
  ]);
  if (!member) return { title: 'Faculty member not found' };
  return {
    title: `${member.name} — ${dept.name}`,
    description: `${member.name}, ${member.designation}, ${dept.name}, Sonargaon University.`,
  };
}

type SectionKey =
  | 'academicQualification'
  | 'trainingExperience'
  | 'teachingArea'
  | 'publications'
  | 'research'
  | 'awards'
  | 'membership'
  | 'previousEmployment';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'academicQualification', label: 'Academic Qualification' },
  { key: 'trainingExperience',    label: 'Training Experience' },
  { key: 'teachingArea',          label: 'Teaching Experiences' },
  { key: 'publications',          label: 'Publication' },
  { key: 'research',              label: 'Research' },
  { key: 'awards',                label: 'Award & Scholarship' },
  { key: 'membership',            label: 'Membership' },
  { key: 'previousEmployment',    label: 'Previous Employment' },
];

const PLACEHOLDER = (
  <p className="text-gray-400 italic text-sm">Information will be updated soon.</p>
);

function renderItem(item: SectionItem, key: number) {
  const text = typeof item === 'string' ? item : item.text;
  const url = typeof item === 'string' ? undefined : item.url;
  return (
    <li key={key}>
      <span>{text}</span>
      {url && url.trim().length > 0 && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-accent hover:text-primary underline break-all text-[13px] mt-0.5 transition-colors"
        >
          {url}
        </a>
      )}
    </li>
  );
}

function renderSection(value: SectionContent | null | undefined) {
  if (value == null) return PLACEHOLDER;

  if (typeof value === 'string') {
    return value.trim().length > 0 ? <p>{value}</p> : PLACEHOLDER;
  }

  if (!Array.isArray(value) || value.length === 0) return PLACEHOLDER;

  const first = value[0];
  const isGrouped =
    typeof first === 'object' && first !== null && 'items' in first;

  if (!isGrouped) {
    return (
      <ul className="list-disc list-outside pl-5 space-y-2">
        {(value as SectionItem[]).map((item, i) => renderItem(item, i))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      {(value as { heading: string; items: SectionItem[] }[]).map((group, gi) => (
        <div key={gi}>
          <h4 className="font-semibold text-primary mb-3 text-[15px]">{group.heading}</h4>
          <ul className="list-disc list-outside pl-5 space-y-2">
            {group.items.map((item, i) => renderItem(item, i))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default async function FacultyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // J3 — office address wired from UniversityIdentity and department
  // name from DepartmentIdentity, both via the existing identity
  // helpers (React.cache dedups across the page).
  const [member, dept, uni, hero] = await Promise.all([
    getFacultyBySlug(slug),
    getDepartmentIdentity(),
    getUniversityIdentity(),
    getPageHero('faculty-member-detail'),
  ]);
  if (!member) notFound();

  const personalInfo = member.personalInfo as
    | Array<{ label: string; value: string }>
    | null;

  return (
    <PageShell
      title={member.name}
      overline={hero?.heroOverline ?? 'Faculty'}
      image={hero?.heroImageUrl}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {/* Profile header card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-10 overflow-hidden max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[auto_1fr_280px] gap-8 lg:gap-10 p-6 md:p-8 lg:p-10 items-start">
            {/* Photo */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative w-44 h-56 md:w-48 md:h-60 border-2 border-accent overflow-hidden bg-gray-50 flex items-center justify-center">
                {member.photoUrl ? (
                  <Image
                    src={member.photoUrl}
                    alt={member.name}
                    fill
                    sizes="(min-width: 768px) 192px, 176px"
                    className="object-cover"
                    style={{ objectPosition: '50% 12%' }}
                  />
                ) : (
                  <span className="font-display text-4xl font-bold text-accent/40">
                    {member.name
                      .replace(/[A-Z]\.\s|Md\.\s|Mrs?\.\s|Prof\.\s|Dr\.\s/g, '')
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w) => w.charAt(0).toUpperCase())
                      .join('')}
                  </span>
                )}
              </div>
            </div>

            {/* Name, designation, dept */}
            <div className="text-center lg:text-left">
              {member.badge && (
                <span className="inline-block text-accent text-[11px] font-bold tracking-[0.25em] uppercase mb-2">
                  {member.badge}
                </span>
              )}
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary leading-tight mb-3">
                {member.name}
              </h2>
              <div className="space-y-1 text-gray-700">
                <p className="font-semibold">{member.designation}</p>
                {member.secondaryTitle && (
                  <p className="text-sm text-gray-600">{member.secondaryTitle}</p>
                )}
                {/* Everyone here belongs to this department — except the
                    Dean, who heads the whole faculty and holds his chair in
                    another department entirely. Printing the department name
                    against him was simply wrong, so his line names the
                    faculty he actually leads. */}
                <p className="text-sm text-gray-600 flex items-center justify-center lg:justify-start gap-2 pt-1">
                  <Building2 size={14} className="text-accent shrink-0" />
                  {member.isDean ? dept.facultyName : dept.name}
                </p>
              </div>
            </div>

            {/* Contact panel */}
            <div className="lg:border-l lg:border-gray-200 lg:pl-8 space-y-4 text-sm min-w-[240px]">
              <ContactRow label="Address" Icon={MapPin}>
                <span className="text-gray-700 whitespace-pre-line">
                  {member.officeAddress ?? uni.address}
                </span>
              </ContactRow>

              {member.email && (
                <ContactRow label="Email" Icon={Mail}>
                  <a
                    href={`mailto:${member.email}`}
                    className="text-primary hover:text-accent break-all transition-colors"
                  >
                    {member.email}
                  </a>
                </ContactRow>
              )}

              {/* A teacher's personal mobile is not published. It is still
                  recorded against the faculty member for the department's own
                  use; the public profile offers the email address instead. */}

              {member.suId && (
                <ContactRow label="SU ID" Icon={IdCard}>
                  <span className="text-gray-700 font-mono text-xs">{member.suId}</span>
                </ContactRow>
              )}
            </div>
          </div>
        </div>

        {/* Accordion sections */}
        <div className="space-y-3 max-w-5xl mx-auto">
          {/* Personal Information — structured label/value list */}
          <AccordionPanel label="Personal Information">
            {personalInfo && personalInfo.length > 0 ? (
              <dl className="grid sm:grid-cols-[180px_1fr] gap-x-6 gap-y-3 text-[14px]">
                {personalInfo.map(({ label, value }) => (
                  <div key={label} className="contents">
                    <dt className="font-semibold text-primary">{label}</dt>
                    <dd className="text-gray-700">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              PLACEHOLDER
            )}
          </AccordionPanel>

          {SECTIONS.map(({ key, label }) => (
            <AccordionPanel key={key} label={label}>
              {renderSection((member as Faculty)[key] as SectionContent | null)}
            </AccordionPanel>
          ))}
        </div>
      </Container>
    </PageShell>
  );
}

function AccordionPanel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  // The `name` attribute groups every panel on this page so opening
  // one auto-closes the others — chair's "only one open at a time"
  // requirement. Native HTML5 accordion behaviour (Chrome 120+ /
  // Firefox 119+ / Safari 17+), no client JS / state needed.
  return (
    <details
      name="faculty-detail-sections"
      className="group bg-white rounded-md border border-gray-200 overflow-hidden"
    >
      <summary className="flex items-center justify-between gap-3 px-5 py-3.5 bg-primary text-white cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-primary/95 transition-colors">
        <span className="font-semibold text-[15px]">{label}</span>
        <Plus
          size={18}
          className="group-open:rotate-45 transition-transform duration-200 shrink-0"
        />
      </summary>
      <div className="px-5 py-5 text-[14px] leading-relaxed text-gray-700">{children}</div>
    </details>
  );
}

function ContactRow({
  label,
  Icon,
  children,
}: {
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-accent mb-1">
        <Icon size={12} />
        {label}
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}
