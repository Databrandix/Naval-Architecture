import { Building2, Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { JsonValue } from '@prisma/client/runtime/library';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import ContactForm from '@/components/forms/ContactForm';
import { getContactPageContent, getCampusLocations } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';

export const metadata = {
  title: 'Contact Us — Sonargaon University',
  description:
    'Contact Sonargaon University — phone, email, website, Facebook, and campus addresses for Permanent, Green Road and Mohakhali campuses.',
};

// Phase 20 — quickContactCards.iconName resolves via the shared
// DynamicLucideIcon (any Lucide name; silent HelpCircle fallback).

type QuickContactCard = {
  iconName: string;
  title: string;
  primaryValue: string;
  primaryHref: string | null;
  secondaryValue: string | null;
  secondaryHref: string | null;
  hint: string | null;
};

function coerceCards(value: JsonValue | null | undefined): QuickContactCard[] {
  if (!Array.isArray(value)) return [];
  const out: QuickContactCard[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const r = raw as Record<string, unknown>;
    const iconName = typeof r.iconName === 'string' ? r.iconName : '';
    const title = typeof r.title === 'string' ? r.title : '';
    const primaryValue = typeof r.primaryValue === 'string' ? r.primaryValue : '';
    if (!iconName || !title || !primaryValue) continue;
    out.push({
      iconName,
      title,
      primaryValue,
      primaryHref:    typeof r.primaryHref === 'string' && r.primaryHref.length > 0 ? r.primaryHref : null,
      secondaryValue: typeof r.secondaryValue === 'string' && r.secondaryValue.length > 0 ? r.secondaryValue : null,
      secondaryHref:  typeof r.secondaryHref === 'string' && r.secondaryHref.length > 0 ? r.secondaryHref : null,
      hint:           typeof r.hint === 'string' && r.hint.length > 0 ? r.hint : null,
    });
  }
  return out;
}

export default async function ContactPage() {
  const [content, campuses] = await Promise.all([
    getContactPageContent(),
    getCampusLocations(),
  ]);

  const heroTitle    = content?.heroTitle    ?? 'Contact Us';
  const heroOverline = content?.heroOverline ?? 'Get in Touch';
  const heroImage    = content?.heroImageUrl ?? '/assets/contact-hero.webp';
  const heroPosition = `center ${content?.heroImageVerticalPercent ?? 50}%`;
  const introBody    = content?.introBody    ?? '';
  const quickContactHeading = content?.quickContactHeading ?? 'Quick Contact Information';
  const formHeading         = content?.formHeading         ?? 'Send Us a Message';
  const formSubheading      = content?.formSubheading      ?? '';
  const campusesHeading     = content?.campusesHeading     ?? 'Campus Locations';
  const responseTimeNote    = content?.responseTimeNote    ?? '';
  const cards = coerceCards(content?.quickContactCards ?? null);

  return (
    <PageShell
      title={heroTitle}
      overline={heroOverline ?? undefined}
      image={heroImage}
      imagePosition={heroPosition ?? undefined}
      contentClassName="bg-gray-50 py-12 md:py-16"
    >
      <Container>
        {/* Intro */}
        {introBody && (
          <div className="mx-auto max-w-3xl text-center mb-12 md:mb-16">
            <p
              className="text-[15px] md:text-[16px] leading-[1.85] text-gray-700"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(introBody) }}
            />
          </div>
        )}

        {/* Quick Contact Information */}
        {cards.length > 0 && (
          <section className="mb-14 md:mb-20">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary">
                {quickContactHeading}
              </h2>
              <div className="mt-3 mx-auto h-1 w-16 bg-accent rounded-full" />
            </div>

            <div className={`mx-auto max-w-5xl grid gap-5 sm:grid-cols-2 ${cards.length >= 4 ? 'lg:grid-cols-4' : `lg:grid-cols-${cards.length}`}`}>
              {cards.map((c, i) => {
                return (
                  <div
                    key={`${c.title}-${i}`}
                    className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow p-6 flex flex-col items-center text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <DynamicLucideIcon name={c.iconName} size={22} className="text-primary" />
                    </div>
                    <h3 className="font-bold text-primary mb-2">{c.title}</h3>
                    {c.primaryHref ? (
                      <a
                        href={c.primaryHref}
                        target={c.primaryHref.startsWith('http') ? '_blank' : undefined}
                        rel={c.primaryHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-[14px] font-semibold text-accent hover:text-primary transition-colors break-all"
                      >
                        {c.primaryValue}
                      </a>
                    ) : (
                      <span className="text-[14px] font-semibold text-accent break-all">
                        {c.primaryValue}
                      </span>
                    )}
                    {c.secondaryValue && (
                      c.secondaryHref ? (
                        <a
                          href={c.secondaryHref}
                          target={c.secondaryHref.startsWith('http') ? '_blank' : undefined}
                          rel={c.secondaryHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="text-[13px] font-semibold text-accent hover:text-primary transition-colors break-all mt-1"
                        >
                          {c.secondaryValue}
                        </a>
                      ) : (
                        <span className="text-[13px] font-semibold text-accent break-all mt-1">
                          {c.secondaryValue}
                        </span>
                      )
                    )}
                    {c.hint && (
                      <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-gray-500">
                        <Clock size={12} />
                        {c.hint}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Send Us a Message */}
        <section className="mb-14 md:mb-20">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary">
              {formHeading}
            </h2>
            {formSubheading && (
              <p className="mt-2 text-gray-600 text-[15px] max-w-xl mx-auto">
                {formSubheading}
              </p>
            )}
            <div className="mt-3 mx-auto h-1 w-16 bg-accent rounded-full" />
          </div>

          <div className="mx-auto max-w-3xl">
            <ContactForm responseTimeNote={responseTimeNote} />
          </div>
        </section>

        {/* Campus Locations */}
        {campuses.length > 0 && (
          <section>
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary">
                {campusesHeading}
              </h2>
              <div className="mt-3 mx-auto h-1 w-16 bg-accent rounded-full" />
            </div>

            <div className={`mx-auto max-w-6xl grid gap-6 ${campuses.length >= 3 ? 'md:grid-cols-3' : `md:grid-cols-${campuses.length}`}`}>
              {campuses.map((c) => (
                <article
                  key={c.id}
                  className="flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="bg-primary text-white px-6 py-5 flex items-start gap-3">
                    <Building2 size={22} className="shrink-0 mt-0.5 text-button-yellow" />
                    <div>
                      <h3 className="font-bold text-[17px] leading-snug">{c.name}</h3>
                      {c.tag && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-button-yellow/90">
                          {c.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="shrink-0 mt-0.5 text-accent" />
                      <p className="text-[14px] leading-[1.7] text-gray-700">{c.address}</p>
                    </div>

                    {c.phone && (
                      <div className="flex items-start gap-3">
                        <Phone size={16} className="shrink-0 mt-0.5 text-accent" />
                        <a
                          href={`tel:${c.phone.replace(/\s/g, '')}`}
                          className="text-[14px] font-semibold text-primary hover:text-accent transition-colors"
                        >
                          {c.phone}
                        </a>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Mail size={16} className="shrink-0 mt-0.5 text-accent" />
                      <a
                        href={`mailto:${c.email}`}
                        className="text-[14px] font-semibold text-primary hover:text-accent transition-colors break-all"
                      >
                        {c.email}
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </Container>
    </PageShell>
  );
}
