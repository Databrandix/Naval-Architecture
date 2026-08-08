'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { TransportLanding } from '@prisma/client';
import FeaturesEditor from '@/components/admin/FeaturesEditor';
import {
  updateTransportLandingAction,
  type ActionResult,
} from '@/lib/admin-actions/transport-landing';

type State = ActionResult | { ok: null };

// Phase 20 — picker + fallback now live in the shared IconInputField
// used by FeaturesEditor; the legacy curated hint list is gone.

export default function TransportLandingForm({ initial }: { initial: TransportLanding | null }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateTransportLandingAction,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === true) toast.success('Transport landing saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  const initialInstructions = Array.isArray(initial?.instructions) ? initial.instructions : [];

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Intro">
        <TextAreaField label="Intro paragraph" name="introBody" required rows={3}
                       defaultValue={initial?.introBody ?? ''} />
      </Card>

      <Card title="Free service banner">
        <TextField label="Banner heading" name="bannerHeading" required
                   defaultValue={initial?.bannerHeading ?? ''} />
        <TextAreaField label="Banner body (HTML allowed)" name="bannerBody" required rows={4}
                       defaultValue={initial?.bannerBody ?? ''} />
        <p className="text-xs text-gray-500">
          HTML is rendered as-is. Inline highlight pattern: <code className="font-mono">&lt;strong class=&quot;text-button-yellow&quot;&gt;…&lt;/strong&gt;</code>.
        </p>
      </Card>

      <Card title="Important instructions">
        <p className="text-xs text-gray-500 -mt-2">
          Each row is one bullet on the public page (icon + title + body).
        </p>
        <FeaturesEditor name="instructions" initialValue={initialInstructions} />
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : 'Save changes'}
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
  label, name, defaultValue, required,
}: { label: string; name: string; defaultValue?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} type="text"
             defaultValue={defaultValue} required={required}
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
