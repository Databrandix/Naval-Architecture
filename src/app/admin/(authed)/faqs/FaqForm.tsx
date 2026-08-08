'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Faq } from '@prisma/client';
import {
  createFaqAction,
  updateFaqAction,
  type ActionResult,
} from '@/lib/admin-actions/faqs';

type State = ActionResult | { ok: null };

const CATEGORIES = ['Admission', 'Rankings', 'Campus', 'Programs', 'Exams'] as const;

export default function FaqForm({ initial }: { initial: Faq | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateFaqAction.bind(null, initial!.id) : createFaqAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'FAQ saved' : 'FAQ created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Q&A">
        <SelectField label="Category" name="category" required options={CATEGORIES}
                     defaultValue={initial?.category ?? 'Admission'} />
        <TextAreaField label="Question" name="question" required rows={2}
                       defaultValue={initial?.question ?? ''}
                       placeholder="Is the LL.B (2-year) program available?" />
        <TextAreaField label="Answer" name="answer" required rows={4}
                       defaultValue={initial?.answer ?? ''}
                       placeholder="We apologize, but our 2-year LLM/LL.B programs are currently closed." />
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/faqs" className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to FAQs
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create FAQ'}
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

function SelectField({
  label, name, defaultValue, required, options,
}: { label: string; name: string; defaultValue?: string; required?: boolean; options: readonly string[] }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <select id={name} name={name} defaultValue={defaultValue} required={required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
