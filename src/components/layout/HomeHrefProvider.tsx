'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Where the breadcrumb's "Home" points.
 *
 * `PageShell` draws the trail and is a client component rendered by each page,
 * not by the layout, so it cannot be handed the value as a prop without
 * touching every page. The layout already reads the university identity for
 * the navbar and footer; this passes that one field the rest of the way down.
 *
 * The default is this site's own home page, which is what a breadcrumb
 * normally means. An administrator who fills in "University website" moves it
 * to the university's site instead — useful where the department site reads as
 * a section of a larger one.
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
