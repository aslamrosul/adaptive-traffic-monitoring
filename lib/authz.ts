// Otorisasi tulis konfigurasi: login wajib, admin untuk tulis.
// GET baca: login cukup. PUT: admin saja (samakan dengan UI + /cameras POST).
export interface SessionLike {
  user?: { role?: string; email?: string; userStatus?: string } | null;
}

export function authWriteError(
  session: SessionLike | null
): { status: 401 | 403; error: string } | null {
  const denied = requireAdmin(session);
  if (denied) {
    return denied.status === 401
      ? { status: 401, error: "Unauthorized" }
      : { status: 403, error: "Khusus admin" };
  }
  return null;
}

function inactiveError(): { status: 403; error: string } {
  return { status: 403, error: "Akun tidak aktif" };
}

// Login wajib (API baca). Tolak juga user nonaktif bila status tersedia.
export function requireAuthenticated(
  session: SessionLike | null
): { status: 401 | 403; error: string } | null {
  if (!session?.user) return { status: 401, error: "Unauthorized" };
  if (session.user.userStatus && session.user.userStatus !== "active") {
    return inactiveError();
  }
  return null;
}

// Admin wajib (API tulis). Urutan: login -> aktif -> admin.
export function requireAdmin(
  session: SessionLike | null
): { status: 401 | 403; error: string } | null {
  const auth = requireAuthenticated(session);
  if (auth) return auth;
  if (session?.user?.role !== "admin") {
    return { status: 403, error: "Khusus admin" };
  }
  return null;
}
