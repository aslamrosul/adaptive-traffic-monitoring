import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    // Skip rate limiting in middleware - Edge Runtime doesn't support node:crypto
    // Implement rate limiting in individual API routes if needed using Node.js runtime
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
