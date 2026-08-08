'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Lab } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import GalleryEditor from '@/components/admin/GalleryEditor';
import {
  createLabAction,
  updateLabAction,
  type ActionResult,
} from '@/lib/admin-actions/lab-facility';

type State = ActionResult | { ok: null };

export default function LabForm({ initial }: { initial: Lab | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateLabAction.bind(null, initial!.id) : createLabAction;

  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Lab saved' : 'Lab created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Slug (URL-hash deep link)" name="slug" required
                     defaultValue={initial?.slug ?? ''}
                     placeholder="fluid-mechanics-lab"
                     monospace />
          <TextField label="Name" name="name" required
                     defaultValue={initial?.name ?? ''}
                     placeholder="Fluid Mechanics Lab" />
        </div>
        <TextField label="Tagline" name="tagline" required
                   defaultValue={initial?.tagline ?? ''}
                   placeholder="Measure flow, pressure, and the behaviour of liquids." />
        <TextAreaField label="Description" name="description" required rows={5}
                       defaultValue={initial?.description ?? ''} />
      </Card>

      <Card title="Hero image (optional)">
        <ImageUploader kind="lab-image" name="heroImage" aspectRatio="wide"
                       initialUrl={initial?.heroImageUrl}
                       initialPublicId={initial?.heroImagePublicId} />
      </Card>

      <Card title="Gallery (optional)">
        <p className="text-xs text-gray-500 -mt-2">
          Add multiple images. Drag arrows to reorder; the on-page gallery follows this order.
        </p>
        <GalleryEditor
          urlsName="gallery"
          publicIdsName="galleryPublicIds"
          initialUrls={initial?.gallery ?? []}
          initialPublicIds={initial?.galleryPublicIds ?? []}
        />
      </Card>

      {state.ok === false && (
        <div role="alert"
             className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/lab-facility"
              className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to lab facility
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create lab'}
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
