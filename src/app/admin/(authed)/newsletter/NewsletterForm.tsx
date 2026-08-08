'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { NewsletterPage } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import HeroImagePositionSlider from '@/components/admin/HeroImagePositionSlider';
import FeaturesEditor from '@/components/admin/FeaturesEditor';
import {
  updateNewsletterPageAction,
  type ActionResult,
} from '@/lib/admin-actions/newsletter';

type State = ActionResult | { ok: null };

export default function NewsletterForm({ initial }: { initial: NewsletterPage | null }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateNewsletterPageAction,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === true) toast.success('Newsletter page saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Hero">
        <TextField
          label="Hero title"
          name="heroTitle"
          required
          defaultValue={initial?.heroTitle ?? 'Stay in the Loop'}
        />
        <TextField
          label="Hero subtitle"
          name="heroSubtitle"
          defaultValue={initial?.heroSubtitle ?? ''}
          placeholder="Optional — appears under the hero title"
        />
        <TextField
          label="Hero overline (optional)"
          name="heroOverline"
          defaultValue={initial?.heroOverline ?? 'Newsletter'}
        />
        <ImageUploader
          kind="about-image"
          name="heroImage"
          aspectRatio="wide"
          label="Hero image"
          initialUrl={initial?.heroImageUrl}
          initialPublicId={initial?.heroImagePublicId}
        />
        <HeroImagePositionSlider
          name="heroImageVerticalPercent"
          initialValue={initial?.heroImageVerticalPercent}
        />
      </Card>

      <Card title="Intro">
        <div>
          <label htmlFor="introBody" className="block text-sm font-medium text-gray-700 mb-1">
            Intro paragraph <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
          </label>
          <textarea
            id="introBody"
            name="introBody"
            required
            defaultValue={initial?.introBody ?? ''}
            rows={4}
            placeholder="Short paragraph above the advantages grid. HTML allowed (sanitized on save)."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y"
          />
        </div>
      </Card>

      <Card title="Advantages">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField
            label="Section overline (optional)"
            name="advantagesOverline"
            defaultValue={initial?.advantagesOverline ?? ''}
            placeholder='e.g. "Why Subscribe"'
          />
          <TextField
            label="Section heading"
            name="advantagesHeading"
            required
            defaultValue={initial?.advantagesHeading ?? ''}
            placeholder='e.g. "What You’ll Get"'
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Advantage cards
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Each card uses a Lucide icon name, a title, and a short description.
            Drag the move buttons to reorder.
          </p>
          <FeaturesEditor name="advantages" initialValue={initial?.advantages as unknown} />
        </div>
      </Card>

      <Card title="Subscribe card">
        <TextField
          label="CTA heading"
          name="ctaHeading"
          required
          defaultValue={initial?.ctaHeading ?? 'Join the Newsletter'}
        />
        <TextField
          label="CTA body (optional — short line under the heading)"
          name="ctaBody"
          defaultValue={initial?.ctaBody ?? ''}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField
            label="Button label"
            name="ctaButtonLabel"
            required
            defaultValue={initial?.ctaButtonLabel ?? 'Subscribe'}
          />
          <TextField
            label="Email placeholder"
            name="emailPlaceholder"
            required
            defaultValue={initial?.emailPlaceholder ?? 'you@example.com'}
          />
        </div>
        <TextField
          label="Privacy note (optional — small text under the form)"
          name="privacyNote"
          defaultValue={initial?.privacyNote ?? ''}
          placeholder="We'll never share your email with anyone."
        />
      </Card>

      {state.ok === false && (
        <div
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {state.error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
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
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
      />
    </div>
  );
}
