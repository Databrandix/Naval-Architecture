'use client';

import {useEffect, useState} from 'react';
import {motion} from 'motion/react';
import Container from '../ui/Container';
import {ChevronRight, Home} from 'lucide-react';

// Per-image alt text now comes from DepartmentIdentity.heroImage{N}Alt
// (Phase 3). When an admin replaces a hero image, they edit the
// matching alt in the same form. Null alt → generic slot label.
// Built from the department name rather than written out, so a copy of this
// codebase never describes the department it was copied from.
const FALLBACK_ALT_SUFFIXES = ['Department', 'students and faculty', 'campus'];

type HeroSectionProps = {
  imageUrls: readonly string[];
  imageAlts: readonly (string | null)[];
  // Phase 13 — per-image vertical position Int 0-100 from
  // DepartmentIdentity.heroImage{1,2,3}VerticalPercent. Same length
  // as imageUrls; defaults to 50 per slot if a value is missing.
  imageVerticalPercents: readonly number[];
  breadcrumbLabel: string;
  /** Department name with the "Department of" prefix removed — the eyebrow above already says it. */
  departmentTitle: string;
  /** Shown in yellow after the title, e.g. NAME. */
  shortCode: string;
  /** One line under the headline. */
  tagline: string;
};

export default function HeroSection({
  imageUrls,
  imageAlts,
  imageVerticalPercents,
  breadcrumbLabel,
  departmentTitle,
  shortCode,
  tagline,
}: HeroSectionProps) {
  const heroImages = imageUrls.map((src, i) => ({
    src,
    alt:
      imageAlts[i] ??
      `Sonargaon University ${departmentTitle} ${FALLBACK_ALT_SUFFIXES[i] ?? `— slide ${i + 1}`}`,
    verticalPercent: imageVerticalPercents[i] ?? 50,
  }));
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % heroImages.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="relative min-h-[480px] md:min-h-[580px] lg:min-h-[660px] w-full overflow-hidden flex flex-col pt-[100px] md:pt-[140px] lg:pt-[200px] pb-20">
      {/* Background Images with subtle Ken Burns */}
      <div className="absolute inset-0 z-0">
        {heroImages.map((image, index) => {
          const isActive = index === activeImage;
          return (
            <motion.div
              key={image.src}
              initial={{ scale: 1 }}
              animate={isActive ? { scale: 1.06 } : { scale: 1 }}
              transition={isActive ? { duration: 6, ease: 'easeOut' } : { duration: 0 }}
              className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
            >
              {/* Plain <img> so the inline objectPosition survives —
                  next/image fill mode injects its own default that
                  overrides style props (see memory:
                  project_next_image_fill_object_position). Loss of
                  srcset/optimization is acceptable: three large hero
                  images on the homepage are a single render path. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.alt}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'low'}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: `center ${image.verticalPercent}%` }}
                referrerPolicy={image.src.startsWith('http') ? 'no-referrer' : undefined}
              />
            </motion.div>
          );
        })}
        {/* Layered overlays for depth and readability */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/10 to-black/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.5)_100%)]" />
      </div>

      {/* Hero Content */}
      <Container className="relative z-10 w-full !max-w-[1600px] flex-1 flex items-center justify-center">
        <div className="flex max-w-4xl flex-col items-center gap-5 md:gap-6 text-center">
          {/* Overline tag */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="flex items-center gap-3"
          >
            <span className="h-px w-8 md:w-10 bg-button-yellow" />
            <span className="text-button-yellow text-[10px] md:text-[11px] font-bold tracking-[0.3em] uppercase">
              Department of
            </span>
            <span className="h-px w-8 md:w-10 bg-button-yellow" />
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white uppercase tracking-tight leading-tight drop-shadow-2xl"
          >
            {departmentTitle} <span className="text-button-yellow">({shortCode})</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="text-sm md:text-base lg:text-lg text-white/85 font-light max-w-2xl leading-relaxed"
          >
            {tagline}
          </motion.p>
        </div>
      </Container>

      {/* Image Dots Indicator (vertical, right side) */}
      <div className="absolute top-1/2 right-3 md:right-6 lg:right-10 z-20 -translate-y-1/2 hidden md:flex flex-col gap-2.5">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveImage(index)}
            aria-label={`Show slide ${index + 1}`}
            className={`relative h-7 w-[3px] rounded-full transition-all overflow-hidden ${
              index === activeImage ? 'bg-white/50' : 'bg-white/40 hover:bg-white/60'
            }`}
          >
            {index === activeImage && (
              <motion.span
                key={activeImage}
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className="absolute top-0 left-0 w-full bg-button-yellow rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Breadcrumb — bottom left */}
      <div className="absolute bottom-6 md:bottom-8 left-0 w-full z-10">
        <Container className="!max-w-[1600px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex items-center justify-center gap-2 text-white/90 text-xs md:text-[13px] font-medium tracking-wide"
          >
            <a href="/" className="hover:text-button-yellow flex items-center gap-1.5 transition-colors">
              <Home size={13} /> Home
            </a>
            <ChevronRight size={13} className="opacity-50" />
            <a href="#" className="hover:text-button-yellow transition-colors">Dept</a>
            <ChevronRight size={13} className="opacity-50" />
            <span className="text-button-yellow font-semibold">{breadcrumbLabel}</span>
          </motion.div>
        </Container>
      </div>
    </section>
  );
}
