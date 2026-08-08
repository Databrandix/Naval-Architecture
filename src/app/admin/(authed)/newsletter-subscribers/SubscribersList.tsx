'use client';

import { useRouter } from 'next/navigation';
import { Trash2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';
import { deleteNewsletterSubscriberAction } from '@/lib/admin-actions/newsletter';

type SubscriberRow = {
  id: string;
  email: string;
  status: string;
  source: string | null;
  // ISO string — Server Component serializes Date for the client boundary.
  createdAt: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

export default function SubscribersList({ items: initialItems }: { items: SubscriberRow[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, email: string) {
    const ok = await confirm({
      title: 'Delete subscriber?',
      message: `"${email}" will be removed from the newsletter list. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteNewsletterSubscriberAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Subscriber removed');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <Mail size={24} className="text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No subscribers yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((row) => (
        <li
          key={row.id}
          className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Mail size={16} />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{row.email}</div>
              <div className="text-xs text-gray-500 truncate">
                {formatDate(row.createdAt)}
                {row.source && (
                  <>
                    {' · '}
                    <span className="font-mono">{row.source}</span>
                  </>
                )}
                {row.status !== 'active' && (
                  <>
                    {' · '}
                    <span className="text-amber-600">{row.status}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(row.id, row.email)}
            aria-label={`Delete ${row.email}`}
            className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <Trash2 size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}
