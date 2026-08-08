'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WaiverCategory } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import {
  deleteWaiverCategoryAction,
  reorderWaiverCategoriesAction,
} from '@/lib/admin-actions/waiver-categories';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function WaiverCategoryList({ items: initialItems }: { items: WaiverCategory[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, title: string) {
    const ok = await confirm({
      title: 'Delete waiver category?',
      message: `"${title}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteWaiverCategoryAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Waiver category deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No waiver categories yet.</p>
        <Link href="/admin/waiver-categories/new" className="text-accent hover:underline font-medium text-sm mt-2 inline-block">
          Add the first category
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(c) => c.id}
      onReorder={async (ids) => {
        const res = await reorderWaiverCategoriesAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(c) => {
        const itemsCount = Array.isArray(c.items) ? c.items.length : 0;
        return (
          <div className="flex items-center justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">{c.iconName}</span>
                {c.note && <MessageSquare size={12} className="text-accent" />}
              </div>
              <div className="font-medium text-gray-900 text-sm truncate">{c.title}</div>
              <div className="text-xs text-gray-500 truncate">
                <span className="font-mono">/{c.slug}</span> · {itemsCount} item{itemsCount === 1 ? '' : 's'}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Link href={`/admin/waiver-categories/${c.id}`} aria-label="Edit category"
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
                <Pencil size={16} />
              </Link>
              <button type="button" onClick={() => handleDelete(c.id, c.title)} aria-label="Delete category"
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
