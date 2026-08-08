'use client';

import { motion } from 'motion/react';
import Container from '../ui/Container';

// Phase 12 — DB-driven. The root layout fetches JourneyCTAContent
// once per request (React.cache'd) and passes the fields down as
// props. Stays a client component because of the motion animation;
// data is server-fetched.
type Props = {
  heroImageUrl: string;
  heroImagePosition: string;
  heading: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  primaryCtaExternal: boolean;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaExternal: boolean;
};

export default function JourneyCTASection({
  heroImageUrl,
  heroImagePosition,
  heading,
  body,
  primaryCtaLabel,
  primaryCtaHref,
  primaryCtaExternal,
  secondaryCtaLabel,
  secondaryCtaHref,
  secondaryCtaExternal,
}: Props) {
  return (
    <section className="relative">
      {/* Hero image with overlays. Plain <img> instead of next/image —
          next/image's fill mode injects its own object-position default
          that overrides the inline style, breaking the admin's
          vertical-position slider. Single-image render path so the
          optimization trade-off is negligible. */}
      <div className="relative h-[420px] md:h-[480px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: heroImagePosition }}
        />
        {/* Left dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/75 to-transparent" />
        {/* Bottom fade for smooth transition to footer */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary/90 to-transparent" />

        <Container className="relative z-10 h-full flex items-center justify-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-xl text-white text-left"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-5 leading-tight">
              {heading}
            </h2>
            <p
              className="text-base md:text-lg text-white/85 mb-8 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: body }}
            />
            <div className="flex flex-wrap gap-4 justify-start">
              <a
                href={primaryCtaHref}
                target={primaryCtaExternal ? '_blank' : undefined}
                rel={primaryCtaExternal ? 'noopener noreferrer' : undefined}
                className="px-7 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-md shadow-xl transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-2xl"
              >
                {primaryCtaLabel}
              </a>
              <a
                href={secondaryCtaHref}
                target={secondaryCtaExternal ? '_blank' : undefined}
                rel={secondaryCtaExternal ? 'noopener noreferrer' : undefined}
                className="px-7 py-3 border-2 border-white text-white hover:bg-white hover:text-primary font-semibold rounded-md transition-all hover:-translate-y-0.5"
              >
                {secondaryCtaLabel}
              </a>
            </div>
          </motion.div>
        </Container>
      </div>

      {/* Gradient divider — project theme colors */}
      <div className="h-1 gradient-blue-magenta shadow-[0_-4px_12px_rgba(204,21,121,0.25)]" />
    </section>
  );
}
