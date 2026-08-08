import Image from 'next/image';
import { Briefcase, Building2, Quote as QuoteIcon } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getVisitors, getPageHero } from '@/lib/identity';

export const metadata = {
  title: 'Visitors — Department of Electrical and Electronics Engineering',
  description:
    'Distinguished visitors and guests of the Department of Mechanical Engineering, Sonargaon University.',
};

// Defensive Json read — quote column is Prisma `Json` (string[]).
function coerceParagraphs(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((p): p is string => typeof p === 'string' && p.length > 0);
}

export default async function VisitorsPage() {
  const [visitors, hero] = await Promise.all([
    getVisitors(),
    getPageHero('student-society-visitor'),
  ]);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Visitors'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Student Society'}
      image={hero?.heroImageUrl ?? '/assets/mission-vision-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : 'center 3%'}
      contentClassName="bg-gray-50 py-12 md:py-16"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center mb-10 md:mb-14">
          <p className="text-base md:text-lg text-gray-700 leading-[1.85]">
            Distinguished guests, industry leaders, and visiting academics who
            have shared their experience with the Department of Mechanical
            Engineering at Sonargaon University.
          </p>
        </div>

        {visitors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No visitors yet.</p>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {visitors.map((v, idx) => {
              const paragraphs = coerceParagraphs(v.quote);
              return (
                <article
                  key={v.id}
                  className="group relative grid grid-cols-1 md:grid-cols-[280px_1fr] bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all overflow-hidden"
                >
                  <span className="absolute left-0 top-0 h-full w-1 gradient-blue-magenta" />

                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 md:py-10 bg-gradient-to-br from-primary/5 via-white to-accent/5 border-b md:border-b-0 md:border-r border-gray-100">
                    <div className="relative">
                      <div className="absolute -inset-1.5 rounded-full gradient-blue-magenta opacity-90 blur-[1px]" />
                      <div className="relative h-32 w-32 md:h-36 md:w-36 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                        <Image
                          src={v.photoUrl}
                          alt={v.name}
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <h3 className="text-base md:text-lg font-bold text-primary text-center leading-snug mt-2">
                      {v.name}
                    </h3>

                    <div className="flex flex-col items-stretch gap-1.5 w-full max-w-[220px]">
                      {v.role && (
                        <span className="inline-flex items-center gap-2 rounded-md bg-white/80 px-3 py-1.5 text-[12px] md:text-[13px] text-gray-700 ring-1 ring-gray-100">
                          <Briefcase size={14} className="text-accent shrink-0" />
                          <span className="leading-tight">{v.role}</span>
                        </span>
                      )}
                      {v.affiliation && (
                        <span className="inline-flex items-center gap-2 rounded-md bg-white/80 px-3 py-1.5 text-[12px] md:text-[13px] text-gray-700 ring-1 ring-gray-100">
                          <Building2 size={14} className="text-primary shrink-0" />
                          <span className="leading-tight">{v.affiliation}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative flex flex-col justify-center px-6 py-8 md:px-12 md:py-10">
                    <QuoteIcon
                      className="absolute top-6 left-6 md:top-7 md:left-10 text-gray-200 pointer-events-none"
                      size={28}
                      strokeWidth={1.5}
                    />

                    <div className="relative space-y-4 pt-10 md:pt-8 text-[14.5px] md:text-[16px] text-gray-700 leading-[1.85]">
                      {paragraphs.map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>

                    <span className="absolute bottom-4 right-5 text-[11px] font-bold tracking-[0.25em] text-gray-300">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </PageShell>
  );
}
