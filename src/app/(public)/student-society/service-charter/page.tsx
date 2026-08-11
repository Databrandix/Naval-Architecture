import type { ReactNode } from 'react';
import { ArrowRight, Download, FileText, UserRound } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getServiceCharter, getPageHero } from '@/lib/identity';
import { departmentMetadata } from '@/lib/page-metadata';
import documents from '@/generated/documents.json';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Service Charter',
    description:
      'How to get things done at the {department} — course offering, registration, add and drop, results, transcripts, and who to contact for each.',
  });
}

/**
 * The department's service charter.
 *
 * A student arrives here with one errand: register for a semester, drop a
 * course, get a transcript. So each service is its own card with the steps in
 * order and the person responsible underneath, rather than a wide table that
 * has to be read across on a phone.
 */

/**
 * Turn the addresses inside a line into things you can act on.
 *
 * The charter is a list of errands, and half of each errand is a way to reach
 * someone: a portal to log into, an office to email, a number to ring. Those
 * arrived from the department's spreadsheet as plain text, so a student on a
 * phone was reading a number off the screen and typing it back in by hand.
 *
 * Only these three shapes are matched, and only where they are already
 * written out in full — nothing is inferred, and a line with none of them is
 * returned exactly as it came.
 */
const LINK =
  /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(\+?880[\s-]?\d{4}-\d{6}|\b01\d{9}\b)/g;

const LINK_CLASS =
  'text-primary decoration-primary/40 hover:decoration-primary underline underline-offset-2 transition-colors break-words';

function linkify(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(LINK)) {
    const [value, url, email, phone] = match;
    const at = match.index ?? 0;
    if (at > cursor) parts.push(text.slice(cursor, at));

    if (url) {
      parts.push(
        <a key={at} href={url} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {value}
        </a>,
      );
    } else if (email) {
      parts.push(
        <a key={at} href={`mailto:${email}`} className={LINK_CLASS}>
          {value}
        </a>,
      );
    } else {
      /* tel: wants the digits only; the page keeps the spacing as written. */
      parts.push(
        <a key={at} href={`tel:${phone.replace(/[\s-]/g, '')}`} className={LINK_CLASS}>
          {value}
        </a>,
      );
    }

    cursor = at + value.length;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

type Step = string;

function stepsOf(value: unknown): Step[] {
  if (!Array.isArray(value)) return [];
  return value.filter((step): step is string => typeof step === 'string' && step.trim() !== '');
}

/** The source packs name, role, phone, email and room into one cell. */
function responsibleLines(responsible: string): string[] {
  return responsible
    .split(/\s*(?=Contact No:|e-mail:|Room no:)/i)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function ServiceCharterPage() {
  const [services, hero] = await Promise.all([getServiceCharter(), getPageHero('service-charter')]);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Service Charter'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Student Society'}
      image={hero?.heroImageUrl ?? '/assets/site-school-1024x576.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-16"
    >
      <Container>
        <p className="mx-auto mb-10 max-w-3xl text-center text-[15px] leading-[1.85] text-gray-700 md:mb-14">
          What to do, in what order, and who to ask — for the things students need from the
          department office through the semester.
        </p>

        {services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-gray-500">No services listed yet.</p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-[1400px] gap-5 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => {
              const steps = stepsOf(service.steps);

              return (
                <article
                  key={service.id}
                  className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg md:p-7"
                >
                  <header className="mb-4 flex items-start gap-3">
                    <span className="bg-primary text-white font-display inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[14px] font-bold">
                      {service.serial}
                    </span>
                    <h2 className="text-primary mt-1 text-[16px] leading-snug font-bold">
                      {service.title}
                    </h2>
                  </header>

                  <ol className="mb-5 flex flex-1 flex-col gap-3">
                    {steps.map((step, index) => (
                      <li key={step} className="flex gap-3 text-[14px] leading-[1.7] text-gray-700">
                        {steps.length > 1 && (
                          <span className="bg-accent/10 text-accent mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                            {index + 1}
                          </span>
                        )}
                        {steps.length === 1 && (
                          <ArrowRight size={15} className="text-accent mt-1 shrink-0" aria-hidden />
                        )}
                        <span className="min-w-0 break-words">{linkify(step)}</span>
                      </li>
                    ))}
                  </ol>

                  {service.responsible && (
                    <footer className="mt-auto flex gap-2.5 border-t border-gray-100 pt-4">
                      <UserRound size={15} className="mt-0.5 shrink-0 text-gray-400" aria-hidden />
                      <div className="min-w-0 text-[13px] leading-[1.65] text-gray-600">
                        {responsibleLines(service.responsible).map((line, index) => (
                          <span
                            key={line}
                            className={index === 0 ? 'block font-semibold text-gray-800' : 'block'}
                          >
                            {linkify(line)}
                          </span>
                        ))}
                      </div>
                    </footer>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* The whole charter as one document. Built from these same rows by
            scripts/build-service-charter-pdf.mjs, so it cannot say anything
            the cards above do not — but it is only rebuilt when that script
            is run, so a service edited in the admin panel reaches the
            download on the next build, not immediately. */}
        {services.length > 0 && (
          <div className="mx-auto mt-12 max-w-[1400px] md:mt-16">
            <div className="border-primary/15 from-primary/5 flex flex-col items-center gap-5 rounded-2xl border bg-gradient-to-r via-white to-white p-6 text-center shadow-sm sm:flex-row sm:p-8 sm:text-left">
              <span className="from-primary to-accent inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md">
                <FileText size={26} strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-primary font-display text-[17px] font-bold md:text-lg">
                  Service Charter as a PDF
                </p>
                <p className="mt-0.5 text-[14.5px] text-gray-600">
                  All {services.length} services, their steps and the person responsible for each —
                  in one document you can keep or print.
                </p>
              </div>
              <a
                href={documents.serviceCharter.url}
                download={documents.serviceCharter.fileName}
                className="bg-primary hover:bg-primary/90 inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-7 py-3.5 font-semibold text-white shadow-md transition-colors"
              >
                <Download size={18} aria-hidden />
                Download PDF
              </a>
            </div>
          </div>
        )}
      </Container>
    </PageShell>
  );
}
