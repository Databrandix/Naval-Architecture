import { CheckCircle2, FileText, BookOpen, Receipt, GraduationCap } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getAdmissionTransferCredits, getPageHero } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { departmentMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Transfer Credits',
    description:
      'Credit transfer policy at Sonargaon University — minimum grades, transfer limits, fees, and the documents required to apply.',
  });
}

// Phase 8c — DB-driven singleton. Fixed section icons + headings
// ("Minimum Grade Policy", "Transfer Limits & Fees", "Required
// Documents") stay hardcoded as page chrome; only the dynamic
// content (grade bullets, limit values, documents, summary rows)
// comes from the singleton.

type HeadingBody = { heading: string; body: string };
type Document = { title: string; description: string };
type SummaryRow = { label: string; value: string };

function coerceHeadingBody(v: unknown): HeadingBody[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      heading: typeof r.heading === 'string' ? r.heading : '',
      body:    typeof r.body    === 'string' ? r.body    : '',
    }))
    .filter((r) => r.heading && r.body);
}

function coerceDocuments(v: unknown): Document[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      title:       typeof r.title       === 'string' ? r.title       : '',
      description: typeof r.description === 'string' ? r.description : '',
    }))
    .filter((d) => d.title && d.description);
}

function coerceSummaryRows(v: unknown): SummaryRow[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      label: typeof r.label === 'string' ? r.label : '',
      value: typeof r.value === 'string' ? r.value : '',
    }))
    .filter((r) => r.label && r.value);
}

export default async function TransferCreditsPage() {
  const [data, hero] = await Promise.all([
    getAdmissionTransferCredits(),
    getPageHero('admission-transfer-credits'),
  ]);

  const bullets       = coerceHeadingBody(data?.minimumGradeBullets);
  const documents     = coerceDocuments(data?.documents);
  const summaryRows   = coerceSummaryRows(data?.summaryRows);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Transfer Credits'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Admission'}
      image={hero?.heroImageUrl ?? '/assets/admission-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : 'top'}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {!data ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 md:p-16 text-center">
            <p className="text-primary font-semibold text-base mb-1">
              Transfer credits policy not yet published
            </p>
            <p className="text-gray-500 text-sm">
              Please check back later for the latest credit transfer information.
            </p>
          </div>
        ) : (
          <>
            {/* Intro */}
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
              <p className="text-base md:text-lg text-gray-700 leading-[1.85]">
                {data.intro}
              </p>
            </div>

            <div className="space-y-8">
              {/* 1. Minimum Grade Policy */}
              {bullets.length > 0 && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                  <SectionHeader Icon={GraduationCap} title="Minimum Grade Policy" />
                  <ul className="space-y-3 mt-5">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 size={20} className="text-accent shrink-0 mt-0.5" />
                        <p className="text-[15px] text-gray-800 leading-[1.7]">
                          <span className="font-semibold text-primary">{b.heading}:</span>{' '}
                          <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(b.body) }} />
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 2. Transfer Limits and Fees */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                <SectionHeader Icon={Receipt} title="Transfer Limits & Fees" />
                <div className="grid sm:grid-cols-2 gap-4 mt-5">
                  <div className="bg-gray-50 rounded-lg p-5 text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                      {data.limitMaxLabel}
                    </div>
                    <div className="font-display text-2xl font-bold text-primary">{data.limitMaxValue}</div>
                    <div className="text-sm text-gray-600 mt-1">{data.limitMaxSubtitle}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-5 text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                      {data.limitFeeLabel}
                    </div>
                    <div className="font-display text-2xl font-bold text-accent">{data.limitFeeValue}</div>
                    <div className="text-sm text-gray-600 mt-1">{data.limitFeeSubtitle}</div>
                  </div>
                </div>
              </section>

              {/* 3. Required Documents */}
              {documents.length > 0 && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                  <SectionHeader Icon={FileText} title="Required Documents" />
                  <p className="text-sm text-gray-600 mt-3 mb-5">
                    {data.documentsIntroText}
                  </p>
                  <div className="space-y-4">
                    {documents.map((doc, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-primary text-[15px] mb-1">
                            {doc.title}
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">{doc.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. Summary card */}
              {summaryRows.length > 0 && (
                <section className="relative bg-primary text-white rounded-xl shadow-lg overflow-hidden">
                  <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-accent/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
                  </div>

                  <div className="relative p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-5">
                      <BookOpen size={20} className="text-button-yellow" />
                      <span className="text-button-yellow text-[11px] font-bold tracking-[0.3em] uppercase">
                        {data.summaryKicker}
                      </span>
                    </div>
                    <h3 className="font-display text-xl md:text-2xl font-bold mb-5">
                      {data.summaryHeading}
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                      {summaryRows.map(({ label, value }) => (
                        <div key={label} className="border-l-2 border-button-yellow/50 pl-4">
                          <div className="text-[11px] font-semibold tracking-wider uppercase text-button-yellow mb-1">
                            {label}
                          </div>
                          <div className="text-base md:text-lg font-semibold">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
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
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shadow-md">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <h2 className="font-display text-xl md:text-2xl font-bold text-primary leading-tight">
        {title}
      </h2>
    </div>
  );
}
