'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const slugToTitle = (slug: string) =>
  slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/80">
      <a href="/" className="inline-flex items-center gap-1 hover:text-white transition-colors">
        <Home size={14} />
        <span>Home</span>
      </a>
      {segments.map((seg, idx) => {
        const href = '/' + segments.slice(0, idx + 1).join('/');
        const isLast = idx === segments.length - 1;
        return (
          <span key={href} className="inline-flex items-center gap-2">
            <ChevronRight size={14} className="opacity-60" />
            {isLast ? (
              <span className="text-white font-medium">{slugToTitle(seg)}</span>
            ) : (
              <a href={href} className="hover:text-white transition-colors">
                {slugToTitle(seg)}
              </a>
            )}
          </span>
        );
      })}
    </nav>
  );
}
