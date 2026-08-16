'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Where the front page's hero breadcrumb sends "Home".
 *
 * Only `HeroSection` reads this, and `HeroSection` only ever renders on the
 * front page. Every other trail is drawn by `PageShell`, whose Home stays on
 * this site: from an inner page, "Home" meaning this department's front page
 * is exactly right. It is on the front page itself that "/" is useless — it
 * links to the page already open — so there Home goes one level up, to the
 * university.
 *
 * The value comes from `UniversityIdentity.websiteUrl`, so an administrator
 * sets it rather than a developer. Empty falls back to "/", which restores the
 * old no-op link rather than breaking the trail.
 *
 * It travels by context because `HeroSection` is a client component rendered
 * by the page, while the value is loaded by the layout for the navbar and
 * footer; this passes that one field the rest of the way down.
 */
const HomeHrefContext = createContext<string>('/');

export function HomeHrefProvider({
  href,
  children,
}: {
  /** Empty or null keeps the default. */
  href?: string | null;
  children: ReactNode;
}) {
  return (
    <HomeHrefContext.Provider value={href?.trim() || '/'}>{children}</HomeHrefContext.Provider>
  );
}

export function useHomeHref(): string {
  return useContext(HomeHrefContext);
}
