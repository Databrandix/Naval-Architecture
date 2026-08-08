'use client';

// Phase 15 — addendum: per-navigation overlay so the branded preloader
// shows on EVERY public page transition, not just on slow Suspense
// fetches. The Tier 1 loading.tsx fallback only renders when the
// route actually suspends; fast / cached routes skipped it, which
// felt like nothing was happening.
//
// Timing strategy:
//   - On internal anchor click → snapshot the current pathname and
//     show the overlay.
//   - Hide the overlay the moment usePathname() reports a value that
//     differs from the snapshot — that's the React commit where the
//     new page has rendered. Preloader duration matches the real
//     navigation duration exactly (no artificial cap, no early hide).
//   - 15s safety timeout prevents a stuck overlay if pathname never
//     changes (e.g. user cancels the navigation, server hangs).
//
// Excluded: admin paths, external links, modifier-key clicks (open in
// new tab), middle/right clicks, download links, hash-only anchors,
// same-path clicks.

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import BrandedLoader from './BrandedLoader';

const SAFETY_MAX_MS = 15000;

export default function PublicNavigationOverlay() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  // The pathname captured at click time. We hide the overlay when
  // usePathname() returns a value different from this — that signals
  // the navigation has actually landed.
  const pathAtClickRef = useRef<string | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/')) return;
      if (anchor.getAttribute('target') === '_blank') return;
      if (anchor.hasAttribute('download')) return;
      if (href.startsWith('#')) return;
      if (href.startsWith('/admin')) return;

      const cleanHref = href.split('?')[0].split('#')[0];
      if (cleanHref === pathname) return;

      pathAtClickRef.current = pathname;
      setShow(true);
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () =>
      document.removeEventListener('click', handleClick, { capture: true });
  }, [pathname]);

  // Hide when pathname differs from what it was at click time —
  // means the new page has rendered.
  useEffect(() => {
    if (!show) return;
    if (pathAtClickRef.current === null) return;
    if (pathname !== pathAtClickRef.current) {
      setShow(false);
      pathAtClickRef.current = null;
    }
  }, [pathname, show]);

  // Safety net for navigations that never complete (server hang,
  // user-cancelled, programmatic redirect to same path, etc.).
  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(() => {
      setShow(false);
      pathAtClickRef.current = null;
    }, SAFETY_MAX_MS);
    return () => window.clearTimeout(t);
  }, [show]);

  if (!show) return null;
  return <BrandedLoader />;
}
