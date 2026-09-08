"use client";

import { deriveAiStatus, formatVehicleCount } from "@/lib/camera-ai-status";
import type { LiveLane } from "@/lib/hooks/useCameraLive";

const STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-600 text-white",
  STALE: "bg-amber-500 text-white",
  OFFLINE: "bg-slate-400 text-white",
  UNKNOWN: "bg-white text-slate-500 border",
};

// Header kartu kamera: hitungan kanonis + badge AI Server 2.
// null/unknown -> "-" (bukan 0 palsu).
export default function AiStatusBadge({ live }: { live?: LiveLane | null }) {
  const status = deriveAiStatus(
    live
      ? {
          online: live.online,
          fresh: live.fresh,
          connected: live.connected,
          inferenceFresh: live.inferenceFresh,
        }
      : null
  );
  return (
    <>
      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
        {formatVehicleCount(live?.active_vehicle_count)}
      </span>
      <span
        title="Status AI Server 2 (otomatis, bukan tombol)"
        className={`rounded-full px-2 py-1 text-[9px] font-bold ${STYLE[status]}`}
      >
        AI ● {status}
      </span>
    </>
  );
}
