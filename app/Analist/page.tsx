"use client";

import DashboardLayout from "@/components/DashboardLayout";
import GreenDurationChart from "@/components/GreenDurationChart";
import QueueDistributionChart from "@/components/QueueDistributionChart";
import QueueEffectivenessTable from "@/components/QueueEffectivenessTable";
import QueueLevelByHourChart from "@/components/QueueLevelByHourChart";
import { useIntersections } from "@/lib/hooks/useIntersections";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type QueueDistributionItem = {
  level: 0 | 1 | 2;
  count: number;
  percentage: number;
};

export default function AnalitikPage() {
  const [selectedIntersection, setSelectedIntersection] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return { start: sevenDaysAgo, end: today };
  });

  const [queueDistributionData, setQueueDistributionData] = useState<QueueDistributionItem[]>([]);
  const [loadingQueueDistribution, setLoadingQueueDistribution] = useState(false);

  const { intersections, isLoading: loadingIntersections } = useIntersections();

  useEffect(() => {
    const start = dateRange.start.toISOString().split("T")[0];
    const end = dateRange.end.toISOString().split("T")[0];
    setStartDate(start);
    setEndDate(end);
  }, [dateRange]);

  const analyticsDate = useMemo(() => {
    return endDate || new Date().toISOString().split("T")[0];
  }, [endDate]);

  useEffect(() => {
    async function fetchQueueDistribution() {
      if (!startDate || !endDate) return;

      setLoadingQueueDistribution(true);

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          lane: "all",
          limit: "5000",
        });

        if (selectedIntersection !== "all") {
          params.set("intersectionId", selectedIntersection);
        }

        const res = await fetch(`/api/analytics/queue-distribution?${params.toString()}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok || json.success === false) {
          throw new Error(json.error || "Gagal mengambil distribusi antrian");
        }

        setQueueDistributionData([
          {
            level: 0,
            count: json.level0?.count ?? 0,
            percentage: json.level0?.percentage ?? 0,
          },
          {
            level: 1,
            count: json.level1?.count ?? 0,
            percentage: json.level1?.percentage ?? 0,
          },
          {
            level: 2,
            count: json.level2?.count ?? 0,
            percentage: json.level2?.percentage ?? 0,
          },
        ]);
      } catch (error: any) {
        console.error("Error fetching queue distribution:", error);
        toast.error(error.message || "Gagal memuat distribusi antrian");
        setQueueDistributionData([]);
      } finally {
        setLoadingQueueDistribution(false);
      }
    }

    fetchQueueDistribution();
  }, [startDate, endDate, selectedIntersection]);

  const handleIntersectionChange = (value: string) => {
    setSelectedIntersection(value);

    const intersection = intersections.find((i: any) => i.id === value);
    toast.success(
      `Filter diubah ke: ${intersection?.name || "Semua Persimpangan"}`
    );
  };

  const handleApplyFilter = () => {
    if (!startDate || !endDate) {
      toast.error("Tanggal awal dan akhir harus diisi");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      toast.error("Tanggal awal harus lebih kecil dari tanggal akhir");
      return;
    }

    setDateRange({ start, end });
    toast.success("Filter tanggal berhasil diterapkan");
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
        today.setDate(today.getDate() - 1);
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
    <DashboardLayout title="Analitik Lalu Lintas - Queue-Based Analytics">
      <div className="p-3 lg:p-6 space-y-4 lg:space-y-6 max-w-[1920px] mx-auto">
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
              Analisis berbasis level antrian dari DynamoDB TrafficTelemetry
            </p>
          </div>

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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100"
        >
          <h3 className="text-sm lg:text-base font-bold font-headline text-on-surface mb-4">
            Filter Rentang Tanggal
          </h3>

          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => handleQuickPreset("today")} className="px-3 py-2 text-xs lg:text-sm font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              Hari Ini
            </button>
            <button onClick={() => handleQuickPreset("yesterday")} className="px-3 py-2 text-xs lg:text-sm font-semibold bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
              Kemarin
            </button>
            <button onClick={() => handleQuickPreset("last7days")} className="px-3 py-2 text-xs lg:text-sm font-semibold bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
              7 Hari Terakhir
            </button>
            <button onClick={() => handleQuickPreset("last30days")} className="px-3 py-2 text-xs lg:text-sm font-semibold bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
              30 Hari Terakhir
            </button>
            <button onClick={() => handleQuickPreset("thisMonth")} className="px-3 py-2 text-xs lg:text-sm font-semibold bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
              Bulan Ini
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 items-start lg:items-end">
            <div className="flex-1">
              <label className="block text-xs lg:text-sm font-semibold text-slate-600 mb-2">
                Tanggal Awal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
                onChange={(e) => setEndDate(e.target.value)}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <QueueDistributionChart
            data={queueDistributionData}
            isLoading={loadingQueueDistribution}
          />

          <QueueLevelByHourChart date={analyticsDate} />
        </div>

        <GreenDurationChart startDate={startDate} endDate={endDate} />

        <QueueEffectivenessTable startDate={startDate} endDate={endDate} />

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
              <h4 className="font-bold text-slate-800 mb-1">
                Tentang Queue-Based Analytics
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Analitik ini dihitung langsung dari DynamoDB table TrafficTelemetry.
                Data dummy/hardcode sudah tidak digunakan. S3 tetap menjadi data lake
                raw, sedangkan Spark/Azure lama bisa dianggap legacy untuk batch processing.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}