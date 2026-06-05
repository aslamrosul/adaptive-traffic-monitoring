"use client";

import AnalyticsTimeFilter, {
  type DateRange,
  type TimeRange,
} from "@/components/AnalyticsTimeFilter";
import DashboardLayout from "@/components/DashboardLayout";
import GreenDurationChart from "@/components/GreenDurationChart";
import QueueDistributionChart from "@/components/QueueDistributionChart";
import QueueEffectivenessTable from "@/components/QueueEffectivenessTable";
import QueueLevelByHourChart from "@/components/QueueLevelByHourChart";
import { useIntersections } from "@/lib/hooks/useIntersections";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type LaneFilter = "all" | "north" | "south" | "east";


interface QueueDistributionItem {
  level: 0 | 1 | 2;
  count: number;
  percentage: number;
}

interface DeviceStats {
  total: number;
  online: number;
  offline: number;
}

function dateToInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

function calculateDateRange(
  timeRange: TimeRange,
  customDates?: DateRange
): {
  startDate: string;
  endDate: string;
} {
  const end = new Date();
  const start = new Date(end);

  switch (timeRange) {
    case "today":
      break;

    case "yesterday":
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      break;

    case "30days":
      start.setDate(start.getDate() - 30);
      break;

    case "custom":
      if (customDates) {
        return {
          startDate: customDates.startDate,
          endDate: customDates.endDate,
        };
      }

      start.setDate(start.getDate() - 7);
      break;

    case "7days":
    default:
      start.setDate(start.getDate() - 7);
      break;
  }

  return {
    startDate: dateToInputValue(start),
    endDate: dateToInputValue(end),
  };
}

export default function AnalitikPage() {
  const [selectedIntersection, setSelectedIntersection] =
    useState<string>("all");

  const [selectedLane, setSelectedLane] =
    useState<LaneFilter>("all");

  const [timeRange, setTimeRange] =
    useState<TimeRange>("7days");

  const [customDates, setCustomDates] =
    useState<DateRange | undefined>();

  const [queueDistributionData, setQueueDistributionData] =
    useState<QueueDistributionItem[]>([]);

  const [loadingQueueDistribution, setLoadingQueueDistribution] =
    useState(false);

  const [deviceStats, setDeviceStats] = useState<DeviceStats>({
    total: 0,
    online: 0,
    offline: 0,
  });

  const { intersections, isLoading: loadingIntersections } =
    useIntersections();

  const { startDate, endDate } = useMemo(
    () => calculateDateRange(timeRange, customDates),
    [timeRange, customDates]
  );

  const analyticsDate = endDate;

  const intersectionId =
    selectedIntersection === "all"
      ? undefined
      : selectedIntersection;

  useEffect(() => {
    async function fetchDistribution() {
      setLoadingQueueDistribution(true);

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          lane: selectedLane,
          limit: "5000",
        });

        if (intersectionId) {
          params.set("intersectionId", intersectionId);
        }

        const response = await fetch(
          `/api/analytics/queue-distribution?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const json = await response.json();

        if (!response.ok || json.success === false) {
          throw new Error(
            json.error || "Gagal mengambil distribusi antrian"
          );
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
        console.error("Queue distribution error:", error);
        setQueueDistributionData([]);
        toast.error(
          error.message || "Gagal memuat distribusi antrian"
        );
      } finally {
        setLoadingQueueDistribution(false);
      }
    }

    fetchDistribution();
  }, [startDate, endDate, selectedLane, intersectionId]);

  useEffect(() => {
    async function fetchDeviceStats() {
      try {
        const response = await fetch("/api/devices/status", {
          cache: "no-store",
        });

        const json = await response.json();

        if (!response.ok || json.success === false) {
          throw new Error(json.error || "Gagal memuat status perangkat");
        }

        setDeviceStats({
          total: json.stats?.total ?? json.count ?? 0,
          online: json.stats?.online ?? 0,
          offline: json.stats?.offline ?? 0,
        });
      } catch (error) {
        console.error("Device stats error:", error);
        setDeviceStats({
          total: 0,
          online: 0,
          offline: 0,
        });
      }
    }

    fetchDeviceStats();

    const interval = window.setInterval(fetchDeviceStats, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const totalSamples = useMemo(() => {
    return queueDistributionData.reduce(
      (sum, item) => sum + item.count,
      0
    );
  }, [queueDistributionData]);

  const averageQueueLevel = useMemo(() => {
    if (totalSamples === 0) {
      return 0;
    }

    const weightedTotal = queueDistributionData.reduce(
      (sum, item) => sum + item.level * item.count,
      0
    );

    return Math.round((weightedTotal / totalSamples) * 100) / 100;
  }, [queueDistributionData, totalSamples]);

  const dominantCondition = useMemo(() => {
    if (totalSamples === 0) {
      return "Belum ada data";
    }

    const dominant = [...queueDistributionData].sort(
      (a, b) => b.count - a.count
    )[0];

    if (dominant.level === 0) {
      return "Lancar";
    }

    if (dominant.level === 1) {
      return "Sedang";
    }

    return "Padat";
  }, [queueDistributionData, totalSamples]);

  const selectedIntersectionName = useMemo(() => {
    if (selectedIntersection === "all") {
      return "Semua Persimpangan";
    }

    const intersection = intersections.find((item: any) => {
      const id = item.id || item.intersection_id;
      return id === selectedIntersection;
    });

    return intersection?.name || selectedIntersection;
  }, [intersections, selectedIntersection]);

  const handleFilterChange = (
    range: TimeRange,
    dates?: DateRange
  ) => {
    setTimeRange(range);

    if (range === "custom" && dates) {
      setCustomDates(dates);
    } else {
      setCustomDates(undefined);
    }
  };

  const handleIntersectionChange = (value: string) => {
    setSelectedIntersection(value);

    const intersection = intersections.find((item: any) => {
      return (item.id || item.intersection_id) === value;
    });

    toast.success(
      `Persimpangan: ${intersection?.name || "Semua Persimpangan"}`
    );
  };

  const handleLaneChange = (value: LaneFilter) => {
    setSelectedLane(value);

    const labels: Record<LaneFilter, string> = {
      all: "Semua Jalur",
      north: "Jalur Utara",
      south: "Jalur Selatan",
      east: "Jalur Timur",
    };

    toast.success(`Filter jalur: ${labels[value]}`);
  };

  const handleExportSummary = () => {
    const rows = [
      ["Metrik", "Nilai"],
      ["Persimpangan", selectedIntersectionName],
      ["Jalur", selectedLane],
      ["Tanggal Awal", startDate],
      ["Tanggal Akhir", endDate],
      ["Total Sampel Antrian", totalSamples],
      ["Rata-rata Queue Level", averageQueueLevel],
      ["Kondisi Dominan", dominantCondition],
      ["Perangkat Online", `${deviceStats.online}/${deviceStats.total}`],
      [],
      ["Level", "Jumlah", "Persentase"],
      ...queueDistributionData.map((item) => [
        `Level ${item.level}`,
        item.count,
        `${item.percentage}%`,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `ringkasan-analitik-${startDate}-${endDate}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);

    toast.success("Ringkasan analitik berhasil diekspor");
  };

  return (
    <DashboardLayout title="Analitik Lalu Lintas">
      <div className="mx-auto max-w-[1920px] space-y-4 p-3 lg:space-y-6 lg:p-6">
        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Queue-Based Analytics
            </p>

            <h1 className="text-2xl font-black text-slate-900 lg:text-3xl">
              Dashboard Analitik Lalu Lintas
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Analisis nyata dari DynamoDB TrafficTelemetry tanpa data dummy.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportSummary}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:shadow-xl"
          >
            <span className="material-symbols-outlined text-lg">
              download
            </span>
            Ekspor Ringkasan
          </button>
        </motion.section>

        <AnalyticsTimeFilter
          currentRange={timeRange}
          onFilterChange={handleFilterChange}
        />

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2"
        >
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Persimpangan
            </label>

            <select
              value={selectedIntersection}
              onChange={(event) =>
                handleIntersectionChange(event.target.value)
              }
              disabled={loadingIntersections}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Persimpangan</option>

              {intersections.map((intersection: any) => {
                const id =
                  intersection.id || intersection.intersection_id;

                return (
                  <option key={id} value={id}>
                    {intersection.name || id}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Jalur
            </label>

            <select
              value={selectedLane}
              onChange={(event) =>
                handleLaneChange(event.target.value as LaneFilter)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Jalur</option>
              <option value="north">Jalur Utara</option>
              <option value="south">Jalur Selatan</option>
              <option value="east">Jalur Timur</option>
            </select>
          </div>
        </motion.section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <KpiCard
            title="Total Sampel"
            value={totalSamples.toLocaleString("id-ID")}
            subtitle="Sampel level antrian"
            icon="database"
            variant="blue"
          />

          <KpiCard
            title="Rata-rata Queue"
            value={averageQueueLevel.toFixed(2)}
            subtitle="Rentang level 0–2"
            icon="monitoring"
            variant="indigo"
          />

          <KpiCard
            title="Kondisi Dominan"
            value={dominantCondition}
            subtitle={selectedIntersectionName}
            icon="traffic"
            variant="amber"
          />

          <KpiCard
            title="Perangkat Online"
            value={`${deviceStats.online}/${deviceStats.total}`}
            subtitle={`${deviceStats.offline} perangkat offline`}
            icon="sensors"
            variant="emerald"
          />
        </section>

        <section className="grid grid-cols-12 gap-4 lg:gap-6">
          <div className="col-span-12 lg:col-span-8">
            <QueueLevelByHourChart
              date={analyticsDate}
              intersectionId={intersectionId}
              lane={selectedLane}
            />
          </div>

          <div className="col-span-12 lg:col-span-4">
            <QueueDistributionChart
              data={queueDistributionData}
              isLoading={loadingQueueDistribution}
            />
          </div>

          <div className="col-span-12">
            <GreenDurationChart
              startDate={startDate}
              endDate={endDate}
              intersectionId={intersectionId}
              lane={selectedLane}
            />
          </div>

          <div className="col-span-12">
            <QueueEffectivenessTable
              startDate={startDate}
              endDate={endDate}
              intersectionId={intersectionId}
              lane={selectedLane}
            />
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 p-5"
        >
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-2xl text-blue-600">
              info
            </span>

            <div>
              <h3 className="font-bold text-slate-900">
                Tentang Analitik
              </h3>

              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Level 0 menunjukkan kondisi lancar, Level 1 menunjukkan
                antrean sedang, dan Level 2 menunjukkan antrean padat.
                Target durasi hijau sistem adalah 10, 20, dan 30 detik
                berdasarkan level antrean.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </DashboardLayout>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  variant,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  variant: "blue" | "indigo" | "amber" | "emerald";
}) {
  const styles = {
    blue: "from-blue-600 to-blue-700 shadow-blue-600/20",
    indigo: "from-indigo-600 to-violet-700 shadow-indigo-600/20",
    amber: "from-amber-500 to-orange-600 shadow-amber-500/20",
    emerald: "from-emerald-600 to-teal-700 shadow-emerald-600/20",
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl bg-gradient-to-br p-4 text-white shadow-lg ${styles[variant]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 lg:text-xs">
            {title}
          </p>

          <p className="mt-2 truncate text-xl font-black lg:text-3xl">
            {value}
          </p>

          <p className="mt-1 truncate text-[10px] text-white/70 lg:text-xs">
            {subtitle}
          </p>
        </div>

        <span className="material-symbols-outlined rounded-lg bg-white/15 p-2 text-xl">
          {icon}
        </span>
      </div>
    </motion.article>
  );
}