'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

type Props = {
  buttonLabel: string;
  emailPlaceholder: string;
};

// Matches the honeypot field name the /api/newsletter/subscribe route
// drops on. Hidden from real users via CSS + tab-index.
const HONEYPOT_NAME = 'website';

export default function NewsletterSubscribeForm({
  buttonLabel,
  emailPlaceholder,
}: Props) {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, [HONEYPOT_NAME]: honeypot }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === 'string' ? data.error : 'Subscribe failed');
        return;
      }
      // alreadySubscribed is treated as a success on the client too —
      // we don't reveal whether the email was already in the list.
      setSubmitted(true);
      setEmail('');
      toast.success("You're subscribed — thanks!");
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mb-2">
          <Mail size={20} />
        </div>
        <p className="text-emerald-800 font-semibold">You&apos;re on the list.</p>
        <p className="text-sm text-emerald-700 mt-1">
          Look out for our next monthly digest in your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3" noValidate>
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="relative flex-1">
        <Mail
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={emailPlaceholder}
          className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
        />
      </div>

      {/* Honeypot — hidden from real users + assistive tech. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] w-px h-px overflow-hidden opacity-0 pointer-events-none"
      >
        <label htmlFor="newsletter-website">Website</label>
        <input
          id="newsletter-website"
          type="text"
          name={HONEYPOT_NAME}
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-accent text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40 whitespace-nowrap"
      >
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Subscribing…
          </>
        ) : (
          buttonLabel
        )}
      </button>
    </form>
  );
}
