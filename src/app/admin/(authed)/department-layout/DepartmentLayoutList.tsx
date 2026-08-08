'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { deleteDepartmentLayoutAction, reorderDepartmentLayoutsAction } from '@/lib/admin-actions/department-layout';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';
import FormSortableList from '@/components/admin/FormSortableList';

type Row = { id: string; slug: string; shortTitle: string };

export default function DepartmentLayoutList({ rows: initialRows }: { rows: Row[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [rows, setRows] = useState(initialRows);
  const [pending, startTransition] = useTransition();

  async function handleDelete(id: string, title: string) {
    const ok = await confirm({ title: 'Delete layout?', message: `"${title}" will be permanently removed.`, confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteDepartmentLayoutAction(id);
      if (res.ok) { toast.success('Layout deleted'); router.refresh(); } else { toast.error(res.error); }
    });
  }

  async function handleReorder(ids: string[]) {
    setRows(ids.map((id) => rows.find((r) => r.id === id)!));
    startTransition(async () => {
      const res = await reorderDepartmentLayoutsAction(ids);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <FormSortableList items={rows} getId={(r) => r.id} onReorder={handleReorder} renderItem={(row) => (
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
        <div className="cursor-grab text-gray-400 hover:text-gray-600"><GripVertical size={16} /></div>
        <span className="flex-1 font-medium text-sm text-gray-800">{row.shortTitle}</span>
        <code className="text-xs text-gray-400 font-mono">{row.slug}</code>
        <Link href={`/admin/department-layout/${row.id}`} className="p-1.5 text-gray-400 hover:text-primary transition-colors"><Pencil size={15} /></Link>
        <button type="button" disabled={pending} onClick={() => handleDelete(row.id, row.shortTitle)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40"><Trash2 size={15} /></button>
      </div>
    )} />
  );
}
