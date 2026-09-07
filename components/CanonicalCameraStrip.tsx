"use client";

import { useCallback, useEffect, useState } from "react";

interface LiveCam {
  camera_id: string;
  approach_id: string;
  status: "ONLINE" | "STALE" | "OFFLINE" | "UNKNOWN";
  frame_age_s: number | null;
  fps_ingest: number | null;
}

// Strip kamera kanonis: registry + live Server 2, tanpa IP manual.
// Snapshot via proxy aman /api/cameras/[id]/snapshot (refresh 5 dtk).
// STALE/OFFLINE = placeholder jujur, bukan frame beku yang mengaku LIVE (Z).
export default function CanonicalCameraStrip({
  intersectionId,
}: {
  intersectionId: string;
}) {
  const [cams, setCams] = useState<LiveCam[]>([]);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/cameras/live?intersectionId=${encodeURIComponent(intersectionId)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (json.success) setCams(json.data);
    } catch {
      /* biarkan tampilan terakhir; polling berikutnya mencoba lagi */
    }
  }, [intersectionId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 5000);
    return () => clearInterval(t);
  }, []);

  if (!cams.length) return null;

  const pill = (s: string) =>
    s === "ONLINE"
      ? "bg-emerald-100 text-emerald-700"
      : s === "STALE"
        ? "bg-amber-100 text-amber-700"
        : s === "OFFLINE"
          ? "bg-red-100 text-red-700"
          : "bg-slate-200 text-slate-600";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Kamera Kanonis • Registry Server
      </p>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cams.map((c) => (
          <div key={c.camera_id} className="rounded-xl border border-slate-200 p-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[11px] font-bold capitalize">
                {c.approach_id}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pill(c.status)}`}>
                {c.status}
              </span>
            </div>
            {c.status === "ONLINE" ? (
              <img
                key={tick}
                src={`/api/cameras/${encodeURIComponent(c.camera_id)}/snapshot?t=${tick}`}
                alt={c.camera_id}
                className="aspect-[4/3] w-full rounded-lg bg-slate-900 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg bg-slate-100 text-slate-400">
                <span className="material-symbols-outlined text-2xl">videocam_off</span>
                <span className="text-[10px] font-bold">
                  {c.status === "UNKNOWN" ? "Layanan tak terjangkau" : "Tidak ada frame live"}
                </span>
              </div>
            )}
            <p className="mt-1 text-[10px] tabular-nums text-slate-500">
              {c.frame_age_s === null || c.frame_age_s === undefined
                ? "age -"
                : `age ${Number(c.frame_age_s).toFixed(1)}s`}
              {" • "}
              {c.fps_ingest ?? "-"} fps
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
