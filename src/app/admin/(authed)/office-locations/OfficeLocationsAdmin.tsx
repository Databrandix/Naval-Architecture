'use client';

import { useActionState, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  deleteOfficeLocation,
  moveOfficeLocation,
  saveOfficeLocation,
  type ActionResult,
} from '@/lib/admin-actions/office-locations';

type Office = {
  id: string;
  name: string;
  level: string;
  building: string;
  isDepartment: boolean;
};

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/50 focus:outline-none';

function Feedback({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  return state.ok ? (
    <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
      <CheckCircle2 size={15} aria-hidden />
      {state.message}
    </p>
  ) : (
    <p role="alert" className="flex items-center gap-2 text-sm font-medium text-red-700">
      <AlertCircle size={15} aria-hidden />
      {state.error}
    </p>
  );
}

/**
 * One form for adding and editing.
 *
 * Editing opens the same fields with the row's values and a hidden id, rather
 * than a second form kept in step with this one by hand.
 */
function OfficeForm({
  editing,
  onDone,
  buildingSuggestion,
}: {
  editing: Office | null;
  onDone: () => void;
  buildingSuggestion: string;
}) {
  const [state, save, saving] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await saveOfficeLocation(prev, formData);
      if (result.ok) onDone();
      return result;
    },
    null,
  );

  return (
    <form action={save} className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          {editing ? `Edit ${editing.name}` : 'Add an office'}
        </h2>
        {editing && (
          <button type="button" onClick={onDone} className="text-sm text-gray-500 underline">
            Cancel
          </button>
        )}
      </div>

      {editing && <input type="hidden" name="id" value={editing.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Office</span>
          <input
            name="name"
            required
            defaultValue={editing?.name ?? ''}
            placeholder="Office of the Registrar"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Level</span>
          <input
            name="level"
            required
            defaultValue={editing?.level ?? ''}
            placeholder="Level 05"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-700">Building</span>
        <input
          name="building"
          defaultValue={editing?.building ?? buildingSuggestion}
          placeholder="147/I, Panthapath, Green Road, Dhaka"
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="isDepartment"
          defaultChecked={editing?.isDepartment ?? false}
          className="size-4 rounded border-gray-300"
        />
        Belongs to this department — listed first on the page
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          {editing ? 'Save changes' : 'Add office'}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export default function OfficeLocationsAdmin({ offices }: { offices: Office[] }) {
  const [editing, setEditing] = useState<Office | null>(null);
  const [moveState, move, moving] = useActionState(moveOfficeLocation, null);
  const [removeState, remove, removing] = useActionState(deleteOfficeLocation, null);
  const [confirming, setConfirming] = useState<string | null>(null);

  /* Every office in this list has sat in the same building so far; offering it
     as the default saves retyping the address on each new row. */
  const buildingSuggestion = offices[0]?.building ?? '';

  return (
    <div className="space-y-8">
      <OfficeForm
        editing={editing}
        onDone={() => setEditing(null)}
        buildingSuggestion={buildingSuggestion}
      />

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
            {offices.length} offices
          </h2>
          <Feedback state={moveState ?? removeState} />
        </div>

        {offices.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            No offices yet. Add the first one above.
          </p>
        )}

        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {offices.map((office, index) => (
            <li key={office.id} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-900">
                  {office.name}
                  {office.isDepartment && (
                    <span className="bg-accent/10 text-accent ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                      Department
                    </span>
                  )}
                </span>
                <span className="block text-xs text-gray-500">
                  {office.level}
                  {office.building ? ` · ${office.building}` : ''}
                </span>
              </span>

              <form action={move}>
                <input type="hidden" name="id" value={office.id} />
                <input type="hidden" name="direction" value="up" />
                <button
                  type="submit"
                  disabled={moving || index === 0}
                  aria-label={`Move ${office.name} up`}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                >
                  <ArrowUp size={15} />
                </button>
              </form>

              <form action={move}>
                <input type="hidden" name="id" value={office.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  type="submit"
                  disabled={moving || index === offices.length - 1}
                  aria-label={`Move ${office.name} down`}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                >
                  <ArrowDown size={15} />
                </button>
              </form>

              <button
                type="button"
                onClick={() => setEditing(office)}
                aria-label={`Edit ${office.name}`}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <Pencil size={15} />
              </button>

              {confirming === office.id ? (
                <form action={remove} className="flex items-center gap-1.5">
                  <input type="hidden" name="id" value={office.id} />
                  <button
                    type="submit"
                    disabled={removing}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    aria-label="Keep it"
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100"
                  >
                    <X size={15} />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(office.id)}
                  aria-label={`Remove ${office.name}`}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
