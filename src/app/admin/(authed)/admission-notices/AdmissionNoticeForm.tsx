'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AdmissionNotice } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import ParagraphsEditor from '@/components/admin/ParagraphsEditor';
import {
  createAdmissionNoticeAction,
  updateAdmissionNoticeAction,
  type ActionResult,
} from '@/lib/admin-actions/admission-notices';

type State = ActionResult | { ok: null };

function dateInputValue(d: Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

type FileState = { url: string; publicId: string; fileName: string };

export default function AdmissionNoticeForm({ initial }: { initial: AdmissionNotice | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateAdmissionNoticeAction.bind(null, initial!.id) : createAdmissionNoticeAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  // File attachment owns its own state (mirrors NoticeForm pattern for
  // PDF/image dual support — keeps fileName paired through onChange).
  const [file, setFile] = useState<FileState>({
    url:      initial?.fileUrl ?? '',
    publicId: initial?.filePublicId ?? '',
    fileName: initial?.fileName ?? '',
  });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Notice saved' : 'Notice created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  const initialBody = Array.isArray(initial?.bodyParagraphs) ? (initial.bodyParagraphs as string[]) : [];
  const initialCc   = Array.isArray(initial?.ccList)         ? (initial.ccList         as string[]) : [];

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Slug" name="slug" required monospace
                     defaultValue={initial?.slug ?? ''} placeholder="summer-2026-inauguration" />
          <TextField label="Reference No" name="refNo" required monospace
                     defaultValue={initial?.refNo ?? ''} placeholder="SU/Reg/Notice/2026/74" />
        </div>
        <TextField label="Subject (letter heading)" name="subject" required
                   defaultValue={initial?.subject ?? ''}
                   placeholder="Attendance at the Inauguration Ceremony…" />
        <TextField label="Title (admin reference / index)" name="title" required
                   defaultValue={initial?.title ?? ''}
                   placeholder="Same as subject is usually fine" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Published at (sort + auto-display)" name="publishedAt" type="date" required
                     defaultValue={dateInputValue(initial?.publishedAt)} />
          <TextField label="Display date override (optional)" name="displayDate"
                     defaultValue={initial?.displayDate ?? ''} placeholder="March 05, 2026" />
        </div>
        <CheckboxField label="Active (this notice shows on /admission/notice when it has the latest publishedAt)"
                       name="isActive" defaultChecked={initial?.isActive ?? true} />
      </Card>

      <Card title="Letterhead">
        <TextField label="Header overline" name="headerOverline" required
                   defaultValue={initial?.headerOverline ?? 'Office of the Registrar'} />
        <p className="text-xs text-gray-500 -mt-2">University name + the &ldquo;Notice&rdquo; pill below it are rendered automatically from Department / University identity.</p>
      </Card>

      <Card title="Hero image (optional)">
        <p className="text-xs text-gray-500 -mt-2">
          Falls back to the default <code className="font-mono">/assets/admission-hero.webp</code> if left empty.
        </p>
        <ImageUploader kind="admission-notice-hero" name="heroImage"
                       initialUrl={initial?.heroImageUrl}
                       initialPublicId={initial?.heroImagePublicId} />
      </Card>

      <Card title="Body paragraphs">
        <p className="text-xs text-gray-500 -mt-2">One paragraph per row. Inline HTML allowed (<code className="font-mono">&lt;strong&gt;</code>, <code className="font-mono">&lt;em&gt;</code>).</p>
        <ParagraphsEditor name="bodyParagraphs" initialValue={initialBody}
                          helpText={<p className="text-xs text-gray-500">Renders in the letter body in order.</p>} />
      </Card>

      <Card title="Signature">
        <TextField label="Signature preamble (optional)" name="signatoryPreamble"
                   defaultValue={initial?.signatoryPreamble ?? ''}
                   placeholder="By order of the Vice-Chancellor (Acting)," />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Signatory name" name="signatoryName" required
                     defaultValue={initial?.signatoryName ?? ''} placeholder="S. M. Nurul Huda" />
          <TextField label="Signatory designation" name="signatoryDesignation" required
                     defaultValue={initial?.signatoryDesignation ?? ''} placeholder="Registrar" />
        </div>
      </Card>

      <Card title="Cc list">
        <TextField label="Cc label" name="ccLabel" required
                   defaultValue={initial?.ccLabel ?? 'Copy for Kind Information (not according to seniority)'} />
        <ParagraphsEditor name="ccList" initialValue={initialCc}
                          helpText={<p className="text-xs text-gray-500">One recipient per row. No HTML needed — plain text.</p>} />
      </Card>

      <Card title="Downloadable file (image or PDF, optional)">
        <p className="text-xs text-gray-500 -mt-2">
          The &ldquo;Download Notice (PDF)&rdquo; button on the public page links here. Both image and PDF accepted; auto-detected.
        </p>
        <ImageUploader
          kind="admission-notice-file"
          name="admissionNoticeFile"
          accept="image/*,application/pdf"
          initialUrl={file.url}
          initialPublicId={file.publicId}
          initialFileType="pdf"
          initialFileName={file.fileName}
          onChange={(url, publicId, meta) => {
            setFile({ url, publicId, fileName: meta?.fileName ?? '' });
          }}
        />
        <input type="hidden" name="fileUrl"      value={file.url} />
        <input type="hidden" name="filePublicId" value={file.publicId} />
        <input type="hidden" name="fileName"     value={file.fileName} />
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/admission-notices" className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to admission notices
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

function CheckboxField({
  label, name, defaultChecked,
}: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
      <input type="checkbox" name={name} defaultChecked={defaultChecked}
             className="mt-0.5 w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent/50" />
      <span>{label}</span>
    </label>
  );
}
