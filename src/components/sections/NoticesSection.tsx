'use client';

import { motion } from 'motion/react';
import { ChevronRight, Eye } from 'lucide-react';
import Container from '../ui/Container';
import Button from '../ui/Button';

const NOTICE_BOARD_PATH = '/student-society/notice-board';

type NoticeRow = {
  slug: string;
  title: string;
  publishedAt: Date | string;
  displayDate: string | null;
  fileUrl: string | null;
};

type Props = {
  notices: readonly NoticeRow[];
};

function formatDate(row: NoticeRow): string {
  if (row.displayDate) return row.displayDate;
  const d = new Date(row.publishedAt);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NoticesSection({ notices }: Props) {
  if (notices.length === 0) return null;

  return (
    <section className="py-8 md:py-16 bg-primary relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <Container className="relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-3 md:mb-4 leading-tight">
            Academic Notices &amp; Announcements
          </h2>
          <p className="text-white/70 text-base md:text-lg">
            Stay up to date with the latest from the Department of Electrical and Electronics Engineering — registration, holidays, and student services.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {notices.map((notice, idx) => {
            // If a file is attached, open the artifact directly (matches
            // pre-Phase-6 behaviour); otherwise fall back to the public
            // notice board page so the row stays clickable.
            const href = notice.fileUrl ?? NOTICE_BOARD_PATH;
            const external = !!notice.fileUrl;
            return (
              <motion.a
                key={notice.slug}
                href={href}
                {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
                aria-label={`View notice: ${notice.title}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-4 md:p-6 lg:p-8 hover:bg-white/10 transition-colors border-b border-white/10 last:border-0 group cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 lg:gap-12 flex-1 min-w-0">
                  <span className="text-accent text-sm md:text-base font-bold md:min-w-[120px] shrink-0">
                    {formatDate(notice)}
                  </span>
                  <h3 className="text-white font-medium text-base md:text-lg leading-snug group-hover:text-accent transition-colors">
                    {notice.title}
                  </h3>
                </div>
                <div className="shrink-0 ml-3 md:ml-4 opacity-50 group-hover:opacity-100 transition-opacity">
                  <Eye size={20} className="text-white" />
                </div>
              </motion.a>
            );
          })}
        </div>

        <div className="mt-8 md:mt-12 text-center">
          <a href={NOTICE_BOARD_PATH}>
            <Button variant="yellow" className="px-10 py-3 group">
              View All Notices
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Button>
          </a>
        </div>
      </Container>
    </section>
  );
}
