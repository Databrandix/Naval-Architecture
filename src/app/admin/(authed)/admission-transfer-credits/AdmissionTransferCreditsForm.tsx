'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { AdmissionTransferCredits } from '@prisma/client';
import HeadingBodyListEditor from '@/components/admin/HeadingBodyListEditor';
import KeyValueListEditor from '@/components/admin/KeyValueListEditor';
import {
  updateAdmissionTransferCreditsAction,
  type ActionResult,
} from '@/lib/admin-actions/admission-transfer-credits';

type State = ActionResult | { ok: null };

export default function AdmissionTransferCreditsForm({ initial }: { initial: AdmissionTransferCredits | null }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateAdmissionTransferCreditsAction,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === true) toast.success('Transfer credits policy saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Intro">
        <TextAreaField label="Intro paragraph" name="intro" required rows={3}
                       defaultValue={initial?.intro ?? ''} />
      </Card>

      <Card title="Minimum grade policy">
        <p className="text-xs text-gray-500 -mt-2">
          Each row renders as one bullet in the &ldquo;Minimum Grade Policy&rdquo; section. Body allows inline HTML (e.g. <code className="font-mono">&lt;strong&gt;&apos;B&apos;&lt;/strong&gt;</code>).
        </p>
        <HeadingBodyListEditor name="minimumGradeBullets"
                               initialValue={initial?.minimumGradeBullets ?? []}
                               headingField="heading" bodyField="body"
                               headingPlaceholder="Standard Credit Transfer"
                               bodyPlaceholder="a minimum grade of <strong>'B'</strong> is required…"
                               addButtonLabel="Add bullet" />
      </Card>

      <Card title="Transfer limits & fees (2 fixed cards)">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Card 1 — Maximum transfer limit</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TextField label="Label" name="limitMaxLabel" required
                     defaultValue={initial?.limitMaxLabel ?? 'Maximum Transfer Limit'} />
          <TextField label="Value (large)" name="limitMaxValue" required
                     defaultValue={initial?.limitMaxValue ?? ''} placeholder="50%" />
          <TextField label="Subtitle" name="limitMaxSubtitle" required
                     defaultValue={initial?.limitMaxSubtitle ?? ''}
                     placeholder="of the program's total credits" />
        </div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 mt-4">Card 2 — Credit transfer fee</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TextField label="Label" name="limitFeeLabel" required
                     defaultValue={initial?.limitFeeLabel ?? 'Credit Transfer Fee'} />
          <TextField label="Value (large)" name="limitFeeValue" required
                     defaultValue={initial?.limitFeeValue ?? ''} placeholder="BDT 20,000" />
          <TextField label="Subtitle" name="limitFeeSubtitle" required
                     defaultValue={initial?.limitFeeSubtitle ?? ''} placeholder="one-time charge" />
        </div>
      </Card>

      <Card title="Required documents">
        <TextAreaField label="Documents intro text" name="documentsIntroText" required rows={2}
                       defaultValue={initial?.documentsIntroText ?? ''} />
        <p className="text-xs text-gray-500 -mt-2">
          Each row renders as a numbered card. Body is the longer description.
        </p>
        <HeadingBodyListEditor name="documents"
                               initialValue={initial?.documents ?? []}
                               headingField="title" bodyField="description"
                               headingPlaceholder="Formal Application"
                               bodyPlaceholder="A prescribed application for…"
                               addButtonLabel="Add document" />
      </Card>

      <Card title="Summary card (Quick Reference)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField label="Kicker overline" name="summaryKicker" required
                     defaultValue={initial?.summaryKicker ?? 'Quick Reference'} />
          <TextField label="Card heading" name="summaryHeading" required
                     defaultValue={initial?.summaryHeading ?? 'Summary of Key Constraints'} />
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Each row renders as a label/value entry in the summary card grid.
        </p>
        <KeyValueListEditor name="summaryRows"
                            initialValue={initial?.summaryRows ?? []}
                            labelPlaceholder="Maximum Credits Accepted"
                            valuePlaceholder="50% of program total"
                            addButtonLabel="Add summary row"
                            emptyHint="No summary rows yet." />
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
