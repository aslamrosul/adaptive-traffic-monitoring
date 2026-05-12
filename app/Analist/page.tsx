"use client";

import type { DateRange, TimeRange } from "@/components/AnalyticsTimeFilter";
import DashboardLayout from "@/components/DashboardLayout";
import GreenDurationChart from "@/components/GreenDurationChart";
import QueueDistributionChart from "@/components/QueueDistributionChart";
import QueueEffectivenessTable from "@/components/QueueEffectivenessTable";
import QueueLevelByHourChart from "@/components/QueueLevelByHourChart";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useEvents } from "@/lib/hooks/useEvents";
import { useIntersections } from "@/lib/hooks/useIntersections";
import { useRealtimeTraffic } from "@/lib/hooks/useTraffic";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function AnalitikPage() {
  const [selectedIntersection, setSelectedIntersection] = useState<string>("all");
  const [selectedLane, setSelectedLane] = useState("Semua Jalur");
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");
  const [customDates, setCustomDates] = useState<DateRange | undefined>();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return { start: sevenDaysAgo, end: today };
  });

  // Initialize date inputs
  useEffect(() => {
    const start = dateRange.start.toISOString().split('T')[0];
    const end = dateRange.end.toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
  }, [dateRange]);

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

  // Queue distribution data
  const queueDistributionData = useMemo(() => {
    return [
      { level: 0 as const, count: 450, percentage: 45 },
      { level: 1 as const, count: 350, percentage: 35 },
      { level: 2 as const, count: 200, percentage: 20 },
    ];
  }, []);

  // Queue level by hour data
  const queueLevelByHourData = useMemo(() => {
    return [
      { hour: 0, time: "00:00", level0: 80, level1: 15, level2: 5 },
      { hour: 2, time: "02:00", level0: 85, level1: 10, level2: 5 },
      { hour: 4, time: "04:00", level0: 90, level1: 8, level2: 2 },
      { hour: 6, time: "06:00", level0: 60, level1: 30, level2: 10 },
      { hour: 8, time: "08:00", level0: 20, level1: 40, level2: 40 },
      { hour: 10, time: "10:00", level0: 15, level1: 35, level2: 50 },
      { hour: 12, time: "12:00", level0: 40, level1: 40, level2: 20 },
      { hour: 14, time: "14:00", level0: 50, level1: 35, level2: 15 },
      { hour: 16, time: "16:00", level0: 25, level1: 35, level2: 40 },
      { hour: 18, time: "18:00", level0: 30, level1: 40, level2: 30 },
      { hour: 20, time: "20:00", level0: 70, level1: 20, level2: 10 },
      { hour: 22, time: "22:00", level0: 75, level1: 18, level2: 7 },
    ];
  }, []);

  // Queue effectiveness data
  const queueEffectivenessData = useMemo(() => {
    return [
      {
        id: "1",
        intersectionName: "Persimpangan Sudirman",
        lane: "Jalur Utara",
        avgQueueLength: 8.5,
        avgGreenDuration: 10,
        vehiclesPerSecond: 4.2,
        effectiveness: 92,
        status: "optimal" as const,
      },
      {
        id: "2",
        intersectionName: "Persimpangan Sudirman",
        lane: "Jalur Timur",
        avgQueueLength: 12.3,
        avgGreenDuration: 12,
        vehiclesPerSecond: 3.8,
        effectiveness: 85,
        status: "good" as const,
      },
      {
        id: "3",
        intersectionName: "Persimpangan Gatot Subroto",
        lane: "Jalur Barat",
        avgQueueLength: 15.7,
        avgGreenDuration: 15,
        vehiclesPerSecond: 3.2,
        effectiveness: 78,
        status: "fair" as const,
      },
      {
        id: "4",
        intersectionName: "Persimpangan Gatot Subroto",
        lane: "Jalur Selatan",
        avgQueueLength: 18.2,
        avgGreenDuration: 15,
        vehiclesPerSecond: 2.9,
        effectiveness: 65,
        status: "poor" as const,
      },
      {
        id: "5",
        intersectionName: "Persimpangan Ahmad Yani",
        lane: "Jalur Utara",
        avgQueueLength: 9.1,
        avgGreenDuration: 10,
        vehiclesPerSecond: 4.1,
        effectiveness: 90,
        status: "optimal" as const,
      },
    ];
  }, []);

  const handleIntersectionChange = (value: string) => {
    setSelectedIntersection(value);
    const intersection = intersections.find((i: any) => i.id === value);
    toast.success(`Filter diubah ke: ${intersection?.name || "Semua Persimpangan"}`);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const handleApplyFilter = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start <= end) {
        setDateRange({ start, end });
        toast.success("Filter tanggal berhasil diterapkan");
      } else {
        toast.error("Tanggal awal harus lebih kecil dari tanggal akhir");
      }
    }
  };

  const handleResetFilter = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    setDateRange({ start: sevenDaysAgo, end: today });
    toast.success("Filter tanggal direset ke 7 hari terakhir");
  };

  const handleQuickPreset = (preset: string) => {
    const today = new Date();
    let start = new Date(today);

    switch (preset) {
      case "today":
        start = new Date(today);
        break;
      case "yesterday":
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        break;
      case "last7days":
        start.setDate(start.getDate() - 7);
        break;
      case "last30days":
        start.setDate(start.getDate() - 30);
        break;
      case "thisMonth":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
    }

    setDateRange({ start, end: today });
    toast.success(`Filter diubah ke: ${preset}`);
  };

  return (
    <DashboardLayout 
      title="Analitik Lalu Lintas - Queue-Based Analytics"
    >
      <div className="p-3 lg:p-6 space-y-4 lg:space-y-6 max-w-[1920px] mx-auto">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-headline text-on-surface">
              Dashboard Analitik Antrian
            </h1>
            <p className="text-sm lg:text-base text-slate-500 mt-1">
              Analisis berbasis level antrian dengan durasi lampu hijau adaptif
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedIntersection}
              onChange={(e) => handleIntersectionChange(e.target.value)}
              className="bg-white border border-outline-variant/30 rounded px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary/20 shadow-sm"
              disabled={loadingIntersections}
            >
              <option value="all">Semua Persimpangan</option>
              {intersections.map((intersection: any) => (
                <option key={intersection.id} value={intersection.id}>
                  {intersection.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Date Range Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100"
        >
          <h3 className="text-sm lg:text-base font-bold font-headline text-on-surface mb-4">
            Filter Rentang Tanggal
          </h3>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleQuickPreset("today")}
              className="px-3 py-2 text-xs lg:text-sm font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={() => handleQuickPreset("yesterday")}
              className="px-3 py-2 text-xs lg:text-sm font-semibold bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Kemarin
            </button>
            <button
              onClick={() => handleQuickPreset("last7days")}
              className="px-3 py-2 text-xs lg:text-sm font-semibold bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => handleQuickPreset("last30days")}
              className="px-3 py-2 text-xs lg:text-sm font-semibold bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              30 Hari Terakhir
            </button>
            <button
              onClick={() => handleQuickPreset("thisMonth")}
              className="px-3 py-2 text-xs lg:text-sm font-semibold bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Bulan Ini
            </button>
          </div>

          {/* Custom Date Range */}
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 items-start lg:items-end">
            <div className="flex-1">
              <label className="block text-xs lg:text-sm font-semibold text-slate-600 mb-2">
                Tanggal Awal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full border border-outline-variant/30 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs lg:text-sm font-semibold text-slate-600 mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="w-full border border-outline-variant/30 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2 w-full lg:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyFilter}
                className="flex-1 lg:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded text-xs lg:text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                Terapkan
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResetFilter}
                className="flex-1 lg:flex-none bg-slate-200 text-slate-700 px-4 py-2 rounded text-xs lg:text-sm font-bold hover:bg-slate-300 transition-all"
              >
                Reset
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Queue Distribution Chart */}
          <QueueDistributionChart
            data={queueDistributionData}
            isLoading={loadingAnalytics}
          />

          {/* Queue Level by Hour Chart */}
          <QueueLevelByHourChart
            date={startDate}
          />
        </div>

        {/* Green Duration Chart - Full Width */}
        <GreenDurationChart
          startDate={startDate}
          endDate={endDate}
        />

        {/* Queue Effectiveness Table - Full Width */}
        <QueueEffectivenessTable
          data={queueEffectivenessData}
          isLoading={loadingAnalytics}
        />

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 lg:p-6 border-l-4 border-blue-500"
        >
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-blue-600 text-2xl flex-shrink-0">
              info
            </span>
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Tentang Queue-Based Analytics</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sistem analitik berbasis antrian menggunakan sensor ultrasonic untuk mendeteksi panjang antrian kendaraan.
                Durasi lampu hijau disesuaikan secara adaptif: Level 0 (Lancar) = 7 detik, Level 1 (Sedang) = 10 detik,
                Level 2 (Padat) = 15 detik. Data diperbarui secara real-time untuk optimasi lalu lintas yang lebih baik.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
