'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { AdmissionRequirements } from '@prisma/client';
import ParagraphsEditor from '@/components/admin/ParagraphsEditor';
import KeyValueListEditor from '@/components/admin/KeyValueListEditor';
import {
  updateAdmissionRequirementsAction,
  type ActionResult,
} from '@/lib/admin-actions/admission-requirements';

type State = ActionResult | { ok: null };

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((s): s is string => typeof s === 'string');
}

export default function AdmissionRequirementsForm({ initial }: { initial: AdmissionRequirements | null }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateAdmissionRequirementsAction,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === true) toast.success('Admission requirements saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  const undergrad  = toStringArray(initial?.undergraduateRequirements);
  const notes      = toStringArray(initial?.additionalNotes);
  const diploma    = toStringArray(initial?.diplomaRequirements);
  const quickCrit  = Array.isArray(initial?.diplomaQuickCriteria) ? initial.diplomaQuickCriteria : [];

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Intro">
        <TextAreaField label="Intro paragraph" name="intro" required rows={3}
                       defaultValue={initial?.intro ?? ''} />
      </Card>

      <Card title="Undergraduate eligibility — numbered bullets">
        <p className="text-xs text-gray-500 -mt-2">
          Renders as the numbered list under &ldquo;Undergraduate Programs&rdquo;. Plain text per row.
        </p>
        <ParagraphsEditor name="undergraduateRequirements" initialValue={undergrad}
                          helpText={<p className="text-xs text-gray-500">Each row = one eligibility bullet.</p>} />
      </Card>

      <Card title="Additional notes — alert callouts">
        <p className="text-xs text-gray-500 -mt-2">
          Renders as the highlighted alert boxes below the UG list.
        </p>
        <ParagraphsEditor name="additionalNotes" initialValue={notes}
                          helpText={<p className="text-xs text-gray-500">Each row = one alert callout.</p>} />
      </Card>

      <Card title="Diploma eligibility — bullets">
        <p className="text-xs text-gray-500 -mt-2">
          Renders inside the &ldquo;For Diploma (Engineering) Students&rdquo; section.
        </p>
        <ParagraphsEditor name="diplomaRequirements" initialValue={diploma}
                          helpText={<p className="text-xs text-gray-500">Each row = one diploma eligibility bullet.</p>} />
      </Card>

      <Card title="Combined GPA criteria — paragraph">
        <p className="text-xs text-gray-500 -mt-2">
          Single paragraph below the diploma bullets. HTML allowed (inline emphasis): <code className="font-mono">&lt;strong class=&quot;text-primary&quot;&gt;…&lt;/strong&gt;</code>.
        </p>
        <TextAreaField label="Combined GPA body (HTML allowed)" name="combinedGpaBody" required rows={4}
                       defaultValue={initial?.combinedGpaBody ?? ''} />
      </Card>

      <Card title="Diploma quick-reference card">
        <p className="text-xs text-gray-500 -mt-2">
          Side card next to the diploma section. Each row is a label/value pair.
        </p>
        <KeyValueListEditor
          name="diplomaQuickCriteria"
          initialValue={quickCrit}
          labelPlaceholder="e.g. SSC"
          valuePlaceholder="e.g. Minimum GPA 2.5"
          addButtonLabel="Add criterion"
          emptyHint="No criteria yet."
        />
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
