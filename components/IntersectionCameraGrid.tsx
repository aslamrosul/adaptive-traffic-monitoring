"use client";

import AiStatusBadge from "@/components/AiStatusBadge";
import { deriveAiStatus, formatVehicleCount } from "@/lib/camera-ai-status";
import { useCallback, useEffect, useState } from "react";

interface CamLive {
  camera_id: string;
  intersection_id: string;
  approach_id: string;
  enabled: boolean;
  status: "ONLINE" | "STALE" | "OFFLINE" | "UNKNOWN";
  online: boolean | null;
  fresh: boolean | null;
  connected: boolean | null;
  inferenceFresh: boolean | null;
  frame_age_s: number | null;
  fps_ingest: number | null;
  last_seen: string | null;
  metrics: {
    active_vehicle_count: number | null;
    queue_vehicle_count: number | null;
    stopped_vehicle_count?: number | null;
    max_waiting_time_s?: number | null;
    confidence?: number | null;
  } | null;
}

interface DisplayCfg {
  camera_id: string;
  approach_id: string;
  source_type: string;
  url: string;
}

// Grid kamera kontekstual satu persimpangan: registry + live + metrik + preview + config.
// Tanpa provisioning (itu di /cameras). Tanpa token di mana pun.
export default function IntersectionCameraGrid({
  intersectionId,
  isAdmin,
}: {
  intersectionId: string;
  isAdmin: boolean;
}) {
  const [cams, setCams] = useState<CamLive[]>([]);
  const [cfg, setCfg] = useState<Record<string, DisplayCfg>>({});
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [formSource, setFormSource] = useState("canonical");
  const [formUrl, setFormUrl] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    try {
      const [liveRes, cfgRes] = await Promise.all([
        fetch(`/api/cameras/live?intersectionId=${encodeURIComponent(intersectionId)}`, {
          cache: "no-store",
        }),
        fetch(`/api/cameras/display-config?intersectionId=${encodeURIComponent(intersectionId)}`, {
          cache: "no-store",
        }),
      ]);
      const liveJson = await liveRes.json().catch(() => ({}));
      const cfgJson = await cfgRes.json().catch(() => ({}));
      if (liveJson.success && Array.isArray(liveJson.data)) {
        setCams(
          [...liveJson.data].sort((a: CamLive, b: CamLive) =>
            String(a.approach_id).localeCompare(String(b.approach_id))
          )
        );
      }
      if (cfgJson.success && Array.isArray(cfgJson.data)) {
        const map: Record<string, DisplayCfg> = {};
        for (const c of cfgJson.data) {
          if (c.camera_id) map[c.camera_id] = c;
        }
        setCfg(map);
      }
    } catch {
      /* polling berikutnya mencoba lagi; satu kamera gagal tak merusak lain */
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

  const openEditor = (camera_id: string) => {
    const current = cfg[camera_id];
    setFormSource(current?.source_type || "canonical");
    setFormUrl(current?.url || "");
    setSaveState("idle");
    setSaveError("");
    setEditing(camera_id);
  };

  const save = async () => {
    if (!editing) return;
    setSaveState("saving");
    setSaveError("");
    try {
      const res = await fetch(
        `/api/cameras/${encodeURIComponent(editing)}/display-config`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source_type: formSource, url: formUrl }),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menyimpan");
      setSaveState("saved");
      load();
    } catch (e: unknown) {
      setSaveState("failed");
      setSaveError(e instanceof Error ? e.message : "Gagal menyimpan");
    }
  };

  if (!cams.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Belum ada kamera terdaftar untuk persimpangan ini. Daftarkan di halaman{" "}
        <a href="/cameras" className="font-bold text-blue-600">
          Kamera
        </a>
        .
      </div>
    );
  }

  const pill = (s: string) =>
    s === "ONLINE"
      ? "bg-emerald-100 text-emerald-700"
      : s === "STALE"
        ? "bg-amber-100 text-amber-700"
        : s === "OFFLINE"
          ? "bg-red-100 text-red-700"
          : "bg-slate-200 text-slate-600";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cams.map((c) => {
        const ai = deriveAiStatus({
          online: c.online,
          fresh: c.fresh,
          connected: c.connected,
          inferenceFresh: c.inferenceFresh,
        });
        const m = c.metrics;
        const disp = cfg[c.camera_id];
        return (
          <div key={c.camera_id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="truncate font-mono text-xs font-extrabold uppercase">
                {c.approach_id || "?"}
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
                className="aspect-[4/3] w-full rounded-lg bg-slate-900 object-contain"
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
            <p className="mt-1 truncate font-mono text-[10px] text-slate-500">{c.camera_id}</p>
            <div className="mt-1 flex items-center gap-1">
              <AiStatusBadge
                live={{
                  status: c.status,
                  online: c.online,
                  fresh: c.fresh,
                  connected: c.connected,
                  inferenceFresh: c.inferenceFresh,
                  frame_age_s: c.frame_age_s,
                  active_vehicle_count: m?.active_vehicle_count ?? null,
                  queue_vehicle_count: m?.queue_vehicle_count ?? null,
                }}
              />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1 text-center">
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-400">Vehicles</p>
                <p className="text-sm font-extrabold">
                  {formatVehicleCount(m?.active_vehicle_count)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-400">Queue</p>
                <p className="text-sm font-extrabold">
                  {formatVehicleCount(m?.queue_vehicle_count)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-400">FPS</p>
                <p className="text-sm font-extrabold tabular-nums">
                  {c.fps_ingest ?? "-"}
                </p>
              </div>
            </div>
            <p className="mt-1 text-[10px] tabular-nums text-slate-500">
              Age {c.frame_age_s === null || c.frame_age_s === undefined ? "-" : `${Number(c.frame_age_s).toFixed(1)}s`}
              {" • Sumber: "}
              {disp ? disp.source_type : "canonical"}
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => openEditor(c.camera_id)}
                className="mt-2 w-full rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Pengaturan
              </button>
            )}
          </div>
        );
      })}

      {editing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-sm font-extrabold">Pengaturan Kamera</p>
            <p className="mb-3 font-mono text-[11px] text-slate-500">{editing}</p>
            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
              Display Source
            </label>
            <select
              value={formSource}
              onChange={(e) => setFormSource(e.target.value)}
              className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="canonical">Canonical ASTRAEA</option>
              <option value="mjpeg">MJPEG Manual</option>
              <option value="hls">HLS Manual</option>
            </select>
            {(formSource === "mjpeg" || formSource === "hls") && (
              <>
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                  URL
                </label>
                <input
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://..."
                  className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </>
            )}
            {saveState === "failed" && saveError && (
              <p className="mb-2 text-xs font-bold text-red-600">{saveError}</p>
            )}
            {saveState === "saved" && (
              <p className="mb-2 text-xs font-bold text-emerald-600">Tersimpan di server.</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saveState === "saving"}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saveState === "saving" ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex-1 rounded-lg bg-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
