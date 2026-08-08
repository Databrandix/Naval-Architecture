import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Wrench,
} from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getAdmissionRequirements, getPageHero } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';

export const metadata = {
  title: 'Admission Requirements — Department of Electrical and Electronics Engineering',
  description:
    'Admission requirements at Sonargaon University — Undergraduate and Diploma (Engineering) entry criteria.',
};

// Phase 8b — DB-driven singleton. Fixed section labels ("Undergraduate
// Programs", "For Diploma (Engineering) Students", "Eligibility",
// "Combined GPA Criteria", "Quick Reference", "Minimum Requirements")
// stay hardcoded as part of the page chrome — they're page layout,
// not editorial content.

function coerceStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((s): s is string => typeof s === 'string' && s.length > 0);
}

function coerceQuickCriteria(v: unknown): { label: string; value: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      label: typeof r.label === 'string' ? r.label : '',
      value: typeof r.value === 'string' ? r.value : '',
    }))
    .filter((r) => r.label && r.value);
}

export default async function AdmissionRequirementsPage() {
  const [reqs, hero] = await Promise.all([
    getAdmissionRequirements(),
    getPageHero('admission-requirements'),
  ]);
  const ugReqs = coerceStringArray(reqs?.undergraduateRequirements);
  const notes  = coerceStringArray(reqs?.additionalNotes);
  const dipReqs = coerceStringArray(reqs?.diplomaRequirements);
  const quickCrit = coerceQuickCriteria(reqs?.diplomaQuickCriteria);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Admission Requirements'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Admission'}
      image={hero?.heroImageUrl ?? '/assets/admission-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : 'top'}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {!reqs ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 md:p-16 text-center">
            <p className="text-primary font-semibold text-base mb-1">
              Admission requirements not yet published
            </p>
            <p className="text-gray-500 text-sm">
              Please check back later for the latest eligibility criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Intro */}
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
              <p className="text-base md:text-lg text-gray-700 leading-[1.85]">
                {reqs.intro}
              </p>
            </div>

            {/* ───── Undergraduate Programs ───── */}
            {ugReqs.length > 0 && (
              <section className="mb-16 md:mb-20">
                <SectionHeader Icon={GraduationCap} title="Undergraduate Programs" />

                <div className="space-y-4">
                  {ugReqs.map((req, i) => (
                    <article
                      key={i}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-5 p-5 md:p-6">
                        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-display font-bold shadow-md">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <p className="text-[15px] text-gray-800 leading-[1.7] pt-1.5">{req}</p>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Additional notes */}
                {notes.length > 0 && (
                  <div className="mt-8 space-y-4">
                    {notes.map((note, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-5 bg-accent/5 border-l-4 border-accent rounded-r-lg"
                      >
                        <AlertCircle size={20} className="text-accent shrink-0 mt-0.5" />
                        <p className="text-[14px] text-gray-700 leading-relaxed">{note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ───── Diploma (Engineering) Students ───── */}
            {(dipReqs.length > 0 || reqs.combinedGpaBody || quickCrit.length > 0) && (
              <section>
                <SectionHeader Icon={Wrench} title="For Diploma (Engineering) Students" />

                <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                  {/* Main eligibility */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-7">
                    {dipReqs.length > 0 && (
                      <>
                        <h3 className="font-display text-lg font-bold text-primary mb-4">
                          Eligibility
                        </h3>
                        <ul className="space-y-3">
                          {dipReqs.map((req, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <CheckCircle2 size={20} className="text-accent shrink-0 mt-0.5" />
                              <p className="text-[15px] text-gray-800 leading-[1.7]">{req}</p>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {reqs.combinedGpaBody && (
                      <div className={`${dipReqs.length > 0 ? 'mt-6 pt-6 border-t border-gray-100' : ''}`}>
                        <h4 className="text-[13px] font-bold uppercase tracking-wider text-accent mb-3">
                          Combined GPA Criteria
                        </h4>
                        <p className="text-[15px] text-gray-700 leading-[1.7]"
                           dangerouslySetInnerHTML={{ __html: sanitizeHtml(reqs.combinedGpaBody) }} />
                      </div>
                    )}
                  </div>

                  {/* Quick criteria card */}
                  {quickCrit.length > 0 && (
                    <div className="relative bg-primary text-white rounded-xl shadow-lg overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                      <div className="relative p-6 md:p-7">
                        <span className="inline-block text-button-yellow text-[10px] font-bold tracking-[0.3em] uppercase mb-2">
                          Quick Reference
                        </span>
                        <h3 className="font-display text-lg font-bold mb-5">Minimum Requirements</h3>
                        <div className="space-y-4">
                          {quickCrit.map(({ label, value }) => (
                            <div key={label}>
                              <div className="text-[11px] font-semibold tracking-wider uppercase text-button-yellow">
                                {label}
                              </div>
                              <div className="text-base font-semibold mt-0.5">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </Container>
    </PageShell>
  );
}

function SectionHeader({
  Icon,
  title,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  title: string;
}) {
  return (
    <div className="text-center mb-8 md:mb-10">
      <div className="inline-flex w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent text-white items-center justify-center shadow-md mb-3">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-bold text-primary leading-tight">
        {title}
      </h2>
      <div className="mt-3 mx-auto h-1 w-16 bg-accent rounded-full" />
    </div>
  );
}
