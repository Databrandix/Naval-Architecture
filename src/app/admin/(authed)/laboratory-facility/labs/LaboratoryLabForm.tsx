'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { LaboratoryLab } from '@prisma/client';
import {
  createLaboratoryLabAction,
  updateLaboratoryLabAction,
  type ActionResult,
} from '@/lib/admin-actions/laboratory-facility';
import IconInputField from '@/components/admin/IconInputField';

type State = ActionResult | { ok: null };

export default function LaboratoryLabForm({ initial }: { initial: LaboratoryLab | null }) {
  const isEdit = !!initial;
  const action = isEdit
    ? updateLaboratoryLabAction.bind(null, initial!.id)
    : createLaboratoryLabAction;

  const [iconName, setIconName] = useState<string>(initial?.iconName ?? '');

  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Laboratory saved' : 'Laboratory created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Card content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IconInputField
            name="iconName"
            label="Lucide icon name"
            required
            value={iconName}
            onChange={setIconName}
            placeholder="Flame, Droplets, Wrench, …"
            helperText="PascalCase name from lucide.dev/icons"
          />
          <TextField label="Title" name="title" required
                     defaultValue={initial?.title ?? ''}
                     placeholder="Applied Thermodynamics & Heat Engine Laboratory" />
        </div>
        <TextAreaField label="Description" name="description" required rows={3}
                       defaultValue={initial?.description ?? ''} />
      </Card>

      <Card title="Equipment block">
        <p className="text-xs text-gray-500 -mt-2">
          The two-line block at the bottom of the card. Label is the bold lead (e.g. <code className="font-mono">Key Equipment</code> / <code className="font-mono">Key Software</code> / <code className="font-mono">Key Processes</code>); items are a single comma-separated sentence.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Key label" name="keyLabel" required
                     defaultValue={initial?.keyLabel ?? ''}
                     placeholder="Key Equipment" />
        </div>
        <TextAreaField label="Key items (single sentence, comma-separated)"
                       name="keyItems" required rows={3}
                       defaultValue={initial?.keyItems ?? ''} />
        <TextAreaField label="Learning Focus" name="focus" required rows={2}
                       defaultValue={initial?.focus ?? ''} />
      </Card>

      {state.ok === false && (
        <div role="alert"
             className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/laboratory-facility"
              className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to laboratory facility
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create laboratory'}
        </button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function TextField({
  label, name, defaultValue, required, placeholder,
}: { label: string; name: string; defaultValue?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} type="text"
             defaultValue={defaultValue} required={required} placeholder={placeholder}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" />
    </div>
  );
}

function TextAreaField({
  label, name, defaultValue, required, rows = 4,
}: { label: string; name: string; defaultValue?: string; required?: boolean; rows?: number }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <textarea id={name} name={name}
                defaultValue={defaultValue} required={required} rows={rows}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y" />
    </div>
  );
}
