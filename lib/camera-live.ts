// Agregasi status kamera LIVE (server-side only).
// Registry DynamoDB = metadata; Server 2 /v1/cameras/{id}/status = live health.
// Token viewer TIDAK PERNAH ke browser (dibaca dari env server di route).

export interface RegistryCamera {
  camera_id: string;
  intersection_id?: string;
  approach_id?: string;
  enabled?: boolean;
  firmware_version?: string;
  created_at?: string;
}

export interface LiveStatus {
  metrics?: {
    online?: boolean;
    fresh?: boolean;
    connected?: boolean;
    frame_age_s?: number | null;
    active_vehicle_count?: number;
    queue_vehicle_count?: number;
    stopped_vehicle_count?: number;
    max_waiting_time_s?: number;
    confidence?: number;
  } | null;
  frame_age_s?: number | null;
  last_seen?: string | null;
  fps_ingest?: number | null;
  enabled?: boolean;
}

export type DerivedStatus = "ONLINE" | "STALE" | "OFFLINE" | "UNKNOWN";

export interface MergedCamera {
  camera_id: string;
  intersection_id: string;
  approach_id: string;
  enabled: boolean;
  status: DerivedStatus;
  connected: boolean | null;
  fresh: boolean | null;
  online: boolean | null;
  frame_age_s: number | null;
  inference_fresh: boolean | null;
  fps_ingest: number | null;
  last_seen: string | null;
  metrics: {
    active_vehicle_count: number;
    queue_vehicle_count: number;
    stopped_vehicle_count: number;
    max_waiting_time_s: number;
    confidence: number;
  } | null;
}

// J: ONLINE = online && fresh (connected!==false bila tersedia).
// STALE = registry ada tapi frame tak fresh. OFFLINE = online false / connected false.
// UNKNOWN = live API gagal. Live MENANG atas persisted health_state.
export function deriveStatus(live: LiveStatus | null): {
  status: DerivedStatus;
  connected: boolean | null;
  fresh: boolean | null;
  online: boolean | null;
} {
  if (!live || !live.metrics) {
    return { status: "UNKNOWN", connected: null, fresh: null, online: null };
  }
  const m = live.metrics;
  const online = m.online === true;
  const fresh = m.fresh === true;
  const connected = typeof m.connected === "boolean" ? m.connected : null;
  if (online && fresh && connected !== false) {
    return { status: "ONLINE", connected, fresh, online };
  }
  if (connected === true || (online && !fresh)) {
    return { status: "STALE", connected, fresh, online };
  }
  return { status: "OFFLINE", connected, fresh, online };
}

export function mergeCamera(reg: RegistryCamera, live: LiveStatus | null): MergedCamera {
  const d = deriveStatus(live);
  const m = live?.metrics;
  const frameAge =
    typeof live?.frame_age_s === "number"
      ? live.frame_age_s
      : typeof m?.frame_age_s === "number"
        ? m.frame_age_s
        : null;
  return {
    camera_id: reg.camera_id,
    intersection_id: reg.intersection_id || "",
    approach_id: reg.approach_id || "",
    enabled: reg.enabled !== false,
    status: d.status,
    connected: d.connected,
    fresh: d.fresh,
    online: d.online,
    frame_age_s: frameAge,
    inference_fresh: null,
    fps_ingest: typeof live?.fps_ingest === "number" ? live.fps_ingest : null,
    last_seen: live?.last_seen ?? null,
    metrics: m
      ? {
          active_vehicle_count: Number(m.active_vehicle_count ?? 0),
          queue_vehicle_count: Number(m.queue_vehicle_count ?? 0),
          stopped_vehicle_count: Number(m.stopped_vehicle_count ?? 0),
          max_waiting_time_s: Number(m.max_waiting_time_s ?? 0),
          confidence: Number(m.confidence ?? 0),
        }
      : null,
  };
}

export async function fetchLiveStatus(
  baseUrl: string,
  cameraId: string,
  viewerToken: string,
  timeoutMs: number,
  doFetch: typeof fetch = fetch,
): Promise<LiveStatus | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = {};
    if (viewerToken) headers["Authorization"] = `Bearer ${viewerToken}`;
    const res = await doFetch(
      `${baseUrl.replace(/\/$/, "")}/v1/cameras/${encodeURIComponent(cameraId)}/status`,
      { headers, signal: ctrl.signal, cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return {
      metrics: data?.metrics ?? null,
      frame_age_s: data?.frame_age_s ?? null,
      last_seen: data?.last_seen ?? null,
      fps_ingest: data?.fps_ingest ?? null,
      enabled: data?.enabled,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
