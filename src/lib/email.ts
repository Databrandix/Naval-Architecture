// Phase 9 — Resend wrapper for the contact submission notification.
// Graceful degradation when RESEND_API_KEY is missing OR when the
// admin has not configured a recipient on UniversityIdentity
// (constraint #12): the submission flow still completes; the API
// returns success; emailSentAt stays null and emailError records
// the skip reason. Admin sees the diagnostic in the detail page.

import { Resend } from 'resend';

export type EmailDispatchResult =
  | { status: 'sent' }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string };

interface ContactEmailPayload {
  to: string | null;
  fromName: string;
  fromEmail: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  submittedAt: Date;
  ipAddress?: string | null;
}

// onboarding@resend.dev is Resend's built-in test sender that
// requires no domain verification. For a verified custom domain
// (e.g. noreply@eee.su.edu.bd), add the domain in resend.com →
// Domains and update this constant. The DB field
// UniversityIdentity.contactSubmissionEmail is the RECEIVING side;
// FROM_ADDRESS is the SENDING side.
const FROM_ADDRESS = 'Sonargaon EEE Contact <onboarding@resend.dev>';

export async function sendContactNotification(
  payload: ContactEmailPayload,
): Promise<EmailDispatchResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { status: 'skipped', reason: 'RESEND_API_KEY not configured' };
  }
  if (!payload.to || payload.to.trim().length === 0) {
    return {
      status: 'skipped',
      reason: 'No recipient configured (UniversityIdentity.contactSubmissionEmail is null)',
    };
  }

  const resend = new Resend(apiKey);
  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: payload.to,
      replyTo: payload.fromEmail,
      subject: payload.subject && payload.subject.trim().length > 0
        ? `Contact: ${payload.subject}`
        : `Contact form: ${payload.fromName}`,
      html: renderHtml(payload),
    });
    if (result.error) {
      return {
        status: 'failed',
        error: result.error.message ?? 'Unknown Resend error',
      };
    }
    return { status: 'sent' };
  } catch (e) {
    return {
      status: 'failed',
      error: e instanceof Error ? e.message : 'Resend SDK threw',
    };
  }
}

function renderHtml(p: ContactEmailPayload): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  const messageHtml = esc(p.message).replace(/\r?\n/g, '<br>');

  const meta: string[] = [];
  meta.push(
    `<tr><td style="padding:6px 12px;color:#666;font-size:12px;">Submitted</td><td style="padding:6px 12px;color:#222;font-size:13px;">${p.submittedAt.toISOString()}</td></tr>`,
  );
  if (p.ipAddress) {
    meta.push(
      `<tr><td style="padding:6px 12px;color:#666;font-size:12px;">IP</td><td style="padding:6px 12px;color:#222;font-size:13px;">${esc(p.ipAddress)}</td></tr>`,
    );
  }
  if (p.phone) {
    meta.push(
      `<tr><td style="padding:6px 12px;color:#666;font-size:12px;">Phone</td><td style="padding:6px 12px;color:#222;font-size:13px;">${esc(p.phone)}</td></tr>`,
    );
  }

  return `<!doctype html>
<html><body style="margin:0;background:#f6f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    <div style="background:#2B3175;color:#fff;padding:18px 24px;">
       <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.85;">Sonargaon EEE</div>
      <div style="font-size:18px;font-weight:700;margin-top:4px;">New contact form submission</div>
    </div>
    <div style="padding:24px;">
      <div style="font-size:14px;color:#111;margin-bottom:4px;"><strong>${esc(p.fromName)}</strong></div>
      <div style="font-size:13px;"><a href="mailto:${esc(p.fromEmail)}" style="color:#CC1579;text-decoration:none;">${esc(p.fromEmail)}</a></div>
      ${p.subject ? `<div style="margin-top:14px;font-size:13px;color:#111;"><span style="color:#666;">Subject:</span> ${esc(p.subject)}</div>` : ''}
      <div style="margin-top:18px;padding:14px 16px;background:#fafafa;border:1px solid #eee;border-radius:6px;font-size:14px;line-height:1.6;color:#222;">${messageHtml}</div>
      <table style="margin-top:18px;border-collapse:collapse;">${meta.join('')}</table>
      <div style="margin-top:20px;font-size:12px;color:#666;border-top:1px solid #eee;padding-top:14px;">
        Reply directly to <a href="mailto:${esc(p.fromEmail)}" style="color:#CC1579;">${esc(p.fromEmail)}</a> to respond.
      </div>
    </div>
  </div>
</body></html>`;
}
