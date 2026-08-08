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
  deleteServiceCharterEntry,
  moveServiceCharterEntry,
  saveServiceCharterEntry,
  type ActionResult,
} from '@/lib/admin-actions/service-charter';

type Service = {
  id: string;
  serial: number;
  title: string;
  steps: string[];
  responsible: string;
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

function ServiceForm({ editing, onDone }: { editing: Service | null; onDone: () => void }) {
  const [state, save, saving] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await saveServiceCharterEntry(prev, formData);
      if (result.ok) onDone();
      return result;
    },
    null,
  );

  return (
    <form
      action={save}
      className="space-y-3 rounded-xl border border-gray-200 bg-white p-5"
      /* Remounting on edit reseeds every defaultValue; without it the fields
         keep the previous service's text when you switch rows. */
      key={editing?.id ?? 'new'}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          {editing ? `Edit service ${editing.serial}` : 'Add a service'}
        </h2>
        {editing && (
          <button type="button" onClick={onDone} className="text-sm text-gray-500 underline">
            Cancel
          </button>
        )}
      </div>

      {editing && <input type="hidden" name="id" value={editing.id} />}

      <div className="grid gap-3 sm:grid-cols-[6rem_1fr]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Number</span>
          <input
            name="serial"
            type="number"
            min={1}
            defaultValue={editing?.serial ?? ''}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Service</span>
          <input
            name="title"
            required
            defaultValue={editing?.title ?? ''}
            placeholder="Registration Process"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-700">Steps — one per line</span>
        <textarea
          name="steps"
          rows={4}
          required
          defaultValue={editing?.steps.join('\n') ?? ''}
          placeholder={'Accounts Clearance (Room 313)\nMeet the Batch Advisor\nCollect the registration slip'}
          className={`${inputClass} resize-y`}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-700">
          Responsible — name, role, phone, email, room
        </span>
        <textarea
          name="responsible"
          rows={2}
          defaultValue={editing?.responsible ?? ''}
          placeholder="Sheikh Abid Ibn Shahed (Lecturer & Coordinator) Contact No: … e-mail: … Room no: 504"
          className={`${inputClass} resize-y`}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          {editing ? 'Save changes' : 'Add service'}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export default function ServiceCharterAdmin({ services }: { services: Service[] }) {
  const [editing, setEditing] = useState<Service | null>(null);
  const [moveState, move, moving] = useActionState(moveServiceCharterEntry, null);
  const [removeState, remove, removing] = useActionState(deleteServiceCharterEntry, null);
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <ServiceForm editing={editing} onDone={() => setEditing(null)} />

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
            {services.length} services
          </h2>
          <Feedback state={moveState ?? removeState} />
        </div>

        {services.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            No services yet. Add the first one above.
          </p>
        )}

        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {services.map((service, index) => (
            <li key={service.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-primary bg-primary/5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {service.serial}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-900">
                  {service.title}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {service.steps.length} step{service.steps.length === 1 ? '' : 's'}
                  {service.responsible ? ` · ${service.responsible.split(/\s*Contact No:/i)[0]}` : ''}
                </span>
              </span>

              <form action={move}>
                <input type="hidden" name="id" value={service.id} />
                <input type="hidden" name="direction" value="up" />
                <button
                  type="submit"
                  disabled={moving || index === 0}
                  aria-label={`Move ${service.title} up`}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                >
                  <ArrowUp size={15} />
                </button>
              </form>

              <form action={move}>
                <input type="hidden" name="id" value={service.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  type="submit"
                  disabled={moving || index === services.length - 1}
                  aria-label={`Move ${service.title} down`}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                >
                  <ArrowDown size={15} />
                </button>
              </form>

              <button
                type="button"
                onClick={() => setEditing(service)}
                aria-label={`Edit ${service.title}`}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <Pencil size={15} />
              </button>

              {confirming === service.id ? (
                <form action={remove} className="flex items-center gap-1.5">
                  <input type="hidden" name="id" value={service.id} />
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
                  onClick={() => setConfirming(service.id)}
                  aria-label={`Remove ${service.title}`}
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
