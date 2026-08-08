'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ProspectusEntry } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import {
  createProspectusEntryAction,
  updateProspectusEntryAction,
  type ActionResult,
} from '@/lib/admin-actions/prospectus-entries';

type State = ActionResult | { ok: null };

const LEVELS = ['Undergraduate', 'Postgraduate'] as const;

type PdfState = { url: string; publicId: string; fileName: string };

export default function ProspectusForm({ initial }: { initial: ProspectusEntry | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateProspectusEntryAction.bind(null, initial!.id) : createProspectusEntryAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  const [pdf, setPdf] = useState<PdfState>({
    url:      initial?.pdfUrl ?? '',
    publicId: initial?.pdfPublicId ?? '',
    fileName: initial?.pdfFileName ?? '',
  });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Prospectus saved' : 'Prospectus created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Slug" name="slug" required monospace
                     defaultValue={initial?.slug ?? ''}                      placeholder="bsc-eee" />
          <SelectField label="Level" name="level" required options={LEVELS}
                       defaultValue={initial?.level ?? 'Undergraduate'} />
        </div>
        <TextField label="Title (full)" name="title" required defaultValue={initial?.title ?? ''} />
        <TextField label="Short title (shown on card)" name="shortTitle" required defaultValue={initial?.shortTitle ?? ''} />
        <TextField label="Department" name="department" required
                   defaultValue={initial?.department ?? ''} />
      </Card>

      <Card title="Cover image">
        <ImageUploader kind="prospectus-cover" name="cover"
                       initialUrl={initial?.coverUrl}
                       initialPublicId={initial?.coverPublicId} />
      </Card>

      <Card title="Prospectus PDF">
        <p className="text-xs text-gray-500 -mt-2">
          The &ldquo;Download&rdquo; button on the public card links to this PDF.
        </p>
        <ImageUploader
          kind="prospectus-pdf"
          name="pdf"
          accept="application/pdf"
          initialUrl={pdf.url}
          initialPublicId={pdf.publicId}
          initialFileType="pdf"
          initialFileName={pdf.fileName}
          onChange={(url, publicId, meta) => {
            setPdf({ url, publicId, fileName: meta?.fileName ?? '' });
          }}
        />
        <input type="hidden" name="pdfUrl" value={pdf.url} />
        <input type="hidden" name="pdfPublicId" value={pdf.publicId} />
        <input type="hidden" name="pdfFileName" value={pdf.fileName} />
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/prospectus-entries" className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to prospectus entries
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create prospectus'}
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
