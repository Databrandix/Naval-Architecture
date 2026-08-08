import { Calendar, FileText, Hash, Download, ExternalLink, Building2 } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getActiveAdmissionNotice, getPageHero } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { withAttachmentDownload } from '@/lib/pdf-helpers';

export const metadata = {
  title: 'Admission Notice — Department of Electrical and Electronics Engineering',
  description:
    'Official admission notice from Sonargaon University, Office of the Registrar.',
};

// Phase 8a — DB-driven. Renders the single latest isActive=true row
// (Decision B1 — no public archive route; admin toggles isActive to
// swap the visible notice). Empty state when nothing is active.
function coerceParagraphs(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((p): p is string => typeof p === 'string' && p.length > 0);
}

export default async function AdmissionNoticePage() {
  const [notice, hero] = await Promise.all([
    getActiveAdmissionNotice(),
    getPageHero('admission-notice'),
  ]);
  const heroImage = notice?.heroImageUrl ?? '/assets/admission-hero.webp';
  const bodyParagraphs = coerceParagraphs(notice?.bodyParagraphs);
  const ccList = coerceParagraphs(notice?.ccList);
  const dateLabel = notice?.displayDate ?? (notice?.publishedAt
    ? new Date(notice.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
    : '');

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Admission Notice'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Admission'}
      image={hero?.heroImageUrl ?? heroImage}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : 'top'}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {!notice ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 md:p-16 text-center">
            <p className="text-primary font-semibold text-base mb-1">
              No admission notice published right now
            </p>
            <p className="text-gray-500 text-sm">
              Please check back later for updates from the Office of the Registrar.
            </p>
          </div>
        ) : (
          <>
            {/* Notice document card */}
            <article className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              {/* Letterhead */}
              <header className="bg-gradient-to-r from-primary to-accent text-white px-6 md:px-10 py-7 md:py-8 text-center">
                <div className="inline-flex items-center gap-3 text-button-yellow mb-2">
                  <Building2 size={18} />
                  <span className="text-[11px] font-bold tracking-[0.3em] uppercase">
                    {notice.headerOverline}
                  </span>
                </div>
                <h2 className="font-display text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-wide">
                  Sonargaon University (SU)
                </h2>
                <div className="mt-3 inline-block px-4 py-1 rounded-full bg-white/15 border border-white/25">
                  <span className="text-[12px] font-bold tracking-[0.4em] uppercase text-button-yellow">
                    Notice
                  </span>
                </div>
              </header>

              {/* Meta row */}
              <div className="px-6 md:px-10 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Hash size={15} className="text-accent" />
                  <span className="font-semibold text-gray-700">Ref No:</span>
                  <span className="font-mono text-gray-800">{notice.refNo}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={15} className="text-accent" />
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="text-gray-800">{dateLabel}</span>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 md:px-10 py-8 md:py-10">
                <div className="mb-6">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-1">
                    Subject
                  </span>
                  <h3 className="font-display text-lg md:text-xl font-bold text-primary leading-snug">
                    {notice.subject}
                  </h3>
                </div>

                <div className="space-y-5 text-[15px] md:text-[16px] leading-[1.85] text-gray-800 text-justify">
                  {bodyParagraphs.map((html, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
                  ))}
                </div>

                {/* Signature */}
                <div className="mt-10 pt-6 border-t border-gray-100">
                  {notice.signatoryPreamble && (
                    <p className="text-sm text-gray-600 italic mb-6">
                      {notice.signatoryPreamble}
                    </p>
                  )}
                  <div>
                    <p className="font-display font-bold text-primary text-base">{notice.signatoryName}</p>
                    <p className="text-sm text-gray-600">{notice.signatoryDesignation}</p>
                  </div>
                </div>

                {/* Cc */}
                {ccList.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-3">
                      {notice.ccLabel}
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-[14px] text-gray-700">
                      {ccList.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </article>

            {/* Download CTA */}
            {notice.fileUrl && (
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <FileText size={22} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-primary text-base">
                      Official Notice Document
                    </h4>
                    <p className="text-sm text-gray-600">
                      View or download the original signed notice.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={notice.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-md shadow-md hover:shadow-lg hover:brightness-110 transition-all whitespace-nowrap"
                  >
                    <ExternalLink size={18} />
                    View Notice
                  </a>
                  <a
                    href={withAttachmentDownload(notice.fileUrl)}
                    download={notice.fileName ?? undefined}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold rounded-md shadow-sm transition-all whitespace-nowrap"
                  >
                    <Download size={18} />
                    Download
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </Container>
    </PageShell>
  );
}
