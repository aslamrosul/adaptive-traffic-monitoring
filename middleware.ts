import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRedisClient } from '@/lib/redis';

export default withAuth(
  async function middleware(req) {
    // Rate limiting for API routes
    if (req.nextUrl.pathname.startsWith('/api')) {
      try {
        const ip = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

        const redis = await getRedisClient();
        const key = `ratelimit:${ip}`;

        // Increment counter
        const count = await redis.incr(key);

        // Set expiry on first request
        if (count === 1) {
          await redis.expire(key, 60); // 1 minute
        }

        // Check limit (100 requests per minute)
        if (count > 100) {
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
          );
        }

        // Add rate limit headers
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', '100');
        response.headers.set('X-RateLimit-Remaining', String(100 - count));

        return response;

      } catch (error) {
        console.error('Rate limiting error:', error);
        // On error, allow request to proceed
        return NextResponse.next();
      }
    }

    // Allow access to authenticated users (for protected routes)
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Skip auth check for API routes (handled by rate limiting above)
        if (req.nextUrl.pathname.startsWith('/api')) {
          return true;
        }
        // Require auth for protected routes
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protect these routes + rate limit API routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/Analist/:path*",
    "/persimpangan/:path*",
    "/pengguna/:path*",
    "/profile/:path*",
    "/tim/:path*",
    "/notifikasi/:path*",
    "/laporan/:path*",
    "/api/:path*", // Add API routes for rate limiting
  ],
};
