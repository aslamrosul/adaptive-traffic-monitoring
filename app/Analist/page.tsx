"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";

const weeklyData = [
  { day: "SENIN", utara: 60, timur: 45, barat: 30, selatan: 50 },
  { day: "SELASA", utara: 75, timur: 60, barat: 40, selatan: 65 },
  { day: "RABU", utara: 90, timur: 70, barat: 55, selatan: 80 },
  { day: "KAMIS", utara: 85, timur: 75, barat: 50, selatan: 70 },
  { day: "JUMAT", utara: 95, timur: 85, barat: 60, selatan: 90 },
  { day: "SABTU", utara: 40, timur: 35, barat: 25, selatan: 35 },
  { day: "MINGGU", utara: 30, timur: 25, barat: 20, selatan: 28 },
];

const heatmapData = [
  { time: "00:00", intensity: 10 },
  { time: "02:00", intensity: 5 },
  { time: "04:00", intensity: 5 },
  { time: "06:00", intensity: 40 },
  { time: "08:00", intensity: 80 },
  { time: "10:00", intensity: 100 },
  { time: "12:00", intensity: 60 },
  { time: "14:00", intensity: 50 },
  { time: "16:00", intensity: 90 },
  { time: "18:00", intensity: 70 },
  { time: "20:00", intensity: 30 },
  { time: "22:00", intensity: 10 },
];

const alerts = [
  {
    id: 1,
    title: "Kemacetan Parah (V/C Ratio > 1.0)",
    location: "Simpangan Sudirman - Arus Masuk Selatan",
    time: "12 MENIT LALU",
    severity: "critical",
  },
  {
    id: 2,
    title: "Sensor IoT Tidak Sinkron",
    location: "Simpangan Gatsu - Node IoT Unit A02",
    time: "45 MENIT LALU",
    severity: "warning",
  },
];

const simpanganOptions = [
  "Semua Jalur",
  "Jalur Utara",
  "Jalur Timur",
  "Jalur Barat",
  "Jalur Selatan",
];

export default function AnalitikPage() {
  const [selectedSimpangan, setSelectedSimpangan] = useState("Semua Jalur");
  const [currentWeek, setCurrentWeek] = useState(0);

  // Filter data berdasarkan simpangan yang dipilih
  const getFilteredData = () => {
    return weeklyData.map((d) => {
      if (selectedSimpangan === "Jalur Utara") {
        return { ...d, timur: 0, barat: 0, selatan: 0 };
      } else if (selectedSimpangan === "Jalur Timur") {
        return { ...d, utara: 0, barat: 0, selatan: 0 };
      } else if (selectedSimpangan === "Jalur Barat") {
        return { ...d, utara: 0, timur: 0, selatan: 0 };
      } else if (selectedSimpangan === "Jalur Selatan") {
        return { ...d, utara: 0, timur: 0, barat: 0 };
      }
      return d; // Semua Jalur
    });
  };

  const filteredData = getFilteredData();

  // Cek simpangan mana yang aktif untuk legend
  const showUtara = selectedSimpangan === "Semua Jalur" || selectedSimpangan === "Jalur Utara";
  const showTimur = selectedSimpangan === "Semua Jalur" || selectedSimpangan === "Jalur Timur";
  const showBarat = selectedSimpangan === "Semua Jalur" || selectedSimpangan === "Jalur Barat";
  const showSelatan = selectedSimpangan === "Semua Jalur" || selectedSimpangan === "Jalur Selatan";

  const handleSimpanganChange = (value: string) => {
    setSelectedSimpangan(value);
    toast.success(`Filter diubah ke: ${value}`);
  };

  const handleExport = () => {
    toast.success("Data berhasil diekspor ke format .csv");
    // Simulasi download
    const csvContent = "Jalur,Hari,Volume\nUtara,Senin,60\nTimur,Senin,45\nBarat,Senin,30\nSelatan,Senin,50\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analitik-lalu-lintas-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleApplyIoT = () => {
    toast.success("Konfigurasi IoT berhasil diterapkan untuk pukul 05:30 WIB");
  };

  const handlePrevWeek = () => {
    setCurrentWeek((w) => Math.max(0, w - 1));
    toast(`Menampilkan data minggu ke-${currentWeek}`, { icon: "📅" });
  };

  const handleNextWeek = () => {
    setCurrentWeek((w) => w + 1);
    toast(`Menampilkan data minggu ke-${currentWeek + 2}`, { icon: "📅" });
  };

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen pb-12">
        <Header title="Analitik Lalu Lintas" dateRange="24 Okt 2023 - 30 Okt 2023" />

        <div className="p-8 space-y-8 max-w-7xl mx-auto">

          {/* Filters & Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row justify-between items-end gap-4"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-label">
                Parameter Analitik
              </p>
              <div className="flex gap-3">
                <select
                  value={selectedSimpangan}
                  onChange={(e) => handleSimpanganChange(e.target.value)}
                  className="bg-white border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary/20 shadow-sm min-w-[200px]"
                >
                  {simpanganOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExport}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Ekspor Data (.csv)
              </motion.button>
            </div>
          </motion.section>

          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-6">

            {/* Hero Chart: Analisis Kepadatan Kendaraan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="col-span-12 lg:col-span-8 bg-white rounded-xl p-6 shadow-sm border border-slate-100"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-lg font-bold font-headline text-on-surface">
                    Analisis Kepadatan Kendaraan
                  </h3>
                  <p className="text-sm text-slate-500">
                    Detail volume unit per meter persegi berdasarkan data sensor IoT.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  {showUtara && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
                      Utara
                    </div>
                  )}
                  {showTimur && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-300 inline-block"></span>
                      Timur
                    </div>
                  )}
                  {showBarat && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-slate-300 inline-block"></span>
                      Barat
                    </div>
                  )}
                  {showSelatan && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
                      Selatan
                    </div>
                  )}
                </div>
              </div>

              <div className="h-64 flex items-end gap-4 px-4">
                {filteredData.map((d, idx) => (
                  <motion.div
                    key={d.day}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ delay: 0.2 + idx * 0.07 }}
                    className="flex-1 flex flex-col items-center gap-2"
                    style={{ transformOrigin: "bottom" }}
                  >
                    <div className="w-full flex items-end gap-1 h-52">
                      {showUtara && d.utara > 0 && (
                        <div
                          className="bg-primary w-full rounded-t-lg transition-all duration-500 hover:brightness-110 cursor-pointer"
                          style={{ height: `${d.utara}%` }}
                          title={`Utara: ${d.utara}%`}
                        ></div>
                      )}
                      {showTimur && d.timur > 0 && (
                        <div
                          className="bg-blue-300 w-full rounded-t-lg transition-all duration-500 hover:brightness-110 cursor-pointer"
                          style={{ height: `${d.timur}%` }}
                          title={`Timur: ${d.timur}%`}
                        ></div>
                      )}
                      {showBarat && d.barat > 0 && (
                        <div
                          className="bg-slate-300 w-full rounded-t-lg transition-all duration-500 hover:brightness-110 cursor-pointer"
                          style={{ height: `${d.barat}%` }}
                          title={`Barat: ${d.barat}%`}
                        ></div>
                      )}
                      {showSelatan && d.selatan > 0 && (
                        <div
                          className="bg-green-400 w-full rounded-t-lg transition-all duration-500 hover:brightness-110 cursor-pointer"
                          style={{ height: `${d.selatan}%` }}
                          title={`Selatan: ${d.selatan}%`}
                        ></div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{d.day}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Stats: Performa Sensor IoT & Indeks Kemacetan */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              {/* Performa Sensor IoT */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-inverse-surface to-slate-800 rounded-xl p-6 text-white shadow-xl"
              >
                <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest font-label mb-4">
                  Performa Sensor IoT
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold">Akurasi Deteksi Kepadatan</span>
                      <span className="text-2xl font-black font-headline">98.4%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "98.4%" }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="h-full bg-blue-400 rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold">Waktu Latensi Jaringan</span>
                      <span className="text-2xl font-black font-headline">12ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="h-full bg-emerald-400 rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] mt-6 leading-relaxed opacity-50">
                  Sistem beroperasi penuh pada infrastruktur IoT terintegrasi untuk kalkulasi arus
                  secara real-time tanpa delay manual.
                </p>
              </motion.div>

              {/* Indeks Kemacetan */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex-1"
              >
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-label mb-4">
                  Indeks Kemacetan
                </h3>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        className="text-slate-100"
                        cx="64"
                        cy="64"
                        fill="transparent"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                      />
                      <motion.circle
                        className="text-primary"
                        cx="64"
                        cy="64"
                        fill="transparent"
                        r="58"
                        stroke="currentColor"
                        strokeDasharray="364"
                        initial={{ strokeDashoffset: 364 }}
                        animate={{ strokeDashoffset: 120 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        strokeWidth="8"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black font-headline text-on-surface">6.4</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Moderat</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-1 text-tertiary text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    +12% kepadatan dari kemarin
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Laporan Kepadatan Per Jam */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-12 bg-white rounded-xl p-8 shadow-sm border border-slate-100"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold font-headline text-on-surface">
                    Laporan Kepadatan Per Jam
                  </h3>
                  <p className="text-sm text-slate-500">
                    Visualisasi heatmap intensitas penumpukan kendaraan berdasarkan data node IoT.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevWeek}
                    className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button
                    onClick={handleNextWeek}
                    className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-1">
                {heatmapData.map((block, idx) => {
                  const isPeak = block.intensity === 100;
                  const textColor = block.intensity >= 60 ? "text-white" : "text-slate-400";
                  return (
                    <motion.div
                      key={block.time}
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ delay: 0.35 + idx * 0.04 }}
                      className="col-span-1 h-32 rounded-lg flex flex-col items-center justify-end pb-2 relative cursor-pointer hover:brightness-110 transition-all"
                      style={{
                        backgroundColor: `rgba(0, 64, 161, ${block.intensity / 100})`,
                        transformOrigin: "bottom",
                      }}
                      title={`${block.time} — Intensitas: ${block.intensity}%`}
                    >
                      {isPeak && (
                        <div className="absolute -top-2 bg-tertiary-container text-on-tertiary-container text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                          Puncak
                        </div>
                      )}
                      <span className={`text-[9px] font-bold ${textColor}`}>{block.time}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 mt-4 justify-end">
                <span className="text-[10px] text-slate-400 font-semibold">Rendah</span>
                <div className="flex gap-1">
                  {[5, 20, 40, 60, 80, 100].map((v) => (
                    <div
                      key={v}
                      className="w-6 h-3 rounded"
                      style={{ backgroundColor: `rgba(0, 64, 161, ${v / 100})` }}
                    ></div>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Tinggi</span>
              </div>
            </motion.div>

            {/* Peringatan Kritis Lalu Lintas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="col-span-12 lg:col-span-6 bg-white rounded-xl p-6 shadow-sm border-r-4 border-tertiary"
            >
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="material-symbols-outlined text-tertiary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  warning
                </span>
                <h3 className="text-lg font-bold font-headline text-on-surface">
                  Peringatan Kritis Lalu Lintas
                </h3>
              </div>
              <div className="space-y-2">
                {alerts.map((alert, idx) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="flex justify-between items-start p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                    onClick={() => toast(`Detail: ${alert.title} — ${alert.location}`)}
                  >
                    <div>
                      <h4 className="text-sm font-bold">{alert.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{alert.location}</p>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 whitespace-nowrap ml-4">
                      {alert.time}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Wawasan Strategis IoT */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="col-span-12 lg:col-span-6 bg-primary-container rounded-xl p-6 text-on-primary-container flex flex-col justify-center relative overflow-hidden"
            >
              <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[180px]">insights</span>
              </div>
              <h3 className="text-xl font-bold font-headline mb-2">Wawasan Strategis IoT</h3>
              <p className="text-sm leading-relaxed mb-4 opacity-90 max-w-md">
                Prediksi algoritma IoT menunjukkan peningkatan kepadatan 15% pada hari esok karena
                acara Car Free Day. Disarankan sinkronisasi ulang durasi hijau pada sensor gerbang
                utama pukul 05:30 WIB.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyIoT}
                className="w-fit bg-white text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-opacity-90 transition-all"
              >
                Terapkan Konfigurasi IoT
              </motion.button>
            </motion.div>

          </div>
        </div>
      </main>
    </>
  );
}
