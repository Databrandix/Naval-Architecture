'use client';

// Phase 15 — Tier 2: first-visit cold-load brand moment.
//
// Renders a BrandedLoader overlay ONCE per browser session for the
// public site. sessionStorage flag persists across navigations within
// the same tab but resets on a new tab or window — acceptable
// "first impression" scope.
//
// Render strategy is client-only (initial state mounted=false, server
// renders null). Returning visitors never see a hydration flash; the
// first-time visitor sees a brief content-then-overlay sequence
// before the 600ms minimum-visible window fades to the live page.
//
// Mounted in the root layout from a server-decided condition
// (!isAdmin from x-pathname header) — Phase 1 trap respected, no
// client-side usePathname guard at layout level.

import { useEffect, useState } from 'react';
import BrandedLoader from './BrandedLoader';

const STORAGE_KEY = 'eee_splash_seen';
const MIN_VISIBLE_MS = 600;   // brand-moment cap, not artificial wait
const FADE_OUT_MS    = 300;

export default function InitialSplash() {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Returning visitor in the same tab → render nothing.
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // SessionStorage unavailable (private mode quota, restrictive
      // browser policy). Skip the splash rather than hard-fail.
      return;
    }

    setVisible(true);
    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
      const unmountTimer = window.setTimeout(() => {
        setVisible(false);
        try {
          sessionStorage.setItem(STORAGE_KEY, '1');
        } catch {
          // ignore
        }
      }, FADE_OUT_MS);
      // Best-effort cleanup; if the user navigates away mid-fade
      // React unmounts the whole tree anyway.
      return () => window.clearTimeout(unmountTimer);
    }, MIN_VISIBLE_MS);

    return () => window.clearTimeout(fadeTimer);
  }, []);

  if (!visible) return null;

  return (
    <BrandedLoader
      className={`transition-opacity duration-300 ease-out ${fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    />
  );
}
