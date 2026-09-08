"use client";

import DashboardLayout from "@/components/DashboardLayout";
import IntersectionCameraGrid from "@/components/IntersectionCameraGrid";
import PedestrianPanel, { type Crossing } from "@/components/PedestrianPanel";
import VisionStateBadge from "@/components/VisionStateBadge";
import { useEvents, useIntersection, useRealtimeTraffic } from "@/lib/hooks";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

type LightColor = "green" | "yellow" | "red";

interface LogEntry {
  time: string;
  type: string;
  description: string;
  priority: "LOW" | "INFO" | "CRITICAL";
  status: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TrafficLight({ color }: { color: LightColor }) {
  return (
    <div className="flex flex-col gap-1 items-center bg-slate-900 p-3 rounded-xl">
      <div className={`w-4 h-4 rounded-full ${color === "red" ? "bg-tertiary shadow-[0_0_12px_rgba(147,0,13,0.6)]" : "bg-slate-700"}`}></div>
      <div className={`w-4 h-4 rounded-full ${color === "yellow" ? "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]" : "bg-slate-700"}`}></div>
      <div className={`w-4 h-4 rounded-full ${color === "green" ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]" : "bg-slate-700"}`}></div>
    </div>
  );
}

function LightDurationColor({ color, duration }: { color: LightColor; duration: number | null }) {
  if (duration === null || duration === undefined) return <p className="text-lg font-headline font-bold text-slate-400">-</p>;
  if (color === "green") return <p className="text-lg font-headline font-bold text-green-600">{duration}s</p>;
  if (color === "yellow") return <p className="text-lg font-headline font-bold text-orange-500">{duration}s</p>;
  return <p className="text-lg font-headline font-bold text-tertiary">{duration > 0 ? `${duration}s` : "-"}</p>;
}

const priorityBadge: Record<string, string> = {
  LOW: "bg-yellow-100 text-yellow-700",
  INFO: "bg-blue-100 text-blue-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const SENSOR_LABEL: Record<number, string> = {
  0: "Low / Clear",
  1: "Occupied",
  2: "Dense / High Occupancy",
};

// Akses aman ke record telemetri mentah tanpa `any`.
type Raw = Record<string, unknown>;
const rNum = (r: Raw, k: string, d = 0): number => {
  const v = r[k];
  return typeof v === "number" && Number.isFinite(v) ? v : d;
};
const rStr = (r: Raw, k: string, d = ""): string =>
  typeof r[k] === "string" ? (r[k] as string) : d;
const rBool = (r: Raw, k: string, d = false): boolean =>
  typeof r[k] === "boolean" ? (r[k] as boolean) : d;
const errMsg = (e: unknown, d: string): string =>
  e instanceof Error ? e.message : d;

function fmtNum(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "-";
}

function fmt1(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(1) : "-";
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DetailPersimpanganPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const role = ((session?.user as unknown as Raw)?.role as string) || "operator";
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  const { intersection, isLoading: loadingIntersection, mutate } = useIntersection(id);
  const { trafficData: trafficDataRaw } = useRealtimeTraffic(id, 100);
  const trafficData = (trafficDataRaw || []) as Raw[];
  const { events: eventsRaw } = useEvents(id, undefined, undefined, 10);
  const events = (eventsRaw || []) as Raw[];

  if (!id) return null;

  if (loadingIntersection) {
    return (
      <DashboardLayout title="Memuat...">
        <div className="p-4 lg:p-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Memuat data persimpangan...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!intersection) {
    return (
      <DashboardLayout title="Error">
        <div className="p-4 lg:p-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
            <p className="text-slate-900 font-bold text-xl mb-2">Persimpangan tidak ditemukan</p>
            <button
              onClick={() => router.push('/persimpangan')}
              className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Kembali ke Daftar
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentTrafficData = (trafficData || []).filter((t: Raw) => {
    const ts = new Date(rStr(t, 'timestamp')).getTime();
    return Number.isFinite(ts) && ts > oneHourAgo;
  });
  const latestTraffic: Raw | null =
    recentTrafficData.length > 0
      ? [...recentTrafficData].sort(
          (a: Raw, b: Raw) => new Date(rStr(b, 'timestamp')).getTime() - new Date(rStr(a, 'timestamp')).getTime()
        )[0]
      : null;

  const telemetryAgeS = latestTraffic
    ? Math.max(0, Math.round((Date.now() - new Date(rStr(latestTraffic, 'timestamp')).getTime()) / 1000))
    : null;
  const controllerOnline =
    intersection.status === "active" && telemetryAgeS !== null && telemetryAgeS < 120;
  const visionState: string | null = latestTraffic ? rStr(latestTraffic, 'vision_state', '') || null : null;
  const modeLabel = !latestTraffic
    ? "UNKNOWN"
    : rBool(latestTraffic, 'autoMode', true) === false
      ? "MANUAL"
      : rBool(latestTraffic, 'adaptiveMode', true) === false
        ? "FIXED"
        : "ADAPTIVE";

  const laneKeys = ["north", "south", "east"] as const;
  const laneRaw = (t: Raw, k: string): Raw => {
    const v = t[k];
    return typeof v === "object" && v !== null ? (v as Raw) : {};
  };
  const totalVolume = recentTrafficData.reduce(
    (sum: number, t: Raw) =>
      sum +
      rNum(laneRaw(t, "north"), "vehicleCount") +
      rNum(laneRaw(t, "south"), "vehicleCount") +
      rNum(laneRaw(t, "east"), "vehicleCount"),
    0
  );
  const avgQueueLevel =
    recentTrafficData.length > 0
      ? recentTrafficData.reduce((sum: number, t: Raw) => {
          const qs = ["north", "south", "east"].map((k) =>
            rNum(laneRaw(t, k), "queueLevel")
          );
          return sum + qs.reduce((a: number, b: number) => a + b, 0) / qs.length;
        }, 0) / recentTrafficData.length
      : 0;
  const avgCongestion = (avgQueueLevel / 2) * 100;
  const congestionLevel =
    recentTrafficData.length === 0
      ? "Belum ada data"
      : avgCongestion > 70
        ? "Macet Parah"
        : avgCongestion > 50
          ? "Padat"
          : avgCongestion > 30
            ? "Sedang"
            : "Lancar";

  // Telemetri mentah terbaru sebagai Raw agar akses field kanonis aman-tipe.
  const tele: Raw | null = latestTraffic ?? null;
  const laneOf = (k: string): Raw => {
    const v = tele?.[k];
    return typeof v === "object" && v !== null ? (v as Raw) : {};
  };
  const teleAge = (k: string): string => {
    if (!tele) return "-";
    const v = tele[k];
    return typeof v === "number" && Number.isFinite(v) ? String(v) : "-";
  };
  const deviceId =
    rStr(intersection as unknown as Raw, 'deviceId') ||
    rStr(intersection as unknown as Raw, 'device_id') ||
    (latestTraffic ? rStr(latestTraffic, 'deviceId') : "") ||
    "";

  const setAutoMode = async (value: boolean) => {
    if (!deviceId) {
      toast.error("Controller ID tidak diketahui");
      return;
    }
    try {
      const res = await fetch(`/api/iot/config/${encodeURIComponent(deviceId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoMode: value }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal mengubah mode");
      toast.success(value ? "Mode otomatis aktif" : "Mode manual aktif (lampu aman)");
      mutate();
    } catch (e: unknown) {
      toast.error(errMsg(e, "Gagal mengubah mode"));
    }
  };

  const handleDelete = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-semibold text-sm text-red-600">Hapus Persimpangan?</p>
        <p className="text-xs text-slate-500">
          Data persimpangan akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const response = await fetch(`/api/intersections/${id}`, {
                  method: "DELETE",
                });
                const data = await response.json();
                if (data.success) {
                  toast.success("Persimpangan berhasil dihapus");
                  router.push("/persimpangan");
                } else {
                  toast.error(data.error || "Gagal menghapus persimpangan");
                }
              } catch (error) {
                console.error("Error deleting intersection:", error);
                toast.error("Terjadi kesalahan saat menghapus persimpangan");
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
          >
            Hapus
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300"
          >
            Batal
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const logs: LogEntry[] = events.map((event: Raw) => ({
    time:
      new Date(rStr(event, 'timestamp')).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB",
    type: rStr(event, 'type'),
    description: rStr(event, 'description'),
    priority: rStr(event, "priority", "info").toUpperCase() as LogEntry["priority"],
    status: rStr(event, 'status'),
  }));

  return (
    <DashboardLayout title={`Detail: ${intersection.name}`}>
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
        {/* 1. Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/persimpangan")}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 rounded-lg transition-colors shadow-sm border border-slate-200"
            >
              <span className="material-symbols-outlined text-slate-500">arrow_back</span>
              <span className="text-sm font-semibold text-slate-700">Kembali</span>
            </motion.button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{intersection.name}</h1>
              <p className="font-mono text-xs text-slate-500">
                {intersection.id}
                {rStr(intersection as unknown as Raw, 'address') ? ` • ${rStr(intersection as unknown as Raw, 'address')}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${controllerOnline ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}
            >
              ● {controllerOnline ? "ONLINE" : latestTraffic ? "OFFLINE" : "UNKNOWN"}
            </span>
            <VisionStateBadge
              state={visionState}
              freshLanes={latestTraffic ? rNum(latestTraffic, 'visionFreshLanes', 0) || null : null}
            />
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              {modeLabel}
            </span>
          </div>
        </div>

        {/* Fallback banner */}
        {visionState === "FALLBACK" && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            Mode fallback aktif — controller menggunakan sensor lokal / konfigurasi aman karena
            data vision tidak tersedia.
          </div>
        )}
        {visionState === "DEGRADED" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-700">
            Sebagian kamera/vision tidak fresh.
          </div>
        )}

        {/* 2. Ringkasan operasional */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <MetricCard
            label="Total Kendaraan/Jam"
            value={totalVolume > 0 ? totalVolume.toLocaleString("id-ID") : "-"}
            sub={totalVolume > 0 ? "1 jam terakhir" : "Tidak ada data"}
            subIcon="trending_up"
            subColor="text-green-600"
          />
          <MetricCard
            label="Indeks Kemacetan"
            value={recentTrafficData.length > 0 ? congestionLevel : "-"}
            sub={recentTrafficData.length > 0 ? `Rata-rata level antrean ${(avgQueueLevel).toFixed(1)}` : "Tidak ada data"}
            subIcon="speed"
            subColor="text-orange-500"
          />
          <MetricCard
            label="Controller"
            value={deviceId || "-"}
            sub={
              controllerOnline
                ? `Telemetri ${telemetryAgeS}s lalu`
                : latestTraffic
                  ? "Telemetri basi/tidak ada"
                  : "Belum ada data"
            }
            subIcon="memory"
            subColor="text-slate-500"
            valueColor={controllerOnline ? "text-green-600" : "text-slate-500"}
          />
          <MetricCard
            label="Firmware"
            value={tele ? rStr(tele, 'firmwareVersion') || "-" : "-"}
            sub={
              tele
                ? `RSSI ${teleAge('wifiRssi')} dBm • uptime ${teleAge('uptimeS')}s`
                : "Belum ada data"
            }
            subIcon="wifi"
            subColor="text-slate-500"
          />
        </div>

        {/* 3. Kamera & AI */}
        <section className="space-y-3">
          <h3 className="font-headline font-bold text-slate-900">Kamera & AI Kanonis</h3>
          <IntersectionCameraGrid intersectionId={id} isAdmin={role === "admin"} />
        </section>

        {/* 4. Operasi jalur */}
        <section className="space-y-3">
          <h3 className="font-headline font-bold text-slate-900">Operasi Jalur</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {laneKeys.map((key) => {
              const lane = laneOf(key);
              const lightRaw = rStr(lane, 'light');
              const light: LightColor =
                lightRaw === "green" || lightRaw === "yellow" ? lightRaw : "red";
              return (
                <div key={key} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-sm">
                      <p className="font-extrabold capitalize">{key}</p>
                      <p>
                        <span className="text-slate-500">Recommended: </span>
                        <span className="font-bold">{fmt1(rNum(lane, 'recommendedGreenS', NaN))}s</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Applied: </span>
                        <span className="font-bold">{fmt1(rNum(lane, 'greenDuration', NaN))}s</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Vehicles: </span>
                        <span className="font-bold">{fmtNum(rNum(lane, 'vehicleCount', NaN))}</span>
                        <span className="text-slate-500"> • Queue: </span>
                        <span className="font-bold">{fmtNum(rNum(lane, 'cameraQueueVehicles', NaN))}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Waiting: </span>
                        <span className="font-bold">{fmt1(rNum(lane, 'maxWaitingS', NaN))}s</span>
                        <span className="text-slate-500"> • Level: </span>
                        <span className="font-bold">{tele ? fmtNum(rNum(lane, 'queueLevel', NaN)) : "-"}</span>
                      </p>
                      {!tele && (
                        <p className="text-xs text-slate-400">Belum ada data jalur.</p>
                      )}
                    </div>
                    <TrafficLight color={light} />
                  </div>
                  <div className="mt-2">
                    <LightDurationColor
                      color={light}
                      duration={(() => { const d = lane['greenDuration']; return typeof d === "number" ? d : null; })()}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Sensor & Controller */}
        <section className="space-y-3">
          <h3 className="font-headline font-bold text-slate-900">Sensor & Controller</h3>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm space-y-3">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <p><span className="text-slate-500">Controller: </span><span className="font-mono font-bold">{deviceId || "-"}</span></p>
              <p><span className="text-slate-500">MQTT: </span><span className="font-bold">{controllerOnline ? "CONNECTED" : "DISCONNECTED"}</span></p>
              <p><span className="text-slate-500">Fase: </span><span className="font-bold">{tele ? rStr(tele, 'sigState') || "-" : "-"}</span></p>
              <p><span className="text-slate-500">Jalur aktif: </span><span className="font-bold capitalize">{tele ? rStr(tele, 'activeLane') || "-" : "-"}</span></p>
              <p><span className="text-slate-500">Config v: </span><span className="font-bold">{tele ? teleAge('configVersion') : "-"}</span></p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {laneKeys.map((key) => {
                const lane = laneOf(key);
                const lvlRaw = lane['queueLevel'];
                const lvl = typeof lvlRaw === "number" ? lvlRaw : null;
                return (
                  <div key={key} className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="font-extrabold capitalize mb-1">{key}</p>
                    <p>IR: <span className="font-bold">{tele ? (rBool(lane, 'vehicleDetected') ? "DETECTED" : "CLEAR") : "-"}</span></p>
                    <p>Ultrasonic: <span className="font-bold">{tele && "distanceCm" in lane ? `${fmtNum(lane["distanceCm"])} cm` : "-"}</span></p>
                    <p>Terdeteksi US: <span className="font-bold">{tele ? (rBool(lane, 'ultrasonicDetected') ? "YES" : "NO") : "-"}</span></p>
                    <p>
                      Sensor Level:{" "}
                      <span className="font-bold">
                        {lvl === null || !tele ? "-" : `${lvl} (${SENSOR_LABEL[lvl] ?? ""})`}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Level = hunian fisik, bukan jumlah kendaraan.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Konfigurasi */}
        <section className="space-y-3">
          <h3 className="font-headline font-bold text-slate-900">Konfigurasi Persimpangan</h3>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm space-y-2">
            <p><span className="text-slate-500">Mode: </span><span className="font-bold">{modeLabel}</span></p>
            <p>
              <span className="text-slate-500">Timing (konfigurasi): </span>
              <span className="font-bold">
                Min {rNum(((intersection as unknown as Raw).config as Raw | undefined) || {}, 'minGreen', 10)}s • Max {rNum(((intersection as unknown as Raw).config as Raw | undefined) || {}, 'maxGreen', 60)}s •{" "}
                Kuning {rNum(((intersection as unknown as Raw).config as Raw | undefined) || {}, 'yellow', 3)}s • All-red {rNum(((intersection as unknown as Raw).config as Raw | undefined) || {}, 'allRed', 2)}s
              </span>
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setAutoMode(false)}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Manual Override (nyata)
              </button>
              <button
                onClick={() => setAutoMode(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Kembalikan Otomatis
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300"
              >
                Hapus Persimpangan
              </button>
            </div>
          </div>
          <PedestrianPanel
            intersectionId={id}
            initial={(() => {
              const v = (intersection as unknown as Raw)?.pedestrian_crossings;
              return Array.isArray(v) ? (v as unknown as Crossing[]) : [];
            })()}
            onSaved={() => mutate()}
          />
        </section>

        {/* 7. Events */}
        <section className="space-y-3">
          <h3 className="font-headline font-bold text-slate-900">Recent Events</h3>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
            {logs.length === 0 && (
              <p className="p-4 text-sm text-slate-400">Belum ada event.</p>
            )}
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 text-sm">
                <span className="text-slate-400 tabular-nums text-xs whitespace-nowrap">{log.time}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityBadge[log.priority] || "bg-slate-100 text-slate-600"}`}>
                  {log.type}
                </span>
                <span className="flex-1 text-slate-700">{log.description}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  valueSuffix,
  sub,
  subIcon,
  subColor,
  valueColor = "text-on-surface",
}: {
  label: string;
  value: string;
  valueSuffix?: string;
  sub: string;
  subIcon: string;
  subColor: string;
  valueColor?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-surface-container-lowest p-6 rounded-xl shadow-sm space-y-2"
    >
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-headline font-extrabold ${valueColor}`}>
        {value}
        {valueSuffix && (
          <span className="text-lg font-medium text-slate-400 ml-1">{valueSuffix}</span>
        )}
      </p>
      <div className={`flex items-center gap-1 text-xs font-bold ${subColor}`}>
        <span className="material-symbols-outlined text-sm">{subIcon}</span>
        <span>{sub}</span>
      </div>
    </motion.div>
  );
}
