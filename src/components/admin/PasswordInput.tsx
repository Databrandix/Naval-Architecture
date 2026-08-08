'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Drop-in replacement for <input type="password" ...> with a show/hide
// eye toggle on the right edge. Native-input attrs (name, id, required,
// minLength, autoComplete, defaultValue, etc.) pass through untouched.
type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'className'
> & {
  className?: string;
};

export default function PasswordInput({ className = '', ...rest }: Props) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        {...rest}
        type={shown ? 'text' : 'password'}
        className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent ${className}`}
        // Browser password-manager extensions (1Password, Bitwarden,
        // built-in Chrome/Edge etc.) inject auto-fill attributes/UI
        // into password inputs BEFORE React hydration — the
        // canonical React escape hatch for that class of mismatch.
        // Docs: https://react.dev/reference/react-dom/components/common#suppresshydrationwarning
        suppressHydrationWarning
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 rounded-r-lg"
        tabIndex={-1}
      >
        {shown ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
