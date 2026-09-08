"use client";

import { useCallback, useEffect, useState } from "react";

export interface LiveLane {
  status: "ONLINE" | "STALE" | "OFFLINE" | "UNKNOWN";
  online: boolean | null;
  fresh: boolean | null;
  connected: boolean | null;
  inferenceFresh: boolean | null;
  frame_age_s: number | null;
  active_vehicle_count: number | null;
  queue_vehicle_count: number | null;
}

// Peta approach -> live Server 2 via /api/cameras/live (polling 4 dtk).
export function useCameraLiveMap(intersectionId: string | null) {
  const [byApproach, setByApproach] = useState<Record<string, LiveLane>>({});

  const load = useCallback(async () => {
    if (!intersectionId || intersectionId === "all") {
      setByApproach({});
      return;
    }
    try {
      const res = await fetch(
        `/api/cameras/live?intersectionId=${encodeURIComponent(intersectionId)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) return;
      const next: Record<string, LiveLane> = {};
      for (const c of json.data) {
        const approach = String(c.approach_id || "").toLowerCase();
        if (!approach) continue;
        next[approach] = {
          status: c.status || "UNKNOWN",
          online: c.online ?? null,
          fresh: c.fresh ?? null,
          connected: c.connected ?? null,
          inferenceFresh: c.inference_fresh ?? null,
          frame_age_s: c.frame_age_s ?? null,
          active_vehicle_count: c.metrics ? c.metrics.active_vehicle_count ?? null : null,
          queue_vehicle_count: c.metrics ? c.metrics.queue_vehicle_count ?? null : null,
        };
      }
      setByApproach(next);
    } catch {
      /* polling berikutnya mencoba lagi */
    }
  }, [intersectionId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  return byApproach;
}
