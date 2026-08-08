'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';
import Container from '../ui/Container';

const LAB_FACILITY_PATH = '/about/lab-facility';

// Public Lab shape — matches getLabs() select in identity.ts.
// Same shape as LabFacilityClient consumes.
type LabRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  heroImageUrl: string | null;
};

type Props = {
  labs: readonly LabRow[];
};

export default function ResearchLabsSection({ labs }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // After a smooth scroll settles, jump silently across the duplicate boundary
  // so forward and backward feel infinite.
  const wrapIfNeeded = (el: HTMLElement) => {
    const halfWidth = el.scrollWidth / 2;
    if (halfWidth <= 0) return;
    if (el.scrollLeft >= halfWidth) {
      el.scrollLeft = el.scrollLeft - halfWidth;
    } else if (el.scrollLeft < 1) {
      el.scrollLeft = el.scrollLeft + halfWidth;
    }
  };

  useEffect(() => {
    if (isPaused) return;
    const intervalId = window.setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const firstCard = el.querySelector<HTMLElement>('[data-lab-card]');
      if (!firstCard) return;
      const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 24;
      const step = firstCard.offsetWidth + gap;
      el.scrollBy({ left: step, behavior: 'smooth' });
      window.setTimeout(() => wrapIfNeeded(el), 700);
    }, 4000);
    return () => window.clearInterval(intervalId);
  }, [isPaused]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>('[data-lab-card]');
    if (!firstCard) return;
    const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 24;
    const step = firstCard.offsetWidth + gap;
    // For backward press at the very start, hop forward to the duplicate before scrolling
    if (direction === 'left' && el.scrollLeft < 1) {
      el.scrollLeft = el.scrollWidth / 2;
    }
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
    window.setTimeout(() => wrapIfNeeded(el), 700);
  };

  return (
    <section className="py-8 md:py-16 bg-white overflow-hidden">
      <Container>
        <div className="flex justify-between items-end mb-6 md:mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-[1.5px] bg-accent/40" />
              <span className="text-accent font-bold tracking-[0.2em] uppercase text-[10px]">
                Research That Advances Technology
              </span>
            </div>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-primary leading-tight">
              Research &amp; Labs
            </h2>
          </div>
          <div className="hidden md:flex gap-4">
            <button
              onClick={() => scroll('left')}
              aria-label="Previous labs"
              className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Next labs"
              className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="relative -mx-4 sm:mx-0">
          {/* Mobile-only side arrows (overlay) */}
          <button
            onClick={() => scroll('left')}
            aria-label="Previous labs"
            className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/95 shadow-lg border border-gray-200 flex items-center justify-center text-primary transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Next labs"
            className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-primary text-white shadow-lg flex items-center justify-center transition-opacity"
          >
            <ChevronRight size={20} />
          </button>

        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pt-4 pb-8 no-scrollbar px-4 sm:px-0"
        >
          {[...labs, ...labs].map((lab, idx) => (
            <motion.a
              key={`${lab.slug}-${idx}`}
              href={`${LAB_FACILITY_PATH}#${lab.slug}`}
              data-lab-card
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -8 }}
              className="snap-center md:snap-start shrink-0 w-[88%] sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.125rem)] h-[460px] md:h-[500px] relative rounded-3xl overflow-hidden group shadow-xl bg-primary"
            >
              {lab.heroImageUrl ? (
                <Image
                  src={lab.heroImageUrl}
                  alt={lab.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 88vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FlaskConical size={64} className="text-white/30" strokeWidth={1.25} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/45 to-primary/10 group-hover:via-primary/65 group-hover:to-primary/20 transition-all duration-500" />

              <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                <h3 className="text-white group-hover:text-accent transition-colors duration-300 text-xl md:text-2xl font-display font-bold mb-2 leading-tight">
                  {lab.name}
                </h3>
                <p className="text-white/80 text-sm leading-snug">{lab.tagline}</p>
                <div className="mt-6 flex justify-end">
                  <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-accent border border-white/20 flex items-center justify-center text-white transition-all">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
        </div>
      </Container>
    </section>
  );
}
