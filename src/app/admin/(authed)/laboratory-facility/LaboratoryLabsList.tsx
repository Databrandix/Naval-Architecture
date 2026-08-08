'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { LaboratoryLab } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import {
  deleteLaboratoryLabAction,
  reorderLaboratoryLabsAction,
} from '@/lib/admin-actions/laboratory-facility';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function LaboratoryLabsList({ items: initialItems }: { items: LaboratoryLab[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, title: string) {
    const ok = await confirm({
      title: 'Delete laboratory?',
      message: `"${title}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteLaboratoryLabAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Laboratory deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No laboratories yet.</p>
        <Link
          href="/admin/laboratory-facility/labs/new"
          className="text-accent hover:underline font-medium text-sm mt-2 inline-block"
        >
          Add the first laboratory
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(l) => l.id}
      onReorder={async (ids) => {
        const res = await reorderLaboratoryLabsAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(lab) => (
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
              {(lab.iconName || '?').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{lab.title}</div>
              <div className="text-xs text-gray-500 truncate">
                <span className="font-mono">{lab.iconName}</span> · {lab.keyLabel}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/admin/laboratory-facility/labs/${lab.id}`}
              aria-label={`Edit ${lab.title}`}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(lab.id, lab.title)}
              aria-label={`Delete ${lab.title}`}
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
