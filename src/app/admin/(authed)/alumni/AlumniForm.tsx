'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Alumni } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import {
  createAlumniAction,
  updateAlumniAction,
  type ActionResult,
} from '@/lib/admin-actions/alumni';

type State = ActionResult | { ok: null };

export default function AlumniForm({ initial }: { initial: Alumni | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateAlumniAction.bind(null, initial!.id) : createAlumniAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Alumni saved' : 'Alumni created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Slug" name="slug" required monospace
                     defaultValue={initial?.slug ?? ''} placeholder="mm-sarwar" />
          <TextField label="Student ID" name="studentId" required monospace
                     defaultValue={initial?.studentId ?? ''} placeholder="BME1502006136" />
        </div>
        <TextField label="Name" name="name" required defaultValue={initial?.name ?? ''} />
        <TextField label="Department" name="department" required
                   defaultValue={initial?.department ?? 'Electrical and Electronics Engineering'} />
        <TextField label="Designation" name="designation" required defaultValue={initial?.designation ?? ''} />
        <TextField label="Company / Organisation" name="company" required defaultValue={initial?.company ?? ''} />
      </Card>

      <Card title="Photo (optional)">
        <ImageUploader kind="alumni-photo" name="photo" aspectRatio="square"
                       initialUrl={initial?.photoUrl}
                       initialPublicId={initial?.photoPublicId} />
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/alumni" className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to alumni
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create alumni'}
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
