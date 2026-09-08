"use client";

import { useCallback, useEffect, useState } from "react";

export interface LaneDisplayCfg {
  camera_id: string;
  active_source: "canonical" | "mjpeg" | "hls";
  manual_mjpeg_url: string;
  manual_hls_url: string;
}

// Konfigurasi display per approach untuk SATU intersection spesifik.
// Kunci: approach (north/south/...), stabil per intersection (STEP 19).
export function useCameraDisplay(intersectionId: string | null) {
  const [byApproach, setByApproach] = useState<Record<string, LaneDisplayCfg>>({});

  const load = useCallback(async (): Promise<Record<string, LaneDisplayCfg>> => {
    if (!intersectionId || intersectionId === "all") {
      return {};
    }
    try {
      const res = await fetch(
        `/api/cameras/display-config?intersectionId=${encodeURIComponent(intersectionId)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) return {};
      const next: Record<string, LaneDisplayCfg> = {};
      for (const c of json.data) {
        const approach = String(c.approach_id || "").toLowerCase();
        if (!approach) continue;
        next[approach] = {
          camera_id: String(c.camera_id),
          active_source:
            c.active_source === "mjpeg" || c.active_source === "hls" ? c.active_source : "canonical",
          manual_mjpeg_url: String(c.manual_mjpeg_url || ""),
          manual_hls_url: String(c.manual_hls_url || ""),
        };
      }
      return next;
    } catch {
      return {};
    }
  }, [intersectionId]);

  const refresh = useCallback(async () => {
    setByApproach(await load());
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    load().then((next) => {
      if (!cancelled) setByApproach(next);
    });
    return () => {
      cancelled = true;
    };
  }, [intersectionId, load]);

  return { byApproach, reload: refresh };
}

// Resolusi sumber efektif per lane (murni, testable).
// Urutan: override lokal (webcam/upload sesi ini) > server active > registry => canonical.
export function resolveLaneSource(opts: {
  serverEntry?: { active_source: string; manual_mjpeg_url: string; manual_hls_url: string } | null;
  registered: boolean;
  localOverride?: "webcam" | "upload" | null;
}): { kind: "canonical" | "mjpeg" | "hls" | "local-webcam" | "local-upload" | "none"; url: string } {
  if (opts.localOverride === "webcam") return { kind: "local-webcam", url: "" };
  if (opts.localOverride === "upload") return { kind: "local-upload", url: "" };
  const e = opts.serverEntry;
  if (e) {
    if (e.active_source === "mjpeg" && e.manual_mjpeg_url) {
      return { kind: "mjpeg", url: e.manual_mjpeg_url };
    }
    if (e.active_source === "hls" && e.manual_hls_url) {
      return { kind: "hls", url: e.manual_hls_url };
    }
    return { kind: "canonical", url: "" };
  }
  if (opts.registered) return { kind: "canonical", url: "" };
  return { kind: "none", url: "" };
}
