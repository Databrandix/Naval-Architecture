'use client';

import { useActionState, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Trash2, Upload } from 'lucide-react';
import {
  deleteCurriculum,
  replaceCurriculumFromWorkbook,
  setCurriculumPdf,
  type ActionResult,
} from '@/lib/admin-actions/program-curriculum';

/**
 * Three separate forms rather than one.
 *
 * Replacing the curriculum, changing its download and deleting it are three
 * decisions with three different consequences, and a single Save button would
 * make the destructive one as easy to hit as the harmless one.
 */

function Feedback({ state }: { state: ActionResult | null }) {
  if (!state) return null;

  return state.ok ? (
    <p className="flex items-start gap-2 text-sm font-medium text-emerald-700">
      <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden />
      {state.message}
    </p>
  ) : (
    <p role="alert" className="flex items-start gap-2 text-sm font-medium text-red-700">
      <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
      {state.error}
    </p>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/50 focus:outline-none';

const buttonClass =
  'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60';

export default function CurriculumAdminForms({
  slug,
  hasCurriculum,
  pdfUrl,
  pdfFileName,
}: {
  slug: string;
  hasCurriculum: boolean;
  pdfUrl: string;
  pdfFileName: string;
}) {
  const [uploadState, upload, uploading] = useActionState(replaceCurriculumFromWorkbook, null);
  const [pdfState, savePdf, savingPdf] = useActionState(setCurriculumPdf, null);
  const [deleteState, remove, removing] = useActionState(deleteCurriculum, null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="space-y-8">
      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Replace from spreadsheet</h2>
          <p className="mt-1 text-xs text-gray-500">
            The department&rsquo;s <code className="font-mono">Programs and Course Curriculum</code>{' '}
            file. It needs a <code className="font-mono">Course_Structure</code> sheet and a{' '}
            <code className="font-mono">Credit_Distribution</code> sheet. Uploading replaces every
            course currently published.
          </p>
        </div>

        <form action={upload} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="slug" value={slug} />
          <input
            type="file"
            name="workbook"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            required
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
          />
          <button type="submit" disabled={uploading} className={buttonClass}>
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? 'Reading…' : 'Upload and replace'}
          </button>
        </form>

        <Feedback state={uploadState} />
      </section>

      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Download link</h2>
          <p className="mt-1 text-xs text-gray-500">
            The PDF offered under the tables. Leave the address empty to remove the download.
          </p>
        </div>

        <form action={savePdf} className="space-y-3">
          <input type="hidden" name="slug" value={slug} />
          <div>
            <label htmlFor="pdfUrl" className="mb-1 block text-xs font-medium text-gray-700">
              PDF address
            </label>
            <input
              id="pdfUrl"
              name="pdfUrl"
              type="text"
              defaultValue={pdfUrl}
              placeholder="/assets/bsc-name-course-structure.pdf"
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label htmlFor="pdfFileName" className="mb-1 block text-xs font-medium text-gray-700">
              Saved as (optional)
            </label>
            <input
              id="pdfFileName"
              name="pdfFileName"
              type="text"
              defaultValue={pdfFileName}
              placeholder="NAME-Course-Structure.pdf"
              className={inputClass}
            />
          </div>
          <button type="submit" disabled={savingPdf || !hasCurriculum} className={buttonClass}>
            {savingPdf && <Loader2 size={15} className="animate-spin" />}
            Save download link
          </button>
          {!hasCurriculum && (
            <p className="text-xs text-gray-500">
              Upload a curriculum first — the download sits beneath the tables.
            </p>
          )}
        </form>

        <Feedback state={pdfState} />
      </section>

      {hasCurriculum && (
        <section className="space-y-3 rounded-xl border border-red-200 bg-red-50/40 p-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Remove the curriculum</h2>
            <p className="mt-1 text-xs text-gray-500">
              The course structure and credit distribution disappear from the programme page. The
              rest of the page stays.
            </p>
          </div>

          {confirmingDelete ? (
            <form action={remove} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="slug" value={slug} />
              <button
                type="submit"
                disabled={removing}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {removing ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Remove it
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-sm text-gray-600 underline"
              >
                Keep it
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              <Trash2 size={15} />
              Remove curriculum
            </button>
          )}

          <Feedback state={deleteState} />
        </section>
      )}
    </div>
  );
}
