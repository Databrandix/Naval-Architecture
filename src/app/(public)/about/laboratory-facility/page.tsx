import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getLaboratoryFacilityLanding, getLaboratoryLabs } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';
import { departmentMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Laboratory Facility',
    description:
      'Hands-on laboratories of the {department} at Sonargaon University — machining and fabrication, structures and materials, fluid mechanics and hydraulics, fluid machinery, marine engines and heat transfer.',
  });
}

// Phase 20 — lab.iconName + feature.iconName both resolve via
// DynamicLucideIcon against the full Lucide library.

type FeatureRow = { iconName: string; title: string; description: string };

function coerceFeatures(v: unknown): FeatureRow[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      iconName:    typeof r.iconName === 'string' ? r.iconName : '',
      title:       typeof r.title === 'string' ? r.title : '',
      description: typeof r.description === 'string' ? r.description : '',
    }))
    .filter((r) => r.title);
}

export default async function LaboratoryFacilityPage() {
  const [landing, labs] = await Promise.all([
    getLaboratoryFacilityLanding(),
    getLaboratoryLabs(),
  ]);
  if (!landing) {
    throw new Error(
      'LaboratoryFacilityLanding row missing (id="singleton"). Run `npm run db:seed`.',
    );
  }

  const features = coerceFeatures(landing.features);

  return (
    <PageShell
      title={landing.heroTitle}
      overline={landing.heroOverline ?? undefined}
      image={landing.heroImageUrl}
      imagePosition={`center ${landing.heroImageVerticalPercent}%`}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {/* Intro */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <p
            className="text-base md:text-lg text-gray-700 leading-[1.85]"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(landing.introBody) }}
          />
        </div>

        {/* Lab cards grid */}
        {labs.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16 md:mb-20">
            {labs.map((lab, idx) => {
              const num = String(idx + 1).padStart(2, '0');
              return (
                <article
                  key={lab.id}
                  className="group relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-accent/30 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Top color band */}
                  <div className="h-1 gradient-blue-magenta" />

                  <div className="p-6 md:p-7">
                    {/* Icon + number */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md text-white group-hover:scale-110 transition-transform">
                        <DynamicLucideIcon name={lab.iconName} size={22} strokeWidth={1.75} />
                      </div>
                      <span className="font-display text-3xl font-bold text-primary/15 leading-none">
                        {num}
                      </span>
                    </div>

                    <h3 className="font-display text-lg md:text-[19px] font-bold text-primary mb-3 leading-snug">
                      {lab.title}
                    </h3>

                    <p className="text-sm text-gray-600 leading-relaxed mb-5">{lab.description}</p>

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-semibold text-primary text-[10px] uppercase tracking-[0.15em]">
                          {lab.keyLabel}
                        </span>
                        <p className="text-gray-700 mt-1 leading-relaxed">{lab.keyItems}</p>
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <span className="font-semibold text-accent text-[10px] uppercase tracking-[0.15em]">
                          Learning Focus
                        </span>
                        <p className="text-gray-700 mt-1 leading-relaxed">{lab.focus}</p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Why Our Labs Matter */}
        {features.length > 0 && (
          <div className="relative bg-primary text-white rounded-2xl shadow-2xl">
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-72 h-72 bg-accent/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
            </div>

            <div className="relative p-5 md:p-12 lg:p-14">
              <div className="text-center mb-10">
                {landing.featuresOverline && (
                  <span className="inline-block text-button-yellow text-[11px] font-bold tracking-[0.3em] uppercase mb-2">
                    {landing.featuresOverline}
                  </span>
                )}
                <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight">
                  {landing.featuresHeading}
                </h2>
                <div className="mt-3 mx-auto h-1 w-16 bg-button-yellow rounded-full" />
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                {features.map((feature) => {
                  return (
                    <div key={feature.title} className="text-center">
                      <div className="inline-flex w-16 h-16 rounded-2xl bg-button-yellow/15 border border-button-yellow/40 items-center justify-center shadow-lg mb-4">
                        <DynamicLucideIcon name={feature.iconName} size={28} className="text-button-yellow" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-display text-lg font-bold mb-2">{feature.title}</h3>
                      <p className="text-white/80 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Container>
    </PageShell>
  );
}
