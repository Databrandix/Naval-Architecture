// Phase 9 — simple in-memory IP-based rate limit for the contact
// submission endpoint. Restart-reset acceptable for dept-site scale
// (chair Decision A); the Map is process-local but that matches the
// abuse vector we actually face (spammy POSTs from one IP within
// a short window). Not a security boundary on its own — pair with
// the honeypot field. For determined attackers, swap to a Redis
// limiter in a future phase.

interface Entry { count: number; windowStartMs: number }

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 3;
const PRUNE_EVERY = 1000;

const store = new Map<string, Entry>();
let checkCounter = 0;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  pruneIfDue(now);
  const entry = store.get(key);
  if (!entry || now - entry.windowStartMs >= WINDOW_MS) {
    store.set(key, { count: 1, windowStartMs: now });
    return { allowed: true, remaining: MAX_PER_WINDOW - 1, resetMs: now + WINDOW_MS };
  }
  if (entry.count >= MAX_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetMs: entry.windowStartMs + WINDOW_MS };
  }
  entry.count += 1;
  return {
    allowed: true,
    remaining: MAX_PER_WINDOW - entry.count,
    resetMs: entry.windowStartMs + WINDOW_MS,
  };
}

function pruneIfDue(now: number) {
  checkCounter += 1;
  if (checkCounter < PRUNE_EVERY) return;
  checkCounter = 0;
  for (const [k, v] of store) {
    if (now - v.windowStartMs >= WINDOW_MS) store.delete(k);
  }
}
