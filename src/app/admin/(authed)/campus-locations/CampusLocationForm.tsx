'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { CampusLocation } from '@prisma/client';
import {
  createCampusLocationAction,
  updateCampusLocationAction,
  type ActionResult,
} from '@/lib/admin-actions/campus-locations';

type State = ActionResult | { ok: null };

export default function CampusLocationForm({ initial }: { initial: CampusLocation | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateCampusLocationAction.bind(null, initial!.id) : createCampusLocationAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Campus saved' : 'Campus created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Identity">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField label="Slug" name="slug" required monospace
                     defaultValue={initial?.slug ?? ''} placeholder="permanent" />
          <TextField label="Name" name="name" required
                     defaultValue={initial?.name ?? ''} placeholder="Permanent Campus" />
        </div>
        <TextField label="Tag (optional — e.g. 'City Campus-1')" name="tag"
                   defaultValue={initial?.tag ?? ''} placeholder="City Campus-1" />
      </Card>

      <Card title="Address & Contact">
        <TextAreaField label="Address" name="address" required rows={2}
                       defaultValue={initial?.address ?? ''}
                       placeholder="Ward No–75, Dasher Kandi, Khilgaon, Dhaka-1219" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField label="Phone (optional)" name="phone"
                     defaultValue={initial?.phone ?? ''} placeholder="+880241010352" />
          <TextField label="Email" name="email" required type="email"
                     defaultValue={initial?.email ?? ''} placeholder="info@su.edu.bd" />
        </div>
        <TextField
          label="Google Maps URL (optional — paste a share link)"
          name="mapsUrl"
          type="url"
          defaultValue={initial?.mapsUrl ?? ''}
          placeholder="https://maps.app.goo.gl/..."
          monospace
        />
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/campus-locations" className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to campus locations
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create campus'}
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
  label, name, defaultValue, required, placeholder, monospace, type = 'text',
}: { label: string; name: string; defaultValue?: string; required?: boolean; placeholder?: string; monospace?: boolean; type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input id={name} name={name} type={type}
             defaultValue={defaultValue} required={required} placeholder={placeholder}
             className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent ${monospace ? 'font-mono' : ''}`} />
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
