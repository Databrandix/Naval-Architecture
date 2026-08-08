'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { DynamicLucideIcon } from '@/components/ui/DynamicLucideIcon';

// Phase 20 — visual icon picker. Lazy-loaded via next/dynamic from
// IconInputField so its full-namespace Lucide import only enters the
// browser bundle when an admin actually opens the picker.

// Curated default set (~30) — shown when search is empty + "Browse
// all" toggle is off. Tuned to institutional content (engineering,
// academia, communication, facilities).
const CURATED_DEFAULTS: readonly string[] = [
  'Flame', 'Cpu', 'Wrench', 'Cog', 'Award',
  'BookOpen', 'GraduationCap', 'Users', 'Building2', 'Globe',
  'Mail', 'Phone', 'MapPin', 'Calendar', 'Clock',
  'FileText', 'Newspaper', 'Sparkles', 'Lightbulb', 'Microscope',
  'FlaskConical', 'Atom', 'Layers', 'Activity', 'Network',
  'ShieldCheck', 'Trophy', 'Rocket', 'Factory', 'Laptop',
];

// All unique Lucide icon names — derived once at module init. The
// library ships each icon under both `Foo` and `FooIcon`; we keep
// the bare-name list as the canonical browseable set.
const ALL_ICON_NAMES: readonly string[] = (() => {
  const lib = LucideIcons as unknown as Record<string, unknown>;
  return Object.keys(lib)
    .filter((k) => /^[A-Z][a-zA-Z0-9]*$/.test(k))
    .filter((k) => !k.endsWith('Icon'))
    .sort();
})();

const RESULTS_CAP = 500; // grid render cap; refine search if more

interface Props {
  value: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}

export default function LucideIconPicker({ value, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q) {
      return ALL_ICON_NAMES.filter((n) => n.toLowerCase().includes(q));
    }
    if (showAll) return ALL_ICON_NAMES;
    return CURATED_DEFAULTS;
  }, [search, showAll]);

  const visible = filtered.slice(0, RESULTS_CAP);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-16"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Lucide icon picker"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 p-4 flex items-center gap-2">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${ALL_ICON_NAMES.length} Lucide icons…`}
            className="flex-1 outline-none text-sm bg-transparent"
            aria-label="Search icons"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close picker"
            className="text-gray-500 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {!search && (
            <div className="flex items-center justify-between mb-3 text-xs text-gray-600">
              <span className="font-medium">
                {showAll ? `Browsing all ${ALL_ICON_NAMES.length}` : 'Common icons'}
              </span>
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="text-accent hover:underline"
              >
                {showAll
                  ? 'Show common only'
                  : `Browse all ${ALL_ICON_NAMES.length}`}
              </button>
            </div>
          )}

          {visible.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No icons match {`"${search}"`}.
            </p>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {visible.map((n) => {
                const selected = value === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      onSelect(n);
                      onClose();
                    }}
                    title={n}
                    className={
                      'flex flex-col items-center gap-1.5 p-2 rounded-md text-gray-700 transition-colors ' +
                      (selected
                        ? 'bg-accent/15 ring-2 ring-accent'
                        : 'hover:bg-accent/10')
                    }
                  >
                    <DynamicLucideIcon name={n} size={20} />
                    <span className="text-[10px] truncate w-full text-center leading-tight">
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {filtered.length > RESULTS_CAP && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              Showing first {RESULTS_CAP} of {filtered.length} matches —
              refine search to narrow.
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 px-4 py-2 text-[11px] text-gray-500 flex items-center justify-between">
          <span>
            PascalCase names from{' '}
            <span className="font-mono">lucide.dev/icons</span>
          </span>
          <span>{filtered.length} match{filtered.length === 1 ? '' : 'es'}</span>
        </div>
      </div>
    </div>
  );
}
