import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitWindow =
  | `${number} s`
  | `${number} m`
  | `${number} h`
  | `${number} d`;

interface CheckRateLimitOptions {
  namespace: string;
  limit: number;
  window: RateLimitWindow;
  request?: Request; // Made optional so ipContext can be used
  ipContext?: string; // Additional field
  identifier?: string;
  includeIp?: boolean;
  timeoutMs?: number;
}

interface CheckRateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

const redisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const redis = redisConfigured ? Redis.fromEnv() : null;
const ephemeralCache = new Map<string, number>();
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(
  namespace: string,
  limit: number,
  window: RateLimitWindow,
  timeoutMs: number,
): Ratelimit {
  const cacheKey = `${namespace}:${limit}:${window}:${timeoutMs}`;
  const existingLimiter = limiterCache.get(cacheKey);

  if (existingLimiter) {
    return existingLimiter;
  }

  if (!redis) {
    throw new Error("Rate limit client is not configured");
  }

  const createdLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    timeout: timeoutMs,
    ephemeralCache,
  });

  limiterCache.set(cacheKey, createdLimiter);
  return createdLimiter;
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export function getRequestIp(request?: Request, ipContext?: string): string {
  if (ipContext) return ipContext;
  if (!request) return "unknown";

  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const forwardedIp = forwardedFor.split(",")[0]?.trim();
    if (forwardedIp) {
      return forwardedIp;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

function buildCompositeKey(
  namespace: string,
  request?: Request,
  identifier?: string,
  includeIp = true,
  ipContext?: string,
): string {
  const keyParts: string[] = [namespace];

  if (includeIp) {
    keyParts.push(getRequestIp(request, ipContext));
  }

  if (identifier) {
    keyParts.push(normalizeIdentifier(identifier));
  }

  return keyParts.join(":");
}

export async function checkRateLimit(
  options: CheckRateLimitOptions,
): Promise<CheckRateLimitResult> {
  const {
    namespace,
    limit,
    window,
    request,
    identifier,
    includeIp = true,
    timeoutMs = 1000,
    ipContext,
  } = options;

  if (!redisConfigured) {
    return {
      success: true,
      remaining: limit,
      reset: Date.now(),
    };
  }

  try {
    const limiter = getLimiter(namespace, limit, window, timeoutMs);
    const key = buildCompositeKey(
      namespace,
      request,
      identifier,
      includeIp,
      ipContext,
    );
    const result = await limiter.limit(key);

    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    return {
      success: true,
      remaining: limit,
      reset: Date.now(),
    };
  }
}

export function getRetryAfterSeconds(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

export function getRateLimitErrorMessage(reset: number): string {
  const retryAfterSeconds = getRetryAfterSeconds(reset);
  const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

  return `Too many attempts. Please try again in ${retryAfterMinutes} minute${
    retryAfterMinutes === 1 ? "" : "s"
  }.`;
}
