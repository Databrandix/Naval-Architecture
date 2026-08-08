'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import PasswordInput from '@/components/admin/PasswordInput';
import {
  createUserAction,
  type ActionResult,
} from '@/lib/admin-actions/users';

type State = ActionResult | { ok: null };

export default function CreateUserForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    createUserAction,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === false) toast.error(state.error);
    // ok === true → action redirects to /admin/users; no toast needed.
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Account
        </h2>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="email" name="email" type="email"
            required autoComplete="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="name" name="name" type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Initial password <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <PasswordInput
            id="password" name="password"
            required minLength={8}
            autoComplete="new-password"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum 8 characters. The new admin can change this after first sign-in.</p>
        </div>

        <fieldset className="pt-2">
          <legend className="block text-sm font-medium text-gray-700 mb-2">Role</legend>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 has-[:checked]:border-accent has-[:checked]:bg-accent/5 transition-colors">
              <input type="radio" name="role" value="admin" defaultChecked
                     className="mt-0.5 accent-accent" />
              <div>
                <div className="text-sm font-medium text-gray-900">Admin</div>
                <div className="text-xs text-gray-500">Can manage content. Cannot manage other admins.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 has-[:checked]:border-accent has-[:checked]:bg-accent/5 transition-colors">
              <input type="radio" name="role" value="super_admin"
                     className="mt-0.5 accent-accent" />
              <div>
                <div className="text-sm font-medium text-gray-900">Super Admin</div>
                <div className="text-xs text-gray-500">Full access including admin user management and role changes.</div>
              </div>
            </label>
          </div>
        </fieldset>
      </section>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link href="/admin/users"
              className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors">
          ← Back to list
        </Link>
        <button type="submit" disabled={pending}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40">
          {pending ? 'Creating…' : 'Create admin'}
        </button>
      </div>
    </form>
  );
}
