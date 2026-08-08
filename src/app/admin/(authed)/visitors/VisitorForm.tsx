'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Visitor } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import ParagraphsEditor from '@/components/admin/ParagraphsEditor';
import {
  createVisitorAction,
  updateVisitorAction,
  type ActionResult,
} from '@/lib/admin-actions/visitors';

type State = ActionResult | { ok: null };

export default function VisitorForm({ initial }: { initial: Visitor | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateVisitorAction.bind(null, initial!.id) : createVisitorAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Visitor saved' : 'Visitor created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  const initialQuote = Array.isArray(initial?.quote) ? (initial.quote as string[]) : [];

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Slug" name="slug" required monospace
                     defaultValue={initial?.slug ?? ''} placeholder="dr-s-r-subramanya" />
          <TextField label="Name" name="name" required defaultValue={initial?.name ?? ''} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Role (optional)" name="role" defaultValue={initial?.role ?? ''} placeholder="Professor / Advisor / VC" />
          <TextField label="Affiliation (optional)" name="affiliation" defaultValue={initial?.affiliation ?? ''} placeholder="Ministry of … / SU" />
        </div>
      </Card>

      <Card title="Photo">
        <ImageUploader kind="visitor-photo" name="photo" aspectRatio="square"
                       initialUrl={initial?.photoUrl}
                       initialPublicId={initial?.photoPublicId} />
      </Card>

      <Card title="Quote — paragraphs">
        <p className="text-xs text-gray-500 -mt-2">One paragraph per row. Single-paragraph quotes are normal.</p>
        <ParagraphsEditor name="quote" initialValue={initialQuote}
                          helpText={<p className="text-xs text-gray-500">Plain prose; renders on /student-society/visitor.</p>} />
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/visitors" className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to visitors
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create visitor'}
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
