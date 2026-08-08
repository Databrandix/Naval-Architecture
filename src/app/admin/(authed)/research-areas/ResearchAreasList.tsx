'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ResearchArea } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import {
  deleteResearchAreaAction,
  reorderResearchAreasAction,
} from '@/lib/admin-actions/research-areas';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function ResearchAreasList({ items: initialItems }: { items: ResearchArea[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: 'Delete research area?',
      message: `"${name}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteResearchAreaAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Research area deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No research areas yet.</p>
        <Link
          href="/admin/research-areas/new"
          className="text-accent hover:underline font-medium text-sm mt-2 inline-block"
        >
          Add the first research area
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(a) => a.id}
      onReorder={async (ids) => {
        const res = await reorderResearchAreasAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(a) => (
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <IconPreview area={a} />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{a.areaName}</div>
              <div className="text-xs text-gray-500">
                {a.iconUrl ? 'Uploaded image' : `Lucide · ${a.iconName ?? '—'}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/admin/research-areas/${a.id}`}
              aria-label={`Edit ${a.areaName}`}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(a.id, a.areaName)}
              aria-label={`Delete ${a.areaName}`}
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

function IconPreview({ area }: { area: ResearchArea }) {
  if (area.iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={area.iconUrl}
        alt=""
        className="w-9 h-9 rounded bg-gray-50 border border-gray-200 object-cover"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold font-mono">
      {(area.iconName ?? '?').slice(0, 2).toUpperCase()}
    </div>
  );
}
