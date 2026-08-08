'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import SortableList from '@/components/admin/SortableList';
import LinkListSection from '@/components/admin/LinkListSection';
import type { MainNavGroupWithItems } from './NavAdmin';
import {
  createMainNavGroupAction, updateMainNavGroupAction, deleteMainNavGroupAction, reorderMainNavGroupsAction,
  createMainNavItemAction, updateMainNavItemAction, deleteMainNavItemAction, reorderMainNavItemsAction,
} from '@/lib/admin-actions/chrome-nav';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

type ActionResult = { ok: true } | { ok: false; error: string };

export default function MainNavSection({ groups: initialGroups }: { groups: MainNavGroupWithItems[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items: groups, removeById } = useAdminListItems(initialGroups);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: 'Delete nav group?',
      message: `"${name}" and all its items will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteMainNavGroupAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Group deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function handleCreate(fd: FormData) {
    const res = await createMainNavGroupAction(fd);
    if (res.ok) { toast.success('Group created'); setAdding(false); router.refresh(); }
    else toast.error(res.error);
  }

  async function handleUpdate(id: string, fd: FormData) {
    const res = await updateMainNavGroupAction(id, fd);
    if (res.ok) { toast.success('Group saved'); setEditingId(null); router.refresh(); }
    else toast.error(res.error);
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Main Nav</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            The main navbar groups. Click any group to expand its items.
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {groups.length} group{groups.length === 1 ? '' : 's'}
            {groups.length > 1 && ' · drag to reorder'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setAdding((v) => !v); setEditingId(null); }}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {adding ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add group</>}
        </button>
      </header>

      {adding && (
        <GroupForm mode="create" onSubmit={handleCreate} onCancel={() => setAdding(false)} />
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-2">No nav groups yet.</p>
      ) : (
        <SortableList
          items={groups}
          getId={(g) => g.id}
          onReorder={async (ids) => {
            const res = await reorderMainNavGroupsAction(ids);
            if (!res.ok) throw new Error(res.error);
          }}
          renderItem={(group) => (
            <div className="w-full">
              {editingId === group.id ? (
                <GroupForm
                  mode="edit"
                  initial={group}
                  onSubmit={(fd) => handleUpdate(group.id, fd)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <GroupHeaderRow
                  group={group}
                  isExpanded={expanded.has(group.id)}
                  onToggle={() => toggleExpand(group.id)}
                  onEdit={() => { setEditingId(group.id); setAdding(false); }}
                  onDelete={() => handleDelete(group.id, group.name)}
                />
              )}

              {expanded.has(group.id) && editingId !== group.id && (
                <div className="mt-3 ml-6 border-l-2 border-gray-100 pl-4">
                  <LinkListSection
                    title="Items"
                    description={group.hasDropdown ? 'Dropdown panel children.' : 'This group is a plain link — items here are ignored on the public site.'}
                    items={group.items}
                    createAction={(fd) => createMainNavItemAction(group.id, fd)}
                    updateAction={updateMainNavItemAction}
                    deleteAction={deleteMainNavItemAction}
                    reorderAction={(ids) => reorderMainNavItemsAction(group.id, ids)}
                  />
                </div>
              )}
            </div>
          )}
        />
      )}
    </section>
  );
}

function GroupHeaderRow({
  group,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  group: MainNavGroupWithItems;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 min-w-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 min-w-0 flex-1 text-left hover:bg-gray-50 -m-1 p-1 rounded transition-colors"
      >
        {group.hasDropdown ? (
          isExpanded ? <ChevronDown size={16} className="text-gray-500 shrink-0" /> : <ChevronRight size={16} className="text-gray-500 shrink-0" />
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 truncate">{group.name}</span>
            {group.hasDropdown ? (
              <span className="text-[10px] uppercase tracking-wider bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                dropdown · {group.items.length} item{group.items.length === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                plain link
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 truncate font-mono mt-0.5">
            {group.href ?? <em className="not-italic text-gray-300">(no href — dropdown)</em>}
          </div>
        </div>
      </button>
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" onClick={onEdit} aria-label={`Edit ${group.name}`}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
          <Pencil size={15} />
        </button>
        <button type="button" onClick={onDelete} aria-label={`Delete ${group.name}`}
                className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function GroupForm({
  mode,
  initial,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initial?: MainNavGroupWithItems;
  onSubmit: (fd: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [hasDropdown, setHasDropdown] = useState<boolean>(initial?.hasDropdown ?? false);

  function handle(fd: FormData) {
    startTransition(async () => { await onSubmit(fd); });
  }

  return (
    <form action={handle} className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input type="text" name="name" required maxLength={200}
                 defaultValue={initial?.name ?? ''}
                 className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {hasDropdown ? 'Dropdown title (optional)' : 'Href *'}
          </label>
          {hasDropdown ? (
            <input type="text" name="title"
                   defaultValue={initial?.title ?? ''}
                   placeholder="Usually same as Name"
                   className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
          ) : (
            <input type="text" name="href" required
                   defaultValue={initial?.href ?? ''}
                   placeholder="/contact, /faculty-member, …"
                   className="w-full px-2.5 py-1.5 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
          )}
        </div>
      </div>

      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
        <input type="checkbox" name="hasDropdown"
               checked={hasDropdown}
               onChange={(e) => setHasDropdown(e.target.checked)}
               className="accent-accent" />
        Has dropdown panel (with child items)
      </label>

      {/* When dropdown is on we still allow setting href to null via hidden empty input */}
      {hasDropdown && <input type="hidden" name="href" value="" />}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
                className="text-sm px-3 py-1.5 text-gray-600 hover:text-gray-900 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={pending}
                className="text-sm px-3 py-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          {pending ? 'Saving…' : mode === 'create' ? 'Create group' : 'Save'}
        </button>
      </div>
    </form>
  );
}
