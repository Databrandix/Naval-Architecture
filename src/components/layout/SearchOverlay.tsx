'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { search, type SearchItem } from '@/lib/search';

const TYPE_BADGE_COLOR: Record<SearchItem['type'], string> = {
  Page: 'bg-primary/10 text-primary',
  Faculty: 'bg-accent/10 text-accent',
  News: 'bg-blue-100 text-blue-700',
  FAQ: 'bg-amber-100 text-amber-700',
  Lab: 'bg-emerald-100 text-emerald-700',
  Club: 'bg-violet-100 text-violet-700',
  Alumni: 'bg-pink-100 text-pink-700',
  Research: 'bg-indigo-100 text-indigo-700',
  Transport: 'bg-cyan-100 text-cyan-700',
  Event: 'bg-rose-100 text-rose-700',
  Notice: 'bg-orange-100 text-orange-700',
  Program: 'bg-teal-100 text-teal-700',
  ResearchArea: 'bg-indigo-100 text-indigo-700',
  Gallery: 'bg-slate-100 text-slate-700',
  Visitor: 'bg-fuchsia-100 text-fuchsia-700',
  Syllabus: 'bg-lime-100 text-lime-700',
  AdmissionNotice: 'bg-yellow-100 text-yellow-800',
  Prospectus: 'bg-sky-100 text-sky-700',
  Fees: 'bg-green-100 text-green-800',
  TransferCredits: 'bg-stone-100 text-stone-700',
  WaiverCategory: 'bg-red-100 text-red-700',
  Scholarship: 'bg-purple-100 text-purple-700',
};

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  items: readonly SearchItem[];
}

export default function SearchOverlay({ open, onClose, items }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => search(query, items, 30), [query, items]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/50 z-[80] transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Search panel */}
      <div
        className={`fixed top-0 left-0 right-0 z-[85] bg-white transition-transform duration-300 ${
          open ? 'translate-y-0 shadow-2xl' : '-translate-y-full pointer-events-none'
        }`}
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-4">
          {/* Input row */}
          <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
            <Search size={20} className="shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, faculty, FAQs, labs, clubs…"
              className="flex-1 bg-transparent text-[15px] md:text-base font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Results */}
          <div className="mt-3 max-h-[70vh] overflow-y-auto">
            {!query.trim() ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Type a keyword — pages, faculty names, lab names, FAQs, clubs, alumni, research…
              </p>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No matches for &ldquo;<span className="text-primary font-semibold">{query}</span>&rdquo;
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {results.map((item, idx) => (
                  <li key={`${item.href}-${idx}`}>
                    <a
                      href={item.href}
                      onClick={onClose}
                      className="group flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className={`mt-0.5 shrink-0 inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          TYPE_BADGE_COLOR[item.type]
                        }`}
                      >
                        {item.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold text-gray-900 leading-snug">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="mt-0.5 text-[12.5px] text-gray-600 leading-snug line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight
                        size={16}
                        className="mt-1 shrink-0 text-gray-300 group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
