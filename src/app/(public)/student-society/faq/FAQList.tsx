'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';

// Plain serializable shape — id is now a cuid string (Phase 7 DB
// migration). The legacy sequential number `id` from faq-data.ts is
// gone; ordering comes from prisma.faq.findMany with displayOrder.
export type FaqRow = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

type Props = { faqs: readonly FaqRow[] };

const PER_PAGE = 12;
const ALL_CATEGORIES = ['All', 'Admission', 'Rankings', 'Campus', 'Programs', 'Exams'] as const;

export default function FAQList({ faqs }: Props) {
  const [activeCat, setActiveCat] = useState<(typeof ALL_CATEGORIES)[number]>('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => (activeCat === 'All' ? faqs : faqs.filter((f) => f.category === activeCat)),
    [activeCat, faqs],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleCatChange = (cat: (typeof ALL_CATEGORIES)[number]) => {
    setActiveCat(cat);
    setPage(1);
    setOpenId(null);
  };

  const handlePageChange = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
    setOpenId(null);
  };

  if (faqs.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12">No FAQs yet.</p>
    );
  }

  return (
    <>
      {/* Filter pills */}
      <div className="mb-8 flex flex-wrap items-center gap-2 md:gap-3">
        <FolderOpen size={18} className="text-gray-400 mr-1" aria-hidden="true" />
        {ALL_CATEGORIES.map((cat) => {
          const active = cat === activeCat;
          return (
            <button
              key={cat}
              onClick={() => handleCatChange(cat)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* FAQ items */}
      <div className="space-y-4">
        {visible.map((faq, idx) => {
          const isOpen = openId === faq.id;
          return (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.35 }}
              className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full flex items-start justify-between gap-4 px-5 py-4 md:px-6 md:py-5 text-left"
                aria-expanded={isOpen}
              >
                <div className="flex-1">
                  <span className="inline-block rounded-md bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600 mb-2">
                    {faq.category}
                  </span>
                  <h3 className="text-[15px] md:text-[17px] font-semibold leading-snug text-primary">
                    {faq.question}
                  </h3>
                </div>
                <ChevronDown
                  size={20}
                  className={`mt-1 shrink-0 text-gray-400 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 md:px-6 md:pb-6 text-[14px] md:text-[15px] leading-[1.75] text-gray-700 border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {visible.length === 0 && (
          <p className="text-center text-gray-500 py-12">
            No questions found in this category.
          </p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const active = p === page;
            return (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`h-10 min-w-[40px] rounded-lg px-3 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </>
  );
}
