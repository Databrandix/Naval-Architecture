'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import type { ProgramFeeStructure } from '@prisma/client';
import OverviewStatsEditor from '@/components/admin/OverviewStatsEditor';
import PoliciesEditor from '@/components/admin/PoliciesEditor';
import ShiftsEditor from '@/components/admin/ShiftsEditor';
import {
  upsertProgramFeeStructureAction,
  deleteProgramFeeStructureAction,
  type ActionResult,
} from '@/lib/admin-actions/program-fee-structures';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

type State = ActionResult | { ok: null };

type ProgramSummary = { id: string; programName: string; degreeCode: string };

export default function ProgramFeeStructureForm({
  program,
  initial,
}: {
  program: ProgramSummary;
  initial: ProgramFeeStructure | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const action = upsertProgramFeeStructureAction.bind(null, program.id);
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success('Fee structure saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete fee structure?',
      message: `The fee structure for "${program.programName}" will be removed and the public /admission/tuition-fees section for this program will disappear. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteProgramFeeStructureAction(program.id);
    if (res.ok) {
      toast.success('Fee structure deleted');
      router.push('/admin/program-fee-structures');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Intro">
        <TextField label="Intro overline pill" name="introOverline" required
                   defaultValue={initial?.introOverline ?? `${program.programName}`}
                   placeholder="B.Sc. in Electrical and Electronics Engineering (EEE)" />
        <TextField label="Intro heading" name="introHeading" required
                   defaultValue={initial?.introHeading ?? 'Tuition Fee Structure'} />
        <TextAreaField label="Intro paragraph" name="introBody" required rows={3}
                       defaultValue={initial?.introBody ?? ''} />
      </Card>

      <Card title="Overview stats (cards above the shifts)">
        <p className="text-xs text-gray-500 -mt-2">
          Drag rows to reorder. Each stat is rendered as a 4-up card grid on the public page.
        </p>
        <OverviewStatsEditor name="overviewStats" initialValue={initial?.overviewStats ?? []} />
      </Card>

      <Card title="Shifts (3-level nesting)">
        <p className="text-xs text-gray-500 -mt-2">
          Each shift contains background groups (e.g. SSC + HSC, Diploma); each group contains fee tiers (GPA range + per-credit + total). All three levels are drag-reorderable.
        </p>
        <ShiftsEditor name="shifts" initialValue={initial?.shifts ?? []} />
      </Card>

      <Card title="Policies (cards below the shifts)">
        <p className="text-xs text-gray-500 -mt-2">
          Drag rows to reorder. <code className="font-mono">Body</code> field accepts inline HTML.
        </p>
        <PoliciesEditor name="policies" initialValue={initial?.policies ?? []} />
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        {initial ? (
          <button type="button" onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
            <Trash2 size={14} />
            Delete fee structure
          </button>
        ) : <span />}
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : initial ? 'Save changes' : 'Create fee structure'}
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
