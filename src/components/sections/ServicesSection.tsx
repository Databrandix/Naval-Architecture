'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Container from '../ui/Container';
import SectionTitle from '../ui/SectionTitle';
import { campusServices } from '../../lib/data';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ServicesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Mobile: jump silently across the duplicate boundary so the carousel feels infinite.
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
      // Only auto-scroll on mobile (when carousel mode is active)
      if (window.matchMedia('(min-width: 768px)').matches) return;
      const firstCard = el.querySelector<HTMLElement>('[data-service-card]');
      if (!firstCard) return;
      const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 16;
      const step = firstCard.offsetWidth + gap;
      el.scrollBy({ left: step, behavior: 'smooth' });
      window.setTimeout(() => wrapIfNeeded(el), 700);
    }, 4000);
    return () => window.clearInterval(intervalId);
  }, [isPaused]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>('[data-service-card]');
    if (!firstCard) return;
    const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 16;
    const step = firstCard.offsetWidth + gap;
    if (direction === 'left' && el.scrollLeft < 1) {
      el.scrollLeft = el.scrollWidth / 2;
    }
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
    window.setTimeout(() => wrapIfNeeded(el), 700);
  };

  // Duplicate services on mobile for infinite loop; on desktop, render once via grid.
  return (
    <section className="py-8 md:py-16 bg-white">
      <Container>
        <SectionTitle
          eyebrow="Student Life & Support"
          title="Essential Campus Services"
          subtitle="Quick links to transportation, financial aid, student support, and campus activities—everything you need beyond the classroom."
          centered
        />

        <div className="relative -mx-4 sm:mx-0 md:mx-auto md:max-w-5xl">
          {/* Mobile-only side arrows (overlay) */}
          <button
            onClick={() => scroll('left')}
            aria-label="Previous services"
            className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/95 shadow-lg border border-gray-200 flex items-center justify-center text-primary transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Next services"
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
            className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none gap-4 md:gap-6 pt-4 pb-8 md:py-0 no-scrollbar px-4 sm:px-0 md:justify-items-center"
          >
            {[...campusServices, ...campusServices].map((service, idx) => {
              const Wrapper: React.ElementType = service.href ? 'a' : 'div';
              const wrapperProps = service.href ? { href: service.href } : {};
              const isMobileDuplicate = idx >= campusServices.length;
              return (
                <motion.div
                  key={`${service.name}-${idx}`}
                  data-service-card
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (idx % campusServices.length) * 0.1 }}
                  className={`snap-center shrink-0 w-[88%] sm:w-[calc(50%-0.5rem)] md:w-full md:max-w-[320px] aspect-[10/14] relative group rounded-[28px] overflow-hidden shadow-xl border border-gray-100 ${
                    isMobileDuplicate ? 'md:hidden' : ''
                  }`}
                >
                  <Wrapper {...wrapperProps} className="relative block w-full h-full">
                    <Image
                      src={service.image}
                      alt={service.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 88vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                      <h3 className="text-white text-lg md:text-xl font-display font-bold mb-2 transition-colors group-hover:text-accent">
                        {service.name}
                      </h3>
                      <p className="text-white/70 text-sm mb-4 md:mb-6 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {service.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-accent border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer">
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  </Wrapper>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
