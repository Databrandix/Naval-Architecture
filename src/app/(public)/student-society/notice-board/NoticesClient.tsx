'use client';

import { useMemo, useState } from 'react';
import {
  Tag,
  Building2,
  Calendar,
  ExternalLink,
  Download,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { withAttachmentDownload } from '@/lib/pdf-helpers';

export type NoticeCardRow = {
  slug: string;
  title: string;
  category: string;
  department: string;
  publishedAt: string;
  displayDate: string | null;
  description: string;
  fileUrl: string | null;
  fileType: string | null;
  fileName: string | null;
};

const CATEGORY_STYLES: Record<string, string> = {
  Academic: 'bg-primary/10 text-primary',
  Holiday: 'bg-accent/10 text-accent',
  Transport: 'bg-amber-100 text-amber-700',
};

const FILTERS = ['All', 'Academic', 'Holiday', 'Transport'] as const;

function formatDate(row: NoticeCardRow): string {
  if (row.displayDate) return row.displayDate;
  return new Date(row.publishedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NoticesClient({ notices }: { notices: readonly NoticeCardRow[] }) {
  const [active, setActive] = useState<(typeof FILTERS)[number]>('All');

  const filtered = useMemo(
    () => (active === 'All' ? notices : notices.filter((n) => n.category === active)),
    [active, notices],
  );

  return (
    <>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {FILTERS.map((f) => {
          const isActive = active === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActive(f)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-accent hover:text-accent'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-500 mb-8">
        Showing <span className="font-semibold text-primary">{filtered.length}</span> of{' '}
        <span className="font-semibold text-primary">{notices.length}</span>{' '}
        {notices.length === 1 ? 'notice' : 'notices'}
      </p>

      {/* Notice cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No notices match this filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((n) => {
            const catStyle = CATEGORY_STYLES[n.category] ?? 'bg-gray-100 text-gray-700';
            const isPdf = n.fileType === 'pdf';
            /* A notice whose attachment lives elsewhere — an examination
               routine kept as a Google Sheet, say — can be opened but not
               downloaded, so it gets a link icon and no Download button. */
            const isExternalLink = n.fileType === 'link';
            const FileIcon = isExternalLink ? ExternalLink : isPdf ? FileText : ImageIcon;
            return (
              <article
                key={n.slug}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-6 md:p-7"
              >
                <h3 className="font-display text-lg md:text-xl font-bold text-primary uppercase leading-snug mb-3">
                  {n.title}
                </h3>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600 mb-5 pb-5 border-b border-gray-100">
                  <span className="inline-flex items-center gap-1.5">
                    <Tag size={14} className="text-gray-400" />
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold ${catStyle}`}>
                      {n.category}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={14} className="text-gray-400" />
                    {n.department}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDate(n)}
                  </span>
                </div>

                <div className="bg-gray-50/70 rounded-lg p-5 mb-5 text-[15px] text-gray-700 leading-[1.85]">
                  {n.description}
                </div>

                {n.fileUrl && (
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={n.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-md transition-colors"
                    >
                      <FileIcon size={16} />
                      View Full Notice
                      <ExternalLink size={14} className="opacity-80" />
                    </a>
                    {!isExternalLink && (
                      <a
                        href={withAttachmentDownload(n.fileUrl)}
                        download={n.fileName ?? undefined}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white text-sm font-semibold rounded-md transition-colors"
                      >
                        <Download size={16} />
                        Download
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
