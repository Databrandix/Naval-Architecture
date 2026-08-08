'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Club } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import { deleteClubAction, reorderClubsAction } from '@/lib/admin-actions/clubs';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function ClubsList({ items: initialItems }: { items: Club[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: 'Delete club?',
      message: `"${name}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteClubAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Club deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No clubs yet.</p>
        <Link href="/admin/clubs/new" className="text-accent hover:underline font-medium text-sm mt-2 inline-block">
          Add the first club
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(c) => c.id}
      onReorder={async (ids) => {
        const res = await reorderClubsAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(c) => (
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.imageUrl} alt="" className="w-14 h-12 rounded bg-gray-50 border border-gray-200 object-cover shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{c.name}</div>
              <div className="text-xs text-gray-500 truncate">
                <span className="font-mono">{c.slug}</span> · {c.abbreviation}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/admin/clubs/${c.id}`} aria-label={`Edit ${c.name}`}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
              <Pencil size={16} />
            </Link>
            <button type="button" onClick={() => handleDelete(c.id, c.name)} aria-label={`Delete ${c.name}`}
                    className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    />
  );
}
