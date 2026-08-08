import { GraduationCap, CalendarDays, CreditCard, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getProgramBySlug, getProgramFeeStructureBySlug, getPageHero } from '@/lib/identity';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';

export const metadata = {
  title: 'B.Sc. in EEE — Program Overview',
  description: 'Program overview, specializations, and key information for B.Sc. in Electrical and Electronic Engineering at Sonargaon University.',
};

type OverviewStat = { iconName: string; label: string; value: string };

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

export default async function ProgramPage() {
  const [program, fee, hero] = await Promise.all([
    getProgramBySlug('bsc-eee'),
    getProgramFeeStructureBySlug('bsc-eee'),
    getPageHero('program-bsc-eee'),
  ]);

  if (!program) {
    return (
      <PageShell title="Program Not Found" overline="Programs">
        <Container>
          <p className="text-center text-gray-500 py-12">Program not found.</p>
        </Container>
      </PageShell>
    );
  }

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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
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
          <section className="mb-16 md:mb-20 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10">
              <h3 className="font-display text-xl md:text-2xl font-bold text-primary mb-6 text-center">
                Specializations
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
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

        {/* Ready to Apply */}
        <section className="max-w-3xl mx-auto">
          <div className="bg-primary rounded-2xl shadow-2xl p-8 md:p-12 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Apply?
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto text-[15px] leading-relaxed">
              Take the next step toward your career in Electrical and Electronic Engineering. Review the admission requirements or explore the tuition fee structure.
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
