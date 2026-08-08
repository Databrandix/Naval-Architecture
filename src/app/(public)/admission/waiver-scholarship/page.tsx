import { CheckCircle2, GraduationCap, ListChecks, Sparkles } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import {
  getScholarships,
  getWaiverCategories,
  getWaiverScholarshipLanding,
  getPageHero,
} from '@/lib/identity';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';
import { departmentMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Waiver & Scholarship',
    description:
      'Tuition waivers and merit scholarships at Sonargaon University — eligibility, percentages, and how they apply.',
  });
}

// Phase 20 — WaiverCategory.iconName resolves via DynamicLucideIcon
// against the full Lucide library; silent HelpCircle fallback on
// unknown names.

// ─── Json shape coercions (defensive) ────────────────────────

type CategoryItem = { heading: string; text: string };
type WaiverSummaryRow = { category: string; max: string; status: string };

function coerceCategoryItems(v: unknown): CategoryItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      heading: typeof r.heading === 'string' ? r.heading : '',
      text:    typeof r.text    === 'string' ? r.text    : '',
    }))
    .filter((i) => i.heading && i.text);
}

function coerceSummaryRows(v: unknown): WaiverSummaryRow[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      category: typeof r.category === 'string' ? r.category : '',
      max:      typeof r.max      === 'string' ? r.max      : '',
      status:   typeof r.status   === 'string' ? r.status   : 'Active',
    }))
    .filter((r) => r.category && r.max);
}

function coerceStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((s): s is string => typeof s === 'string' && s.length > 0);
}

export default async function WaiverScholarshipPage() {
  const [landing, categories, scholarships, hero] = await Promise.all([
    getWaiverScholarshipLanding(),
    getWaiverCategories(),
    getScholarships(),
    getPageHero('admission-waiver-scholarship'),
  ]);

  // Filter Inactive rows out of the public summary table — they
  // stay in the DB so the admin can flip them back to Active
  // without re-typing the content.
  const visibleSummaryRows = coerceSummaryRows(landing?.summaryRows).filter((r) => r.status === 'Active');
  const keyTakeaways       = coerceStringArray(landing?.keyTakeaways);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Waiver & Scholarship'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Admission'}
      image={hero?.heroImageUrl ?? '/assets/admission-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : 'top'}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {!landing ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 md:p-16 text-center">
            <p className="text-primary font-semibold text-base mb-1">
              Waiver &amp; scholarship policy not yet published
            </p>
            <p className="text-gray-500 text-sm">
              Please check back later for tuition waivers and merit scholarship details.
            </p>
          </div>
        ) : (
          <>
            {/* Intro */}
            <div className="max-w-3xl mx-auto text-center mb-14 md:mb-20">
              <p className="text-base md:text-lg text-gray-700 leading-[1.85]">
                {landing.intro}
              </p>
            </div>

            {/* ════════════════ WAIVERS ════════════════ */}
            <PartHeader iconName="Sparkles" kicker={landing.part1Kicker} title={landing.part1Heading} />

            {categories.length > 0 && (
              <div className="space-y-6 mb-12">
                {categories.map((cat) => {
                  const items = coerceCategoryItems(cat.items);
                  return (
                    <article
                      key={cat.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8"
                    >
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shadow-md shrink-0">
                          <DynamicLucideIcon name={cat.iconName} size={22} strokeWidth={1.75} />
                        </div>
                        <h3 className="font-display text-xl md:text-2xl font-bold text-primary leading-tight">
                          {cat.title}
                        </h3>
                      </div>

                      {items.length > 0 && (
                        <ul className="space-y-4">
                          {items.map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <CheckCircle2 size={20} className="text-accent shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-primary text-[15px] mb-1">
                                  {item.heading}
                                </h4>
                                <p className="text-[14px] text-gray-700 leading-relaxed">{item.text}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {cat.note && (
                        <div className="mt-5 p-4 bg-accent/5 border-l-4 border-accent rounded-r-lg">
                          <p className="text-[13px] text-gray-700 leading-relaxed">
                            <span className="font-bold text-accent">Note:</span> {cat.note}
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* Summary Table */}
            {visibleSummaryRows.length > 0 && (
              <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-16">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shadow-md shrink-0">
                    <ListChecks size={22} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl md:text-2xl font-bold text-primary leading-tight">
                      {landing.summaryHeading}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{landing.summarySubheading}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse">
                    <thead>
                      <tr className="border-b-2 border-primary/15 text-left">
                        <th className="px-3 py-3 text-[11px] font-bold tracking-wider uppercase text-gray-500 w-12">
                          SL
                        </th>
                        <th className="px-3 py-3 text-[11px] font-bold tracking-wider uppercase text-gray-500">
                          Waiver Category
                        </th>
                        <th className="px-3 py-3 text-[11px] font-bold tracking-wider uppercase text-gray-500">
                          Maximum Waiver
                        </th>
                        <th className="px-3 py-3 text-[11px] font-bold tracking-wider uppercase text-gray-500">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleSummaryRows.map((row, i) => (
                        <tr key={`${row.category}-${i}`} className="border-b border-gray-100 hover:bg-accent/5 transition-colors">
                          <td className="px-3 py-3 text-sm text-gray-500 font-mono">{i + 1}</td>
                          <td className="px-3 py-3 text-[14px] text-gray-800 font-semibold">{row.category}</td>
                          <td className="px-3 py-3 text-[14px] text-accent font-display font-bold">{row.max}</td>
                          <td className="px-3 py-3">
                            <span className="inline-block px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {landing.summaryFooterNote && (
                  <div className="mt-5 p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                    <p className="text-[13px] text-gray-700 leading-relaxed">
                      <span className="font-bold text-primary">Note:</span> {landing.summaryFooterNote}
                    </p>
                  </div>
                )}
              </article>
            )}

            {/* ════════════════ SCHOLARSHIPS ════════════════ */}
            <PartHeader iconName="Trophy" kicker={landing.part2Kicker} title={landing.part2Heading} />

            <p className="text-center text-gray-700 max-w-3xl mx-auto mb-10 leading-[1.85]">
              {landing.part2Intro}
            </p>

            {/* Slab cards */}
            {scholarships.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                {scholarships.map((slab) => (
                  <article
                    key={slab.id}
                    className={`relative rounded-2xl p-6 md:p-7 ${
                      slab.isHighlight
                        ? 'bg-primary text-white shadow-2xl ring-2 ring-button-yellow'
                        : 'bg-white text-gray-800 border border-gray-100 shadow-sm'
                    }`}
                  >
                    {slab.isHighlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-button-yellow text-primary text-[10px] font-bold tracking-[0.25em] uppercase px-3 py-1 rounded-full shadow-md">
                        Best Value
                      </span>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold ${
                          slab.isHighlight
                            ? 'bg-button-yellow/20 text-button-yellow border border-button-yellow/40'
                            : 'bg-gradient-to-br from-primary to-accent text-white'
                        }`}
                      >
                        <GraduationCap size={20} strokeWidth={1.75} />
                      </div>
                      <div>
                        <div
                          className={`text-[10px] font-bold tracking-[0.25em] uppercase ${
                            slab.isHighlight ? 'text-button-yellow' : 'text-accent'
                          }`}
                        >
                          {slab.name}
                        </div>
                        <h3 className={`font-display text-base font-bold leading-tight ${slab.isHighlight ? 'text-white' : 'text-primary'}`}>
                          {slab.credits}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <Row label="Base Scholarship" value={slab.base} highlight={slab.isHighlight} emphasis={false} />
                      <Row label="GPA 4.00"          value={slab.perfect} highlight={slab.isHighlight} emphasis />
                      <Row label="GPA 3.90 – 3.99"   value={slab.near}    highlight={slab.isHighlight} emphasis={false} />
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Key Takeaways */}
            {keyTakeaways.length > 0 && (
              <div className="relative bg-primary text-white rounded-xl shadow-lg overflow-hidden">
                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                  <div className="absolute top-0 right-0 w-72 h-72 bg-accent/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
                </div>

                <div className="relative p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <Sparkles size={20} className="text-button-yellow" />
                    <span className="text-button-yellow text-[11px] font-bold tracking-[0.3em] uppercase">
                      {landing.keyTakeawaysKicker}
                    </span>
                  </div>

                  <ul className="space-y-4">
                    {keyTakeaways.map((t, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 size={20} className="text-button-yellow shrink-0 mt-0.5" />
                        <p className="text-[15px] text-white/90 leading-[1.7]">{t}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </Container>
    </PageShell>
  );
}

function PartHeader({
  iconName,
  kicker,
  title,
}: {
  iconName: string;
  kicker: string;
  title: string;
}) {
  return (
    <div className="text-center mb-8 md:mb-10">
      <div className="inline-flex w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent text-white items-center justify-center shadow-md mb-3">
        <DynamicLucideIcon name={iconName} size={22} strokeWidth={1.75} />
      </div>
      <span className="block text-accent text-[11px] font-bold tracking-[0.3em] uppercase mb-1">
        {kicker}
      </span>
      <h2 className="font-display text-2xl md:text-3xl font-bold text-primary leading-tight">
        {title}
      </h2>
      <div className="mt-3 mx-auto h-1 w-16 bg-accent rounded-full" />
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  emphasis,
}: {
  label: string;
  value: string;
  highlight: boolean;
  emphasis: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        highlight ? 'border-b border-white/10' : 'border-b border-gray-100'
      } last:border-b-0`}
    >
      <span className={highlight ? 'text-white/75' : 'text-gray-600'}>{label}</span>
      <span
        className={`font-display font-bold ${
          emphasis
            ? highlight
              ? 'text-button-yellow text-xl'
              : 'text-accent text-xl'
            : highlight
              ? 'text-white'
              : 'text-primary'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
