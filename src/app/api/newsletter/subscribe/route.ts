import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { newsletterSubscribeSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';

// Honeypot field name — must match the hidden input in NewsletterForm.
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

  const honeypotValue = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  if (typeof honeypotValue === 'string' && honeypotValue.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent');

  // Share the contact-form rate-limit bucket namespace prefix but
  // keep newsletter separate so a chatty signup form can't lock out
  // contact submissions (or vice versa).
  const rateLimitKey = `newsletter:${ip ?? 'no-ip'}`;
  const limit = checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((limit.resetMs - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Too many submissions from your IP. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  const parsed = newsletterSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Please enter a valid email address.',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  // Normalize email to lower-case so re-subscribes with a different
  // case still hit the unique index correctly.
  const email = parsed.data.email.toLowerCase();

  try {
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        source: 'newsletter-page',
        ipAddress: ip,
        userAgent: userAgent ?? null,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      // Already subscribed — treat as success so we don't leak the
      // existence of the email and the user gets a friendly confirmation.
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 },
    );
  }

  // Admin sidebar / subscribers list reflect the new count.
  revalidatePath('/admin/newsletter-subscribers');
  revalidatePath('/admin');

  return NextResponse.json({ ok: true });
}
