// Phase 19 CP19.4 — per-account login lockout (Layer B).
//
// Layer A (per-IP rate limit) lives in Better Auth's built-in
// rateLimit.customRules — see src/lib/auth.ts. This file
// implements Layer B: per-account failure counter that triggers
// a temporary lock after N consecutive wrong-password attempts,
// so a single attacker rotating IPs can't bypass Layer A.
//
// Storage is in-memory: per-Vercel-instance, restart-reset.
// Adequate for current scale (small admin team, low login
// volume); revisit if multi-instance scaling makes per-account
// state inconsistent. Same trade-off as Phase 9 contact-form
// rate limit.
//
// Disclosure-protocol invariant: callers MUST treat lockout
// responses as indistinguishable from wrong-password responses
// (same body, same status, same timing) to avoid leaking
// account-existence or lockout state to an attacker.

import { createHash } from 'crypto';

interface Entry {
  failureCount: number;
  firstFailureAt: number;
  lockedUntil: number | null;
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const FAILURE_WINDOW_MS = 30 * 60 * 1000; // counter resets if no
                                          // failure in this window
const PRUNE_EVERY = 500;

const store = new Map<string, Entry>();
let opCounter = 0;

export interface LockoutState {
  allowed: boolean;
  lockedUntilMs: number | null;
}

// Hash email for log lines so we can correlate repeat
// offenders across log batches without persisting PII in logs.
export function hashIdentifier(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 8);
}

function pruneIfDue(now: number): void {
  opCounter += 1;
  if (opCounter < PRUNE_EVERY) return;
  opCounter = 0;
  for (const [k, v] of store) {
    const lockExpired = v.lockedUntil !== null && v.lockedUntil <= now;
    const windowExpired = now - v.firstFailureAt >= FAILURE_WINDOW_MS;
    if (lockExpired && windowExpired) store.delete(k);
  }
}

function keyFor(email: string): string {
  return email.toLowerCase().trim();
}

// Caller-facing: is this account currently locked?
// Returns { allowed: true } if free to attempt, { allowed: false }
// if locked. Does NOT mutate state.
export function checkAccountLockout(email: string): LockoutState {
  const key = keyFor(email);
  const now = Date.now();
  pruneIfDue(now);
  const entry = store.get(key);
  if (!entry) return { allowed: true, lockedUntilMs: null };
  if (entry.lockedUntil !== null && entry.lockedUntil > now) {
    return { allowed: false, lockedUntilMs: entry.lockedUntil };
  }
  return { allowed: true, lockedUntilMs: null };
}

// Called after Better Auth returns 401 (wrong password) for this
// email. Increments the counter; trips the lock at threshold.
export function recordFailedLoginAttempt(email: string): void {
  const key = keyFor(email);
  const now = Date.now();
  pruneIfDue(now);
  const entry = store.get(key);

  if (!entry) {
    store.set(key, {
      failureCount: 1,
      firstFailureAt: now,
      lockedUntil: null,
    });
    return;
  }

  // If the failure window expired, treat this as a fresh sequence.
  if (now - entry.firstFailureAt >= FAILURE_WINDOW_MS) {
    entry.failureCount = 1;
    entry.firstFailureAt = now;
    entry.lockedUntil = null;
    return;
  }

  entry.failureCount += 1;

  if (entry.failureCount >= LOCKOUT_THRESHOLD && entry.lockedUntil === null) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    // Server-side log only, hashed identifier — no PII.
    console.warn(
      `[auth] account lockout triggered acct=${hashIdentifier(key)}`,
    );
  }
}

// Called after Better Auth returns 200 (successful sign-in).
// Clears the counter so a user who just signed in successfully
// after a few mistypes doesn't carry over a near-lockout state.
export function recordSuccessfulLogin(email: string): void {
  const key = keyFor(email);
  store.delete(key);
}
