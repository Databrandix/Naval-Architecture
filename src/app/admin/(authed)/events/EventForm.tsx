'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Event as EventRow } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import ParagraphsEditor from '@/components/admin/ParagraphsEditor';
import KeyValueListEditor from '@/components/admin/KeyValueListEditor';
import {
  createEventAction,
  updateEventAction,
  type ActionResult,
} from '@/lib/admin-actions/events';

type State = ActionResult | { ok: null };

const CATEGORIES = ['Sports', 'Industrial Visit', 'Achievement', 'Partnership', 'Seminar', 'Exhibition'] as const;
const STATUSES = ['Past', 'Current', 'Upcoming'] as const;

function dateInputValue(d: Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export default function EventForm({ initial }: { initial: EventRow | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateEventAction.bind(null, initial!.id) : createEventAction;

  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Event saved' : 'Event created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  const initialDescription = Array.isArray(initial?.description) ? (initial.description as string[]) : [];
  const initialDetails = Array.isArray(initial?.details) ? initial.details : [];

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Slug (URL path)" name="slug" required monospace
                     defaultValue={initial?.slug ?? ''}
                     placeholder="cricket-tournament-2026" />
          <SelectField label="Category" name="category" required options={CATEGORIES}
                       defaultValue={initial?.category ?? 'Seminar'} />
        </div>
        <TextField label="Title (full)" name="title" required
                   defaultValue={initial?.title ?? ''} />
        <TextField label="Short title (card / sidebar)" name="shortTitle" required
                   defaultValue={initial?.shortTitle ?? ''} />
        <TextAreaField label="Summary (1-line card description)" name="summary" required rows={3}
                       defaultValue={initial?.summary ?? ''} />
      </Card>

      <Card title="Status & date">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField label="Status" name="status" required options={STATUSES}
                       defaultValue={initial?.status ?? 'Upcoming'} />
          <TextField label="Event date (optional, sort key)" name="eventDate" type="date"
                     defaultValue={dateInputValue(initial?.eventDate)} />
          <TextField label="Display date override" name="displayDate"
                     defaultValue={initial?.displayDate ?? ''}
                     placeholder='e.g. "2024" or "20 Apr"' />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Time (optional)" name="time"
                     defaultValue={initial?.time ?? ''}
                     placeholder="8:00 PM" />
          <TextField label="Venue (optional)" name="venue"
                     defaultValue={initial?.venue ?? ''}
                     placeholder="Sonargaon University Campus" />
        </div>
      </Card>

      <Card title="Cover image">
        <ImageUploader kind="event-image" name="image" aspectRatio="wide"
                       initialUrl={initial?.imageUrl}
                       initialPublicId={initial?.imagePublicId} />
      </Card>

      <Card title="Description — paragraphs">
        <p className="text-xs text-gray-500 -mt-2">
          Body shown on the detail page. One paragraph per row.
        </p>
        <ParagraphsEditor name="description" initialValue={initialDescription}
                          helpText={<p className="text-xs text-gray-500">Plain prose; preview after save.</p>} />
      </Card>

      <Card title="Focus statement">
        <TextAreaField label="Focus (single sentence — accent-highlighted on detail page)" name="focus" required rows={2}
                       defaultValue={initial?.focus ?? ''}
                       placeholder="Sportsmanship, Team Building, and Departmental Pride." />
      </Card>

      <Card title="Additional details (optional)">
        <p className="text-xs text-gray-500 -mt-2">
          Optional key-value rows shown in the &quot;Additional Information&quot; box (e.g. Chief Guest, Chairperson).
        </p>
        <KeyValueListEditor name="details" initialValue={initialDetails}
                            labelPlaceholder="Label (e.g. Chief Guest)"
                            valuePlaceholder="Value (e.g. Professor Shamim Ara Hassan, VC)"
                            addButtonLabel="Add detail"
                            emptyHint="No additional details yet." />
      </Card>

      <Card title="Call-to-action (optional)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="CTA label" name="ctaLabel"
                     defaultValue={initial?.ctaLabel ?? ''}
                     placeholder="Register Now" />
          <TextField label="CTA href" name="ctaHref" monospace
                     defaultValue={initial?.ctaHref ?? ''}
                     placeholder="https://… or /…" />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="ctaExternal" defaultChecked={initial?.ctaExternal ?? false}
                 className="rounded border-gray-300 text-accent focus:ring-accent" />
          Open in new tab (external link)
        </label>
      </Card>

      {state.ok === false && (
        <div role="alert"
             className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/events"
              className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to events
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
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
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} type={type}
             defaultValue={defaultValue} required={required} placeholder={placeholder}
             className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent ${monospace ? 'font-mono' : ''}`} />
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
