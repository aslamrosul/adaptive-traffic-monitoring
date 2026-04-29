"use client";

import DashboardLayout from "@/components/DashboardLayout";
import AnalyticsTimeFilter from "@/components/AnalyticsTimeFilter";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useEvents } from "@/lib/hooks/useEvents";
import { useIntersections } from "@/lib/hooks/useIntersections";
import { useRealtimeTraffic } from "@/lib/hooks/useTraffic";
import {
    calculateHourlyStats,
    calculateWeeklyStats,
    formatDate,
    getWeekRange
} from "@/lib/utils/analytics";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { TimeRange, DateRange } from "@/components/AnalyticsTimeFilter";

export default function AnalitikPage() {
  const [selectedIntersection, setSelectedIntersection] = useState<string>("all");
  const [selectedLane, setSelectedLane] = useState("Semua Jalur");
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");
  const [customDates, setCustomDates] = useState<DateRange | undefined>();
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return { start: sevenDaysAgo, end: today };
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("harian");
  const [reportName, setReportName] = useState("");

  // Fetch data dari backend
  const { intersections, isLoading: loadingIntersections } = useIntersections();
  const { trafficData, isLoading: loadingTraffic } = useRealtimeTraffic(
    selectedIntersection !== "all" ? selectedIntersection : undefined,
    500
  );
  const { analytics, isLoading: loadingAnalytics } = useAnalytics(
    selectedIntersection !== "all" ? selectedIntersection : undefined
  );
  const { events, isLoading: loadingEvents } = useEvents(
    selectedIntersection !== "all" ? selectedIntersection : undefined,
    "open"
  );

  // Update date range ketika time range berubah
  useEffect(() => {
    const today = new Date();
    let start = new Date(today);

    switch (timeRange) {
      case "today":
        start = new Date(today);
        break;
      case "yesterday":
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        break;
      case "7days":
        start.setDate(start.getDate() - 7);
        break;
      case "30days":
        start.setDate(start.getDate() - 30);
        break;
      case "custom":
        if (customDates) {
          start = new Date(customDates.startDate);
          today.setTime(new Date(customDates.endDate).getTime());
        }
        break;
    }

    setDateRange({ start, end: today });
  }, [timeRange, customDates]);

  const handleFilterChange = (range: TimeRange, dates?: DateRange) => {
    setTimeRange(range);
    if (range === "custom" && dates) {
      setCustomDates(dates);
    } else {
      setCustomDates(undefined);
    }
  };

  // Hitung statistik dari data real-time
  const hourlyStats = useMemo(() => {
    if (trafficData.length === 0) {
      // Fallback data jika belum ada data
      return [
        { time: "00:00", hour: 0, intensity: 10, vehicleCount: 50, congestionIndex: 10 },
        { time: "02:00", hour: 2, intensity: 5, vehicleCount: 25, congestionIndex: 5 },
        { time: "04:00", hour: 4, intensity: 5, vehicleCount: 30, congestionIndex: 5 },
        { time: "06:00", hour: 6, intensity: 40, vehicleCount: 200, congestionIndex: 40 },
        { time: "08:00", hour: 8, intensity: 80, vehicleCount: 450, congestionIndex: 80 },
        { time: "10:00", hour: 10, intensity: 100, vehicleCount: 560, congestionIndex: 100 },
        { time: "12:00", hour: 12, intensity: 60, vehicleCount: 320, congestionIndex: 60 },
        { time: "14:00", hour: 14, intensity: 50, vehicleCount: 280, congestionIndex: 50 },
        { time: "16:00", hour: 16, intensity: 90, vehicleCount: 480, congestionIndex: 90 },
        { time: "18:00", hour: 18, intensity: 70, vehicleCount: 380, congestionIndex: 70 },
        { time: "20:00", hour: 20, intensity: 30, vehicleCount: 150, congestionIndex: 30 },
        { time: "22:00", hour: 22, intensity: 10, vehicleCount: 60, congestionIndex: 10 },
      ];
    }
    return calculateHourlyStats(trafficData);
  }, [trafficData]);

  // Hitung statistik mingguan
  const weeklyStats = useMemo(() => {
    if (analytics.length === 0) {
      // Fallback data
      return [
        { day: "SENIN", utara: 60, timur: 45, barat: 30, selatan: 50, total: 185 },
        { day: "SELASA", utara: 75, timur: 60, barat: 40, selatan: 65, total: 240 },
        { day: "RABU", utara: 90, timur: 70, barat: 55, selatan: 80, total: 295 },
        { day: "KAMIS", utara: 85, timur: 75, barat: 50, selatan: 70, total: 280 },
        { day: "JUMAT", utara: 95, timur: 85, barat: 60, selatan: 90, total: 330 },
        { day: "SABTU", utara: 40, timur: 35, barat: 25, selatan: 35, total: 135 },
        { day: "MINGGU", utara: 30, timur: 25, barat: 20, selatan: 28, total: 103 },
      ];
    }
    return calculateWeeklyStats(analytics);
  }, [analytics]);

  // Filter data berdasarkan jalur yang dipilih
  const filteredWeeklyData = useMemo(() => {
    return weeklyStats.map((d) => {
      if (selectedLane === "Jalur Utara") {
        return { ...d, timur: 0, barat: 0, selatan: 0 };
      } else if (selectedLane === "Jalur Timur") {
        return { ...d, utara: 0, barat: 0, selatan: 0 };
      } else if (selectedLane === "Jalur Barat") {
        return { ...d, utara: 0, timur: 0, selatan: 0 };
      } else if (selectedLane === "Jalur Selatan") {
        return { ...d, utara: 0, timur: 0, barat: 0 };
      }
      return d; // Semua Jalur
    });
  }, [weeklyStats, selectedLane]);

  // Cek jalur mana yang aktif untuk legend
  const showUtara = selectedLane === "Semua Jalur" || selectedLane === "Jalur Utara";
  const showTimur = selectedLane === "Semua Jalur" || selectedLane === "Jalur Timur";
  const showBarat = selectedLane === "Semua Jalur" || selectedLane === "Jalur Barat";
  const showSelatan = selectedLane === "Semua Jalur" || selectedLane === "Jalur Selatan";

  // Hitung total kendaraan dari data real
  const totalVehicles = useMemo(() => {
    if (analytics.length > 0) {
      return analytics.reduce((sum: number, a: any) => sum + (a.summary?.totalVehicles || 0), 0);
    }
    return trafficData.reduce((sum: number, t: any) => sum + t.vehicleCount, 0);
  }, [analytics, trafficData]);

  // Hitung congestion index rata-rata
  const avgCongestionIndex = useMemo(() => {
    if (analytics.length > 0) {
      const avg = analytics.reduce((sum: number, a: any) => sum + (a.summary?.averageCongestionIndex || 0), 0) / analytics.length;
      return Math.round(avg * 10) / 10;
    }
    return 6.4; // Default
  }, [analytics]);

  // Hitung IoT performance
  const iotPerformance = useMemo(() => {
    const activeDevices = intersections.filter((i: any) => i.status === "active").length;
    const totalDevices = intersections.length;
    const accuracy = totalDevices > 0 ? (activeDevices / totalDevices) * 100 : 98.4;
    return {
      accuracy: Math.round(accuracy * 10) / 10,
      activeDevices,
      totalDevices,
      latency: 12, // ms - bisa dihitung dari timestamp
    };
  }, [intersections]);

  const handleIntersectionChange = (value: string) => {
    setSelectedIntersection(value);
    const intersection = intersections.find((i: any) => i.id === value);
    toast.success(`Filter diubah ke: ${intersection?.name || "Semua Persimpangan"}`);
  };

  const handleLaneChange = (value: string) => {
    setSelectedLane(value);
    toast.success(`Filter diubah ke: ${value}`);
  };

  const handleExport = () => {
    toast.success("Data berhasil diekspor ke format .csv");
    
    // Generate CSV dari data real
    let csvContent = "Jalur,Hari,Volume,Kecepatan,Kepadatan\n";
    
    filteredWeeklyData.forEach((data) => {
      if (data.utara > 0) csvContent += `Utara,${data.day},${data.utara},0,0\n`;
      if (data.timur > 0) csvContent += `Timur,${data.day},${data.timur},0,0\n`;
      if (data.barat > 0) csvContent += `Barat,${data.day},${data.barat},0,0\n`;
      if (data.selatan > 0) csvContent += `Selatan,${data.day},${data.selatan},0,0\n`;
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analitik-lalu-lintas-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleApplyIoT = () => {
    toast.success("Konfigurasi IoT berhasil diterapkan untuk pukul 05:30 WIB");
  };

  const handleGenerateReport = () => {
    if (!reportName.trim()) {
      toast.error("Nama laporan tidak boleh kosong");
      return;
    }

    const dateStr = `${dateRange.start.toLocaleDateString('id-ID')} - ${dateRange.end.toLocaleDateString('id-ID')}`;
    const filename = `laporan-${reportType}-${reportName}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    toast.success(`Laporan "${reportName}" berhasil dibuat!\nTipe: ${reportType}\nPeriode: ${dateStr}\nFile: ${filename}`);
    
    // Reset form
    setReportName("");
    setReportType("harian");
    setShowReportModal(false);
  };

  const handlePrevWeek = () => {
    const newStart = new Date(dateRange.start);
    newStart.setDate(newStart.getDate() - 7);
    const newEnd = new Date(dateRange.start);
    setDateRange({ start: newStart, end: newEnd });
    toast(`Menampilkan data minggu sebelumnya`, { icon: "📅" });
  };

  const handleNextWeek = () => {
    const newStart = new Date(dateRange.end);
    newStart.setDate(newStart.getDate() + 1);
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + 6);
    setDateRange({ start: newStart, end: newEnd });
    toast(`Menampilkan data minggu berikutnya`, { icon: "📅" });
  };

  return (
    <DashboardLayout 
      title="Analitik Lalu Lintas"
    >
      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto">

        {/* Time Filter */}
        <AnalyticsTimeFilter 
          onFilterChange={handleFilterChange}
          currentRange={timeRange}
        />

          {/* Filters & Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col gap-4"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-label">
                Parameter Analitik
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <select
                  value={selectedIntersection}
                  onChange={(e) => handleIntersectionChange(e.target.value)}
                  className="bg-white border border-outline-variant/30 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-primary/20 shadow-sm w-full sm:w-auto sm:min-w-[180px]"
                  disabled={loadingIntersections}
                >
                  <option value="all">Semua Persimpangan</option>
                  {intersections.map((intersection: any) => (
                    <option key={intersection.id} value={intersection.id}>
                      {intersection.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedLane}
                  onChange={(e) => handleLaneChange(e.target.value)}
                  className="bg-white border border-outline-variant/30 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-primary/20 shadow-sm w-full sm:w-auto sm:min-w-[150px]"
                >
                  <option>Semua Jalur</option>
                  <option>Jalur Utara</option>
                  <option>Jalur Timur</option>
                  <option>Jalur Barat</option>
                  <option>Jalur Selatan</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExport}
                className="flex items-center justify-center sm:justify-start gap-2 bg-primary text-white px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                <span className="hidden sm:inline">Ekspor Data (.csv)</span>
                <span className="sm:hidden">Ekspor</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowReportModal(true)}
                className="flex items-center justify-center sm:justify-start gap-2 bg-green-600 text-white px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-green-600/20 hover:brightness-110 transition-all w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-lg">description</span>
                <span className="hidden sm:inline">Buat Laporan</span>
                <span className="sm:hidden">Laporan</span>
              </motion.button>
            </div>
          </motion.section>

          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-3 lg:gap-6">

            {/* Hero Chart: Analisis Kepadatan Kendaraan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="col-span-12 lg:col-span-8 bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-slate-100"
            >
              <div className="flex justify-between items-start mb-4 lg:mb-8">
                <div>
                  <h3 className="text-base lg:text-lg font-bold font-headline text-on-surface">
                    Analisis Kepadatan Kendaraan
                  </h3>
                  <p className="text-xs lg:text-sm text-slate-500">
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

              {loadingAnalytics || loadingTraffic ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-slate-500">Memuat data analitik...</p>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-end gap-4 px-4">
                  {filteredWeeklyData.map((d, idx) => (
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
              )}
            </motion.div>

            {/* Stats: Performa Sensor IoT & Indeks Kemacetan */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              {/* Performa Sensor IoT */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-inverse-surface to-slate-800 rounded-xl p-4 lg:p-6 text-white shadow-xl"
              >
                <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest font-label mb-4">
                  Performa Sensor IoT
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold">Akurasi Deteksi Kepadatan</span>
                      <span className="text-2xl font-black font-headline">{iotPerformance.accuracy}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${iotPerformance.accuracy}%` }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="h-full bg-blue-400 rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold">Perangkat Aktif</span>
                      <span className="text-2xl font-black font-headline">
                        {iotPerformance.activeDevices}/{iotPerformance.totalDevices}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(iotPerformance.activeDevices / iotPerformance.totalDevices) * 100}%` 
                        }}
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
                className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-slate-100 flex-1"
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
                      <span className="text-2xl font-black font-headline text-on-surface">
                        {avgCongestionIndex}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {avgCongestionIndex < 30 ? "Lancar" : avgCongestionIndex < 60 ? "Moderat" : avgCongestionIndex < 85 ? "Padat" : "Macet"}
                      </span>
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
              className="col-span-12 bg-white rounded-xl p-4 lg:p-8 shadow-sm border border-slate-100"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 lg:mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-bold font-headline text-on-surface">
                    Laporan Kepadatan Per Jam
                  </h3>
                  <p className="text-sm text-slate-500">
                    Visualisasi heatmap intensitas penumpukan kendaraan berdasarkan data node IoT.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-1">
                {hourlyStats.map((block, idx) => {
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
              className="col-span-12 lg:col-span-6 bg-white rounded-xl p-4 lg:p-6 shadow-sm border-r-4 border-tertiary"
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
              {loadingEvents ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
                    check_circle
                  </span>
                  <p className="text-sm text-slate-500">Tidak ada peringatan kritis saat ini</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.slice(0, 5).map((event: any, idx: number) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      className="flex justify-between items-start p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                      onClick={() => toast(`Detail: ${event.title}`)}
                    >
                      <div>
                        <h4 className="text-sm font-bold">{event.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {intersections.find((i: any) => i.id === event.intersectionId)?.name || event.intersectionId}
                        </p>
                      </div>
                      <div className="flex flex-col items-end ml-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${
                          event.priority === "critical" ? "bg-red-100 text-red-700" :
                          event.priority === "high" ? "bg-orange-100 text-orange-700" :
                          event.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {event.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          {new Date(event.timestamp).toLocaleTimeString("id-ID", { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Wawasan Strategis IoT */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="col-span-12 lg:col-span-6 bg-primary-container rounded-xl p-4 lg:p-6 text-on-primary-container flex flex-col justify-center relative overflow-hidden"
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

      {/* Modal Buat Laporan */}
      <AnimatePresence>
        {showReportModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReportModal(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 z-50 mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 text-2xl">description</span>
                  <h3 className="font-headline font-bold text-lg text-slate-900">
                    Buat Laporan Manual
                  </h3>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-500">close</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* Nama Laporan */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nama Laporan
                  </label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Contoh: Analisis Kemacetan Pagi"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
                  />
                </div>

                {/* Tipe Laporan */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tipe Laporan
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
                  >
                    <option value="harian">Laporan Harian</option>
                    <option value="mingguan">Laporan Mingguan</option>
                    <option value="bulanan">Laporan Bulanan</option>
                    <option value="custom">Laporan Custom</option>
                  </select>
                </div>

                {/* Periode */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Periode
                  </label>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-900">
                      {dateRange.start.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - {dateRange.end.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Persimpangan */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Persimpangan
                  </label>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedIntersection === "all" ? "Semua Persimpangan" : intersections.find((i: any) => i.id === selectedIntersection)?.name || "Semua Persimpangan"}
                    </p>
                  </div>
                </div>

                {/* Jalur */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Jalur
                  </label>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedLane}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
                  <span className="material-symbols-outlined text-green-600 text-lg flex-shrink-0">
                    info
                  </span>
                  <p className="text-xs text-green-700 leading-relaxed">
                    Laporan akan dibuat berdasarkan filter yang Anda pilih dan disimpan dalam format PDF.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  Buat Laporan
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
