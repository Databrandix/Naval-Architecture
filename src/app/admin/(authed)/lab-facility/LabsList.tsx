'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Lab } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import {
  deleteLabAction,
  reorderLabsAction,
} from '@/lib/admin-actions/lab-facility';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function LabsList({ items: initialItems }: { items: Lab[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: 'Delete lab?',
      message: `"${name}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteLabAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Lab deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No labs yet.</p>
        <Link
          href="/admin/lab-facility/labs/new"
          className="text-accent hover:underline font-medium text-sm mt-2 inline-block"
        >
          Add the first lab
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(l) => l.id}
      onReorder={async (ids) => {
        const res = await reorderLabsAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(lab) => (
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {lab.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lab.heroImageUrl}
                alt=""
                className="w-12 h-12 rounded bg-gray-50 border border-gray-200 object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-mono shrink-0">
                no img
              </div>
            )}
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{lab.name}</div>
              <div className="text-xs text-gray-500 truncate font-mono">
                /{lab.slug} · {lab.gallery.length} gallery img{lab.gallery.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/admin/lab-facility/labs/${lab.id}`}
              aria-label={`Edit ${lab.name}`}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(lab.id, lab.name)}
              aria-label={`Delete ${lab.name}`}
              className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    />
  );
}
