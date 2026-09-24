/*
 * A small fixed-window rate limiter for the public advisor endpoints. It's
 * per server instance, so it blunts abuse rather than guaranteeing a limit;
 * put a shared limiter (Vercel Firewall, Upstash) in front for that.
 */

interface Window {
  start: number;
  count: number;
}

const windows = new Map<string, Window>();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets. */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  // Keep memory bounded.
  if (windows.size > 10_000) {
    for (const [existingKey, window] of windows) {
      if (now - window.start >= windowMs) windows.delete(existingKey);
    }
  }

  const window = windows.get(key);
  if (!window || now - window.start >= windowMs) {
    windows.set(key, { start: now, count: 1 });
    return { ok: true, retryAfter: 0 };
  }
  window.count += 1;
  const retryAfter = Math.ceil((window.start + windowMs - now) / 1000);
  return { ok: window.count <= limit, retryAfter };
}

/** The caller's IP as the platform reports it. */
export function clientKey(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
