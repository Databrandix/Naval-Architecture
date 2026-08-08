import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';
import NewsletterSubscribeForm from './NewsletterSubscribeForm';
import { getNewsletterPage } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';

export const metadata = {
  title: 'Newsletter — Department of Electrical and Electronics Engineering',
  description:
    'Subscribe to the Department of Mechanical Engineering newsletter for monthly updates on events, research, admissions, and student achievements.',
};

type AdvantageRow = {
  iconName: string;
  title: string;
  description: string;
};

function coerceAdvantages(value: unknown): AdvantageRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (v): v is AdvantageRow =>
        !!v &&
        typeof v === 'object' &&
        typeof (v as AdvantageRow).iconName === 'string' &&
        typeof (v as AdvantageRow).title === 'string' &&
        typeof (v as AdvantageRow).description === 'string',
    );
}

export default async function NewsletterPage() {
  const row = await getNewsletterPage();
  if (!row) {
    throw new Error(
      'NewsletterPage row missing (id="singleton"). Run `npm run db:seed`.',
    );
  }

  const advantages = coerceAdvantages(row.advantages);

  return (
    <PageShell
      title={row.heroTitle}
      subtitle={row.heroSubtitle ?? undefined}
      overline={row.heroOverline ?? undefined}
      image={row.heroImageUrl}
      imagePosition={`center ${row.heroImageVerticalPercent}%`}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {/* Intro */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <p
            className="text-base md:text-lg text-gray-700 leading-[1.85]"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.introBody) }}
          />
        </div>

        {/* Advantages */}
        {advantages.length > 0 && (
          <div className="mb-12 md:mb-16">
            <div className="text-center mb-8 md:mb-10">
              {row.advantagesOverline && (
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="h-px w-8 bg-accent" />
                  <span className="text-accent text-[11px] font-bold tracking-[0.3em] uppercase">
                    {row.advantagesOverline}
                  </span>
                  <span className="h-px w-8 bg-accent" />
                </div>
              )}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-primary leading-tight">
                {row.advantagesHeading}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {advantages.map((adv, idx) => (
                <div
                  key={`${adv.title}-${idx}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 md:p-7 flex flex-col gap-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <DynamicLucideIcon name={adv.iconName} size={22} />
                  </div>
                  <h3 className="text-lg font-display font-bold text-primary leading-tight">
                    {adv.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {adv.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscribe card */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-premium p-8 md:p-10">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-display font-bold text-primary mb-2">
              {row.ctaHeading}
            </h2>
            {row.ctaBody && (
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                {row.ctaBody}
              </p>
            )}
          </div>

          <NewsletterSubscribeForm
            buttonLabel={row.ctaButtonLabel}
            emailPlaceholder={row.emailPlaceholder}
          />

          {row.privacyNote && (
            <p className="mt-4 text-xs text-gray-500 text-center leading-relaxed">
              {row.privacyNote}
            </p>
          )}
        </div>
      </Container>
    </PageShell>
  );
}
