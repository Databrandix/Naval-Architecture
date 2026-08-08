'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BusRoute } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import { deleteBusRouteAction, reorderBusRoutesAction } from '@/lib/admin-actions/bus-routes';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function BusRoutesList({ items: initialItems }: { items: BusRoute[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: 'Delete bus route?',
      message: `"${name}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteBusRouteAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Bus route deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No bus routes yet.</p>
        <Link href="/admin/bus-routes/new" className="text-accent hover:underline font-medium text-sm mt-2 inline-block">
          Add the first route
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(r) => r.id}
      onReorder={async (ids) => {
        const res = await reorderBusRoutesAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(r) => (
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-md bg-primary/5 text-primary flex items-center justify-center shrink-0">
              <Bus size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{r.routeName}</div>
              <div className="text-xs text-gray-500 truncate font-mono">
                {r.busNumber} · {r.contact} · {r.departureTimes.length}↑ / {r.returnTimes.length}↓
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/admin/bus-routes/${r.id}`} aria-label={`Edit ${r.routeName}`}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
              <Pencil size={16} />
            </Link>
            <button type="button" onClick={() => handleDelete(r.id, r.routeName)} aria-label={`Delete ${r.routeName}`}
                    className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    />
  );
}
