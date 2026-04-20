import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Allow access to authenticated users
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protect these routes (exclude root "/" because it handles its own redirect)
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
  ],
};
