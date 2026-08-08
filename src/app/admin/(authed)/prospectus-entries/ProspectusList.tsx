'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ProspectusEntry } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import {
  deleteProspectusEntryAction,
  reorderProspectusEntriesAction,
} from '@/lib/admin-actions/prospectus-entries';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function ProspectusList({ items: initialItems }: { items: ProspectusEntry[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, title: string) {
    const ok = await confirm({
      title: 'Delete prospectus?',
      message: `"${title}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteProspectusEntryAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Prospectus deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No prospectus entries yet.</p>
        <Link href="/admin/prospectus-entries/new" className="text-accent hover:underline font-medium text-sm mt-2 inline-block">
          Add the first prospectus
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(p) => p.id}
      onReorder={async (ids) => {
        const res = await reorderProspectusEntriesAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(p) => (
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.coverUrl} alt="" className="w-12 h-14 rounded bg-gray-50 border border-gray-200 object-cover shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${p.level === 'Undergraduate' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                  {p.level}
                </span>
                {p.pdfUrl && <FileText size={14} className="text-accent" />}
              </div>
              <div className="font-medium text-gray-900 text-sm truncate">{p.shortTitle}</div>
              <div className="text-xs text-gray-500 truncate font-mono">/{p.slug}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/admin/prospectus-entries/${p.id}`} aria-label="Edit prospectus"
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
              <Pencil size={16} />
            </Link>
            <button type="button" onClick={() => handleDelete(p.id, p.shortTitle)} aria-label="Delete prospectus"
                    className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    />
  );
}
