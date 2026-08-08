'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import SortableList from './SortableList';
import IconInputField from './IconInputField';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from './ConfirmDialogProvider';

export type LinkRowShape = {
  id: string;
  name: string;
  href: string | null;
  isExternal: boolean;
  isDisabled: boolean;
};

type ActionResult = { ok: true } | { ok: false; error: string };

type Props<T extends LinkRowShape> = {
  title: string;
  description?: string;
  items: T[];
  emptyText?: string;
  /** Server action that takes FormData and returns { ok } / { ok: false, error }. */
  createAction: (fd: FormData) => Promise<ActionResult>;
  /** id-bound update action; the section calls `updateAction(id, fd)`. */
  updateAction: (id: string, fd: FormData) => Promise<ActionResult>;
  deleteAction: (id: string) => Promise<ActionResult>;
  reorderAction: (ids: string[]) => Promise<ActionResult>;
  /** Optional extra field — used by QuickAccess for `iconName`.
   *  `kind: 'icon'` swaps the plain text input for the Phase 20
   *  IconInputField with live preview + picker.
   */
  extraField?: {
    name: string;
    label: string;
    placeholder?: string;
    valueOf: (item: T) => string;
    kind?: 'text' | 'icon';
  };
};

export default function LinkListSection<T extends LinkRowShape>({
  title,
  description,
  items: initialItems,
  emptyText = 'No items yet. Click + Add to create the first.',
  createAction,
  updateAction,
  deleteAction,
  reorderAction,
  extraField,
}: Props<T>) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: 'Delete item?',
      message: `"${name}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function handleCreate(fd: FormData) {
    const res = await createAction(fd);
    if (res.ok) {
      toast.success('Created');
      setAdding(false);
      startTransition(() => router.refresh());
    } else {
      toast.error(res.error);
    }
  }

  async function handleUpdate(id: string, fd: FormData) {
    const res = await updateAction(id, fd);
    if (res.ok) {
      toast.success('Saved');
      setEditingId(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(res.error);
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          <p className="text-xs text-gray-400 mt-0.5">
            {items.length} item{items.length === 1 ? '' : 's'}
            {items.length > 1 && ' · drag to reorder'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setAdding((v) => !v); setEditingId(null); }}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {adding ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add</>}
        </button>
      </header>

      {adding && (
        <RowForm
          mode="create"
          extraField={extraField}
          onSubmit={handleCreate}
          onCancel={() => setAdding(false)}
        />
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-2">{emptyText}</p>
      ) : (
        <SortableList
          items={items}
          getId={(i) => i.id}
          onReorder={async (ids) => {
            const res = await reorderAction(ids);
            if (!res.ok) throw new Error(res.error);
          }}
          renderItem={(item) =>
            editingId === item.id ? (
              <RowForm
                mode="edit"
                initial={item}
                extraField={extraField}
                onSubmit={(fd) => handleUpdate(item.id, fd)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <RowView
                item={item}
                extraField={extraField}
                onEdit={() => { setEditingId(item.id); setAdding(false); }}
                onDelete={() => handleDelete(item.id, item.name)}
              />
            )
          }
        />
      )}
    </section>
  );
}

function RowView<T extends LinkRowShape>({
  item,
  extraField,
  onEdit,
  onDelete,
}: {
  item: T;
  extraField?: Props<T>['extraField'];
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 min-w-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 truncate">{item.name}</span>
          {item.isDisabled && (
            <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">disabled</span>
          )}
          {item.isExternal && (
            <span className="text-[10px] uppercase tracking-wider bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">external</span>
          )}
          {extraField && (
            <span className="text-[10px] uppercase tracking-wider bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono">
              {extraField.valueOf(item) || '—'}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate font-mono mt-0.5">
          {item.href ?? <em className="not-italic text-gray-300">(no href)</em>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${item.name}`}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${item.name}`}
          className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function RowForm<T extends LinkRowShape>({
  mode,
  initial,
  extraField,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initial?: T;
  extraField?: Props<T>['extraField'];
  onSubmit: (fd: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [extraValue, setExtraValue] = useState<string>(
    extraField && initial ? extraField.valueOf(initial) : '',
  );
  async function handle(fd: FormData) {
    startTransition(async () => {
      await onSubmit(fd);
    });
  }
  return (
    <form action={handle} className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input
            type="text" name="name" required maxLength={200}
            defaultValue={initial?.name ?? ''}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Href</label>
          <input
            type="text" name="href"
            defaultValue={initial?.href ?? ''}
            placeholder="/about/overview or https://… — leave blank if disabled"
            className="w-full px-2.5 py-1.5 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
        </div>
      </div>

      {extraField && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{extraField.label} *</label>
          {extraField.kind === 'icon' ? (
            <IconInputField
              compact
              name={extraField.name}
              required
              value={extraValue}
              onChange={setExtraValue}
              placeholder={extraField.placeholder}
            />
          ) : (
            <input
              type="text" name={extraField.name} required
              value={extraValue}
              onChange={(e) => setExtraValue(e.target.value)}
              placeholder={extraField.placeholder}
              className="w-full px-2.5 py-1.5 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox" name="isExternal"
            defaultChecked={initial?.isExternal ?? false}
            className="accent-accent"
          />
          External link
        </label>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox" name="isDisabled"
            defaultChecked={initial?.isDisabled ?? false}
            className="accent-accent"
          />
          Disabled (no href)
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
                className="text-sm px-3 py-1.5 text-gray-600 hover:text-gray-900 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={pending}
                className="text-sm px-3 py-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          {pending ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
        </button>
      </div>
    </form>
  );
}
