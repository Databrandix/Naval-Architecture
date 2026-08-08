'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Visitor } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import { deleteVisitorAction, reorderVisitorsAction } from '@/lib/admin-actions/visitors';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function VisitorsList({ items: initialItems }: { items: Visitor[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: 'Delete visitor?',
      message: `"${name}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteVisitorAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Visitor deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No visitors yet.</p>
        <Link href="/admin/visitors/new" className="text-accent hover:underline font-medium text-sm mt-2 inline-block">
          Add the first visitor
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(v) => v.id}
      onReorder={async (ids) => {
        const res = await reorderVisitorsAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(v) => (
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.photoUrl} alt="" className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 object-cover shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{v.name}</div>
              <div className="text-xs text-gray-500 truncate">
                <span className="font-mono">{v.slug}</span>
                {v.role && <> · {v.role}</>}
                {v.affiliation && <> · {v.affiliation}</>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/admin/visitors/${v.id}`} aria-label={`Edit ${v.name}`}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
              <Pencil size={16} />
            </Link>
            <button type="button" onClick={() => handleDelete(v.id, v.name)} aria-label={`Delete ${v.name}`}
                    className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    />
  );
}
