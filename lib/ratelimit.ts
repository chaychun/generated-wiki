import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let cached: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (cached !== undefined) return cached;
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    cached = null;
    return null;
  }
  cached = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(12, "60 s"),
    analytics: true,
    prefix: "genwiki:gen",
  });
  return cached;
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anon";
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number; limit: number; remaining: number; reset: number };

export async function checkRateLimit(req: Request): Promise<RateLimitResult> {
  const limiter = getLimiter();
  if (!limiter) return { ok: true };
  const ip = getClientIp(req);
  const r = await limiter.limit(ip);
  if (r.success) return { ok: true };
  const retryAfter = Math.max(1, Math.ceil((r.reset - Date.now()) / 1000));
  return {
    ok: false,
    retryAfter,
    limit: r.limit,
    remaining: r.remaining,
    reset: r.reset,
  };
}
