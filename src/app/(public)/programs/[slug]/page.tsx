import { GraduationCap, CalendarDays, CreditCard, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { notFound } from 'next/navigation';
import {
  getProgramBySlug,
  getProgramFeeStructureBySlug,
  getPageHero,
  getPrograms,
  getDepartmentIdentity,
  getProgramCurriculumBySlug,
} from '@/lib/identity';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';
import CurriculumSection, {
  type CreditRow,
  type Semester,
} from '@/components/programs/CurriculumSection';

/**
 * One page per program, addressed by its degree code lowercased
 * (`BSc-NAME` → /programs/bsc-name).
 *
 * This used to be a fixed `/programs/bsc-eee` route with the title written
 * into the file, which meant a department with two programs could only ever
 * show one of them, and starting a new department site meant renaming a
 * directory.
 */
export function generateStaticParams() {
  return getPrograms().then((programs) =>
    programs.map((program) => ({ slug: program.degreeCode.toLowerCase() })),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [program, dept] = await Promise.all([getProgramBySlug(slug), getDepartmentIdentity()]);
  if (!program) return { title: 'Program Not Found' };

  return {
    title: `${program.programName} — Program Overview`,
    description: `Program overview, specializations, and key information for ${program.programName} at Sonargaon University, ${dept.name}.`,
  };
}

type OverviewStat = { iconName: string; label: string; value: string };

/* ProgramCurriculum.semesters and .creditRows are Json columns, so what comes
   back is whatever was written to them. Both are coerced rather than cast: a
   curriculum imported from a spreadsheet with a renamed column should drop a
   field, not crash the page. */

function asRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null);
}

const asText = (v: unknown): string => (typeof v === 'string' ? v : '');
const asNumber = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const asOptionalText = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);

function coerceSemesters(value: unknown): Semester[] {
  return asRecords(value)
    .map((s) => ({
      name: asText(s.name),
      courses: asRecords(s.courses)
        .map((c) => ({
          code: asText(c.code),
          title: asText(c.title),
          type: asText(c.type),
          credits: asNumber(c.credits),
          prerequisite: asOptionalText(c.prerequisite),
          remarks: asOptionalText(c.remarks),
        }))
        .filter((c) => c.code && c.title),
    }))
    .filter((s) => s.name && s.courses.length > 0);
}

function coerceCreditRows(value: unknown): CreditRow[] {
  return asRecords(value)
    .map((r) => ({
      semester: asText(r.semester),
      total: asNumber(r.total),
      core: asNumber(r.core),
      elective: asNumber(r.elective),
      lab: asNumber(r.lab),
      project: asNumber(r.project),
      cumulative: asNumber(r.cumulative),
    }))
    .filter((r) => r.semester);
}

function coerceOverview(v: unknown): OverviewStat[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      iconName: typeof r.iconName === 'string' ? r.iconName : '',
      label:    typeof r.label    === 'string' ? r.label    : '',
      value:    typeof r.value    === 'string' ? r.value    : '',
    }))
    .filter((s) => s.label && s.value);
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [program, fee, hero, curriculum, dept] = await Promise.all([
    getProgramBySlug(slug),
    getProgramFeeStructureBySlug(slug),
    getPageHero(`program-${slug}`),
    getProgramCurriculumBySlug(slug),
    getDepartmentIdentity(),
  ]);

  /* A 404 rather than a "not found" page body: an address that names a
     program this department does not offer is a wrong address, and telling
     search engines otherwise puts an empty page in the index. */
  if (!program) notFound();

  const nameParts = program.programName.split(' — ');
  const overline = nameParts.length > 1 ? nameParts[0] : undefined;
  const heading = nameParts.length > 1 ? nameParts.slice(1).join(' — ') : program.programName;
  const stats = coerceOverview(fee?.overviewStats);

  return (
    <PageShell
      title={hero?.heroTitle ?? heading}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? overline ?? 'Programs'}
      image={hero?.heroImageUrl ?? '/assets/site-school-1024x576.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {/* Intro */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-primary leading-tight mb-4">
            {heading}
          </h2>
          {program.description && (
            <p className="text-base text-gray-700 leading-[1.85]">
              {program.description}
            </p>
          )}
        </div>

        {/* At a Glance */}
        {stats.length > 0 && (
          <section className="mb-16 md:mb-20">
            <h3 className="text-center font-display text-xl md:text-2xl font-bold text-primary mb-8">
              At a Glance
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {stats.map((stat) => (
                <div
                  key={`${stat.label}-${stat.value}`}
                  className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <div className="inline-flex w-11 h-11 rounded-lg bg-gradient-to-br from-primary to-accent text-white items-center justify-center mb-3 shadow-md">
                    <DynamicLucideIcon name={stat.iconName} size={20} strokeWidth={1.75} />
                  </div>
                  <div className="text-[10px] font-bold tracking-wider uppercase text-gray-500 mb-1">
                    {stat.label}
                  </div>
                  <div className="font-display text-lg md:text-xl font-bold text-primary leading-tight">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Specializations */}
        {Array.isArray(program.specializations) && program.specializations.length > 0 && (
          <section className="mb-16 md:mb-20 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10">
              <h3 className="font-display text-xl md:text-2xl font-bold text-primary mb-6 text-center">
                Specializations
              </h3>
              {/* Two then four, not three: a three-column grid leaves the
                  fourth specialization stranded on a row of its own. */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {program.specializations.map((spec) => (
                  <div
                    key={spec}
                    className="flex items-center gap-3 px-4 py-3 bg-primary/5 rounded-lg"
                  >
                    <CheckCircle2 size={20} className="shrink-0 text-accent" />
                    <span className="text-[15px] font-semibold text-primary">{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Course structure, credit distribution, and the same as a PDF */}
        {curriculum && (
          <CurriculumSection
            semesters={coerceSemesters(curriculum.semesters)}
            creditRows={coerceCreditRows(curriculum.creditRows)}
            pdfUrl={curriculum.pdfUrl}
            pdfFileName={curriculum.pdfFileName}
          />
        )}

        {/* Ready to Apply */}
        <section className="max-w-3xl mx-auto">
          <div className="bg-primary rounded-2xl shadow-2xl p-8 md:p-12 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Apply?
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto text-[15px] leading-relaxed">
              Take the next step toward your career in {dept.name.replace(/^Department of\s+/i, '')}.
              Review the admission requirements or explore the tuition fee structure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/admission/requirements"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-button-yellow hover:bg-button-yellow/90 text-primary font-bold rounded-lg transition-colors shadow-md"
              >
                <ClipboardIcon size={18} />
                View Requirements
              </a>
              <a
                href="/admission/tuition-fees"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-white/30 hover:bg-white/10 text-white font-bold rounded-lg transition-colors"
              >
                <CreditCard size={18} />
                Tuition Fees
              </a>
            </div>
          </div>
        </section>
      </Container>
    </PageShell>
  );
}

function ClipboardIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}
