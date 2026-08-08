import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { contactSubmissionCreateSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendContactNotification } from '@/lib/email';

// Honeypot field name — must match the hidden input in ContactForm.
// Real users never fill it (hidden via CSS); bots fill all inputs.
// On honeypot trip we return 200 OK so the bot's logging shows
// success and they don't probe for a different attack surface.
const HONEYPOT_FIELD = 'website';

function getClientIp(request: NextRequest): string | null {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0];
    if (first) return first.trim();
  }
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return null;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Honeypot — silently accept and discard. Bots happily move on.
  const honeypotValue = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  if (typeof honeypotValue === 'string' && honeypotValue.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent');

  // Rate limit by IP; the 'no-ip' bucket is shared so abuse from
  // a misconfigured proxy can't bypass the limit by stripping headers.
  const rateLimitKey = `contact:${ip ?? 'no-ip'}`;
  const limit = checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((limit.resetMs - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Too many submissions from your IP. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  const parsed = contactSubmissionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const identity = await prisma.universityIdentity.findUnique({
    where: { id: 'singleton' },
    select: { contactSubmissionEmail: true },
  });

  // Persist BEFORE attempting email. DB is the source of truth;
  // emailSentAt/emailError are dispatch metadata that get patched in
  // after the send (or skip).
  const submission = await prisma.contactSubmission.create({
    data: {
      ...parsed.data,
      ipAddress: ip,
      userAgent: userAgent ?? null,
    },
  });

  const dispatch = await sendContactNotification({
    to: identity?.contactSubmissionEmail ?? null,
    fromName: submission.name,
    fromEmail: submission.email,
    phone: submission.phone,
    subject: submission.subject,
    message: submission.message,
    submittedAt: submission.submittedAt,
    ipAddress: submission.ipAddress,
  });

  let emailSentAt: Date | null = null;
  let emailError: string | null = null;
  if (dispatch.status === 'sent') {
    emailSentAt = new Date();
  } else if (dispatch.status === 'skipped') {
    emailError = `skipped: ${dispatch.reason}`;
  } else if (dispatch.status === 'failed') {
    emailError = dispatch.error;
  }

  if (emailSentAt || emailError) {
    await prisma.contactSubmission.update({
      where: { id: submission.id },
      data: { emailSentAt, emailError },
    });
  }

  // Sidebar badge count + admin dashboard stat read from this table.
  revalidatePath('/', 'layout');
  revalidatePath('/admin/contact-submissions');
  revalidatePath('/admin');

  return NextResponse.json({ ok: true });
}
