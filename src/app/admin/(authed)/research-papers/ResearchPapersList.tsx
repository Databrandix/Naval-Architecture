'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ResearchPaper } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import { deleteResearchPaperAction, reorderResearchPapersAction } from '@/lib/admin-actions/research-papers';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function ResearchPapersList({ items: initialItems }: { items: ResearchPaper[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, title: string) {
    const ok = await confirm({
      title: 'Delete research paper?',
      message: `"${title}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteResearchPaperAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Research paper deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No research papers yet.</p>
        <Link href="/admin/research-papers/new" className="text-accent hover:underline font-medium text-sm mt-2 inline-block">
          Add the first paper
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(p) => p.id}
      onReorder={async (ids) => {
        const res = await reorderResearchPapersAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(p) => (
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 text-sm line-clamp-2">{p.title}</div>
            <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{p.authors}</div>
            {(p.date || p.publicationYear) && (
              <div className="text-[11px] text-gray-400 mt-0.5">
                {p.date ?? `Year: ${p.publicationYear}`}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/admin/research-papers/${p.id}`} aria-label="Edit paper"
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
              <Pencil size={16} />
            </Link>
            <button type="button" onClick={() => handleDelete(p.id, p.title)} aria-label="Delete paper"
                    className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    />
  );
}
