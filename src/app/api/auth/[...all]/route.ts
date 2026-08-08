import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth';
import {
  checkAccountLockout,
  hashIdentifier,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
} from '@/lib/login-lockout';

// Mounts the Better Auth catch-all:
//   POST /api/auth/sign-in/email    — credentials sign-in
//   POST /api/auth/sign-out          — sign out (revokes session)
//   GET  /api/auth/get-session       — current user + session
//   POST /api/auth/change-password   — logged-in user changes own password
//
// All other Better Auth endpoints (sign-up, verify-email, OAuth callbacks,
// magic-link, etc.) are mounted but inert in our config:
//   - sign-up returns 400 (`emailAndPassword.disableSignUp: true`)
//   - verify-email / magic-link / OAuth never get a valid token
//
// Phase 19 CP19.4 — the POST handler is wrapped so the email
// sign-in endpoint passes through a per-account lockout (Layer B).
// Better Auth's built-in rate limit (Layer A, per-IP) is configured
// in src/lib/auth.ts and runs inside the handler before we ever
// see a 401. Lockout responses are intentionally indistinguishable
// from wrong-password responses (status + body + timing) so an
// attacker can't probe for valid emails by observing lockout state.

const handler = toNextJsHandler(auth);

// Match the slow-path 95th percentile (Better Auth user-lookup +
// bcrypt cost-12 verify) so a lockout-fast-path response can't be
// distinguished from a wrong-password response by timing. Tuned
// against observed steady-state slow-path latency of ~410–490ms;
// 500ms gives comfortable headroom for slow-path variance.
const CONSTANT_TIME_FLOOR_MS = 500;

// Sign-in endpoint path within the catch-all. Better Auth mounts it
// at /api/auth/sign-in/email — this constant lets us match without
// re-parsing the route segments.
const SIGN_IN_EMAIL_PATH = '/sign-in/email';

// Same JSON body shape as Better Auth returns on wrong credentials
// (verified empirically: message + code both present), so an
// attacker comparing responses can't tell our lockout fast-path
// apart from a real wrong-password rejection.
function genericInvalidCredentialsResponse(): Response {
  return new Response(
    JSON.stringify({
      message: 'Invalid email or password',
      code: 'INVALID_EMAIL_OR_PASSWORD',
    }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

async function constantTime<T>(work: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    return await work();
  } finally {
    const elapsed = Date.now() - startedAt;
    const remaining = CONSTANT_TIME_FLOOR_MS - elapsed;
    if (remaining > 0) {
      await new Promise<void>((r) => setTimeout(r, remaining));
    }
  }
}

export const GET = handler.GET;

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const isEmailSignIn = url.pathname.endsWith(SIGN_IN_EMAIL_PATH);

  if (!isEmailSignIn) {
    return handler.POST(request);
  }

  // Read body once; we need the email for the lockout key and
  // Better Auth needs the body too. Buffer + reconstruct so the
  // downstream handler sees a fresh, unconsumed body.
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    // Body unreadable — let Better Auth surface its own 400.
    return handler.POST(request);
  }

  let email: string | null = null;
  try {
    const parsed = JSON.parse(rawBody) as { email?: unknown };
    if (typeof parsed.email === 'string') {
      email = parsed.email;
    }
  } catch {
    // JSON parse failure — let Better Auth surface its 400.
  }

  // Rebuild the request with the consumed body so the downstream
  // handler can re-read it.
  const forwarded = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: rawBody,
  });

  return constantTime(async () => {
    if (email) {
      const lockoutState = checkAccountLockout(email);
      if (!lockoutState.allowed) {
        console.warn(
          `[auth] sign-in blocked by lockout acct=${hashIdentifier(email)}`,
        );
        return genericInvalidCredentialsResponse();
      }
    }

    const response = await handler.POST(forwarded);

    // Only the credentials-failure status (401) increments the
    // counter; 403 (inactive account) and other 4xx are not user-
    // input-driven brute force signals. 200 resets.
    if (email) {
      if (response.status === 200) {
        recordSuccessfulLogin(email);
      } else if (response.status === 401) {
        recordFailedLoginAttempt(email);
      }
    }

    return response;
  });
}
