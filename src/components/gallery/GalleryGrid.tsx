'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Aperture,
  Expand,
  X as CloseIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Phase 6: images arrive as a prop (DB-driven via server page).
// Shape is the narrow subset the masonry + lightbox need.
type GalleryImageRow = {
  id: string;
  imageUrl: string;
  alt: string;
  width: number;
  height: number;
};

type Props = {
  images: readonly GalleryImageRow[];
};

export default function GalleryGrid({ images }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const isOpen = activeIdx !== null;
  const active = activeIdx !== null ? images[activeIdx] : null;

  const close = useCallback(() => setActiveIdx(null), []);
  const next = useCallback(() => {
    setActiveIdx((idx) =>
      idx === null ? null : (idx + 1) % images.length
    );
  }, []);
  const prev = useCallback(() => {
    setActiveIdx((idx) =>
      idx === null
        ? null
        : (idx - 1 + images.length) % images.length
    );
  }, []);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close, next, prev]);

  return (
    <>
      {/* Intro */}
      <div className="mx-auto max-w-3xl text-center mb-10 md:mb-14">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 ring-1 ring-gray-200 shadow-sm mb-4">
          <Aperture size={14} className="text-accent" />
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-gray-600">
            Visual Journal
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-3">
          Glimpses of Campus Life
        </h2>
        <p className="text-base md:text-[17px] text-gray-700 leading-[1.85]">
          Convocations, workshops, club activities, and everyday energy from
          the Sonargaon University campus.
        </p>
      </div>

      {/* Masonry grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 md:gap-4 [&>button]:mb-3 md:[&>button]:mb-4">
        {images.map((img, idx) => (
          <button
            type="button"
            key={img.id}
            onClick={() => setActiveIdx(idx)}
            aria-label={`Open ${img.alt}`}
            className="group relative break-inside-avoid block w-full overflow-hidden bg-gray-100 ring-1 ring-gray-200/80 shadow-sm hover:shadow-2xl hover:ring-primary/30 hover:-translate-y-1 transition-all duration-300 cursor-zoom-in"
          >
            <Image
              src={img.imageUrl}
              alt={img.alt}
              width={img.width}
              height={img.height}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.05]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <span className="absolute bottom-3 left-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <Expand size={15} />
            </span>

            <span className="absolute top-3 right-3 inline-flex h-7 min-w-[34px] items-center justify-center rounded-full bg-white/90 backdrop-blur-sm px-2 text-[10px] font-bold tracking-wider text-primary shadow opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {String(idx + 1).padStart(2, '0')} / {images.length}
            </span>

            <span className="absolute top-0 left-0 h-12 w-12 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isOpen && active && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Gallery image viewer"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={close}
          >
            {/* Top bar */}
            <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 md:px-8 py-4 text-white pointer-events-none">
              <span className="text-sm font-medium tracking-wide bg-white/10 px-3 py-1 rounded-full">
                {String(activeIdx + 1).padStart(2, '0')} /{' '}
                {images.length}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                }}
                className="pointer-events-auto inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Prev */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-3 md:left-6 inline-flex items-center justify-center h-11 w-11 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Image (animated swap) */}
            <div
              className="relative flex items-center justify-center max-w-[92vw] max-h-[82vh] px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative"
              >
                <Image
                  src={active.imageUrl}
                  alt={active.alt}
                  width={active.width}
                  height={active.height}
                  priority
                  sizes="92vw"
                  className="object-contain max-w-[92vw] max-h-[82vh] w-auto h-auto shadow-2xl"
                />
              </motion.div>
            </div>

            {/* Next */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-3 md:right-6 inline-flex items-center justify-center h-11 w-11 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>

            {/* Caption — bottom center */}
            <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
              <span className="bg-white/10 backdrop-blur-sm text-white/85 text-xs md:text-sm px-4 py-1.5 rounded-full">
                {active.alt}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
