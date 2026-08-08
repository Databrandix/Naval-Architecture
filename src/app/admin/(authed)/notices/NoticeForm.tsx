'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Notice } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import {
  createNoticeAction,
  updateNoticeAction,
  type ActionResult,
} from '@/lib/admin-actions/notices';

type State = ActionResult | { ok: null };

const CATEGORIES = ['Academic', 'Holiday', 'Transport'] as const;

function dateInputValue(d: Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

type FileState = {
  url: string;
  publicId: string;
  fileType: 'image' | 'pdf' | '';
  fileName: string;
};

export default function NoticeForm({ initial }: { initial: Notice | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateNoticeAction.bind(null, initial!.id) : createNoticeAction;

  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  // File upload owns its own state because the Notice form needs to
  // persist 4 paired fields (url, publicId, type, name) and ImageUploader
  // only emits the first 2 as hidden inputs by default. Going via
  // onChange + parent-rendered hidden inputs keeps the data path
  // straightforward — no need for a separate FileUploader component.
  const [file, setFile] = useState<FileState>({
    url: initial?.fileUrl ?? '',
    publicId: initial?.filePublicId ?? '',
    fileType: (initial?.fileType ?? '') as FileState['fileType'],
    fileName: initial?.fileName ?? '',
  });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Notice saved' : 'Notice created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Slug" name="slug" required monospace
                     defaultValue={initial?.slug ?? ''}
                     placeholder="final-registration-summer-2026" />
          <SelectField label="Category" name="category" required options={CATEGORIES}
                       defaultValue={initial?.category ?? 'Academic'} />
        </div>
        <TextField label="Title" name="title" required
                   defaultValue={initial?.title ?? ''} />
        <TextField label="Department / Office" name="department" required
                   defaultValue={initial?.department ?? 'Office of the Registrar'} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Published at (sort + auto-display)" name="publishedAt" type="date" required
                     defaultValue={dateInputValue(initial?.publishedAt)} />
          <TextField label="Display date override (optional)" name="displayDate"
                     defaultValue={initial?.displayDate ?? ''}
                     placeholder="27 Apr, 2026" />
        </div>
        <TextAreaField label="Description (shown inside the notice card)" name="description" required rows={5}
                       defaultValue={initial?.description ?? ''} />
      </Card>

      <Card title="File attachment (image or PDF)">
        <p className="text-xs text-gray-500 -mt-2">
          The &quot;View Full Notice&quot; / &quot;Download&quot; buttons on the public page link to this file. Both image (.jpg/.png/.webp) and PDF are accepted.
        </p>
        <ImageUploader
          kind="notice-file"
          name="noticeFile"
          accept="image/*,application/pdf"
          initialUrl={file.url}
          initialPublicId={file.publicId}
          initialFileType={file.fileType === '' ? null : file.fileType}
          initialFileName={file.fileName}
          onChange={(url, publicId, meta) => {
            setFile({
              url,
              publicId,
              fileType: (meta?.fileType ?? '') as FileState['fileType'],
              fileName: meta?.fileName ?? '',
            });
          }}
        />
        <input type="hidden" name="fileUrl" value={file.url} />
        <input type="hidden" name="filePublicId" value={file.publicId} />
        <input type="hidden" name="fileType" value={file.fileType} />
        <input type="hidden" name="fileName" value={file.fileName} />
      </Card>

      {state.ok === false && (
        <div role="alert"
             className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/notices"
              className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to notices
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create notice'}
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
