'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  updateUserAction,
  type ActionResult,
} from '@/lib/admin-actions/users';

type State = ActionResult | { ok: null };

type Props = {
  initial: {
    id: string;
    name: string;
    role: 'super_admin' | 'admin';
    isActive: boolean;
  };
  isSelf: boolean;
};

export default function EditUserForm({ initial, isSelf }: Props) {
  const action = updateUserAction.bind(null, initial.id);
  const [state, formAction, pending] = useActionState<State, FormData>(
    action,
    { ok: null },
  );

  useEffect(() => {
    if (state.ok === true) toast.success('Admin updated');
    if (state.ok === false) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
        Profile & access
      </h2>

      <div>
        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
          Full name <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="edit-name" name="name" type="text"
          required defaultValue={initial.name}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">Role</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 has-[:checked]:border-accent has-[:checked]:bg-accent/5 transition-colors">
            <input type="radio" name="role" value="admin"
                   defaultChecked={initial.role === 'admin'}
                   className="mt-0.5 accent-accent" />
            <div>
              <div className="text-sm font-medium text-gray-900">Admin</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 has-[:checked]:border-accent has-[:checked]:bg-accent/5 transition-colors">
            <input type="radio" name="role" value="super_admin"
                   defaultChecked={initial.role === 'super_admin'}
                   className="mt-0.5 accent-accent" />
            <div>
              <div className="text-sm font-medium text-gray-900">Super Admin</div>
            </div>
          </label>
        </div>
      </fieldset>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox" name="isActive"
            defaultChecked={initial.isActive}
            className="rounded accent-accent w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">
            Account is active
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          Deactivating immediately revokes this user&apos;s sessions; they cannot sign in until reactivated.
        </p>
      </div>

      {isSelf && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          You are editing your own account. Demoting yourself or deactivating yourself will succeed only if at least one other active super_admin exists.
        </div>
      )}

      {state.ok === false && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
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
