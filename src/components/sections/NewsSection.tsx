'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import Container from '../ui/Container';
import SectionTitle from '../ui/SectionTitle';
import Button from '../ui/Button';

const NEWS_PATH = '/news';

// DB row shape — kept narrow on purpose (the homepage section only
// needs cover + title + category + display date). Server fetcher
// in lib/identity.ts can return the full row; only these fields
// are read here.
type NewsRow = {
  slug: string;
  title: string;
  category: string;
  publishedAt: Date | string;
  displayDate: string | null;
  coverUrl: string;
};

type Props = {
  news: readonly NewsRow[];
};

function formatDate(row: NewsRow): string {
  if (row.displayDate) return row.displayDate;
  const d = new Date(row.publishedAt);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NewsSection({ news }: Props) {
  // Empty state — render nothing rather than a broken layout.
  if (news.length === 0) return null;

  const [main, ...others] = news;
  const sideItems = others.slice(0, 4);

  return (
    <section className="py-8 md:py-16 bg-gray-50 border-t border-gray-100">
      <Container>
        <div className="flex justify-between items-end mb-6 md:mb-8">
          <SectionTitle
            eyebrow="Department Updates"
            title="Latest News"
            subtitle="From hands-on workshops to breakthrough announcements—never miss what's shaping tomorrow's innovations."
          />
          <a href={NEWS_PATH} className="hidden md:block">
            <Button variant="ghost" className="mb-6 md:mb-8 group">
              View All News
              <ArrowUpRight
                size={18}
                className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </Button>
          </a>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 mt-6 md:mt-8">
          {/* Main featured */}
          <motion.a
            href={`/news/${main.slug}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group"
          >
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-5 h-[280px] md:h-[400px]">
              <Image
                src={main.coverUrl}
                alt={main.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 text-sm font-semibold">{main.category}</span>
            </div>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-primary leading-tight mb-2 group-hover:text-accent transition-colors">
              {main.title}
            </h3>
            <span className="text-sm text-gray-500">{formatDate(main)}</span>
          </motion.a>

          {/* Side list */}
          <div className="flex flex-col divide-y divide-gray-200">
            {sideItems.map((item, idx) => (
              <motion.a
                key={item.slug}
                href={`/news/${item.slug}`}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="flex items-start gap-5 md:gap-6 py-5 first:pt-0 last:pb-0 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-600 text-sm font-semibold">{item.category}</span>
                  </div>
                  <h4 className="text-base md:text-lg font-display font-bold text-primary leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-3">
                    {item.title}
                  </h4>
                  <span className="text-sm text-gray-500">{formatDate(item)}</span>
                </div>
                <div className="relative w-32 md:w-44 h-24 md:h-28 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                  <Image
                    src={item.coverUrl}
                    alt={item.title}
                    fill
                    sizes="(min-width: 768px) 176px, 128px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
