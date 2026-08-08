'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { WaiverCategory } from '@prisma/client';
import HeadingBodyListEditor from '@/components/admin/HeadingBodyListEditor';
import IconInputField from '@/components/admin/IconInputField';
import {
  createWaiverCategoryAction,
  updateWaiverCategoryAction,
  type ActionResult,
} from '@/lib/admin-actions/waiver-categories';

type State = ActionResult | { ok: null };

export default function WaiverCategoryForm({ initial }: { initial: WaiverCategory | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateWaiverCategoryAction.bind(null, initial!.id) : createWaiverCategoryAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });
  const [iconName, setIconName] = useState<string>(initial?.iconName ?? '');

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Waiver category saved' : 'Waiver category created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField label="Slug" name="slug" required monospace
                     defaultValue={initial?.slug ?? ''} placeholder="staff-dependent" />
          <IconInputField
            label="Icon (Lucide name)"
            name="iconName"
            required
            value={iconName}
            onChange={setIconName}
            placeholder="Users, HeartHandshake, Award, …"
            helperText="PascalCase name from lucide.dev/icons"
          />
        </div>
        <TextField label="Title (card heading)" name="title" required
                   defaultValue={initial?.title ?? ''}
                   placeholder="University Staff & Dependent Waivers" />
      </Card>

      <Card title="Items (bullets inside the card)">
        <p className="text-xs text-gray-500 -mt-2">
          Each row renders as one bullet (heading + body) under this category card.
        </p>
        <HeadingBodyListEditor name="items"
                               initialValue={initial?.items ?? []}
                               headingField="heading" bodyField="text"
                               headingPlaceholder="SU Staff (Academic & Administrative)"
                               bodyPlaceholder="If permitted by the Head of Department…"
                               addButtonLabel="Add item" />
      </Card>

      <Card title="Optional note callout">
        <p className="text-xs text-gray-500 -mt-2">
          Renders as a highlighted note at the bottom of the card. Leave blank to hide.
        </p>
        <TextAreaField label="Note (optional)" name="note" rows={3}
                       defaultValue={initial?.note ?? ''} />
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/waiver-categories" className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to waiver categories
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create category'}
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
