'use client';

import { useActionState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import PasswordInput from '@/components/admin/PasswordInput';
import {
  resetPasswordAction,
  type ActionResult,
} from '@/lib/admin-actions/users';

type State = ActionResult | { ok: null };

export default function ResetPasswordCard({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const action = resetPasswordAction.bind(null, userId);
  const [state, formAction, pending] = useActionState<State, FormData>(
    action,
    { ok: null },
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok === true) {
      toast.success(`Password reset · all of ${userName}'s sessions were revoked`);
      formRef.current?.reset();
    }
    if (state.ok === false) toast.error(state.error);
  }, [state, userName]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
    >
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Reset password
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Sets a new password and revokes all of this user&apos;s sessions —
          they will need to sign in again with the new password.
        </p>
      </div>

      <div>
        <label
          htmlFor={`new-password-${userId}`}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          New password <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <PasswordInput
          id={`new-password-${userId}`}
          name="newPassword"
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
          className="bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {pending ? 'Resetting…' : 'Reset password'}
        </button>
      </div>
    </form>
  );
}
