'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Scholarship } from '@prisma/client';
import {
  createScholarshipAction,
  updateScholarshipAction,
  type ActionResult,
} from '@/lib/admin-actions/scholarships';

type State = ActionResult | { ok: null };

export default function ScholarshipForm({ initial }: { initial: Scholarship | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateScholarshipAction.bind(null, initial!.id) : createScholarshipAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Scholarship saved' : 'Scholarship created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField label="Slug" name="slug" required monospace
                     defaultValue={initial?.slug ?? ''} placeholder="slab-1" />
          <TextField label="Name (kicker)" name="name" required
                     defaultValue={initial?.name ?? ''} placeholder="Slab 1" />
        </div>
        <TextField label="Credits descriptor (card heading)" name="credits" required
                   defaultValue={initial?.credits ?? ''} placeholder="10 Credits or Fewer" />
      </Card>

      <Card title="Percentages">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TextField label="Base scholarship" name="base" required
                     defaultValue={initial?.base ?? ''} placeholder="2% or 'Highest'" />
          <TextField label="GPA 4.00" name="perfect" required
                     defaultValue={initial?.perfect ?? ''} placeholder="25%" />
          <TextField label="GPA 3.90 – 3.99" name="near" required
                     defaultValue={initial?.near ?? ''} placeholder="10%" />
        </div>
      </Card>

      <Card title="Display">
        <CheckboxField label="Best Value highlight (primary background + button-yellow ribbon)"
                       name="isHighlight" defaultChecked={initial?.isHighlight ?? false} />
        <p className="text-xs text-gray-500 -mt-2">
          Only one slab should typically have this enabled — it stands out from the others on the public page.
        </p>
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/scholarships" className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to scholarships
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create slab'}
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
  label, name, defaultValue, required, placeholder, monospace,
}: { label: string; name: string; defaultValue?: string; required?: boolean; placeholder?: string; monospace?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} type="text"
             defaultValue={defaultValue} required={required} placeholder={placeholder}
             className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent ${monospace ? 'font-mono' : ''}`} />
    </div>
  );
}

function CheckboxField({
  label, name, defaultChecked,
}: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
      <input type="checkbox" name={name} defaultChecked={defaultChecked}
             className="mt-0.5 w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent/50" />
      <span>{label}</span>
    </label>
  );
}
