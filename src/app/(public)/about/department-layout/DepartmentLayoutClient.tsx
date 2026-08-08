'use client';

import Image from 'next/image';
import { Download, ExternalLink } from 'lucide-react';
import { withAttachmentDownload } from '@/lib/pdf-helpers';

export interface DepartmentLayoutItem {
  slug: string;
  title: string;
  shortTitle: string;
  cover: string;
  pdf: string;
}

export default function DepartmentLayoutClient({ items }: { items: DepartmentLayoutItem[] }) {
  return (
    <div className="flex justify-center">
      {items.map((item) => (
        <article
          key={item.slug}
          className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col w-full max-w-md"
        >
          <div className="bg-gray-50">
            <Image
              src={item.cover}
              alt={item.title}
              width={600}
              height={800}
              sizes="(min-width: 640px) 50vw, 100vw"
              className="block w-full h-auto"
            />
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <h3 className="font-display text-base md:text-lg font-bold text-primary leading-snug mb-1">
              {item.shortTitle}
            </h3>
            {item.pdf ? (
              <div className="mt-4 flex flex-col gap-2.5">
                <a
                  href={item.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-md transition-colors"
                >
                  <ExternalLink size={16} />
                  View Layout
                </a>
                <a
                  href={withAttachmentDownload(item.pdf)}
                  download
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white text-sm font-semibold rounded-md transition-colors"
                >
                  <Download size={16} />
                  Download
                </a>
              </div>
            ) : (
              <span className="mt-4 inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-gray-100 text-gray-400 text-sm font-semibold rounded-md cursor-not-allowed">
                PDF coming soon
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
