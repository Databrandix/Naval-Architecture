'use client';

import { useActionState, useEffect } from 'react';
import type { UniversityIdentity } from '@prisma/client';
import { toast } from 'sonner';
import ImageUploader from '@/components/admin/ImageUploader';
import {
  updateUniversityAction,
  type ActionResult,
} from '@/lib/admin-actions/university';

type Initial = UniversityIdentity | null;
type State = ActionResult | { ok: null };

export default function UniversityForm({ initial }: { initial: Initial }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateUniversityAction,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === true) toast.success('University identity saved');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Identity">
        <TextField label="University name" name="name" required
                   defaultValue={initial?.name ?? ''} />
        <TextAreaField label="Address" name="address" required rows={2}
                       defaultValue={initial?.address ?? ''} />
        <TextField label="Copyright text" name="copyrightText" required
                   defaultValue={initial?.copyrightText ?? ''} />
      </Card>

      <Card title="Contact (one per line)">
        <TextAreaField label="Phones" name="phones" rows={3}
                       defaultValue={(initial?.phones ?? []).join('\n')}
                       placeholder="+8801775000888" />
        <TextAreaField label="Emails" name="emails" rows={3}
                       defaultValue={(initial?.emails ?? []).join('\n')}
                       placeholder="info@su.edu.bd" />
      </Card>

      <Card title="Social URLs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Facebook"  name="facebookUrl"  defaultValue={initial?.facebookUrl  ?? ''} type="url" />
          <TextField label="Instagram" name="instagramUrl" defaultValue={initial?.instagramUrl ?? ''} type="url" />
          <TextField label="YouTube"   name="youtubeUrl"   defaultValue={initial?.youtubeUrl   ?? ''} type="url" />
          <TextField label="LinkedIn"  name="linkedinUrl"  defaultValue={initial?.linkedinUrl  ?? ''} type="url" />
          <TextField label="X"         name="xUrl"         defaultValue={initial?.xUrl         ?? ''} type="url" />
          <TextField label="TikTok"    name="tiktokUrl"    defaultValue={initial?.tiktokUrl    ?? ''} type="url" />
          <TextField label="WhatsApp"  name="whatsappUrl"  defaultValue={initial?.whatsappUrl  ?? ''} type="url" />
          <TextField label="Threads"   name="threadsUrl"   defaultValue={initial?.threadsUrl   ?? ''} type="url" />
        </div>
      </Card>

      <Card title="External services">
        <p className="text-sm text-gray-500 -mt-1 mb-4">
          Set <strong>University website</strong> to send the breadcrumb&rsquo;s Home link to the
          university&rsquo;s own site instead of this department&rsquo;s front page. Leave it empty
          and Home stays where it is.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="University website" name="websiteUrl" defaultValue={initial?.websiteUrl ?? ''} type="url" />
          <TextField label="ERP"     name="erpUrl"     defaultValue={initial?.erpUrl     ?? ''} type="url" />
          <TextField label="Apply"   name="applyUrl"   defaultValue={initial?.applyUrl   ?? ''} type="url" />
          <TextField label="Library" name="libraryUrl" defaultValue={initial?.libraryUrl ?? ''} type="url" />
          <TextField label="IQAC"    name="iqacUrl"    defaultValue={initial?.iqacUrl    ?? ''} type="url" />
          <TextField label="Career"  name="careerUrl"  defaultValue={initial?.careerUrl  ?? ''} type="url" />
          <TextField label="Notice"  name="noticeUrl"  defaultValue={initial?.noticeUrl  ?? ''} type="url" />
        </div>
      </Card>

      <Card title="Map embed">
        <TextAreaField label="Google Maps embed URL" name="mapEmbedUrl" rows={2}
                       defaultValue={initial?.mapEmbedUrl ?? ''}
                       placeholder="https://maps.google.com/maps?q=…&output=embed" />
      </Card>

      <Card title="Footer logo">
        <ImageUploader
          kind="university-logo"
          name="logo"
          initialUrl={initial?.logoUrl}
          initialPublicId={initial?.logoPublicId}
        />
      </Card>

      <Card title="Contact form">
        <div>
          <label htmlFor="contactSubmissionEmail"
                 className="block text-sm font-medium text-gray-700 mb-1">
            Email recipient
          </label>
          <input
            id="contactSubmissionEmail"
            name="contactSubmissionEmail"
            type="email"
            defaultValue={initial?.contactSubmissionEmail ?? ''}
            placeholder="e.g. contact@su.edu.bd"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Submissions from <code className="font-mono">/contact</code> will email here. Leave blank to disable email delivery — submissions still get logged in the database, visible at <code className="font-mono">/admin/contact-submissions</code>.
          </p>
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
  label, name, defaultValue, required, type = 'text',
}: {
  label: string; name: string; defaultValue?: string; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} type={type}
             defaultValue={defaultValue}
             required={required}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" />
    </div>
  );
}

function TextAreaField({
  label, name, defaultValue, required, rows = 3, placeholder,
}: {
  label: string; name: string; defaultValue?: string; required?: boolean; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <textarea id={name} name={name}
                defaultValue={defaultValue}
                required={required}
                rows={rows}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y" />
    </div>
  );
}
