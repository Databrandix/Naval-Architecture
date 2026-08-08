'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { LegalPagesContent } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import HeroImagePositionSlider from '@/components/admin/HeroImagePositionSlider';
import SectionsEditor, {
  type LegalSection,
} from '@/components/admin/SectionsEditor';
import {
  updateLegalPagesContentAction,
  type ActionResult,
} from '@/lib/admin-actions/legal-pages';

type State = ActionResult | { ok: null };

// The Json columns return as Prisma.JsonValue — coerce into the
// editor's expected shape with a tolerant default so a malformed
// row (shouldn't happen, but defensive) still renders.
function coerceSections(raw: unknown): LegalSection[] {
  if (!Array.isArray(raw)) return [];
  const out: LegalSection[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const r = item as Record<string, unknown>;
    const heading =
      typeof r.heading === 'string'
        ? r.heading
        : r.heading === null
          ? null
          : '';
    const paragraphs = Array.isArray(r.paragraphs)
      ? r.paragraphs.filter((p): p is string => typeof p === 'string')
      : [];
    out.push({ heading, paragraphs });
  }
  return out;
}

export default function LegalPagesForm({
  initial,
}: {
  initial: LegalPagesContent | null;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateLegalPagesContentAction,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === true) toast.success('Legal pages saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  const privacySections = coerceSections(initial?.privacySections);
  const termsSections = coerceSections(initial?.termsSections);

  return (
    <form action={formAction} className="space-y-8">
      {/* Privacy Policy section */}
      <SectionHeader
        kicker="Page 1"
        title="Privacy Policy"
        hint="Publishes to /privacy-policy"
      />

      <Card title="Hero">
        <TextField
          label="Hero title"
          name="privacyHeroTitle"
          required
          defaultValue={initial?.privacyHeroTitle ?? 'Privacy Policy'}
        />
        <TextField
          label="Hero overline (small label above the title)"
          name="privacyHeroOverline"
          defaultValue={initial?.privacyHeroOverline ?? 'Legal'}
        />
        <ImageUploader
          kind="legal-hero"
          name="privacyHeroImage"
          aspectRatio="wide"
          label="Hero image"
          initialUrl={initial?.privacyHeroImageUrl}
          initialPublicId={initial?.privacyHeroImagePublicId}
        />
        <HeroImagePositionSlider
          name="privacyHeroImageVerticalPercent"
          initialValue={initial?.privacyHeroImageVerticalPercent}
        />
      </Card>

      <Card title="Body — sections">
        <p className="text-xs text-gray-500 -mt-2">
          Each section may have an optional heading and a list of
          paragraphs. The first section commonly has no heading (it's
          the intro). Sections render as <code>&lt;h2&gt;</code> + a
          stack of <code>&lt;p&gt;</code> tags on the public page.
        </p>
        <SectionsEditor name="privacySections" initialValue={privacySections} />
      </Card>

      {/* Terms & Conditions section */}
      <SectionHeader
        kicker="Page 2"
        title="Terms & Conditions"
        hint="Publishes to /terms-and-conditions"
      />

      <Card title="Hero">
        <TextField
          label="Hero title"
          name="termsHeroTitle"
          required
          defaultValue={initial?.termsHeroTitle ?? 'Terms & Conditions'}
        />
        <TextField
          label="Hero overline (small label above the title)"
          name="termsHeroOverline"
          defaultValue={initial?.termsHeroOverline ?? 'Legal'}
        />
        <ImageUploader
          kind="legal-hero"
          name="termsHeroImage"
          aspectRatio="wide"
          label="Hero image"
          initialUrl={initial?.termsHeroImageUrl}
          initialPublicId={initial?.termsHeroImagePublicId}
        />
        <HeroImagePositionSlider
          name="termsHeroImageVerticalPercent"
          initialValue={initial?.termsHeroImageVerticalPercent}
        />
      </Card>

      <Card title="Body — sections">
        <SectionsEditor name="termsSections" initialValue={termsSections} />
      </Card>

      {state.ok === false && (
        <div
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {state.error}
        </div>
      )}

      <div className="flex justify-end sticky bottom-4 bg-gray-50/80 backdrop-blur-sm py-2 -mx-2 px-2 rounded-lg">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {pending ? 'Saving…' : 'Save both pages'}
        </button>
      </div>
    </form>
  );
}

function SectionHeader({
  kicker,
  title,
  hint,
}: {
  kicker: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="border-b border-gray-200 pb-2 mt-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        {kicker}
      </div>
      <h2 className="text-lg font-display font-bold text-gray-900 mt-1">
        {title}
      </h2>
      <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
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
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
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
