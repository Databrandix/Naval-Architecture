'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MailCheck, Inbox, Archive, Trash2 } from 'lucide-react';
import {
  updateContactSubmissionStatusAction,
  deleteContactSubmissionAction,
} from '@/lib/admin-actions/contact-submissions';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

type Status = 'new' | 'read' | 'archived';

export default function StatusActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();

  function runStatusUpdate(next: Status, label: string) {
    startTransition(async () => {
      const res = await updateContactSubmissionStatusAction(id, next);
      if (res.ok) {
        toast.success(`Marked as ${label}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  async function runDelete() {
    const ok = await confirm({
      title: 'Delete submission?',
      message: 'This submission will be removed permanently. This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteContactSubmissionAction(id);
      if (res.ok) {
        toast.success('Submission deleted');
        router.push('/admin/contact-submissions');
      } else {
        toast.error(res.error);
      }
    });
  }

  const isNew = currentStatus === 'new';
  const isRead = currentStatus === 'read';
  const isArchived = currentStatus === 'archived';

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
        Actions
      </h2>
      <div className="flex flex-wrap gap-2">
        {!isNew && (
          <button
            type="button"
            onClick={() => runStatusUpdate('new', 'new')}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Inbox size={14} /> Mark as new
          </button>
        )}
        {!isRead && (
          <button
            type="button"
            onClick={() => runStatusUpdate('read', 'read')}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium transition-colors disabled:opacity-60"
          >
            <MailCheck size={14} /> Mark as read
          </button>
        )}
        {!isArchived && (
          <button
            type="button"
            onClick={() => runStatusUpdate('archived', 'archived')}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Archive size={14} /> Archive
          </button>
        )}
        <button
          type="button"
          onClick={runDelete}
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors disabled:opacity-60 ml-auto"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </section>
  );
}
