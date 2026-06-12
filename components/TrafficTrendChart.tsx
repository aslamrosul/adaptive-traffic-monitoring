"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type TimeRange =
  | "today"
  | "yesterday"
  | "7days"
  | "30days"
  | "custom"
  | string;

type LaneFilter = "all" | "north" | "south" | "east";

interface TrafficTrendChartProps {
  timeRange?: TimeRange;
  customDates?: {
    startDate?: string;
    endDate?: string;
  };
  intersectionId?: string;
}

interface HourlyData {
  hour: string;
  vehicleCount: number;
  queueLevel: number;
}

interface FlattenedLaneData {
  timestamp: string;
  processedAt?: string;
  intersectionId: string;
  deviceId: string;
  lane: "north" | "south" | "east";
  vehicleCount: number;
  queueLevel: number;
}

const APP_TIMEZONE = "Asia/Jakarta";
const ACTIVE_LANES = ["north", "south", "east"] as const;

function getWibDateValue(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDaysToDateValue(dateValue: string, days: number): string {
  const date = new Date(`${dateValue}T12:00:00.000+07:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getDateRange(
  timeRange: TimeRange,
  customDates?: TrafficTrendChartProps["customDates"],
) {
  const today = getWibDateValue();

  if (
    timeRange === "custom" &&
    customDates?.startDate &&
    customDates?.endDate
  ) {
    return {
      startDate: customDates.startDate,
      endDate: customDates.endDate,
      start: new Date(`${customDates.startDate}T00:00:00.000+07:00`),
      end: new Date(`${customDates.endDate}T23:59:59.999+07:00`),
    };
  }

  if (timeRange === "yesterday") {
    const yesterday = addDaysToDateValue(today, -1);

    return {
      startDate: yesterday,
      endDate: yesterday,
      start: new Date(`${yesterday}T00:00:00.000+07:00`),
      end: new Date(`${yesterday}T23:59:59.999+07:00`),
    };
  }

  if (timeRange === "7days") {
    const startDate = addDaysToDateValue(today, -7);

    return {
      startDate,
      endDate: today,
      start: new Date(`${startDate}T00:00:00.000+07:00`),
      end: new Date(`${today}T23:59:59.999+07:00`),
    };
  }

  if (timeRange === "30days") {
    const startDate = addDaysToDateValue(today, -30);

    return {
      startDate,
      endDate: today,
      start: new Date(`${startDate}T00:00:00.000+07:00`),
      end: new Date(`${today}T23:59:59.999+07:00`),
    };
  }

  return {
    startDate: today,
    endDate: today,
    start: new Date(`${today}T00:00:00.000+07:00`),
    end: new Date(`${today}T23:59:59.999+07:00`),
  };
}

function getWibHour(timestamp?: string): number {
  if (!timestamp) return 0;

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return 0;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(
    parts.find((part) => part.type === "hour")?.value ?? 0,
  );

  return hour === 24 ? 0 : hour;
}

function getValidTimestamp(item: any): string {
  return (
    item.timestamp ||
    item.processedAt ||
    item.received_at_utc ||
    ""
  );
}

function flattenTrafficData(items: any[]): FlattenedLaneData[] {
  const rows: FlattenedLaneData[] = [];

  for (const item of items) {
    for (const lane of ACTIVE_LANES) {
      const laneData = item?.[lane];

      if (!laneData) continue;

      rows.push({
        timestamp: getValidTimestamp(item),
        processedAt: item.processedAt || item.received_at_utc,
        intersectionId:
          item.intersectionId || item.intersection_id || "",
        deviceId:
          item.deviceId || item.device_id || item.device || "",
        lane,
        vehicleCount: Number(laneData.vehicleCount || 0),
        queueLevel: Number(laneData.queueLevel || 0),
      });
    }
  }

  return rows;
}

function formatRangeSubtitle(
  timeRange: TimeRange,
  startDate: string,
  endDate: string,
) {
  if (timeRange === "today") return "Hari ini";
  if (timeRange === "yesterday") return "Kemarin";
  if (timeRange === "7days") return "7 hari terakhir";
  if (timeRange === "30days") return "30 hari terakhir";
  if (timeRange === "custom") return `${startDate} sampai ${endDate}`;

  return "Periode terpilih";
}

export default function TrafficTrendChart({
  timeRange = "today",
  customDates,
  intersectionId = "all",
}: TrafficTrendChartProps) {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLane, setSelectedLane] = useState<LaneFilter>("all");

  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);

  const range = useMemo(
    () => getDateRange(timeRange, customDates),
    [timeRange, customDates?.startDate, customDates?.endDate],
  );

  const fetchChartData = useCallback(
    async (showRefreshIndicator = false) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!hasLoadedRef.current) {
        setIsInitialLoading(true);
      } else if (showRefreshIndicator) {
        setIsRefreshing(true);
      }

      try {
        const params = new URLSearchParams({
          limit: "500",
          startDate: range.startDate,
          endDate: range.endDate,
        });

        if (intersectionId && intersectionId !== "all") {
          params.set("intersectionId", intersectionId);
        }

        const response = await fetch(
          `/api/traffic/realtime?${params.toString()}`,
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (
          !response.ok ||
          !result.success ||
          !Array.isArray(result.data) ||
          result.data.length === 0
        ) {
          setHourlyData([]);
          return;
        }

        const flattenedData = flattenTrafficData(result.data);

        const laneFilteredData =
          selectedLane === "all"
            ? flattenedData
            : flattenedData.filter((item) => item.lane === selectedLane);

        const rangeData = laneFilteredData.filter((item) => {
          const timestamp = getValidTimestamp(item);

          if (!timestamp) return false;

          const date = new Date(timestamp);

          if (Number.isNaN(date.getTime())) return false;

          return date >= range.start && date <= range.end;
        });

        const hourlyMap = new Map<
          number,
          {
            vehicles: number[];
            queueLevels: number[];
          }
        >();

        for (let hour = 0; hour < 24; hour++) {
          hourlyMap.set(hour, {
            vehicles: [],
            queueLevels: [],
          });
        }

        for (const item of rangeData) {
          const hour = getWibHour(item.timestamp || item.processedAt);
          const bucket = hourlyMap.get(hour);

          if (!bucket) continue;

          bucket.vehicles.push(Number(item.vehicleCount || 0));
          bucket.queueLevels.push(Number(item.queueLevel || 0));
        }

        const chartRows: HourlyData[] = [];

        const currentWibHour = getWibHour(new Date().toISOString());

        const hoursToShow =
          timeRange === "today"
            ? 12
            : timeRange === "yesterday"
              ? 24
              : 24;

        for (let i = hoursToShow - 1; i >= 0; i--) {
          const hour =
            timeRange === "today"
              ? (currentWibHour - i + 24) % 24
              : 23 - i;

          const data = hourlyMap.get(hour);

          const avgVehicles =
            data && data.vehicles.length > 0
              ? Math.round(
                  data.vehicles.reduce((sum, value) => sum + value, 0) /
                    data.vehicles.length,
                )
              : 0;

          const avgQueueLevel =
            data && data.queueLevels.length > 0
              ? Math.round(
                  (data.queueLevels.reduce(
                    (sum, value) => sum + value,
                    0,
                  ) /
                    data.queueLevels.length) *
                    10,
                ) / 10
              : 0;

          chartRows.push({
            hour: `${String(hour).padStart(2, "0")}:00`,
            vehicleCount: avgVehicles,
            queueLevel: avgQueueLevel,
          });
        }

        setHourlyData(chartRows);
      } catch (error) {
        if (requestId === requestIdRef.current) {
          console.error("Error fetching traffic trend chart:", error);
          setHourlyData([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          hasLoadedRef.current = true;
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [
      range.startDate,
      range.endDate,
      range.start,
      range.end,
      intersectionId,
      selectedLane,
      timeRange,
    ],
  );

  useEffect(() => {
    hasLoadedRef.current = false;
    setIsInitialLoading(true);
    setHourlyData([]);

    void fetchChartData(false);

    const interval = window.setInterval(() => {
      void fetchChartData(false);
    }, 30000);

    return () => {
      requestIdRef.current += 1;
      window.clearInterval(interval);
    };
  }, [fetchChartData]);

  const maxVehicleValue = Math.max(
    ...hourlyData.map((item) => item.vehicleCount),
    10,
  );

  const chartData = {
    labels: hourlyData.map((item) => item.hour),
    datasets: [
      {
        label: "Vehicle Count",
        data: hourlyData.map((item) => item.vehicleCount),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        yAxisID: "y-left",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
      {
        label: "Queue Level",
        data: hourlyData.map((item) => item.queueLevel),
        borderColor: "rgb(249, 115, 22)",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        borderDash: [5, 5],
        yAxisID: "y-right",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "rgb(249, 115, 22)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            weight: "bold",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 13,
          weight: "bold",
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label(context: any) {
            let label = context.dataset.label || "";

            if (label) label += ": ";

            if (context.parsed.y === null) return label;

            if (context.dataset.label === "Queue Level") {
              const level = Math.round(context.parsed.y);
              const levelText =
                level === 0
                  ? "Lancar"
                  : level === 1
                    ? "Sedang"
                    : "Padat";

              return `${label}${context.parsed.y} (${levelText})`;
            }

            return `${label}${context.parsed.y} kendaraan`;
          },
        },
      },
    },
    scales: {
      "y-left": {
        type: "linear" as const,
        position: "left" as const,
        beginAtZero: true,
        suggestedMax: Math.max(10, Math.ceil(maxVehicleValue * 1.2)),
        title: {
          display: true,
          text: "Vehicle Count",
          font: {
            size: 11,
            weight: "bold",
          },
          color: "rgb(59, 130, 246)",
        },
        ticks: {
          precision: 0,
          font: {
            size: 10,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      "y-right": {
        type: "linear" as const,
        position: "right" as const,
        min: 0,
        max: 2,
        title: {
          display: true,
          text: "Queue Level",
          font: {
            size: 11,
            weight: "bold",
          },
          color: "rgb(249, 115, 22)",
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 10,
          },
          callback(value: any) {
            const labels = ["0 (Lancar)", "1 (Sedang)", "2 (Padat)"];
            return labels[value] || value;
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        ticks: {
          font: {
            size: 10,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
  };

  if (isInitialLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
        <div className="mb-4 h-6 w-48 rounded bg-slate-200" />
        <div className="h-64 rounded-xl bg-slate-100 lg:h-80" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6"
    >
      <div className="mb-6 flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h4 className="flex items-center gap-2 text-base font-bold text-slate-900 lg:text-lg">
            <span className="material-symbols-outlined text-primary">
              show_chart
            </span>
            Tren Lalu Lintas & Queue Level
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            {formatRangeSubtitle(
              timeRange,
              range.startDate,
              range.endDate,
            )}{" "}
            ·{" "}
            {intersectionId === "all"
              ? "Semua persimpangan"
              : intersectionId}
          </p>
        </div>

        <div className="flex w-full gap-2 lg:w-auto">
          <select
            value={selectedLane}
            onChange={(event) =>
              setSelectedLane(event.target.value as LaneFilter)
            }
            className="flex-1 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20 lg:flex-none"
          >
            <option value="all">Semua Jalur</option>
            <option value="north">Jalur Utara</option>
            <option value="south">Jalur Selatan</option>
            <option value="east">Jalur Timur</option>
          </select>

          <motion.button
            whileHover={{
              scale: isRefreshing ? 1 : 1.05,
            }}
            whileTap={{
              scale: isRefreshing ? 1 : 0.95,
            }}
            onClick={() => void fetchChartData(true)}
            disabled={isRefreshing}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            title="Refresh data"
            type="button"
          >
            <span
              className={[
                "material-symbols-outlined text-slate-600",
                isRefreshing ? "animate-spin" : "",
              ].join(" ")}
            >
              refresh
            </span>
          </motion.button>
        </div>
      </div>

      <div className="h-64 lg:h-80">
        {hourlyData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl bg-slate-50">
            <div className="text-center">
              <span className="material-symbols-outlined mb-3 inline-block text-5xl text-slate-300">
                show_chart
              </span>

              <p className="text-sm text-slate-500">
                Belum ada data untuk ditampilkan
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="grid grid-cols-1 gap-3 text-xs lg:grid-cols-2">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-8 rounded bg-blue-500" />

            <span className="text-slate-600">
              <span className="font-bold">Vehicle Count:</span> Rata-rata
              kendaraan per jam
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-0.5 w-8 rounded border-t-2 border-dashed border-orange-500 bg-orange-500" />

            <span className="text-slate-600">
              <span className="font-bold">Queue Level:</span> 0=Lancar,
              1=Sedang, 2=Padat
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}