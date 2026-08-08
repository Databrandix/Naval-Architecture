import { ArrowRight, UserRound } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getServiceCharter, getPageHero } from '@/lib/identity';
import { departmentMetadata } from '@/lib/page-metadata';

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
          <div className="mx-auto grid max-w-6xl gap-5 md:gap-6 lg:grid-cols-2">
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
                        <span className="min-w-0 break-words">{step}</span>
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
                            {line}
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
      </Container>
    </PageShell>
  );
}
