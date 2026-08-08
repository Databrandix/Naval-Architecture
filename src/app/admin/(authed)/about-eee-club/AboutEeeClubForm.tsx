'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { AboutEeeClub } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import HeroImagePositionSlider from '@/components/admin/HeroImagePositionSlider';
import StatsEditor from '@/components/admin/StatsEditor';
import ActivitiesEditor from '@/components/admin/ActivitiesEditor';
import {
  updateAboutEeeClubAction,
  type ActionResult,
} from '@/lib/admin-actions/about-eee-club';

type State = ActionResult | { ok: null };

// Phase 20 — admins now pick from the full Lucide library via the
// shared IconInputField inside ActivitiesEditor; the legacy curated
// hint list is gone.

export default function AboutEeeClubForm({ initial }: { initial: AboutEeeClub | null }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateAboutEeeClubAction,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === true) toast.success('About SU Electrical and Electronic Club saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Hero">
        <TextField label="Hero title" name="heroTitle" required
                   defaultValue={initial?.heroTitle ?? ''} />
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

      <Card title="Intro section">
        <TextField label="Overline (optional)" name="introOverline"
                   defaultValue={initial?.introOverline ?? ''}
                   placeholder="Where Engineering Meets Community" />
        <TextAreaField label="Heading (HTML allowed)" name="introHeading" required rows={2}
                       defaultValue={initial?.introHeading ?? ''} />
        <p className="text-xs text-gray-500 -mt-2">
          Inline HTML allowed. Gradient emphasis pattern:{' '}
          <code className="font-mono">&lt;span class=&quot;text-gradient&quot;&gt;…&lt;/span&gt;</code>
        </p>
        <TextAreaField label="Body paragraph #1" name="introBody1" required rows={4}
                       defaultValue={initial?.introBody1 ?? ''} />
        <TextAreaField label="Body paragraph #2" name="introBody2" required rows={4}
                       defaultValue={initial?.introBody2 ?? ''} />
        <ImageUploader kind="about-image" name="introImage" aspectRatio="auto"
                       label="Intro image"
                       initialUrl={initial?.introImageUrl}
                       initialPublicId={initial?.introImagePublicId} />
      </Card>

      <Card title="Stats">
        <p className="text-xs text-gray-500 -mt-2">
          The 4 stat cards below the intro. Value on the left (e.g. <code className="font-mono">100+</code>), label on the right.
        </p>
        <StatsEditor name="stats" initialValue={initial?.stats} />
      </Card>

      <Card title="Activities section">
        <TextField label="Section overline (optional)" name="activitiesOverline"
                   defaultValue={initial?.activitiesOverline ?? ''}
                   placeholder="What We Do" />
        <TextField label="Section heading" name="activitiesHeading" required
                   defaultValue={initial?.activitiesHeading ?? ''}
                   placeholder="Core Activities & Initiatives" />
        <ActivitiesEditor name="activities"
                          initialValue={initial?.activities} />
      </Card>

      <Card title="Network section">
        <TextField label="Overline (optional)" name="networkOverline"
                   defaultValue={initial?.networkOverline ?? ''}
                   placeholder="Beyond Graduation" />
        <TextField label="Heading" name="networkHeading" required
                   defaultValue={initial?.networkHeading ?? ''} />
        <TextAreaField label="Body" name="networkBody" required rows={4}
                       defaultValue={initial?.networkBody ?? ''} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <TextField label="Primary CTA label" name="networkPrimaryCtaLabel" required
                     defaultValue={initial?.networkPrimaryCtaLabel ?? ''}
                     placeholder="Join the Club" />
          <TextField label="Primary CTA href" name="networkPrimaryCtaHref" required
                     defaultValue={initial?.networkPrimaryCtaHref ?? ''}
                     placeholder="https://facebook.com/…" />
          <TextField label="Secondary CTA label (optional)" name="networkSecondaryCtaLabel"
                     defaultValue={initial?.networkSecondaryCtaLabel ?? ''}
                     placeholder="Alumni Portal" />
          <TextField label="Secondary CTA href (optional)" name="networkSecondaryCtaHref"
                     defaultValue={initial?.networkSecondaryCtaHref ?? ''}
                     placeholder="https://…" />
        </div>
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

function TextAreaField({
  label, name, defaultValue, required, rows = 4, placeholder,
}: { label: string; name: string; defaultValue?: string; required?: boolean; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <textarea id={name} name={name}
                defaultValue={defaultValue} required={required} rows={rows} placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y" />
    </div>
  );
}
