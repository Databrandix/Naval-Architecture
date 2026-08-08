'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Program } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import {
  deleteProgramAction,
  reorderProgramsAction,
} from '@/lib/admin-actions/programs';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function ProgramsList({ items: initialItems }: { items: Program[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: 'Delete program?',
      message: `"${name}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteProgramAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Program deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No programs yet.</p>
        <Link
          href="/admin/programs/new"
          className="text-accent hover:underline font-medium text-sm mt-2 inline-block"
        >
          Add the first program
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(p) => p.id}
      onReorder={async (ids) => {
        const res = await reorderProgramsAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(p) => (
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">{p.programName}</div>
            <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 mt-0.5">
              <span className="font-mono">{p.degreeCode}</span>
              <span aria-hidden="true">·</span>
              <span>{p.duration}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/admin/programs/${p.id}`}
              aria-label={`Edit ${p.programName}`}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(p.id, p.programName)}
              aria-label={`Delete ${p.programName}`}
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
