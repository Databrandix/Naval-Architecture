'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { ResearchPaper } from '@prisma/client';
import KeyValueListEditor from '@/components/admin/KeyValueListEditor';
import {
  createResearchPaperAction,
  updateResearchPaperAction,
  type ActionResult,
} from '@/lib/admin-actions/research-papers';

type State = ActionResult | { ok: null };

export default function ResearchPaperForm({ initial }: { initial: ResearchPaper | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateResearchPaperAction.bind(null, initial!.id) : createResearchPaperAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Research paper saved' : 'Research paper created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Paper">
        <TextAreaField label="Title" name="title" required rows={2} defaultValue={initial?.title ?? ''} />
        <TextAreaField label="Authors" name="authors" required rows={2}
                       defaultValue={initial?.authors ?? ''}
                       placeholder="Comma-separated list" />
        <TextAreaField label="Department / Affiliation (area)" name="area" required rows={2}
                       defaultValue={initial?.area ?? ''} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Date (free-form, optional)" name="date"
                     defaultValue={initial?.date ?? ''}
                     placeholder='"14 August 2019" / "2023" / "January–February 2023"' />
          <NumberField label="Publication year (optional)" name="publicationYear"
                       defaultValue={initial?.publicationYear ?? ''} min={1900} max={2100}
                       placeholder="2023" />
        </div>
        <p className="text-xs text-gray-500">
          The structured year (left) enables optional year-based sort/filter; the free-form date string (right) keeps human-readable nuance like &quot;January–February 2023&quot;.
        </p>
        <KeyValueListEditor
          name="links"
          initialValue={initial?.links}
          labelPlaceholder="DOI"
          valuePlaceholder="https://doi.org/10.1109/..."
          addButtonLabel="Add link"
          emptyHint="No links yet."
        />
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/research-papers" className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to research papers
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create paper'}
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

function NumberField({
  label, name, defaultValue, required, placeholder, min, max,
}: { label: string; name: string; defaultValue?: string | number; required?: boolean; placeholder?: string; min?: number; max?: number }) {
  const def = defaultValue === null || defaultValue === undefined ? '' : String(defaultValue);
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} type="number" min={min} max={max}
             defaultValue={def} required={required} placeholder={placeholder}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" />
    </div>
  );
}

function TextAreaField({
  label, name, defaultValue, required, rows = 4, placeholder,
}: { label: string; name: string; defaultValue?: string; required?: boolean; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <textarea id={name} name={name}
                defaultValue={defaultValue} required={required} rows={rows} placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y" />
    </div>
  );
}
