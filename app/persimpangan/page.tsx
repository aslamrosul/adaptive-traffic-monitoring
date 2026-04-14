"use client";

import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";

const lanes = [
  { name: "Jalur Utara", volume: 1240, duration: 45, status: "green", active: true },
  { name: "Jalur Timur", volume: 850, duration: 25, status: "red", active: false },
  { name: "Jalur Selatan", volume: 1410, duration: 12, status: "yellow", active: false },
  { name: "Jalur Barat", volume: 621, duration: 30, status: "red", active: false },
];

const events = [
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
];

export default function PersimpanganPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLane, setSelectedLane] = useState<typeof lanes[0] | null>(null);

  const handleManualOverride = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-red-600">Aktifkan Manual Override?</p>
          <p className="text-sm text-slate-600">
            Sistem otomatis akan dinonaktifkan. Anda akan mengontrol lampu secara manual.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.success("Manual Override diaktifkan!");
                toast.dismiss(t.id);
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
      ),
      { duration: 10000 }
    );
  };

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen bg-slate-50">
        {/* Custom Header with Back Button */}
        <header className="sticky top-0 z-30 w-full h-16 bg-white/80 backdrop-blur-md shadow-sm px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <span className="material-symbols-outlined text-slate-500">arrow_back</span>
            </button>
            <h2 className="font-headline font-bold text-lg text-slate-900">
              Persimpangan Soekarno Hatta
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                sensors
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">IoT Aktif: Auto-Mode</span>
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200">
              <img
                alt="Profil"
                className="w-full h-full rounded-full object-cover"
                src="https://ui-avatars.com/api/?name=Admin&background=0040a1&color=fff"
              />
            </div>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* Top Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Total Kendaraan/Jam
              </p>
              <p className="text-4xl font-headline font-extrabold text-primary mb-1">4,821</p>
              <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>12% dari rata-rata</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Indeks Kemacetan
              </p>
              <p className="text-4xl font-headline font-extrabold text-on-surface mb-1">Sedang</p>
              <div className="flex items-center gap-1 text-orange-500 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">speed</span>
                <span>V/C Ratio: 0.65</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Waktu Siklus Aktif
              </p>
              <p className="text-4xl font-headline font-extrabold text-on-surface mb-1">
                120
                <span className="text-lg font-medium text-slate-400 ml-1">detik</span>
              </p>
              <div className="flex items-center gap-1 text-primary text-xs font-bold">
                <span className="material-symbols-outlined text-sm">update</span>
                <span>Optimasi Dinamis</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Status Perangkat
              </p>
              <p className="text-4xl font-headline font-extrabold text-green-600 mb-1">Online</p>
              <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">wifi</span>
                <span>Latensi: 14ms</span>
              </div>
            </motion.div>
          </div>

          {/* Main Section */}
          <div className="space-y-6">
            {/* Lane Controls */}
            <div>
              <h3 className="font-headline font-bold text-slate-900 text-lg mb-4">
                Kontrol Jalur Real-time
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {lanes.map((lane, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    onClick={() => setSelectedLane(lane)}
                    className="bg-white rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                          <p className="text-base font-bold text-slate-900">{lane.name}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>VOLUME: {lane.volume}</span>
                          <span>DURASI: {lane.duration}s</span>
                        </div>
                      </div>

                      {/* Traffic Light */}
                      <div className="flex flex-col gap-2 items-center bg-slate-900 p-4 rounded-lg">
                        <div className={`w-6 h-6 rounded-full ${
                          lane.status === "red" 
                            ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" 
                            : "bg-red-900/30"
                        }`}></div>
                        <div className={`w-6 h-6 rounded-full ${
                          lane.status === "yellow" 
                            ? "bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.8)]" 
                            : "bg-yellow-900/30"
                        }`}></div>
                        <div className={`w-6 h-6 rounded-full ${
                          lane.status === "green" 
                            ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]" 
                            : "bg-green-900/30"
                        }`}></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Detail Jalur */}
        {selectedLane && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLane(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-headline font-bold">{selectedLane.name}</h3>
                    <p className="text-sm text-white/80 mt-1">Detail Kontrol Jalur</p>
                  </div>
                  <button
                    onClick={() => setSelectedLane(null)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Status Lampu */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Status Lampu Saat Ini
                    </p>
                    <p className="text-2xl font-bold capitalize">
                      {selectedLane.status === "red" && "🔴 Merah"}
                      {selectedLane.status === "yellow" && "🟡 Kuning"}
                      {selectedLane.status === "green" && "🟢 Hijau"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-center bg-slate-900 p-3 rounded-lg">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">
                      Volume Kendaraan
                    </p>
                    <p className="text-3xl font-headline font-extrabold text-blue-900">
                      {selectedLane.volume}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">kendaraan/jam</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-2">
                      Durasi Hijau
                    </p>
                    <p className="text-3xl font-headline font-extrabold text-green-900">
                      {selectedLane.duration}
                    </p>
                    <p className="text-xs text-green-600 mt-1">detik</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl">
                    <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-2">
                      Mode Operasi
                    </p>
                    <p className="text-lg font-bold text-purple-900">
                      {selectedLane.active ? "Aktif" : "Standby"}
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-xl">
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-2">
                      Prioritas
                    </p>
                    <p className="text-lg font-bold text-orange-900">
                      {selectedLane.active ? "Tinggi" : "Normal"}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">info</span>
                    Informasi Tambahan
                  </h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Sensor Status:</span>
                      <span className="font-bold text-green-600">Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Update Terakhir:</span>
                      <span className="font-bold">Baru saja</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center">
                  <button 
                    onClick={() => setSelectedLane(null)}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                  >
                    OKE
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </>
  );
}
