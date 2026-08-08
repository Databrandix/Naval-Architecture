'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { News } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import ParagraphsEditor from '@/components/admin/ParagraphsEditor';
import KeyValueListEditor from '@/components/admin/KeyValueListEditor';
import {
  createNewsAction,
  updateNewsAction,
  type ActionResult,
} from '@/lib/admin-actions/news';

type State = ActionResult | { ok: null };

const CATEGORIES = ['Academic', 'Achievement', 'Event', 'Workshop', 'Seminar', 'Industrial Visit'] as const;

// Convert DB DateTime → "YYYY-MM-DD" for <input type="date">.
function dateInputValue(d: Date | null | undefined): string {
  if (!d) return '';
  const iso = new Date(d).toISOString();
  return iso.slice(0, 10);
}

export default function NewsForm({ initial }: { initial: News | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateNewsAction.bind(null, initial!.id) : createNewsAction;

  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'News article saved' : 'News article created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  const initialBody = Array.isArray(initial?.body) ? (initial.body as string[]) : [];
  const initialMeta = Array.isArray(initial?.meta) ? initial.meta : [];

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Slug (URL path /news/<slug>)" name="slug" required monospace
                     defaultValue={initial?.slug ?? ''}
                     placeholder="bmtf-industrial-visit-2025" />
          <SelectField label="Category" name="category" required
                       options={CATEGORIES}
                       defaultValue={initial?.category ?? 'Industrial Visit'} />
        </div>
        <TextField label="Title (full)" name="title" required
                   defaultValue={initial?.title ?? ''} />
        <TextField label="Short title (card / breadcrumb)" name="shortTitle" required
                   defaultValue={initial?.shortTitle ?? ''} />
        <TextAreaField label="Summary (1-line card description)" name="summary" required rows={3}
                       defaultValue={initial?.summary ?? ''} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Published at (sort + auto-display)" name="publishedAt" type="date" required
                     defaultValue={dateInputValue(initial?.publishedAt)} />
          <TextField label="Display date override (optional, e.g. &quot;2024&quot;)" name="displayDate"
                     defaultValue={initial?.displayDate ?? ''}
                     placeholder="01 Sep, 2025" />
        </div>
      </Card>

      <Card title="Cover image">
        <ImageUploader kind="news-cover" name="cover" aspectRatio="wide"
                       initialUrl={initial?.coverUrl}
                       initialPublicId={initial?.coverPublicId} />
      </Card>

      <Card title="Body — paragraphs">
        <p className="text-xs text-gray-500 -mt-2">
          One paragraph per row. Empty rows are dropped on save.
        </p>
        <ParagraphsEditor
          name="body"
          initialValue={initialBody}
          helpText={
            <p className="text-xs text-gray-500">
              Plain prose. Use the public detail page to preview after save.
            </p>
          }
        />
      </Card>

      <Card title="Meta details (optional)">
        <p className="text-xs text-gray-500 -mt-2">
          Optional key-value rows shown under the cover (e.g. Participants, Location).
        </p>
        <KeyValueListEditor
          name="meta"
          initialValue={initialMeta}
          labelPlaceholder="Label (e.g. Participants)"
          valuePlaceholder="Value (e.g. 35 Students & 4 Faculty Members)"
          addButtonLabel="Add detail"
          emptyHint="No extra detail rows yet."
        />
      </Card>

      {state.ok === false && (
        <div role="alert"
             className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/news"
              className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to news
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create article'}
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
  label, name, defaultValue, required, placeholder, monospace, type = 'text',
}: { label: string; name: string; defaultValue?: string; required?: boolean; placeholder?: string; monospace?: boolean; type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        <span dangerouslySetInnerHTML={{ __html: label }} />
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} type={type}
             defaultValue={defaultValue} required={required} placeholder={placeholder}
             className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent ${monospace ? 'font-mono' : ''}`} />
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
