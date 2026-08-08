'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { GalleryImage } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import {
  createGalleryImageAction,
  updateGalleryImageAction,
  type ActionResult,
} from '@/lib/admin-actions/gallery';

type State = ActionResult | { ok: null };

// Gallery is a flat masonry list (Decision A) — each row needs alt
// + intrinsic width/height for the aspect-ratio calculation. The
// width/height are auto-populated from Cloudinary's upload response
// via ImageUploader's onChange.meta but remain editable so admin
// can override (e.g. when seeding from a /assets/ URL).

type ImageState = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};

export default function GalleryImageForm({ initial }: { initial: GalleryImage | null }) {
  const isEdit = !!initial;
  const action = isEdit
    ? updateGalleryImageAction.bind(null, initial!.id)
    : createGalleryImageAction;

  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  const [img, setImg] = useState<ImageState>({
    url: initial?.imageUrl ?? '',
    publicId: initial?.imagePublicId ?? '',
    width: initial?.width ?? 0,
    height: initial?.height ?? 0,
  });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Gallery image saved' : 'Gallery image created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Image">
        <ImageUploader
          kind="gallery-image"
          name="gallery"
          initialUrl={img.url}
          initialPublicId={img.publicId}
          onChange={(url, publicId, meta) => {
            setImg({
              url,
              publicId,
              width: meta?.width ?? img.width,
              height: meta?.height ?? img.height,
            });
          }}
        />
        <input type="hidden" name="imageUrl" value={img.url} />
        <input type="hidden" name="imagePublicId" value={img.publicId} />
      </Card>

      <Card title="Metadata">
        <TextField
          label="Alt text (for accessibility + SEO)" name="alt" required
          defaultValue={initial?.alt ?? ''}
          placeholder="Campus life at Sonargaon University — moment 01"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
              Width (px)<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="width" name="width" type="number" min={1} required
              value={img.width || ''}
              onChange={(e) => setImg({ ...img, width: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
              Height (px)<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="height" name="height" type="number" min={1} required
              value={img.height || ''}
              onChange={(e) => setImg({ ...img, height: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Width / height are auto-populated on Cloudinary upload (used by the masonry layout to reserve space and avoid layout shift). You can override them manually.
        </p>
      </Card>

      {state.ok === false && (
        <div role="alert"
             className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/gallery"
              className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to gallery
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add to gallery'}
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
