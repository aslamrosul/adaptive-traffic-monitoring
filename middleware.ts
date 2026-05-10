import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    // Rate limiting only works in Node.js runtime (production)
    // In Edge Runtime (development), Redis is not available
    if (req.nextUrl.pathname.startsWith('/api') && process.env.NODE_ENV === 'production') {
      try {
        // Dynamic import to avoid Edge Runtime issues
        const { getRedisClient } = await import('@/lib/redis');
        
        const ip = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

        const redis = await getRedisClient();
        const key = `ratelimit:${ip}`;

        const count = await redis.incr(key);

        if (count === 1) {
          await redis.expire(key, 60);
        }

        if (count > 100) {
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
          );
        }

        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', '100');
        response.headers.set('X-RateLimit-Remaining', String(100 - count));

        return response;

      } catch (error) {
        console.error('Rate limiting error:', error);
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith('/api')) {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

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
    "/api/:path*",
  ],
};
