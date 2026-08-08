'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { AboutOverview } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import HeroImagePositionSlider from '@/components/admin/HeroImagePositionSlider';
import ParagraphsEditor from '@/components/admin/ParagraphsEditor';
import {
  updateAboutOverviewAction,
  type ActionResult,
} from '@/lib/admin-actions/about-overview';

type State = ActionResult | { ok: null };

export default function AboutOverviewForm({ initial }: { initial: AboutOverview | null }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateAboutOverviewAction,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === true) toast.success('About Overview saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Hero">
        <TextField label="Hero title" name="heroTitle" required
                   defaultValue={initial?.heroTitle ?? ''} />
        <TextField label="Hero subtitle" name="heroSubtitle"
                   defaultValue={initial?.heroSubtitle ?? ''} />
        <TextField label="Hero overline (optional)" name="heroOverline"
                   defaultValue={initial?.heroOverline ?? ''} />
        <ImageUploader kind="about-image" name="heroImage" aspectRatio="wide"
                       label="Hero image"
                       initialUrl={initial?.heroImageUrl}
                       initialPublicId={initial?.heroImagePublicId} />
        <HeroImagePositionSlider
          name="heroImageVerticalPercent"
          initialValue={initial?.heroImageVerticalPercent}
        />
      </Card>

      <Card title="Paragraphs">
        <p className="text-xs text-gray-500 -mt-2">
          Body of the page. Each entry renders as one paragraph; HTML allowed.
        </p>
        <ParagraphsEditor
          name="paragraphs"
          initialValue={initial?.paragraphs ?? []}
          helpText={
            <p className="text-xs text-gray-500">
              HTML allowed (rendered as-is). The drop-cap on the first paragraph&apos;s first letter is applied automatically.
            </p>
          }
        />
      </Card>

      {state.ok === false && (
        <div role="alert"
             className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
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
