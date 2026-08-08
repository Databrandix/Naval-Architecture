'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Tag, Calendar, Clock, ArrowRight } from 'lucide-react';

// Plain serializable shape — eventDate is a string (or null) because
// Date objects can't cross the server→client boundary in Next 15
// server-actions/client-props mode without going through JSON. The
// parent (server page.tsx) toISOString()s it before passing in.
export type EventCardRow = {
  slug: string;
  shortTitle: string;
  summary: string;
  category: string;
  status: string;
  imageUrl: string;
  eventDate: string | null;
  displayDate: string | null;
  time: string | null;
};

type Filter = 'All' | string;

// Fixed-style maps. Keys come from admin-edited rows so unknown
// categories/statuses fall through to a neutral default — no crash.
const CATEGORY_STYLES: Record<string, string> = {
  Sports: 'bg-emerald-100 text-emerald-700',
  'Industrial Visit': 'bg-amber-100 text-amber-700',
  Achievement: 'bg-violet-100 text-violet-700',
  Partnership: 'bg-sky-100 text-sky-700',
  Seminar: 'bg-rose-100 text-rose-700',
  Exhibition: 'bg-primary/10 text-primary',
};

const STATUS_STYLES: Record<string, string> = {
  Past: 'bg-gray-200 text-gray-700',
  Current: 'bg-primary/10 text-primary',
  Upcoming: 'bg-accent/10 text-accent',
};

const STATUS_FILTERS: Filter[] = ['All', 'Current', 'Upcoming'];
const CATEGORY_FILTERS = [
  'Sports', 'Industrial Visit', 'Achievement', 'Partnership', 'Seminar', 'Exhibition',
] as const;

function formatDate(row: EventCardRow): string | null {
  if (row.displayDate) return row.displayDate;
  if (!row.eventDate) return null;
  return new Date(row.eventDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EventsClient({ events }: { events: readonly EventCardRow[] }) {
  const [active, setActive] = useState<Filter>('All');

  const filtered = useMemo(() => {
    if (active === 'All') return events;
    return events.filter((e) => e.status === active || e.category === active);
  }, [active, events]);

  return (
    <>
      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="text-sm font-semibold text-gray-600 mr-1">Filter by:</span>
        {STATUS_FILTERS.map((f) => {
          const isActive = active === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActive(f)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-accent hover:text-accent'
              }`}
            >
              {f === 'Current' ? 'Current Events' : f}
            </button>
          );
        })}
        {CATEGORY_FILTERS.map((c) => {
          const isActive = active === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-accent hover:text-accent'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-500 mb-8">
        Showing <span className="font-semibold text-primary">{filtered.length}</span>{' '}
        of <span className="font-semibold text-primary">{events.length}</span>{' '}
        {events.length === 1 ? 'event' : 'events'}
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No events match this filter.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ev) => {
            const dateLabel = formatDate(ev);
            const catStyle = CATEGORY_STYLES[ev.category] ?? 'bg-gray-100 text-gray-700';
            const statusStyle = STATUS_STYLES[ev.status] ?? 'bg-gray-200 text-gray-700';
            return (
              <article
                key={ev.slug}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                  <Image
                    src={ev.imageUrl}
                    alt={ev.shortTitle}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span
                    className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm ${statusStyle} bg-white/95`}
                  >
                    <Tag size={12} />
                    {ev.status === 'Current' ? 'Current Events' : ev.status}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600 mb-3">
                    {dateLabel && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={13} className="text-accent" />
                        {dateLabel}
                      </span>
                    )}
                    {ev.time && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} className="text-accent" />
                        {ev.time}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-base md:text-lg font-bold text-primary leading-snug mb-2 line-clamp-2">
                    {ev.shortTitle}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                    {ev.summary}
                  </p>

                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${catStyle}`}
                    >
                      {ev.category}
                    </span>
                    <Link
                      href={`/student-society/events/${ev.slug}`}
                      className="inline-flex items-center gap-1.5 text-primary hover:text-accent text-sm font-bold transition-colors"
                    >
                      View Details
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
