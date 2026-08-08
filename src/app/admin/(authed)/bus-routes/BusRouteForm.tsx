'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import type { BusRoute } from '@prisma/client';
import {
  createBusRouteAction,
  updateBusRouteAction,
  type ActionResult,
} from '@/lib/admin-actions/bus-routes';

type State = ActionResult | { ok: null };

export default function BusRouteForm({ initial }: { initial: BusRoute | null }) {
  const isEdit = !!initial;
  const action = isEdit ? updateBusRouteAction.bind(null, initial!.id) : createBusRouteAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, { ok: null });

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Route saved' : 'Route created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  const departureDefault = (initial?.departureTimes ?? []).join('\n');
  const returnDefault    = (initial?.returnTimes ?? []).join('\n');

  return (
    <form action={formAction} className="space-y-6">
      <Card title="Route">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Slug" name="slug" required monospace
                     defaultValue={initial?.slug ?? ''} placeholder="technical" />
          <TextField label="Route name" name="routeName" required
                     defaultValue={initial?.routeName ?? ''} placeholder="Technical → SU" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Bus number" name="busNumber" required
                     defaultValue={initial?.busNumber ?? ''} placeholder="Dhaka Metro-J 11-2657" />
          <TextField label="Contact" name="contact" required
                     defaultValue={initial?.contact ?? ''} placeholder="01958-642577" />
        </div>
      </Card>

      <Card title="Timings">
        <p className="text-xs text-gray-500 -mt-2">One time per line. Empty lines are dropped.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextAreaField label="Departure times (to SU)" name="departureTimes" rows={5}
                         defaultValue={departureDefault}
                         placeholder={'07:00 AM\n10:30 AM'} />
          <TextAreaField label="Return times (from SU)" name="returnTimes" rows={5}
                         defaultValue={returnDefault}
                         placeholder={'04:45 PM'} />
        </div>
      </Card>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/bus-routes" className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to bus routes
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create route'}
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
  label, name, defaultValue, required, rows = 4, placeholder,
}: { label: string; name: string; defaultValue?: string; required?: boolean; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <textarea id={name} name={name}
                defaultValue={defaultValue} required={required} rows={rows} placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y" />
    </div>
  );
}
