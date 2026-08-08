import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getProgramFeeStructures, getPageHero } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';

export const metadata = {
  title: 'Tuition Fees — Department of Electrical and Electronics Engineering',
  description:
    'Tuition fee structures by program at Sonargaon University Department of Electrical and Electronics Engineering.',
};

// Phase 20 — overview / shifts / policies all use DynamicLucideIcon
// against the full Lucide library; silent HelpCircle fallback on
// unknown names.

// ─── Json column shapes (defensive coerce) ───────────────────────

type OverviewStat = { iconName: string; label: string; value: string };
type FeeTier = { gpa: string; waiver?: string; totalCredits?: number; perCredit: number; total: number };
type FeeGroup = { background: string; tiers: FeeTier[] };
type FeeShift = {
  iconName: string;
  name: string;
  shiftLabel: string;
  description: string;
  groups: FeeGroup[];
};
type FeePolicy = { iconName: string; title: string; text: string };

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

function coerceTiers(v: unknown): FeeTier[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      gpa:          typeof r.gpa          === 'string' ? r.gpa          : '',
      waiver:       typeof r.waiver       === 'string' ? r.waiver       : undefined,
      totalCredits: typeof r.totalCredits === 'number' ? r.totalCredits : undefined,
      perCredit:    typeof r.perCredit    === 'number' ? r.perCredit    : 0,
      total:        typeof r.total        === 'number' ? r.total        : 0,
    }))
    .filter((t) => t.gpa);
}

function coerceGroups(v: unknown): FeeGroup[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      background: typeof r.background === 'string' ? r.background : '',
      tiers:      coerceTiers(r.tiers),
    }))
    .filter((g) => g.background);
}

function coerceShifts(v: unknown): FeeShift[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      iconName:    typeof r.iconName    === 'string' ? r.iconName    : '',
      name:        typeof r.name        === 'string' ? r.name        : '',
      shiftLabel:  typeof r.shiftLabel  === 'string' ? r.shiftLabel  : '',
      description: typeof r.description === 'string' ? r.description : '',
      groups:      coerceGroups(r.groups),
    }))
    .filter((s) => s.name);
}

function coercePolicies(v: unknown): FeePolicy[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      iconName: typeof r.iconName === 'string' ? r.iconName : '',
      title:    typeof r.title    === 'string' ? r.title    : '',
      text:     typeof r.text     === 'string' ? r.text     : '',
    }))
    .filter((p) => p.title && p.text);
}

const fmt = (n: number) => 'BDT ' + n.toLocaleString('en-BD');

export default async function TuitionFeesPage() {
  const [feeStructures, hero] = await Promise.all([
    getProgramFeeStructures(),
    getPageHero('admission-tuition-fees'),
  ]);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Tuition Fees'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Admission'}
      image={hero?.heroImageUrl ?? '/assets/admission-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : 'top'}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {feeStructures.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 md:p-16 text-center">
            <p className="text-primary font-semibold text-base mb-1">
              Tuition fee structures not yet published
            </p>
            <p className="text-gray-500 text-sm">
              Please check back later for the latest per-program fee tables.
            </p>
          </div>
        ) : (
          feeStructures.map((fs, programIdx) => {
            const overview = coerceOverview(fs.overviewStats);
            const shifts   = coerceShifts(fs.shifts);
            const policies = coercePolicies(fs.policies);
            return (
              <div key={fs.id} className={programIdx > 0 ? 'mt-20 pt-16 border-t border-gray-200' : ''}>
                {/* Intro */}
                <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
                  <span className="inline-block text-accent text-[11px] font-bold tracking-[0.3em] uppercase mb-2">
                    {fs.introOverline}
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-primary leading-tight mb-4">
                    {fs.introHeading}
                  </h2>
                  <p className="text-base text-gray-700 leading-[1.85]">
                    {fs.introBody}
                  </p>
                </div>

                {/* Program Overview */}
                {overview.length > 0 && (
                  <section className="mb-16 md:mb-20">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {overview.map((stat) => {
                        return (
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
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Shifts */}
                {shifts.length > 0 && (
                  <section className="mb-16 md:mb-20">
                    <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
                      <span className="inline-block text-accent text-[11px] font-bold tracking-[0.3em] uppercase mb-2">
                        By Admission Shift
                      </span>
                      <h2 className="font-display text-3xl md:text-4xl font-bold text-primary leading-tight">
                        Choose Your Shift
                      </h2>
                      <div className="mt-3 mx-auto h-1 w-16 bg-accent rounded-full" />
                    </div>

                    <div className="space-y-8">
                      {shifts.map((shift) => {
                        return (
                          <article
                            key={shift.name}
                            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
                          >
                            {/* Shift header */}
                            <div className="bg-gradient-to-r from-primary to-accent text-white px-6 md:px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                                  <DynamicLucideIcon name={shift.iconName} size={22} className="text-button-yellow" strokeWidth={1.75} />
                                </div>
                                <div>
                                  <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-button-yellow">
                                    {shift.shiftLabel}
                                  </div>
                                  <h3 className="font-display text-xl md:text-2xl font-bold leading-tight">
                                    {shift.name}
                                  </h3>
                                </div>
                              </div>
                              {shift.description && (
                                <p className="text-white/85 text-sm mt-3">{shift.description}</p>
                              )}
                            </div>

                            {/* Fee tables */}
                            <div className="p-6 md:p-8 space-y-8">
                              {shift.groups.map((group) => (
                                <div key={group.background}>
                                  <h4 className="text-[11px] font-bold tracking-[0.25em] uppercase text-accent mb-3">
                                    {group.background} Background
                                  </h4>
                                  <div className="overflow-x-auto -mx-2">
                                    <table className="w-full min-w-[480px] border-collapse">
                                      <thead>
                                        <tr className="border-b-2 border-primary/15 text-left">
                                          <th className="px-3 py-3 text-[11px] font-bold tracking-wider uppercase text-gray-500">
                                            GPA Range
                                          </th>
                                          <th className="px-3 py-3 text-[11px] font-bold tracking-wider uppercase text-gray-500 text-right">
                                            Waiver
                                          </th>
                                          <th className="px-3 py-3 text-[11px] font-bold tracking-wider uppercase text-gray-500 text-right">
                                            Credits
                                          </th>
                                          <th className="px-3 py-3 text-[11px] font-bold tracking-wider uppercase text-gray-500 text-right">
                                            Per Credit
                                          </th>
                                          <th className="px-3 py-3 text-[11px] font-bold tracking-wider uppercase text-gray-500 text-right">
                                            Total Program Cost
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {group.tiers.map((tier) => (
                                          <tr
                                            key={tier.gpa}
                                            className="border-b border-gray-100 hover:bg-accent/5 transition-colors"
                                          >
                                            <td className="px-3 py-4">
                                              <span className="inline-block px-3 py-1 bg-primary/8 text-primary text-sm font-semibold rounded">
                                                {tier.gpa}
                                              </span>
                                            </td>
                                            <td className="px-3 py-4 text-right font-display font-bold text-accent">
                                              {tier.waiver || '—'}
                                            </td>
                                            <td className="px-3 py-4 text-right font-display font-bold text-gray-800">
                                              {tier.totalCredits ?? '—'}
                                            </td>
                                            <td className="px-3 py-4 text-right font-display font-bold text-gray-800">
                                              {fmt(tier.perCredit)}
                                            </td>
                                            <td className="px-3 py-4 text-right font-display font-bold text-accent">
                                              {fmt(tier.total)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Important Policies */}
                {policies.length > 0 && (
                  <section>
                    <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
                      <span className="inline-block text-accent text-[11px] font-bold tracking-[0.3em] uppercase mb-2">
                        Read Before You Apply
                      </span>
                      <h2 className="font-display text-3xl md:text-4xl font-bold text-primary leading-tight">
                        Important Policies
                      </h2>
                      <div className="mt-3 mx-auto h-1 w-16 bg-accent rounded-full" />
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                      {policies.map((policy) => {
                        return (
                          <article
                            key={policy.title}
                            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6"
                          >
                            <div className="inline-flex w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent text-white items-center justify-center mb-4 shadow-md">
                              <DynamicLucideIcon name={policy.iconName} size={22} strokeWidth={1.75} />
                            </div>
                            <h3 className="font-display text-lg font-bold text-primary mb-2">{policy.title}</h3>
                            <p className="text-sm text-gray-700 leading-relaxed"
                               dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.text) }} />
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            );
          })
        )}
      </Container>
    </PageShell>
  );
}
