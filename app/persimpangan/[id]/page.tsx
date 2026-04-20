"use client";

import Sidebar from "@/components/Sidebar";
import { useEvents, useIntersection, useRealtimeTraffic } from "@/lib/hooks";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  const { intersection, isLoading: loadingIntersection, mutate } = useIntersection(id);
  const { trafficData, isLoading: loadingTraffic } = useRealtimeTraffic(id, 10);
  const { events, isLoading: loadingEvents } = useEvents(id, undefined, undefined, 10);

  if (!id) return null;

  if (loadingIntersection) {
    return (
      <>
        <Sidebar />
        <main className="ml-64 min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Memuat data persimpangan...</p>
          </div>
        </main>
      </>
    );
  }

  if (!intersection) {
    return (
      <>
        <Sidebar />
        <main className="ml-64 min-h-screen bg-slate-50 flex items-center justify-center">
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
        </main>
      </>
    );
  }

  const isOnline = intersection.status === 'active';
  
  // Calculate lane data from traffic data
  const laneDirections = ['Utara', 'Timur', 'Selatan', 'Barat'];
  const lanes = laneDirections.map((direction, idx) => {
    const laneTraffic = trafficData.filter((t: any) => 
      t.direction?.toLowerCase() === direction.toLowerCase()
    );
    const totalVolume = laneTraffic.reduce((sum: number, t: any) => sum + (t.vehicleCount || 0), 0);
    
    // Simulate traffic light status based on volume
    let light: LightColor = 'red';
    if (idx === 0) light = 'green'; // First lane is green
    else if (idx === 2) light = 'yellow'; // Third lane is yellow
    
    return {
      direction,
      street: intersection.address?.split(',')[0] || direction,
      volume: totalVolume,
      duration: light === 'green' ? 45 : light === 'yellow' ? 12 : 30,
      light,
    };
  });

  // Calculate metrics
  const totalVolume = trafficData.reduce((sum: number, t: any) => sum + (t.vehicleCount || 0), 0);
  const avgCongestion = trafficData.length > 0
    ? trafficData.reduce((sum: number, t: any) => sum + (t.congestionIndex || 0), 0) / trafficData.length
    : 0;
  const congestionLevel = avgCongestion > 70 ? 'Macet Parah' : avgCongestion > 50 ? 'Padat' : avgCongestion > 30 ? 'Sedang' : 'Lancar';
  const vcRatio = avgCongestion / 100;

  const data: IntersectionDetail = {
    id: intersection.id,
    name: intersection.name,
    totalVolume,
    congestion: congestionLevel,
    vcRatio,
    cycleTime: intersection.config?.cycleTime?.max || 120,
    latency: isOnline ? 14 : 0,
    algorithm: intersection.config?.mode === 'auto' ? 'Adaptive-Flow v2.4' : 'Manual Override',
    lanes,
    logs: events.map((event: any) => ({
      time: new Date(event.timestamp).toLocaleTimeString('id-ID'),
      type: event.type,
      description: event.description,
      priority: event.priority.toUpperCase(),
      status: event.status,
    })),
  };

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
    setIsEditModalOpen(true);
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
              sub={data.vcRatio > 0 ? `V/C Ratio: ${data.vcRatio.toFixed(2)}` : "Tidak tersedia"}
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
          <div className="space-y-8">
            {/* Lane Control Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="font-headline font-bold text-slate-900">Kontrol Jalur Real-time</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {data.lanes.map((lane, idx) => (
                  <motion.div
                    key={lane.direction}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + idx * 0.08 }}
                    className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left side - Text content */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${lane.light === "green" ? "bg-primary animate-pulse" : "bg-slate-300"}`}></span>
                          <p className="text-sm font-bold text-slate-900">
                            Jalur {lane.direction}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">{lane.street}</p>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold">Volume</p>
                            <p className="text-lg font-headline font-bold">
                              {lane.volume > 0 ? lane.volume.toLocaleString("id-ID") : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold">Durasi</p>
                            <LightDurationColor color={lane.light} duration={lane.duration} />
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - Traffic Light */}
                      <div className="flex-shrink-0">
                        <TrafficLight color={lane.light} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Visualization + Action Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col gap-6"
            >
            </motion.div>
          </div>
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
