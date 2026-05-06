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
import { motion } from "framer-motion";
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
      <div className="p-3 lg:p-6 space-y-4 lg:space-y-5 max-w-[1920px] mx-auto">

        {/* Time Filter with Stats on Mobile */}
        <div className="flex gap-2">
          <div className="flex-1">
            <AnalyticsTimeFilter 
              onFilterChange={handleFilterChange}
              currentRange={timeRange}
            />
          </div>
          
          {/* Mobile Stats - Performa IoT & Indeks side by side */}
          <div className="lg:hidden flex gap-2">
            {/* Performa Sensor IoT - Mobile Only */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-2 shadow-lg border border-slate-700 flex flex-col justify-center min-w-[100px]"
            >
              <h3 className="text-[7px] font-bold text-white/60 uppercase tracking-widest font-label mb-1.5">
                Performa IoT
              </h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] text-white/80 font-semibold">Akurasi</span>
                    <span className="text-xs font-black text-white">{iotPerformance.accuracy}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${iotPerformance.accuracy}%` }}
                      transition={{ delay: 0.4, duration: 0.8 }}
                      className="h-full bg-blue-400 rounded-full"
                    ></motion.div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] text-white/80 font-semibold">Aktif</span>
                    <span className="text-xs font-black text-white">
                      {iotPerformance.activeDevices}/{iotPerformance.totalDevices}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
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
            </motion.div>

            {/* Indeks Kemacetan - Mobile Only */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 shadow-lg border-2 border-blue-200 flex flex-col items-center justify-center min-w-[100px]"
            >
              <h3 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-label mb-1">
                Indeks
              </h3>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    className="text-slate-100"
                    cx="32"
                    cy="32"
                    fill="transparent"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <motion.circle
                    className="text-primary"
                    cx="32"
                    cy="32"
                    fill="transparent"
                    r="28"
                    stroke="currentColor"
                    strokeDasharray="176"
                    initial={{ strokeDashoffset: 176 }}
                    animate={{ strokeDashoffset: 58 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    strokeWidth="4"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black font-headline text-on-surface">
                    {avgCongestionIndex}
                  </span>
                  <span className="text-[7px] font-bold text-slate-400 uppercase">
                    {avgCongestionIndex < 30 ? "Lancar" : avgCongestionIndex < 60 ? "Moderat" : avgCongestionIndex < 85 ? "Padat" : "Macet"}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

          {/* Filters & Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5"
          >
            <div className="flex flex-col sm:flex-row gap-1 flex-1">
              <select
                value={selectedIntersection}
                onChange={(e) => handleIntersectionChange(e.target.value)}
                className="bg-white border border-outline-variant/30 rounded text-[9px] px-1.5 py-1 font-semibold focus:ring-2 focus:ring-primary/20 shadow-sm w-full sm:w-auto sm:min-w-[130px]"
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
                className="bg-white border border-outline-variant/30 rounded text-[9px] px-1.5 py-1 font-semibold focus:ring-2 focus:ring-primary/20 shadow-sm w-full sm:w-auto sm:min-w-[110px]"
              >
                <option>Semua Jalur</option>
                <option>Jalur Utara</option>
                <option>Jalur Timur</option>
                <option>Jalur Barat</option>
                <option>Jalur Selatan</option>
              </select>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              className="flex items-center justify-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-1 rounded text-[9px] font-bold shadow-md shadow-blue-600/30 hover:shadow-lg hover:shadow-blue-600/40 transition-all w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-xs">download</span>
              <span>Ekspor</span>
            </motion.button>
          </motion.section>

          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-2 lg:gap-4">

            {/* Hero Chart: Analisis Kepadatan Kendaraan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="col-span-12 lg:col-span-8 bg-white rounded-lg p-2 lg:p-3 shadow-lg border border-blue-100 card-hover"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm lg:text-base font-bold font-headline text-on-surface">
                    Analisis Kepadatan Kendaraan
                  </h3>
                  <p className="text-[9px] lg:text-[10px] text-slate-500">
                    Detail volume unit per meter persegi berdasarkan data sensor IoT.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-semibold">
                  {showUtara && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                      Utara
                    </div>
                  )}
                  {showTimur && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-300 inline-block"></span>
                      Timur
                    </div>
                  )}
                  {showBarat && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
                      Barat
                    </div>
                  )}
                  {showSelatan && (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
                      Selatan
                    </div>
                  )}
                </div>
              </div>

              {loadingAnalytics || loadingTraffic ? (
                <div className="h-56 lg:h-80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-slate-500">Memuat data analitik...</p>
                  </div>
                </div>
              ) : (
                <div className="h-56 lg:h-80 px-2 lg:px-4 relative">
                  <div className="absolute bottom-0 left-2 lg:left-4 right-2 lg:right-4 h-[calc(100%-24px)]">
                    <div className="flex items-end justify-between gap-2 lg:gap-4 h-full">
                      {filteredWeeklyData.map((d, idx) => {
                        const maxValue = Math.max(d.utara, d.timur, d.barat, d.selatan);
                        return (
                          <div
                            key={d.day}
                            className="flex-1 flex flex-col items-center h-full"
                          >
                            <div className="flex-1 w-full flex items-end justify-center gap-0.5">
                              <motion.div
                                initial={{ opacity: 0, scaleY: 0 }}
                                animate={{ opacity: 1, scaleY: 1 }}
                                transition={{ delay: 0.2 + idx * 0.07 }}
                                className="w-full flex items-end justify-center gap-0.5"
                                style={{ 
                                  transformOrigin: "bottom",
                                  height: `${maxValue}%`
                                }}
                              >
                                {showUtara && d.utara > 0 && (
                                  <div
                                    className="bg-primary w-full rounded-t-lg transition-all duration-500 hover:brightness-110 cursor-pointer"
                                    style={{ height: `${(d.utara / maxValue) * 100}%` }}
                                    title={`Utara: ${d.utara}%`}
                                  ></div>
                                )}
                                {showTimur && d.timur > 0 && (
                                  <div
                                    className="bg-blue-300 w-full rounded-t-lg transition-all duration-500 hover:brightness-110 cursor-pointer"
                                    style={{ height: `${(d.timur / maxValue) * 100}%` }}
                                    title={`Timur: ${d.timur}%`}
                                  ></div>
                                )}
                                {showBarat && d.barat > 0 && (
                                  <div
                                    className="bg-slate-300 w-full rounded-t-lg transition-all duration-500 hover:brightness-110 cursor-pointer"
                                    style={{ height: `${(d.barat / maxValue) * 100}%` }}
                                    title={`Barat: ${d.barat}%`}
                                  ></div>
                                )}
                                {showSelatan && d.selatan > 0 && (
                                  <div
                                    className="bg-green-400 w-full rounded-t-lg transition-all duration-500 hover:brightness-110 cursor-pointer"
                                    style={{ height: `${(d.selatan / maxValue) * 100}%` }}
                                    title={`Selatan: ${d.selatan}%`}
                                  ></div>
                                )}
                              </motion.div>
                            </div>
                            <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 mt-1 lg:mt-2">{d.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Stats: Indeks Kemacetan & Performa Sensor IoT (Swapped Order) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-2 lg:gap-3">
              {/* Indeks Kemacetan - Hidden on Mobile, Shown on Desktop */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="hidden lg:block bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-2 lg:p-3 shadow-lg border-2 border-blue-200"
              >
                <h3 className="text-xs lg:text-sm font-bold text-slate-400 uppercase tracking-widest font-label mb-1.5 lg:mb-2">
                  Indeks Kemacetan
                </h3>
                <div className="flex items-center justify-center py-1 lg:py-2">
                  <div className="relative w-20 h-20 lg:w-28 lg:h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        className="text-slate-100 lg:hidden"
                        cx="40"
                        cy="40"
                        fill="transparent"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="5"
                      />
                      <motion.circle
                        className="text-primary lg:hidden"
                        cx="40"
                        cy="40"
                        fill="transparent"
                        r="36"
                        stroke="currentColor"
                        strokeDasharray="226"
                        initial={{ strokeDashoffset: 226 }}
                        animate={{ strokeDashoffset: 75 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        strokeWidth="5"
                      />
                      <circle
                        className="text-slate-100 hidden lg:block"
                        cx="56"
                        cy="56"
                        fill="transparent"
                        r="50"
                        stroke="currentColor"
                        strokeWidth="7"
                      />
                      <motion.circle
                        className="text-primary hidden lg:block"
                        cx="56"
                        cy="56"
                        fill="transparent"
                        r="50"
                        stroke="currentColor"
                        strokeDasharray="314"
                        initial={{ strokeDashoffset: 314 }}
                        animate={{ strokeDashoffset: 103 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        strokeWidth="7"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg lg:text-xl font-black font-headline text-on-surface">
                        {avgCongestionIndex}
                      </span>
                      <span className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase">
                        {avgCongestionIndex < 30 ? "Lancar" : avgCongestionIndex < 60 ? "Moderat" : avgCongestionIndex < 85 ? "Padat" : "Macet"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-1 lg:mt-2 text-center">
                  <span className="inline-flex items-center gap-0.5 lg:gap-1 text-tertiary text-[9px] lg:text-[10px] font-bold">
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    +12% kepadatan dari kemarin
                  </span>
                </div>
              </motion.div>

              {/* Performa Sensor IoT - Desktop Only (Hidden on Mobile) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="hidden lg:block bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-xl p-3 lg:p-4 text-white shadow-2xl border border-slate-700"
              >
                <h3 className="text-xs lg:text-sm font-bold opacity-60 uppercase tracking-widest font-label mb-2 lg:mb-3">
                  Performa Sensor IoT
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-1.5 lg:mb-2">
                      <span className="text-[10px] lg:text-xs font-semibold">Akurasi Deteksi Kepadatan</span>
                      <span className="text-xl lg:text-2xl font-black font-headline">{iotPerformance.accuracy}%</span>
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
                    <div className="flex justify-between items-end mb-1.5 lg:mb-2">
                      <span className="text-[10px] lg:text-xs font-semibold">Perangkat Aktif</span>
                      <span className="text-xl lg:text-2xl font-black font-headline">
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
                <p className="text-[9px] lg:text-[10px] mt-3 lg:mt-4 leading-relaxed opacity-50">
                  Sistem beroperasi penuh pada infrastruktur IoT terintegrasi untuk kalkulasi arus
                  secara real-time tanpa delay manual.
                </p>
              </motion.div>
            </div>

            {/* Laporan Kepadatan Per Jam */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-12 bg-white rounded-xl p-4 lg:p-8 shadow-lg border-2 border-indigo-100 card-hover"
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
              className="col-span-12 lg:col-span-6 bg-white rounded-xl p-4 lg:p-6 shadow-lg border-l-4 border-orange-500"
            >
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="material-symbols-outlined text-orange-500 text-2xl"
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
              className="col-span-12 lg:col-span-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 lg:p-6 text-white flex flex-col justify-center relative overflow-hidden shadow-xl"
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
                className="w-fit bg-white text-purple-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-opacity-90 transition-all shadow-lg"
              >
                Terapkan Konfigurasi IoT
              </motion.button>
            </motion.div>

          </div>
      </div>
    </DashboardLayout>
  );
}
