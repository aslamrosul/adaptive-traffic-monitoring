"use client";

import AnalyticsTimeFilter, {
  type DateRange,
  type TimeRange,
} from "@/components/AnalyticsTimeFilter";
import DashboardLayout from "@/components/DashboardLayout";
import GreenDurationChart from "@/components/GreenDurationChart";
import QueueDistributionChart from "@/components/QueueDistributionChart";
import QueueEffectivenessTable from "@/components/QueueEffectivenessTable";
import QueueHourlyHeatmap from "@/components/QueueHourlyHeatmap";
import QueueLevelByHourChart from "@/components/QueueLevelByHourChart";
import VehicleVolumeChart from "@/components/VehicleVolumeChart";

import { useIntersections } from "@/lib/hooks/useIntersections";
import {
  addDaysToDateValue,
  getWibDateValue,
} from "@/lib/timezone";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useActivityLogger } from "@/lib/hooks/useActivityLogger";
import { useT } from "@/lib/useT";

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

interface VehiclePeak {
  period: string;
  label?: string;
  count: number;
  lane?: string;
}

interface VehicleVolumeSummary {
  totalVehicles: number;
  groupBy: "hour" | "day";
  peak: VehiclePeak | null;
}

function calculateDateRange(
  timeRange: TimeRange,
  customDates?: DateRange,
): {
  startDate: string;
  endDate: string;
} {
  const today = getWibDateValue();

  switch (timeRange) {
    case "today":
      return {
        startDate: today,
        endDate: today,
      };

    case "yesterday": {
      const yesterday = addDaysToDateValue(today, -1);

      return {
        startDate: yesterday,
        endDate: yesterday,
      };
    }

    case "30days":
      return {
        startDate: addDaysToDateValue(today, -29),
        endDate: today,
      };

    case "custom":
      if (customDates) {
        return {
          startDate: customDates.startDate,
          endDate: customDates.endDate,
        };
      }

      return {
        startDate: addDaysToDateValue(today, -6),
        endDate: today,
      };

    case "7days":
    default:
      return {
        startDate: addDaysToDateValue(today, -6),
        endDate: today,
      };
  }
}

export default function AnalitikPage() {
  const t = useT();

  useActivityLogger({
    type: "analytics.view",
    action: t('analytics.activityLog.action') || "Membuka halaman analitik",
    description: t('analytics.activityLog.description') || "Pengguna membuka dashboard analitik lalu lintas",
  });

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

  const [vehicleSummary, setVehicleSummary] =
    useState<VehicleVolumeSummary>({
      totalVehicles: 0,
      groupBy: "day",
      peak: null,
    });

  const [loadingVehicleSummary, setLoadingVehicleSummary] =
    useState(false);

  const { intersections, isLoading: loadingIntersections } =
    useIntersections();

  const { startDate, endDate } = useMemo(
    () => calculateDateRange(timeRange, customDates),
    [timeRange, customDates],
  );

  const intersectionId =
    selectedIntersection === "all"
      ? undefined
      : selectedIntersection;

  useEffect(() => {
    const controller = new AbortController();

    async function fetchQueueDistribution() {
      setLoadingQueueDistribution(true);

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          lane: selectedLane,
          limit: "10000",
        });

        if (intersectionId) {
          params.set("intersectionId", intersectionId);
        }

        const response = await fetch(
          `/api/analytics/queue-distribution?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const json = await response.json();

        if (!response.ok || json.success === false) {
          throw new Error(
            json.error || "Gagal mengambil distribusi antrean",
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
        if (error.name === "AbortError") {
          return;
        }

        console.error("Queue distribution error:", error);
        setQueueDistributionData([]);

        toast.error(
          error.message || "Gagal memuat distribusi antrean",
        );
      } finally {
        setLoadingQueueDistribution(false);
      }
    }

    fetchQueueDistribution();

    return () => controller.abort();
  }, [
    startDate,
    endDate,
    selectedLane,
    intersectionId,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchVehicleSummary() {
      setLoadingVehicleSummary(true);

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          lane: selectedLane,
          limit: "20000",
        });

        if (intersectionId) {
          params.set("intersectionId", intersectionId);
        }

        const response = await fetch(
          `/api/analytics/vehicle-volume?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const json = await response.json();

        if (!response.ok || json.success === false) {
          throw new Error(
            json.error || "Gagal mengambil volume kendaraan",
          );
        }

        setVehicleSummary({
          totalVehicles: Number(json.totalVehicles || 0),
          groupBy: json.groupBy === "hour" ? "hour" : "day",
          peak: json.peak || null,
        });
      } catch (error: any) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Vehicle summary error:", error);

        setVehicleSummary({
          totalVehicles: 0,
          groupBy: "day",
          peak: null,
        });
      } finally {
        setLoadingVehicleSummary(false);
      }
    }

    fetchVehicleSummary();

    return () => controller.abort();
  }, [
    startDate,
    endDate,
    selectedLane,
    intersectionId,
  ]);

  useEffect(() => {
    async function fetchDeviceStats() {
      try {
        const response = await fetch("/api/devices/status", {
          cache: "no-store",
        });

        const json = await response.json();

        if (!response.ok || json.success === false) {
          throw new Error(
            json.error || "Gagal memuat status perangkat",
          );
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

    const interval = window.setInterval(
      fetchDeviceStats,
      60_000,
    );

    return () => window.clearInterval(interval);
  }, []);

  const totalSamples = useMemo(() => {
    return queueDistributionData.reduce(
      (sum, item) => sum + item.count,
      0,
    );
  }, [queueDistributionData]);

  const averageQueueLevel = useMemo(() => {
    if (totalSamples === 0) {
      return 0;
    }

    const weightedTotal = queueDistributionData.reduce(
      (sum, item) => sum + item.level * item.count,
      0,
    );

    return (
      Math.round((weightedTotal / totalSamples) * 100) / 100
    );
  }, [queueDistributionData, totalSamples]);

  const dominantCondition = useMemo(() => {
    if (totalSamples === 0) {
      return "Belum ada data";
    }

    const dominant = [...queueDistributionData].sort(
      (a, b) => b.count - a.count,
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
      return t('intersections.allIntersections');
    }

    const intersection = intersections.find((item: any) => {
      const id = item.id || item.intersection_id;

      return id === selectedIntersection;
    });

    return intersection?.name || selectedIntersection;
  }, [intersections, selectedIntersection]);

  const peakLabel = useMemo(() => {
    if (!vehicleSummary.peak) {
      return "-";
    }

    return (
      vehicleSummary.peak.label ||
      vehicleSummary.peak.period ||
      "-"
    );
  }, [vehicleSummary.peak]);

  const handleFilterChange = (
    range: TimeRange,
    dates?: DateRange,
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
      `${t('intersections.name')}: ${
        intersection?.name || t('intersections.allIntersections')
      }`,
    );
  };

  const handleLaneChange = (value: LaneFilter) => {
    setSelectedLane(value);

    const labels: Record<LaneFilter, string> = {
      all: t('traffic.allLanes') || "Semua Jalur",
      north: t('traffic.northLane') || "Jalur Utara",
      south: t('traffic.southLane') || "Jalur Selatan",
      east: t('traffic.eastLane') || "Jalur Timur",
    };

    toast.success(`${t('common.filter')}: ${labels[value]}`);
  };

  const handleExportSummary = () => {
    const rows = [
      ["Metrik", "Nilai"],
      ["Persimpangan", selectedIntersectionName],
      ["Jalur", selectedLane],
      ["Tanggal Awal", startDate],
      ["Tanggal Akhir", endDate],
      ["Total Kendaraan", vehicleSummary.totalVehicles],
      ["Periode Volume Tertinggi", peakLabel],
      [
        "Jumlah Pada Periode Tertinggi",
        vehicleSummary.peak?.count || 0,
      ],
      ["Total Sampel Antrean", totalSamples],
      ["Rata-rata Queue Level", averageQueueLevel],
      ["Kondisi Dominan", dominantCondition],
      [
        "Perangkat Online",
        `${deviceStats.online}/${deviceStats.total}`,
      ],
      [],
      ["Queue Level", "Jumlah", "Persentase"],
      ...queueDistributionData.map((item) => [
        `Level ${item.level}`,
        item.count,
        `${item.percentage}%`,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value ?? "").replaceAll('"', '""')}"`,
          )
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `ringkasan-analitik-${startDate}-${endDate}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    toast.success("Ringkasan analitik berhasil diekspor");
  };

  return (
    <DashboardLayout title="Analitik Lalu Lintas">
      <div className="mx-auto max-w-[1920px] space-y-3 p-3 lg:space-y-6 lg:p-6">
        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 lg:items-end"
        >
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 lg:mb-1 lg:text-xs">
              Traffic & Queue Analytics
            </p>

            <h1 className="text-lg font-black text-slate-900 lg:text-3xl">
              Dashboard Analitik Lalu Lintas
            </h1>

            <p className="mt-0.5 hidden text-sm text-slate-500 lg:block">
              Analisis volume kendaraan, antrean, dan efektivitas
              lampu dari DynamoDB tanpa data dummy.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportSummary}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:shadow-lg lg:rounded-xl lg:px-5 lg:py-3 lg:text-sm"
          >
            <span className="material-symbols-outlined text-base lg:text-lg">
              download
            </span>
            <span className="hidden sm:inline">Ekspor Ringkasan</span>
            <span className="sm:hidden">Ekspor</span>
          </button>
        </motion.section>

        <AnalyticsTimeFilter
          currentRange={timeRange}
          onFilterChange={handleFilterChange}
        />

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:gap-3 lg:p-4"
        >
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500 lg:mb-2 lg:text-xs">
              Persimpangan
            </label>

            <select
              value={selectedIntersection}
              onChange={(event) =>
                handleIntersectionChange(event.target.value)
              }
              disabled={loadingIntersections}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 lg:px-4 lg:py-3 lg:text-sm"
            >
              <option value="all">{t('intersections.allIntersections')}</option>

              {intersections.map((intersection: any) => {
                const id =
                  intersection.id ||
                  intersection.intersection_id;

                return (
                  <option key={id} value={id}>
                    {intersection.name || id}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500 lg:mb-2 lg:text-xs">
              Jalur
            </label>

            <select
              value={selectedLane}
              onChange={(event) =>
                handleLaneChange(
                  event.target.value as LaneFilter,
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 lg:px-4 lg:py-3 lg:text-sm"
            >
              <option value="all">{t('traffic.allLanes') || 'Semua Jalur'}</option>
              <option value="north">{t('traffic.northLane') || 'Jalur Utara'}</option>
              <option value="south">{t('traffic.southLane') || 'Jalur Selatan'}</option>
              <option value="east">{t('traffic.eastLane') || 'Jalur Timur'}</option>
            </select>
          </div>
        </motion.section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <KpiCard
            title="Total Kendaraan"
            value={
              loadingVehicleSummary
                ? "..."
                : vehicleSummary.totalVehicles.toLocaleString(
                    "id-ID",
                  )
            }
            subtitle="Kendaraan baru terdeteksi"
            icon="directions_car"
            variant="blue"
          />

          <KpiCard
            title="Volume Tertinggi"
            value={loadingVehicleSummary ? "..." : peakLabel}
            subtitle={`${
              vehicleSummary.peak?.count || 0
            } kendaraan`}
            icon="trending_up"
            variant="indigo"
          />

          <KpiCard
            title="Rata-rata Antrean"
            value={averageQueueLevel.toFixed(2)}
            subtitle={`${dominantCondition} · Level 0–2`}
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
            <VehicleVolumeChart
              startDate={startDate}
              endDate={endDate}
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
            <QueueHourlyHeatmap
              startDate={startDate}
              endDate={endDate}
              intersectionId={intersectionId}
              lane={selectedLane}
            />
          </div>

          <div className="col-span-12">
            <QueueLevelByHourChart
              startDate={startDate}
              endDate={endDate}
              intersectionId={intersectionId}
              lane={selectedLane}
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
                Volume kendaraan dihitung berdasarkan kenaikan counter
                kendaraan, bukan dengan menjumlahkan seluruh telemetry.
                Level 0 berarti lancar, Level 1 berarti antrean sedang,
                dan Level 2 berarti antrean padat. Seluruh tanggal dan
                pengelompokan jam menggunakan WIB.
              </p>

              <p className="mt-2 text-xs font-semibold text-slate-500">
                Sampel antrean pada periode ini:{" "}
                {totalSamples.toLocaleString("id-ID")}
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
    indigo:
      "from-indigo-600 to-violet-700 shadow-indigo-600/20",
    amber:
      "from-amber-500 to-orange-600 shadow-amber-500/20",
    emerald:
      "from-emerald-600 to-teal-700 shadow-emerald-600/20",
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