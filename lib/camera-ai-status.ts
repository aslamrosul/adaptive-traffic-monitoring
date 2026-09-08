// Status AI kanonis per kamera (Server 2), bukan boolean lokal.
// ACTIVE: online && fresh && inference fresh && connected!==false.
// STALE: terhubung/online tapi tak fresh. OFFLINE: mati. UNKNOWN: API gagal.
export type AiStatus = "ACTIVE" | "STALE" | "OFFLINE" | "UNKNOWN";

export interface AiLiveInput {
  online?: boolean | null;
  fresh?: boolean | null;
  connected?: boolean | null;
  inferenceFresh?: boolean | null;
}

export function deriveAiStatus(live: AiLiveInput | null | undefined): AiStatus {
  if (!live) return "UNKNOWN";
  const online = live.online === true;
  const fresh = live.fresh === true;
  const connected = live.connected;
  const inferFresh = live.inferenceFresh;
  const inferOk = inferFresh === null || inferFresh === undefined ? true : inferFresh === true;
  if (online && fresh && inferOk && connected !== false) return "ACTIVE";
  if (connected === true || (online && !fresh)) return "STALE";
  if (online === false || connected === false) return "OFFLINE";
  return "UNKNOWN";
}

// Tampilkan "-" bila data tak diketahui; 0 hanya bila eksplisit 0 (STEP 11).
export function formatVehicleCount(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return String(Math.max(0, Math.floor(n)));
}
