'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Faculty } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import {
  deleteFacultyAction,
  reorderFacultyAction,
} from '@/lib/admin-actions/faculty';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

type Filter = 'all' | 'leadership' | 'full_time' | 'part_time';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'leadership',  label: 'Leadership' },
  { value: 'full_time',   label: 'Full-time' },
  { value: 'part_time',   label: 'Part-time' },
];

function labelForType(t: string): string {
  if (t === 'leadership') return 'Leadership';
  if (t === 'full_time')  return 'Full-time';
  if (t === 'part_time')  return 'Part-time';
  return t;
}

export default function FacultyList({ items: initialItems }: { items: Faculty[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = filter === 'all' ? items : items.filter((f) => f.type === filter);

  const counts: Record<Filter, number> = {
    all:         items.length,
    leadership:  items.filter((f) => f.type === 'leadership').length,
    full_time:   items.filter((f) => f.type === 'full_time').length,
    part_time:   items.filter((f) => f.type === 'part_time').length,
  };

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: 'Delete faculty?',
      message: `"${name}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteFacultyAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Faculty deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  function renderRow(f: Faculty) {
    return (
      <div className="flex items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate flex items-center gap-2">
            <span className="truncate">{f.name}</span>
            {f.isDean && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent shrink-0">
                Dean
              </span>
            )}
            {f.isHead && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent shrink-0">
                Head
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 mt-0.5">
            <span className="truncate">{f.designation}</span>
            <span aria-hidden="true">·</span>
            <span>{labelForType(f.type)}</span>
            {f.suId && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{f.suId}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/admin/faculty/${f.id}`}
            aria-label={`Edit ${f.name}`}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <Pencil size={16} />
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(f.id, f.name)}
            aria-label={`Delete ${f.name}`}
            className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label} ({counts[value]})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-sm">
            {filter === 'all'
              ? 'No faculty yet.'
              : `No ${labelForType(filter).toLowerCase()} faculty.`}
          </p>
          {filter === 'all' && (
            <Link
              href="/admin/faculty/new"
              className="text-accent hover:underline font-medium text-sm mt-2 inline-block"
            >
              Add the first faculty
            </Link>
          )}
        </div>
      ) : filter === 'all' ? (
        <SortableList
          items={filtered}
          getId={(f) => f.id}
          onReorder={async (ids) => {
            const res = await reorderFacultyAction(ids);
            if (!res.ok) throw new Error(res.error);
          }}
          renderItem={renderRow}
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((f) => (
            <li key={f.id} className="bg-white border border-gray-200 rounded-lg p-3 pl-10">
              {renderRow(f)}
            </li>
          ))}
        </ul>
      )}

      {filter !== 'all' && filtered.length > 0 && (
        <p className="text-xs text-gray-500">
          Switch to{' '}
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="underline hover:text-primary"
          >
            All
          </button>{' '}
          to reorder.
        </p>
      )}
    </div>
  );
}
