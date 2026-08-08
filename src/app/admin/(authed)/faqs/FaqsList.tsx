'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Faq } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import { deleteFaqAction, reorderFaqsAction } from '@/lib/admin-actions/faqs';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

const CATEGORY_STYLES: Record<string, string> = {
  Admission: 'bg-primary/10 text-primary',
  Rankings:  'bg-violet-100 text-violet-700',
  Campus:    'bg-emerald-100 text-emerald-700',
  Programs:  'bg-amber-100 text-amber-700',
  Exams:     'bg-rose-100 text-rose-700',
};

export default function FaqsList({ items: initialItems }: { items: Faq[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, question: string) {
    const ok = await confirm({
      title: 'Delete FAQ?',
      message: `"${question}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteFaqAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('FAQ deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No FAQs yet.</p>
        <Link href="/admin/faqs/new" className="text-accent hover:underline font-medium text-sm mt-2 inline-block">
          Add the first FAQ
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(q) => q.id}
      onReorder={async (ids) => {
        const res = await reorderFaqsAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(q) => {
        const catStyle = CATEGORY_STYLES[q.category] ?? 'bg-gray-100 text-gray-700';
        return (
          <div className="flex items-center justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${catStyle}`}>
                  {q.category}
                </span>
              </div>
              <div className="font-medium text-gray-900 text-sm line-clamp-2">{q.question}</div>
              <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{q.answer}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Link href={`/admin/faqs/${q.id}`} aria-label="Edit FAQ"
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
                <Pencil size={16} />
              </Link>
              <button type="button" onClick={() => handleDelete(q.id, q.question)} aria-label="Delete FAQ"
                      className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      }}
    />
  );
}
