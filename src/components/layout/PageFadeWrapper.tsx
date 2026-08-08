'use client';

import { usePathname } from 'next/navigation';

// Phase 18 — replaces the Phase 15 server-side keyed wrapper that used
// the x-pathname header to re-trigger the 250ms opacity fade-in on
// every public navigation. usePathname() is safe here because this is
// a client component nested inside (public)/layout.tsx — no Phase 1
// admin-vs-public conditional rendering, just a re-key signal so the
// .page-fade-in animation restarts on each route change.
export default function PageFadeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-fade-in">
      {children}
    </div>
  );
}
