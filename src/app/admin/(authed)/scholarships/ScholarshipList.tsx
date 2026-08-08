'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Scholarship } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import {
  deleteScholarshipAction,
  reorderScholarshipsAction,
} from '@/lib/admin-actions/scholarships';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function ScholarshipList({ items: initialItems }: { items: Scholarship[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: 'Delete scholarship?',
      message: `"${name}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteScholarshipAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Scholarship deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No scholarship slabs yet.</p>
        <Link href="/admin/scholarships/new" className="text-accent hover:underline font-medium text-sm mt-2 inline-block">
          Add the first slab
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(s) => s.id}
      onReorder={async (ids) => {
        const res = await reorderScholarshipsAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(s) => (
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{s.name}</span>
              {s.isHighlight && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-button-yellow/20 text-primary">
                  <Star size={10} /> Best Value
                </span>
              )}
            </div>
            <div className="font-medium text-gray-900 text-sm truncate">{s.credits}</div>
            <div className="text-xs text-gray-500 truncate">
              Base {s.base} · GPA 4.00 → {s.perfect} · GPA 3.90–3.99 → {s.near}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/admin/scholarships/${s.id}`} aria-label="Edit slab"
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
              <Pencil size={16} />
            </Link>
            <button type="button" onClick={() => handleDelete(s.id, s.name)} aria-label="Delete slab"
                    className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    />
  );
}
