'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import ConfirmDialog, { type ConfirmVariant } from './ConfirmDialog';

export type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // Label shown on the confirm button while `onConfirm` is in flight
  // (only meaningful when `onConfirm` is provided). Default "Working…".
  pendingLabel?: string;
  variant?: ConfirmVariant;
  // Optional async action. When provided, the dialog stays open in
  // pending state while the function runs and only closes once it
  // settles, so the user sees an explicit "loading" affordance instead
  // of the modal disappearing the instant they click. Without
  // `onConfirm`, the dialog closes on click and `confirm()` resolves
  // immediately to true (legacy path used by delete handlers — they
  // don't need pending feedback because the optimistic removal hides
  // the row instantly).
  onConfirm?: () => Promise<void> | void;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

type DialogState = {
  options: Required<Pick<ConfirmOptions, 'title' | 'message'>> &
    Pick<
      ConfirmOptions,
      'confirmLabel' | 'cancelLabel' | 'pendingLabel' | 'variant' | 'onConfirm'
    >;
  resolver: (value: boolean) => void;
  pending: boolean;
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      setState({
        options: {
          title: opts.title ?? 'Are you sure?',
          message: opts.message ?? '',
          confirmLabel: opts.confirmLabel,
          cancelLabel: opts.cancelLabel,
          pendingLabel: opts.pendingLabel,
          variant: opts.variant,
          onConfirm: opts.onConfirm,
        },
        resolver: resolve,
        pending: false,
      });
    });
  }, []);

  const handleCancel = useCallback(() => {
    setState((prev) => {
      if (!prev) return null;
      // Lock out cancel while an action is in flight so the user can't
      // accidentally background a half-finished operation.
      if (prev.pending) return prev;
      prev.resolver(false);
      return null;
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    // Snapshot the current state before we mutate it; the setState
    // callback below only flips `pending`, so reading `state` here is
    // the latest because the click came from the rendered dialog.
    if (!state) return;
    const { resolver, options } = state;
    const action = options.onConfirm;

    if (!action) {
      // Legacy path: close immediately, resolve true.
      resolver(true);
      setState(null);
      return;
    }

    // Pending path: lock the dialog, run the action, close on settle.
    setState((prev) => (prev ? { ...prev, pending: true } : null));
    try {
      await action();
      resolver(true);
    } catch {
      // Caller's `onConfirm` swallows its own errors (toast etc.); if
      // it does throw, treat as cancellation so the caller's awaited
      // `confirm()` resolves false rather than hanging.
      resolver(false);
    } finally {
      setState(null);
    }
  }, [state]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <ConfirmDialog
          title={state.options.title}
          message={state.options.message}
          confirmLabel={state.options.confirmLabel}
          cancelLabel={state.options.cancelLabel}
          pendingLabel={state.options.pendingLabel}
          variant={state.options.variant}
          pending={state.pending}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error(
      'useConfirm must be used inside <ConfirmDialogProvider>. The admin layout already wraps it; check that the call site is under /admin/(authed).',
    );
  }
  return ctx;
}
