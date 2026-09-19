// Simple in-memory sliding-window rate limiter.
// Good enough for a single serverless instance / dev server; for multi-instance
// production deployments this would be backed by Redis (e.g. Upstash) instead.

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetMs: number;
}

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, limit, resetMs: windowMs };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  const resetMs = windowMs - (now - existing.windowStart);
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    limit,
    resetMs,
  };
}

// Periodically clear stale buckets so this map doesn't grow unbounded on a
// long-lived server process.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.windowStart > 5 * 60_000) buckets.delete(key);
    }
  }, 5 * 60_000).unref?.();
}
