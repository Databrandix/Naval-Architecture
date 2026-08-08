'use client';

import { useActionState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import PasswordInput from '@/components/admin/PasswordInput';
import {
  changeOwnPasswordAction,
  type ActionResult,
} from '@/lib/admin-actions/users';

type State = ActionResult | { ok: null };

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    changeOwnPasswordAction,
    { ok: null },
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok === true) {
      toast.success('Password changed');
      formRef.current?.reset();
    }
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white border border-gray-200 rounded-lg p-6 space-y-5"
    >
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Current password <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          required
          autoComplete="current-password"
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
          New password <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <p className="text-xs text-gray-500 mt-1">Minimum 8 characters.</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm new password <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {pending ? 'Changing…' : 'Change password'}
        </button>
      </div>
    </form>
  );
}
