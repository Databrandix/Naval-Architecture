'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CampusLocation } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import {
  deleteCampusLocationAction,
  reorderCampusLocationsAction,
} from '@/lib/admin-actions/campus-locations';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function CampusLocationList({ items: initialItems }: { items: CampusLocation[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: 'Delete campus?',
      message: `"${name}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteCampusLocationAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Campus deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No campus locations yet.</p>
        <Link href="/admin/campus-locations/new" className="text-accent hover:underline font-medium text-sm mt-2 inline-block">
          Add the first campus
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(c) => c.id}
      onReorder={async (ids) => {
        const res = await reorderCampusLocationsAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(c) => (
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-gray-900 truncate">{c.name}</span>
              {c.tag && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-button-yellow/30 px-1.5 py-0.5 rounded">
                  {c.tag}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 truncate">{c.address}</div>
            <div className="text-xs text-gray-400 truncate mt-0.5">
              {c.email}{c.phone && ` · ${c.phone}`}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/admin/campus-locations/${c.id}`} aria-label="Edit campus"
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
              <Pencil size={16} />
            </Link>
            <button type="button" onClick={() => handleDelete(c.id, c.name)} aria-label="Delete campus"
                    className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    />
  );
}
