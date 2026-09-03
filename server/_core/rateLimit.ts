/**
 * In-memory sliding-window rate limiter.
 *
 * Keyed per user (or IP) + bucket name. This is per-process: it protects a single
 * server instance from runaway/abusive spend on paid external APIs (LLM, DataForSEO,
 * image gen, email/social sends). If the app is ever scaled to multiple instances,
 * back this with a shared store (Redis) so limits are global.
 */

const store = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Record an attempt against `key` and report whether it is within `limit` per `windowMs`.
 * A rejected attempt is NOT counted, so being blocked doesn't extend the block.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  const cutoff = now - windowMs;
  const recent = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= limit) {
    store.set(key, recent); // keep the pruned window
    const oldest = recent[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  recent.push(now);
  store.set(key, recent);
  return { allowed: true, remaining: limit - recent.length, retryAfterSeconds: 0 };
}

/** Test helper — clear all counters. */
export function resetRateLimits(): void {
  store.clear();
}

// Periodically drop keys whose window has fully elapsed so the map can't grow unbounded.
const SWEEP_MS = 60_000;
const MAX_KEEP_MS = 60 * 60_000; // longest window we use is well under an hour
const sweeper = setInterval(() => {
  const cutoff = Date.now() - MAX_KEEP_MS;
  for (const [key, arr] of Array.from(store.entries())) {
    const recent = arr.filter((t) => t > cutoff);
    if (recent.length === 0) store.delete(key);
    else store.set(key, recent);
  }
}, SWEEP_MS);
// Don't keep the process (or test runner) alive just for the sweeper.
sweeper.unref?.();
