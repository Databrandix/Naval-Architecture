'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ResearchArea } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import IconInputField from '@/components/admin/IconInputField';
import {
  createResearchAreaAction,
  updateResearchAreaAction,
  type ActionResult,
} from '@/lib/admin-actions/research-areas';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

type State = ActionResult | { ok: null };
type IconMode = 'lucide' | 'upload';

export default function ResearchAreaForm({
  initial,
}: {
  initial: ResearchArea | null;
}) {
  const isEdit = !!initial;
  const action = isEdit
    ? updateResearchAreaAction.bind(null, initial!.id)
    : createResearchAreaAction;

  // Choose the initial icon mode from whichever side of the schema is populated.
  const [iconMode, setIconMode] = useState<IconMode>(
    initial?.iconPublicId ? 'upload' : 'lucide',
  );

  const [iconName, setIconName] = useState<string>(initial?.iconName ?? '');

  // Featured toggle controls whether the conditional featured-card
  // fields render. Save logic (server) always reads these fields —
  // the toggle is a UX hint, not the server-side gate.
  const [isFeatured, setIsFeatured] = useState<boolean>(initial?.isFeatured ?? false);

  const [state, formAction, pending] = useActionState<State, FormData>(
    action,
    { ok: null },
  );
  const confirm = useConfirm();

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Research area saved' : 'Research area created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  async function handleFeaturedToggle(next: boolean) {
    if (next && !initial?.isFeatured) {
      const ok = await confirm({
        title: 'Promote to Featured?',
        message: 'Promoting this row to Featured will demote whichever row is currently featured. Continue?',
        confirmLabel: 'Continue',
      });
      if (!ok) return;
    }
    setIsFeatured(next);
  }

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Details">
        <TextField label="Area name" name="areaName" required
                   defaultValue={initial?.areaName ?? ''} />
        <TextAreaField label="Description (optional)" name="description" rows={3}
                       defaultValue={initial?.description ?? ''} />
      </Card>

      <Card title="Icon">
        <p className="text-xs text-gray-500 -mt-2">
          Pick one source: a Lucide icon name (rendered as a vector glyph by the site) OR an uploaded image (good for custom logos).
        </p>

        <fieldset className="flex gap-6 items-center">
          <legend className="sr-only">Icon source</legend>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="_iconMode"
              checked={iconMode === 'lucide'}
              onChange={() => setIconMode('lucide')}
              className="accent-accent"
            />
            <span>Lucide icon</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="_iconMode"
              checked={iconMode === 'upload'}
              onChange={() => setIconMode('upload')}
              className="accent-accent"
            />
            <span>Uploaded image</span>
          </label>
        </fieldset>

        {iconMode === 'lucide' ? (
          <IconInputField
            label="Lucide icon name"
            name="iconName"
            required
            value={iconName}
            onChange={setIconName}
            placeholder="e.g. Flame, Cpu, Bot, Waves"
            helperText="PascalCase name from lucide.dev/icons"
          />
        ) : (
          <ImageUploader
            kind="research-icon"
            name="icon"
            aspectRatio="square"
            label="Icon image"
            initialUrl={initial?.iconUrl}
            initialPublicId={initial?.iconPublicId}
          />
        )}
      </Card>

      <Card title="Featured slot (optional)">
        <p className="text-xs text-gray-500 -mt-2">
          Exactly one research area can be featured. Promoting this row will demote the current featured row in the same save.
        </p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isFeatured"
            checked={isFeatured}
            onChange={(e) => handleFeaturedToggle(e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          <span className="text-sm font-medium text-gray-700">
            Promote this area into the right-side featured card
          </span>
        </label>

        {isFeatured && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <TextField
              label="Featured card heading (optional)"
              name="featuredHeading"
              defaultValue={initial?.featuredHeading ?? ''}
              placeholder="Falls back to area name when blank"
            />
            <ImageUploader
              kind="research-icon"
              name="featuredImage"
              aspectRatio="wide"
              label="Featured card image"
              initialUrl={initial?.featuredImageUrl}
              initialPublicId={initial?.featuredImagePublicId}
            />
            <TextAreaField
              label="Featured card description (optional)"
              name="featuredDescription"
              rows={3}
              defaultValue={initial?.featuredDescription ?? ''}
            />
            <TextField
              label="Read More href (optional)"
              name="featuredCtaHref"
              defaultValue={initial?.featuredCtaHref ?? ''}
              placeholder="/research"
            />
          </div>
        )}
      </Card>

      {state.ok === false && (
        <div role="alert"
             className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/research-areas"
              className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to list
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create research area'}
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
  label, name, defaultValue, required, type = 'text', placeholder,
}: {
  label: string; name: string; defaultValue?: string;
  required?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} type={type}
             defaultValue={defaultValue} required={required} placeholder={placeholder}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" />
    </div>
  );
}

function TextAreaField({
  label, name, defaultValue, required, rows = 3, placeholder,
}: {
  label: string; name: string; defaultValue?: string;
  required?: boolean; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <textarea id={name} name={name}
                defaultValue={defaultValue} required={required}
                rows={rows} placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y" />
    </div>
  );
}
