"use client";

import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// ─── Data ────────────────────────────────────────────────────────────────────

const intersectionData: Record<string, IntersectionDetail> = {
  "thamrin-sudirman": {
    id: "thamrin-sudirman",
    name: "Persimpangan Thamrin-Sudirman",
    totalVolume: 4821,
    congestion: "Sedang",
    vcRatio: 0.65,
    cycleTime: 120,
    latency: 14,
    algorithm: "Adaptive-Flow v2.4",
    lanes: [
      { direction: "Utara", street: "Sudirman", volume: 1240, duration: 45, light: "green" },
      { direction: "Timur", street: "Imam Bonjol", volume: 850, duration: 25, light: "red" },
      { direction: "Selatan", street: "Thamrin", volume: 1410, duration: 12, light: "yellow" },
      { direction: "Barat", street: "Kebon Sirih", volume: 621, duration: 30, light: "red" },
    ],
    logs: [
      {
        time: "14:22:10",
        type: "Anomali IoT",
        description: "Sensor Jalur Selatan kehilangan paket data sementara (200ms)",
        priority: "LOW",
        status: "Auto-resolved",
      },
      {
        time: "14:15:00",
        type: "Penyesuaian Fase",
        description: "Penambahan durasi hijau Jalur Utara (+5s) karena lonjakan volume",
        priority: "INFO",
        status: "Sistem",
      },
      {
        time: "13:45:22",
        type: "Kendaraan Prioritas",
        description: "Deteksi Ambulans (B 1234 ABC) arah Utara, Prioritas Hijau Aktif",
        priority: "CRITICAL",
        status: "Selesai",
      },
    ],
  },
  "kuningan-rasuna": {
    id: "kuningan-rasuna",
    name: "Persimpangan Kuningan-Rasuna Said",
    totalVolume: 3210,
    congestion: "Padat",
    vcRatio: 0.78,
    cycleTime: 90,
    latency: 22,
    algorithm: "Adaptive-Flow v2.4",
    lanes: [
      { direction: "Utara", street: "Rasuna Said", volume: 980, duration: 35, light: "red" },
      { direction: "Timur", street: "Kuningan", volume: 720, duration: 40, light: "green" },
      { direction: "Selatan", street: "Gatot Subroto", volume: 1100, duration: 10, light: "yellow" },
      { direction: "Barat", street: "HR Rasuna", volume: 410, duration: 25, light: "red" },
    ],
    logs: [
      {
        time: "14:10:05",
        type: "Penyesuaian Fase",
        description: "Durasi merah Jalur Utara diperpanjang (+8s) akibat antrian panjang",
        priority: "INFO",
        status: "Sistem",
      },
      {
        time: "13:55:30",
        type: "Anomali IoT",
        description: "Koneksi sensor Jalur Barat terputus selama 500ms",
        priority: "LOW",
        status: "Auto-resolved",
      },
    ],
  },
  "gatot-subroto": {
    id: "gatot-subroto",
    name: "Persimpangan Gatot Subroto",
    totalVolume: 5100,
    congestion: "Macet Parah",
    vcRatio: 0.91,
    cycleTime: 150,
    latency: 18,
    algorithm: "Manual Override",
    lanes: [
      { direction: "Utara", street: "Gatot Subroto", volume: 1800, duration: 55, light: "green" },
      { direction: "Timur", street: "Semanggi", volume: 1200, duration: 20, light: "red" },
      { direction: "Selatan", street: "Slipi", volume: 1500, duration: 8, light: "yellow" },
      { direction: "Barat", street: "S. Parman", volume: 600, duration: 35, light: "red" },
    ],
    logs: [
      {
        time: "14:20:00",
        type: "Manual Override",
        description: "Operator mengaktifkan mode manual karena kepadatan ekstrem",
        priority: "CRITICAL",
        status: "Aktif",
      },
      {
        time: "14:05:15",
        type: "Kendaraan Prioritas",
        description: "Deteksi Pemadam Kebakaran (B 9876 XY) arah Selatan",
        priority: "CRITICAL",
        status: "Selesai",
      },
    ],
  },
  "imam-bonjol": {
    id: "imam-bonjol",
    name: "Persimpangan Imam Bonjol",
    totalVolume: 0,
    congestion: "-",
    vcRatio: 0,
    cycleTime: 0,
    latency: 0,
    algorithm: "-",
    lanes: [
      { direction: "Utara", street: "Imam Bonjol", volume: 0, duration: 0, light: "red" },
      { direction: "Timur", street: "Diponegoro", volume: 0, duration: 0, light: "red" },
      { direction: "Selatan", street: "Cikini", volume: 0, duration: 0, light: "red" },
    ],
    logs: [
      {
        time: "12:00:00",
        type: "Perangkat Offline",
        description: "Semua sensor dan kontroler tidak merespons. Pemeriksaan lapangan diperlukan.",
        priority: "CRITICAL",
        status: "Pending",
      },
    ],
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

type LightColor = "green" | "yellow" | "red";

interface Lane {
  direction: string;
  street: string;
  volume: number;
  duration: number;
  light: LightColor;
}

interface LogEntry {
  time: string;
  type: string;
  description: string;
  priority: "LOW" | "INFO" | "CRITICAL";
  status: string;
}

interface IntersectionDetail {
  id: string;
  name: string;
  totalVolume: number;
  congestion: string;
  vcRatio: number;
  cycleTime: number;
  latency: number;
  algorithm: string;
  lanes: Lane[];
  logs: LogEntry[];
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

function LightDurationColor({ color, duration }: { color: LightColor; duration: number }) {
  if (color === "green") return <p className="text-lg font-headline font-bold text-green-600">{duration}s</p>;
  if (color === "yellow") return <p className="text-lg font-headline font-bold text-orange-500">{duration}s</p>;
  return <p className="text-lg font-headline font-bold text-tertiary">{duration > 0 ? `${duration}s` : "-"}</p>;
}

const priorityBadge: Record<string, string> = {
  LOW: "bg-yellow-100 text-yellow-700",
  INFO: "bg-blue-100 text-blue-700",
  CRITICAL: "bg-red-100 text-red-700",
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DetailPersimpanganPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const data = intersectionData[params.id];
  const [isOnline] = useState(data?.latency > 0);

  useEffect(() => {
    if (!data) {
      toast.error("Persimpangan tidak ditemukan");
      router.push("/persimpangan");
    }
  }, [data, router]);

  if (!data) return null;

  const handleManualOverride = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-semibold text-sm">Aktifkan Manual Override?</p>
        <p className="text-xs text-slate-500">Sistem otomatis akan dinonaktifkan sementara.</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              toast.success("Manual Override diaktifkan");
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
          >
            Aktifkan
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
          >
            Batal
          </button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  const handleDownloadReport = () => {
    toast.success("Laporan sedang diunduh...");
  };

  const handleConfigureLane = () => {
    toast.success("Membuka konfigurasi jalur...");
  };

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen">
        {/* Top App Bar */}
        <header className="sticky top-0 z-30 w-full h-16 bg-white/80 backdrop-blur-md shadow-sm flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/persimpangan")}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-slate-500">arrow_back</span>
            </motion.button>
            <h2 className="font-headline font-bold text-xl tracking-tight text-slate-900">
              {data.name}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isOnline ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>sensors</span>
              {isOnline ? `IoT Aktif: ${data.algorithm}` : "IoT Offline"}
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Metric Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <MetricCard
              label="Total Kendaraan/Jam"
              value={data.totalVolume > 0 ? data.totalVolume.toLocaleString("id-ID") : "-"}
              sub={data.totalVolume > 0 ? "12% dari rata-rata" : "Tidak ada data"}
              subIcon="trending_up"
              subColor="text-green-600"
            />
            <MetricCard
              label="Indeks Kemacetan"
              value={data.congestion}
              sub={data.vcRatio > 0 ? `V/C Ratio: ${data.vcRatio}` : "Tidak tersedia"}
              subIcon="speed"
              subColor="text-orange-500"
            />
            <MetricCard
              label="Waktu Siklus Aktif"
              value={data.cycleTime > 0 ? `${data.cycleTime}` : "-"}
              valueSuffix={data.cycleTime > 0 ? "detik" : ""}
              sub={data.cycleTime > 0 ? "Optimasi Dinamis" : "Tidak aktif"}
              subIcon="update"
              subColor="text-primary"
            />
            <MetricCard
              label="Status Perangkat"
              value={isOnline ? "Online" : "Offline"}
              sub={isOnline ? `Latensi: ${data.latency}ms` : "Tidak terhubung"}
              subIcon="wifi"
              subColor={isOnline ? "text-slate-500" : "text-red-500"}
              valueColor={isOnline ? "text-green-600" : "text-red-500"}
            />
          </motion.div>

          {/* Main Section */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Lane Control Cards */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="xl:col-span-4 space-y-6"
            >
              <h3 className="font-headline font-bold text-slate-900 px-1">Kontrol Jalur Real-time</h3>
              {data.lanes.map((lane, idx) => (
                <motion.div
                  key={lane.direction}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.08 }}
                  className={`bg-surface-container-lowest rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow ${lane.light === "green" ? "border-2 border-green-200" : ""}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${lane.light === "green" ? "bg-primary animate-pulse" : "bg-slate-300"}`}></span>
                      <p className="text-sm font-bold text-slate-900">
                        Jalur {lane.direction} ({lane.street})
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Volume</p>
                        <p className="text-lg font-headline font-bold">
                          {lane.volume > 0 ? lane.volume.toLocaleString("id-ID") : "-"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Durasi</p>
                        <LightDurationColor color={lane.light} duration={lane.duration} />
                      </div>
                    </div>
                  </div>
                  <TrafficLight color={lane.light} />
                </motion.div>
              ))}
            </motion.div>

            {/* Visualization + Action Bar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="xl:col-span-8 flex flex-col gap-6"
            >
              {/* Intersection Visual */}
              <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative flex-1 min-h-[500px]">
                <div className="absolute inset-0 flex items-center justify-center p-12">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Vertical Road */}
                    <div className="absolute w-32 h-full bg-slate-800 border-x border-slate-700/50 flex flex-col justify-between py-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-[10px] text-slate-500 font-bold">UTARA</div>
                        <div className="w-8 h-1 bg-white/30 rounded-full"></div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-1 bg-white/30 rounded-full"></div>
                        <div className="text-[10px] text-slate-500 font-bold">SELATAN</div>
                      </div>
                    </div>
                    {/* Horizontal Road */}
                    <div className="absolute h-32 w-full bg-slate-800 border-y border-slate-700/50 flex justify-between px-8">
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] text-slate-500 font-bold [writing-mode:vertical-lr] rotate-180">BARAT</div>
                        <div className="h-8 w-1 bg-white/30 rounded-full"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-1 bg-white/30 rounded-full"></div>
                        <div className="text-[10px] text-slate-500 font-bold [writing-mode:vertical-lr]">TIMUR</div>
                      </div>
                    </div>
                    {/* Center */}
                    <div className="relative w-32 h-32 bg-slate-700 shadow-inner flex items-center justify-center">
                      <div className="w-24 h-24 border border-dashed border-slate-500/30 rounded-full animate-spin [animation-duration:10s]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-4xl opacity-50">center_focus_weak</span>
                      </div>
                    </div>
                    {/* Flow Indicators */}
                    {data.lanes.find((l) => l.direction === "Utara")?.light === "green" && (
                      <div className="absolute top-0 w-24 flex flex-col items-center gap-1 translate-y-8">
                        <div className="flex gap-1">
                          <div className="w-2 h-4 bg-green-500 rounded-sm"></div>
                          <div className="w-2 h-4 bg-green-500 rounded-sm"></div>
                          <div className="w-2 h-4 bg-green-500 rounded-sm"></div>
                        </div>
                        <p className="text-[10px] font-bold text-green-400">AKTIF</p>
                      </div>
                    )}
                    {data.lanes.find((l) => l.direction === "Selatan")?.light === "yellow" && (
                      <div className="absolute bottom-0 w-24 flex flex-col items-center gap-1 -translate-y-8">
                        <div className="flex gap-1">
                          <div className="w-2 h-4 bg-orange-500 rounded-sm"></div>
                          <div className="w-2 h-4 bg-orange-500 rounded-sm"></div>
                        </div>
                        <p className="text-[10px] font-bold text-orange-400">SIAGA</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Overlays */}
                <div className="absolute top-6 left-6 flex items-center gap-4">
                  <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live CCTV Feed</p>
                    <p className="text-sm text-white font-headline font-bold">Cam-04: {data.lanes[0]?.street} North</p>
                  </div>
                  {isOnline && (
                    <div className="bg-primary/20 backdrop-blur-md px-4 py-2 rounded-xl border border-primary/30 flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                      <p className="text-[10px] text-primary-container font-bold uppercase">AI Analysis: Running</p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="absolute bottom-6 right-6 flex gap-3">
                  <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-all border border-white/20">
                    <span className="material-symbols-outlined">zoom_in</span>
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-all border border-white/20">
                    <span className="material-symbols-outlined">fullscreen</span>
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleManualOverride}
                    className="bg-tertiary text-white px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-sm">emergency</span>
                    MANUAL OVERRIDE
                  </motion.button>
                </div>
              </div>

              {/* Action Bar */}
              <div className="bg-surface-container-low p-4 rounded-2xl flex items-center justify-between border border-outline-variant/10">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Metode Sinkronisasi</span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">precision_manufacturing</span>
                      <span className="text-sm font-bold text-on-surface">Algoritma {data.algorithm}</span>
                    </div>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-300"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Update Terakhir</span>
                    <span className="text-sm font-bold text-on-surface">Baru saja (Real-time)</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownloadReport}
                    className="px-5 py-2.5 rounded-xl bg-white border border-outline-variant text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Unduh Laporan
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfigureLane}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:shadow-md transition-all"
                  >
                    Konfigurasi Jalur
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Event Log Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-surface-container flex items-center justify-between">
              <h4 className="font-headline font-bold text-slate-900">Riwayat Kejadian &amp; Anomali</h4>
              <button
                onClick={() => toast.success("Memuat semua log...")}
                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
              >
                Lihat Semua Log
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-[10px] uppercase tracking-widest font-black text-slate-500">
                    <th className="px-6 py-4">Waktu</th>
                    <th className="px-6 py-4">Tipe Kejadian</th>
                    <th className="px-6 py-4">Deskripsi</th>
                    <th className="px-6 py-4">Prioritas</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {data.logs.map((log, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 + idx * 0.07 }}
                      className="hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">{log.time}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{log.type}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{log.description}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${priorityBadge[log.priority]}`}>
                          {log.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold ${log.status === "Auto-resolved" || log.status === "Selesai" ? "text-green-600" : log.status === "Aktif" ? "text-orange-500" : "text-slate-500"}`}>
                          {log.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </>
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
