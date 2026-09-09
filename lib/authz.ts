// Otorisasi tulis konfigurasi: login wajib, admin untuk tulis.
// GET baca: login cukup. PUT: admin saja (samakan dengan UI + /cameras POST).
export interface SessionLike {
  user?: { role?: string; email?: string } | null;
}

export function authWriteError(
  session: SessionLike | null
): { status: 401 | 403; error: string } | null {
  if (!session?.user) return { status: 401, error: "Unauthorized" };
  if (session.user.role !== "admin") {
    return { status: 403, error: "Khusus admin" };
  }
  return null;
}
