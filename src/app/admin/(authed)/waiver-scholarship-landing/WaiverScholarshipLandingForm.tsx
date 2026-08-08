'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { WaiverScholarshipLanding } from '@prisma/client';
import ParagraphsEditor from '@/components/admin/ParagraphsEditor';
import SummaryRowsEditor from '@/components/admin/SummaryRowsEditor';
import {
  updateWaiverScholarshipLandingAction,
  type ActionResult,
} from '@/lib/admin-actions/waiver-scholarship-landing';

type State = ActionResult | { ok: null };

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((s): s is string => typeof s === 'string');
}

export default function WaiverScholarshipLandingForm({ initial }: { initial: WaiverScholarshipLanding | null }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateWaiverScholarshipLandingAction,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === true) toast.success('Waiver/scholarship landing saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  const initialKeyTakeaways = toStringArray(initial?.keyTakeaways);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Intro">
        <TextAreaField label="Intro paragraph" name="intro" required rows={3}
                       defaultValue={initial?.intro ?? ''} />
      </Card>

      <Card title="Part 01 chrome">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField label="Part 01 kicker" name="part1Kicker" required
                     defaultValue={initial?.part1Kicker ?? 'Part 01'} />
          <TextField label="Part 01 heading" name="part1Heading" required
                     defaultValue={initial?.part1Heading ?? 'Tuition Fee Waivers'} />
        </div>
      </Card>

      <Card title="Summary table (under waiver categories)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField label="Heading" name="summaryHeading" required
                     defaultValue={initial?.summaryHeading ?? 'Summary Table'} />
          <TextField label="Subheading" name="summarySubheading" required
                     defaultValue={initial?.summarySubheading ?? 'Quick reference for all waiver categories.'} />
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Each row renders one line in the summary table. SL numbers are auto-generated.
        </p>
        <SummaryRowsEditor name="summaryRows" initialValue={initial?.summaryRows ?? []} />
        <TextAreaField label="Footer note (below the table)" name="summaryFooterNote" required rows={2}
                       defaultValue={initial?.summaryFooterNote ?? ''} />
      </Card>

      <Card title="Part 02 chrome">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField label="Part 02 kicker" name="part2Kicker" required
                     defaultValue={initial?.part2Kicker ?? 'Part 02'} />
          <TextField label="Part 02 heading" name="part2Heading" required
                     defaultValue={initial?.part2Heading ?? 'Merit Scholarships'} />
        </div>
        <TextAreaField label="Part 02 intro paragraph" name="part2Intro" required rows={3}
                       defaultValue={initial?.part2Intro ?? ''} />
      </Card>

      <Card title="Key takeaways (bottom card)">
        <TextField label="Kicker overline" name="keyTakeawaysKicker" required
                   defaultValue={initial?.keyTakeawaysKicker ?? 'Key Takeaways'} />
        <p className="text-xs text-gray-500 -mt-2">
          Each row renders as one bullet inside the dark Key Takeaways card.
        </p>
        <ParagraphsEditor name="keyTakeaways" initialValue={initialKeyTakeaways}
                          helpText={<p className="text-xs text-gray-500">Plain prose; renders white-on-primary.</p>} />
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
