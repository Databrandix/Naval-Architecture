'use client';

import { useEffect } from 'react';

export type ConfirmVariant = 'primary' | 'danger';

export type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  variant?: ConfirmVariant;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// Centered confirmation modal. Used through the shared
// ConfirmDialogProvider via useConfirm() — call sites never render
// this directly. Visual contract: dark overlay backdrop, white card
// in the middle of the viewport, two buttons (Cancel + the action).
//
// Backdrop click + Escape both cancel (unless `pending`, when the
// dialog is locked while the async action runs).
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  pendingLabel = 'Working…',
  variant = 'primary',
  pending = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !pending) onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, pending]);

  const confirmCls =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-300'
      : 'bg-primary hover:bg-primary/90 text-white focus:ring-accent/40';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={() => !pending && onCancel()}
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-6">
        <h2
          id="confirm-dialog-title"
          className="text-lg font-display font-bold text-gray-900"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-600 whitespace-pre-line leading-relaxed">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            autoFocus
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${confirmCls}`}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
