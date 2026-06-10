import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

// In-memory rate limiting for development/Edge Runtime
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig = { maxRequests: 100, windowSeconds: 60 }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const key = `${ip}`;

  // Clean up old entries
  for (const [k, v] of requestCounts.entries()) {
    if (v.resetTime < now) {
      requestCounts.delete(k);
    }
  }

  const record = requestCounts.get(key);

  if (!record || record.resetTime < now) {
    // New window
    requestCounts.set(key, {
      count: 1,
      resetTime: now + config.windowSeconds * 1000,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowSeconds * 1000,
    };
  }

  // Existing window
  record.count++;

  const allowed = record.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - record.count);

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
  };
}

export function rateLimitResponse(
  remaining: number,
  resetTime: number,
  maxRequests: number
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(maxRequests),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(resetTime),
        "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
      },
    }
  );
}
