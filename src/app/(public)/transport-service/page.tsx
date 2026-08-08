import {
  Phone,
  Clock,
  ArrowDownRight,
  ArrowUpLeft,
  Bus,
  Info,
  Sparkles,
} from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getBusRoutes, getTransportLanding, getPageHero } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';

export const metadata = {
  title: 'Transport Service — Sonargaon University',
  description:
    "Sonargaon University's free bus service routes, timings, and contact numbers covering major areas across Dhaka.",
};

// Phase 20 — instructions[].iconName resolves via DynamicLucideIcon
// against the full Lucide library; silent HelpCircle fallback on
// unknown names.

type InstructionRow = { iconName: string; title: string; description: string };

function coerceInstructions(v: unknown): InstructionRow[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      iconName:    typeof r.iconName === 'string' ? r.iconName : '',
      title:       typeof r.title === 'string' ? r.title : '',
      description: typeof r.description === 'string' ? r.description : '',
    }))
    .filter((r) => r.title && r.description);
}

export default async function TransportServicePage() {
  const [routes, landing, hero] = await Promise.all([
    getBusRoutes(),
    getTransportLanding(),
    getPageHero('transport-service'),
  ]);

  const instructions = coerceInstructions(landing?.instructions);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Transport Service'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Campus Services'}
      image={hero?.heroImageUrl ?? '/assets/transport/dsc01671.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-16"
    >
      <Container>
        {/* Intro */}
        {landing?.introBody && (
          <div className="mx-auto max-w-3xl text-center mb-10 md:mb-14">
            <p className="text-[15px] md:text-[16px] leading-[1.85] text-gray-700">
              {landing.introBody}
            </p>
          </div>
        )}

        {/* Free service banner */}
        {landing && (
          <div className="mx-auto max-w-5xl mb-10 md:mb-14 rounded-2xl bg-gradient-to-r from-primary to-accent text-white p-6 md:p-8 shadow-lg">
            <div className="flex items-start gap-4">
              <Sparkles size={28} className="shrink-0 text-button-yellow mt-1" />
              <div>
                <h3 className="font-display text-xl md:text-2xl font-bold mb-2">
                  {landing.bannerHeading}
                </h3>
                {/* HTML allowed — preserves the inline yellow-strong pattern
                    seeded from the pre-Phase-7 hardcoded markup. */}
                <p
                  className="text-white/90 text-[14px] md:text-[15px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(landing.bannerBody) }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bus Routes & Timings */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary">
              Bus Routes &amp; Timings
            </h2>
            <div className="mt-3 mx-auto h-1 w-16 bg-accent rounded-full" />
          </div>

          {routes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-500">No bus routes yet.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {routes.map((route) => (
                <article
                  key={route.id}
                  className="flex flex-col rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="bg-primary text-white px-5 py-4 flex items-start gap-3">
                    <Bus size={20} className="shrink-0 mt-0.5 text-button-yellow" />
                    <h3 className="text-[16px] font-bold leading-snug">
                      {route.routeName}
                    </h3>
                  </div>

                  <div className="p-5 flex flex-col gap-4 flex-1">
                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Bus Number
                      </span>
                      <span className="inline-block rounded-md bg-gray-100 px-2.5 py-1 text-[13px] font-semibold text-gray-800">
                        {route.busNumber}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Contact
                      </span>
                      <a
                        href={`tel:${route.contact.replace(/-/g, '')}`}
                        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent hover:text-primary transition-colors"
                      >
                        <Phone size={14} />
                        {route.contact}
                      </a>
                    </div>

                    <div>
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        <ArrowDownRight size={12} className="text-primary" />
                        Departure (to SU)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {route.departureTimes.length === 0 ? (
                          <span className="text-[13px] text-gray-400">—</span>
                        ) : (
                          route.departureTimes.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 rounded-md bg-primary/5 px-2.5 py-1 text-[13px] font-semibold text-primary"
                            >
                              <Clock size={12} />
                              {t}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        <ArrowUpLeft size={12} className="text-accent" />
                        Return (from SU)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {route.returnTimes.length === 0 ? (
                          <span className="text-[13px] text-gray-400">—</span>
                        ) : (
                          route.returnTimes.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 rounded-md bg-accent/5 px-2.5 py-1 text-[13px] font-semibold text-accent"
                            >
                              <Clock size={12} />
                              {t}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Important Instructions */}
        {instructions.length > 0 && (
          <div className="mx-auto max-w-5xl rounded-2xl bg-white border border-gray-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <Info size={22} className="text-accent" />
              <h2 className="font-display text-xl md:text-2xl font-bold text-primary">
                Important Instructions
              </h2>
            </div>

            <ul className="space-y-5">
              {instructions.map((row, i) => {
                return (
                  <li key={i} className="flex items-start gap-3">
                    <DynamicLucideIcon
                      name={row.iconName}
                      size={18}
                      className="shrink-0 mt-0.5 text-primary"
                    />
                    <div>
                      <p className="font-bold text-[15px] text-primary mb-1">
                        {row.title}
                      </p>
                      {/* HTML allowed — instructions can embed tel: links + bold text */}
                      <p
                        className="text-[14px] leading-[1.7] text-gray-700"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.description) }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Container>
    </PageShell>
  );
}
