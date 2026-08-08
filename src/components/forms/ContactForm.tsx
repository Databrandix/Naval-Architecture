'use client';

import { FormEvent, useState } from 'react';
import { Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

type FormState = 'idle' | 'submitting' | 'submitted' | 'error';

export default function ContactForm({
  responseTimeNote = 'We typically respond within 1–2 business days.',
}: {
  responseTimeNote?: string;
}) {
  const [state, setState] = useState<FormState>('idle');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  // Honeypot — never typed by real users. Bots that auto-fill all
  // inputs will populate this, which the server uses to silently
  // discard the submission. Wired to state so the value flows into
  // the fetch JSON body even though no human ever sees the field.
  const [website, setWebsite] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSubject('');
    setMessage('');
    setWebsite('');
    setErrorMsg(null);
    setState('idle');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('submitting');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message, website }),
      });
      if (res.ok) {
        setState('submitted');
        return;
      }
      let serverMessage = 'Something went wrong. Please try again.';
      try {
        const data = await res.json();
        if (typeof data?.error === 'string' && data.error.length > 0) {
          serverMessage = data.error;
        }
      } catch {
        // non-JSON response — keep generic message
      }
      if (res.status === 429) {
        setErrorMsg(serverMessage);
      } else if (res.status === 400) {
        setErrorMsg(`We couldn't accept this message: ${serverMessage}`);
      } else {
        setErrorMsg(serverMessage);
      }
      setState('error');
    } catch {
      setErrorMsg('Network error — please check your connection and try again.');
      setState('error');
    }
  };

  if (state === 'submitted') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <h3 className="font-display text-2xl font-bold text-primary mb-2">
          Thanks for reaching out!
        </h3>
        <p className="text-gray-600 text-[15px] leading-relaxed max-w-md mx-auto mb-6">
          We&rsquo;ve received your message and will respond within 1&ndash;2 business days. If it&rsquo;s urgent, you can also reach us at{' '}
          <a href="mailto:info@su.edu.bd" className="text-accent font-semibold hover:underline">
            info@su.edu.bd
          </a>
          .
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-200 hover:border-accent hover:text-accent text-gray-700 text-sm font-semibold rounded-md transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  const isSubmitting = state === 'submitting';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 lg:p-10"
    >
      {/* Honeypot — visually hidden, off the tab order, no assistive
          tech focus. Real users can't see or reach it; bots filling
          every input will populate it and get silently dropped on
          the server. */}
      <div aria-hidden="true" style={honeypotWrapStyle}>
        <label htmlFor="website-url">Website (leave empty)</label>
        <input
          id="website-url"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Full name" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="Your name"
            className={inputClass}
          />
        </Field>

        <Field label="Email" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="you@example.com"
            className={inputClass}
          />
        </Field>

        <Field label="Phone" hint="Optional">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
            placeholder="+8801XXXXXXXXX"
            className={inputClass}
          />
        </Field>

        <Field label="Subject" required>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="What is this regarding?"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Message" required>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="Tell us a bit more about your inquiry..."
            className={`${inputClass} resize-y min-h-[120px]`}
          />
        </Field>
      </div>

      {state === 'error' && errorMsg && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="mt-7 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-[12px] text-gray-500">
          {responseTimeNote}
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-gradient-to-r from-primary to-accent hover:brightness-110 text-white font-semibold rounded-md shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={16} />
              Send message
            </>
          )}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full px-4 py-2.5 rounded-md border border-gray-200 bg-white text-[14px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition disabled:bg-gray-50 disabled:text-gray-500';

const honeypotWrapStyle: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
};

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 mb-1.5 text-[13px] font-semibold text-primary">
        {label}
        {required && <span className="text-accent">*</span>}
        {hint && <span className="text-[11px] text-gray-400 font-normal">({hint})</span>}
      </span>
      {children}
    </label>
  );
}
