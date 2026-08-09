import Image from 'next/image';
import { ArrowRight, Network } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getAboutDepartmentClub } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';
import JoinClubButton from './JoinClubButton';
import { departmentMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  /* The club names itself in its own row, so the title follows a rename
     without anyone editing this file. */
  const club = await getAboutDepartmentClub();

  return departmentMetadata({
    title: club?.heroTitle ?? 'Department Club',
    description: `${club?.heroTitle ?? 'The student club'} of the {department} — seminars, workshops and training, research and technical projects, and professional networks in ship design and marine engineering.`,
  });
}

// Phase 20 — activities[].iconName resolves via DynamicLucideIcon
// against the full Lucide library; silent HelpCircle fallback on
// unknown names.

type StatsRow = { value: string; label: string };
type ActivityRow = {
  iconName: string;
  imageUrl: string;
  imagePublicId: string | null;
  category: string;
  title: string;
  description: string;
};

function coerceStats(v: unknown): StatsRow[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      value: typeof r.value === 'string' ? r.value : '',
      label: typeof r.label === 'string' ? r.label : '',
    }))
    .filter((r) => r.value && r.label);
}

function coerceActivities(v: unknown): ActivityRow[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      iconName:      typeof r.iconName === 'string' ? r.iconName : '',
      imageUrl:      typeof r.imageUrl === 'string' ? r.imageUrl : '',
      imagePublicId: typeof r.imagePublicId === 'string' ? r.imagePublicId : null,
      category:      typeof r.category === 'string' ? r.category : '',
      title:         typeof r.title === 'string' ? r.title : '',
      description:   typeof r.description === 'string' ? r.description : '',
    }))
    .filter((r) => r.title);
}

export default async function AboutDepartmentClubPage() {
  const row = await getAboutDepartmentClub();
  if (!row) {
    throw new Error(
      'AboutDepartmentClub row missing (id="singleton"). Run `npm run db:seed`.',
    );
  }

  const stats = coerceStats(row.stats);
  const activities = coerceActivities(row.activities);

  return (
    <PageShell
      title={row.heroTitle}
      overline={row.heroOverline ?? undefined}
      image={row.heroImageUrl}
      imagePosition={`center ${row.heroImageVerticalPercent}%`}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {/* Intro section */}
        <section className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-16 md:mb-24">
          <div>
            {row.introOverline && (
              <span className="inline-block text-accent text-[11px] font-bold tracking-[0.3em] uppercase mb-3">
                {row.introOverline}
              </span>
            )}
            <h2
              className="font-display text-3xl md:text-4xl font-bold text-primary leading-tight mb-5"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.introHeading) }}
            />
            <p className="text-gray-700 leading-[1.85] mb-6">
              {row.introBody1}
            </p>
            <p className="text-gray-700 leading-[1.85]">
              {row.introBody2}
            </p>

            {stats.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200">
                {stats.map(({ value, label }) => (
                  /* The values are usually a number and occasionally a word. A
                     value that wraps used to push its own label out of line
                     with the others; the cells are equal-height columns now,
                     with the labels pinned to the bottom. */
                  <div key={label} className="flex h-full flex-col justify-between">
                    <div className="text-2xl md:text-3xl font-display font-bold text-primary leading-tight text-balance">
                      {value}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mt-1">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[360px] md:h-[440px]">
              <Image
                src={row.introImageUrl}
                alt={`${row.heroTitle} members`}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-button-yellow rounded-2xl -z-10 hidden lg:block" />
            <div className="absolute -top-5 -right-5 w-32 h-32 gradient-blue-magenta rounded-2xl -z-10 hidden lg:block" />
          </div>
        </section>

        {/* Activities section */}
        {activities.length > 0 && (
          <section className="mb-16 md:mb-20">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
              {row.activitiesOverline && (
                <span className="inline-block text-accent text-[11px] font-bold tracking-[0.3em] uppercase mb-2">
                  {row.activitiesOverline}
                </span>
              )}
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary leading-tight">
                {row.activitiesHeading}
              </h2>
              <div className="mt-3 mx-auto h-1 w-16 bg-accent rounded-full" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity) => {
                return (
                  <article
                    key={activity.title}
                    className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={activity.imageUrl}
                        alt={activity.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
                      <div className="absolute top-4 left-4 w-11 h-11 rounded-lg bg-white/95 backdrop-blur flex items-center justify-center shadow-md">
                        <DynamicLucideIcon name={activity.iconName} size={20} className="text-accent" strokeWidth={1.75} />
                      </div>
                      {activity.category && (
                        <span className="absolute bottom-4 left-4 text-[10px] font-bold tracking-[0.2em] uppercase text-white bg-accent/90 px-2.5 py-1 rounded-full">
                          {activity.category}
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-lg font-bold text-primary leading-snug mb-3">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {activity.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Network section */}
        <section className="relative bg-primary text-white rounded-2xl shadow-2xl">
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          </div>

          <div className="relative grid lg:grid-cols-[1fr_auto] gap-10 items-center p-5 md:p-12 lg:p-14">
            <div>
              {row.networkOverline && (
                <div className="inline-flex items-center gap-2 mb-3">
                  <Network size={20} className="text-button-yellow" />
                  <span className="text-button-yellow text-[11px] font-bold tracking-[0.3em] uppercase">
                    {row.networkOverline}
                  </span>
                </div>
              )}
              <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-5">
                {row.networkHeading}
              </h2>
              <div className="h-1 w-16 bg-button-yellow rounded-full mb-6" />
              <p className="text-white/90 leading-[1.85] text-[15px] md:text-[16px] max-w-2xl">
                {row.networkBody}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <JoinClubButton label={row.networkPrimaryCtaLabel} clubName={row.heroTitle} />
              {row.networkSecondaryCtaLabel && row.networkSecondaryCtaHref && (
                <a
                  href={row.networkSecondaryCtaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-white/40 text-white font-semibold rounded-md hover:bg-white hover:text-primary hover:-translate-y-0.5 transition-all whitespace-nowrap"
                >
                  {row.networkSecondaryCtaLabel}
                  <ArrowRight size={18} />
                </a>
              )}
            </div>
          </div>
        </section>
      </Container>
    </PageShell>
  );
}
