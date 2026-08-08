'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { News } from '@prisma/client';
import { deleteNewsAction } from '@/lib/admin-actions/news';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function NewsList({ items: initialItems }: { items: News[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, title: string) {
    const ok = await confirm({
      title: 'Delete article?',
      message: `"${title}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteNewsAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Article deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No news articles yet.</p>
        <Link
          href="/admin/news/new"
          className="text-accent hover:underline font-medium text-sm mt-2 inline-block"
        >
          Create the first article
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((article) => (
        <li key={article.id}
            className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverUrl}
              alt=""
              className="w-16 h-12 rounded bg-gray-50 border border-gray-200 object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{article.title}</div>
              <div className="text-xs text-gray-500 truncate">
                <span className="font-mono">/{article.slug}</span> ·{' '}
                <span>{article.category}</span> ·{' '}
                <span>{article.displayDate ?? new Date(article.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/admin/news/${article.id}`}
              aria-label={`Edit ${article.title}`}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(article.id, article.title)}
              aria-label={`Delete ${article.title}`}
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
