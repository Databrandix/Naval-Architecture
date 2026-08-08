'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Event as EventRow } from '@prisma/client';
import { deleteEventAction } from '@/lib/admin-actions/events';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

const STATUS_STYLES: Record<string, string> = {
  Past:     'bg-gray-200 text-gray-700',
  Current:  'bg-primary/10 text-primary',
  Upcoming: 'bg-accent/10 text-accent',
};

export default function EventsList({ items: initialItems }: { items: EventRow[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, title: string) {
    const ok = await confirm({
      title: 'Delete event?',
      message: `"${title}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteEventAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Event deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No events yet.</p>
        <Link
          href="/admin/events/new"
          className="text-accent hover:underline font-medium text-sm mt-2 inline-block"
        >
          Create the first event
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((event) => (
        <li key={event.id}
            className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.imageUrl}
              alt=""
              className="w-16 h-12 rounded bg-gray-50 border border-gray-200 object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_STYLES[event.status] ?? 'bg-gray-200 text-gray-700'}`}>
                  {event.status}
                </span>
                <span className="text-xs text-gray-500">{event.category}</span>
              </div>
              <div className="font-medium text-gray-900 truncate">{event.shortTitle}</div>
              <div className="text-xs text-gray-500 truncate">
                <span className="font-mono">/{event.slug}</span>
                {event.displayDate ? ` · ${event.displayDate}` : event.eventDate ? ` · ${new Date(event.eventDate).toLocaleDateString()}` : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/admin/events/${event.id}`}
              aria-label={`Edit ${event.shortTitle}`}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(event.id, event.shortTitle)}
              aria-label={`Delete ${event.shortTitle}`}
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
