// Seleksi intersection awal (satu-kali). Murni + testable.
export interface IntersectionOption {
  id?: string;
  intersection_id?: string;
  status?: string;
}

// 1. SIMPANG_TALUN_01 bila ada; 2. aktif pertama; 3. pertama tersedia; 4. "all".
export function resolveInitialIntersection(
  list: IntersectionOption[] | null | undefined
): string {
  if (!list || !list.length) return "all";
  const talun = list.find((x) => (x.id || x.intersection_id) === "SIMPANG_TALUN_01");
  if (talun) return String(talun.id || talun.intersection_id);
  const active =
    list.find((x) => (x.status || "active") === "active") || list[0];
  return String(active.id || active.intersection_id || "all") || "all";
}
