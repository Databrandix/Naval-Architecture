'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { ContactPageContent } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import HeroImagePositionSlider from '@/components/admin/HeroImagePositionSlider';
import QuickContactCardsEditor from '@/components/admin/QuickContactCardsEditor';
import {
  updateContactPageContentAction,
  type ActionResult,
} from '@/lib/admin-actions/contact-page';

type State = ActionResult | { ok: null };

export default function ContactPageForm({ initial }: { initial: ContactPageContent | null }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateContactPageContentAction,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === true) toast.success('Contact page saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Hero">
        <TextField label="Hero title" name="heroTitle" required
                   defaultValue={initial?.heroTitle ?? 'Contact Us'} />
        <TextField label="Hero overline (kicker)" name="heroOverline"
                   defaultValue={initial?.heroOverline ?? ''} placeholder="Get in Touch" />
        <ImageUploader kind="contact-hero" name="heroImage" aspectRatio="wide"
                       label="Hero image"
                       initialUrl={initial?.heroImageUrl}
                       initialPublicId={initial?.heroImagePublicId} />
        <HeroImagePositionSlider
          name="heroImageVerticalPercent"
          initialValue={initial?.heroImageVerticalPercent}
        />
      </Card>

      <Card title="Intro">
        <TextAreaField label="Intro paragraph (HTML allowed)" name="introBody" required rows={4}
                       defaultValue={initial?.introBody ?? ''} />
      </Card>

      <Card title="Quick Contact Information">
        <TextField label="Section heading" name="quickContactHeading" required
                   defaultValue={initial?.quickContactHeading ?? 'Quick Contact Information'} />
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">
            Cards <span className="text-red-500" aria-hidden="true">*</span>
          </p>
          <QuickContactCardsEditor
            name="quickContactCards"
            initialValue={initial?.quickContactCards ?? []}
          />
          <p className="mt-2 text-xs text-gray-500">
            Drag to reorder. Each card needs an icon name, title, and a primary value. Secondary value and hint are optional and stay collapsed unless you have data.
          </p>
        </div>
      </Card>

      <Card title="Form section copy">
        <TextField label="Section heading" name="formHeading" required
                   defaultValue={initial?.formHeading ?? 'Send Us a Message'} />
        <TextAreaField label="Subheading (helper text under heading)" name="formSubheading" required rows={2}
                       defaultValue={initial?.formSubheading ?? ''} />
        <TextField label="Response-time note (above submit button)" name="responseTimeNote" required
                   defaultValue={initial?.responseTimeNote ?? ''} />
      </Card>

      <Card title="Campus Locations section">
        <TextField label="Section heading" name="campusesHeading" required
                   defaultValue={initial?.campusesHeading ?? 'Campus Locations'} />
        <p className="text-xs text-gray-500 -mt-2">
          Campus cards themselves are managed at <code className="font-mono">/admin/campus-locations</code>.
        </p>
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
  label, name, defaultValue, required, rows = 3, placeholder,
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
