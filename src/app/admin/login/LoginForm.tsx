'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import PasswordInput from '@/components/admin/PasswordInput';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [redirectTo, setRedirectTo] = useState('/admin');

  // Read ?redirect=... safely without forcing a Suspense boundary.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get('redirect');
    if (target && target.startsWith('/admin')) {
      setRedirectTo(target);
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(formData.get('email') ?? ''),
          password: String(formData.get('password') ?? ''),
        }),
      });

      if (res.ok) {
        toast.success('Signed in');
        // Hard navigation so middleware + layouts re-run with the cookie.
        window.location.href = redirectTo;
        return;
      }

      const data = await res.json().catch(() => ({}));
      const msg =
        data.message ||
        data.error ||
        (res.status === 403 && 'Account is inactive') ||
        'Invalid email or password';
      setError(msg);
    } catch {
      setError('Network error — please try again');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="you@su.edu.bd"
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <div
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
