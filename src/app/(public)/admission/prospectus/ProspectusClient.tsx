'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Download, ExternalLink, Search } from 'lucide-react';
import { withAttachmentDownload } from '@/lib/pdf-helpers';

type Level = 'Undergraduate' | 'Postgraduate';

export interface ProspectusItem {
  slug: string;
  title: string;
  shortTitle: string;
  department: string;
  level: string; // 'Undergraduate' | 'Postgraduate' (Zod-validated upstream)
  pdf: string;
}
/* No cover here any more. The row still stores one and the admin panel still
   edits it — the public page opens the document itself instead of showing a
   thumbnail of its first page. */

const filters: ('All' | Level)[] = ['All', 'Undergraduate', 'Postgraduate'];

export default function ProspectusClient({
  items,
  departmentShortCode,
}: {
  items: ProspectusItem[];
  /** Named in the "no postgraduate programmes yet" line. */
  departmentShortCode: string;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<'All' | Level>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (active !== 'All' && p.level !== active) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.level.toLowerCase().includes(q)
      );
    });
  }, [items, query, active]);

  /* The reader at the top follows the list below it, so filtering to a
     programme opens that programme rather than leaving the wrong document
     on screen. */
  const reading = filtered.find((p) => p.pdf);

  return (
    <>
      {reading && (
        <section className="mb-10 md:mb-14">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-primary font-display text-lg font-bold md:text-xl">
                {reading.shortTitle}
              </h2>
              <p className="text-sm text-gray-600">{reading.department}</p>
            </div>
            <a
              href={reading.pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-accent inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            >
              <ExternalLink size={15} aria-hidden />
              Open in a new tab
            </a>
          </div>

          {/* The browser's own PDF reader, which scrolls the document in
              place. Some mobile browsers refuse to render a PDF in a frame
              and show nothing at all, which is why the link above it is not
              optional — it is the way through for those readers.

              The fragment asks that reader for the document and nothing else:
              no thumbnail rail, no toolbar, and the page scaled to the width
              of the frame so it does not sit in a grey trough. These are
              hints, not guarantees — Chrome honours all three, Firefox most,
              Safari few — so the layout must still look right if a browser
              ignores every one of them. */}
          <div className="h-[75vh] min-h-[420px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <iframe
              key={reading.slug}
              src={`${reading.pdf}#toolbar=0&navpanes=0&statusbar=0&view=FitH`}
              title={reading.title}
              className="h-full w-full"
            />
          </div>
        </section>
      )}

      {/* Search + Filters */}
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs..."
            className="focus:border-accent focus:ring-accent/15 w-full rounded-lg border border-gray-200 bg-white py-3 pr-4 pl-11 text-sm transition placeholder:text-gray-400 focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const isActive = active === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setActive(f)}
                className={`rounded-lg px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'hover:border-accent hover:text-accent border border-gray-200 bg-white text-gray-700'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mb-8 text-sm text-gray-500">
        Showing <span className="text-primary font-semibold">{filtered.length}</span>{' '}
        {filtered.length === 1 ? 'program' : 'programs'}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          {active === 'Postgraduate' && !query ? (
            <>
              <p className="text-primary mb-1 text-base font-semibold">
                Postgraduate prospectus coming soon
              </p>
              <p className="text-sm text-gray-500">
                {`Postgraduate programs in ${departmentShortCode} are not offered yet. Please check back later for updates.`}
              </p>
            </>
          ) : (
            <p className="text-gray-500">No programs match your search.</p>
          )}
        </div>
      ) : (
        /* One row per programme rather than a wall of cover thumbnails: the
           document itself is already open above, so the list only has to say
           which programme it is and hand over the file. */
        <div className="mx-auto grid max-w-4xl gap-4">
          {filtered.map((p) => (
            <article
              key={p.slug}
              className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:p-6 sm:text-left"
            >
              <span className="from-primary to-accent inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md">
                <BookOpen size={22} strokeWidth={1.75} aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <span
                  className={`mb-1.5 inline-block w-fit rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase ${
                    p.level === 'Undergraduate'
                      ? 'bg-primary/8 text-primary'
                      : 'bg-accent/10 text-accent'
                  }`}
                >
                  {p.level}
                </span>
                <p className="text-primary font-display text-[15px] font-bold md:text-base">
                  {p.shortTitle}
                </p>
                <p className="text-sm text-gray-500">{p.department}</p>
              </div>

              {p.pdf ? (
                <a
                  href={withAttachmentDownload(p.pdf)}
                  download
                  className="bg-primary hover:bg-primary/90 inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white shadow-md transition-colors"
                >
                  <Download size={17} aria-hidden />
                  Download PDF
                </a>
              ) : (
                <span className="inline-flex shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-400">
                  PDF coming soon
                </span>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
