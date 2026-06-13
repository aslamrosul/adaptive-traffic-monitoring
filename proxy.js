import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function proxy(req) {
    // Skip rate limiting in middleware - Edge Runtime doesn't support node:crypto
    // Implement rate limiting in individual API routes if needed using Node.js runtime
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow API routes to pass through
        if (req.nextUrl.pathname.startsWith('/api')) {
          return true;
        }
        // Require authentication for protected routes
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
    "/iot-config/:path*",
    "/panduan/:path*",
  ],
};
