'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Notice } from '@prisma/client';
import { deleteNoticeAction } from '@/lib/admin-actions/notices';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

const CATEGORY_STYLES: Record<string, string> = {
  Academic:  'bg-primary/10 text-primary',
  Holiday:   'bg-accent/10 text-accent',
  Transport: 'bg-amber-100 text-amber-700',
};

export default function NoticesList({ items: initialItems }: { items: Notice[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, title: string) {
    const ok = await confirm({
      title: 'Delete notice?',
      message: `"${title}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteNoticeAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Notice deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No notices yet.</p>
        <Link
          href="/admin/notices/new"
          className="text-accent hover:underline font-medium text-sm mt-2 inline-block"
        >
          Create the first notice
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((notice) => (
        <li key={notice.id}
            className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
              {notice.fileType === 'pdf'
                ? <FileText size={18} className="text-accent" />
                : notice.fileType === 'image'
                  ? <ImageIcon size={18} className="text-gray-500" />
                  : <span className="text-[10px] text-gray-400 font-mono">none</span>}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${CATEGORY_STYLES[notice.category] ?? 'bg-gray-200 text-gray-700'}`}>
                  {notice.category}
                </span>
                <span className="text-xs text-gray-500">{notice.department}</span>
              </div>
              <div className="font-medium text-gray-900 truncate">{notice.title}</div>
              <div className="text-xs text-gray-500 truncate">
                <span className="font-mono">/{notice.slug}</span> ·{' '}
                <span>{notice.displayDate ?? new Date(notice.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/admin/notices/${notice.id}`}
              aria-label={`Edit ${notice.title}`}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(notice.id, notice.title)}
              aria-label={`Delete ${notice.title}`}
              className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
