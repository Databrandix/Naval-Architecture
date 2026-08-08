'use client';

// Phase 15 — branded preloader, used by:
//   1. src/app/loading.tsx (Tier 1: route-segment Suspense fallback)
//   2. InitialSplash.tsx (Tier 2: first-visit cold-load brand moment)
//
// Fullscreen overlay with the project favicon stacked above a classic
// dot-ellipsis spinner in the brand primary + accent palette. Pure
// CSS animation, no JS, no external library — keyframes live in
// globals.css under @layer utilities (.ellipsis-grow / -shrink /
// -slide).
//
// Client component — consumed by InitialSplash + PublicNavigationOverlay
// which are client components; adding 'use client' avoids missing RSC
// payload errors when these components re-render after initial load.

type Props = {
  /** Optional extra classes on the fullscreen wrapper (e.g. opacity
   *  control during the InitialSplash fade-out). */
  className?: string;
};

export default function BrandedLoader({ className = '' }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white ${className}`}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Brand logo — static, sourced from the App Router auto-
            favicon route (src/app/icon.png, 512x512). Plain <img>
            since next/image isn't useful here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.png"
          alt=""
          aria-hidden="true"
          className="w-12 h-12 object-contain"
        />

        {/* Dot ellipsis. Four 12x12 dots in three slots (left 8 / 32
            / 56 px within an 80x16 container); dot 1 grows in, dots
            2 + 3 slide from slot 1 → slot 2 / slot 2 → slot 3, and
            dot 4 shrinks out. Two-tone primary + accent. */}
        <div className="relative w-20 h-4">
          <span className="ellipsis-grow   absolute left-2  top-1 block w-3 h-3 rounded-full bg-primary" />
          <span className="ellipsis-slide  absolute left-2  top-1 block w-3 h-3 rounded-full bg-primary" />
          <span className="ellipsis-slide  absolute left-8  top-1 block w-3 h-3 rounded-full bg-accent" />
          <span className="ellipsis-shrink absolute left-14 top-1 block w-3 h-3 rounded-full bg-accent" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
