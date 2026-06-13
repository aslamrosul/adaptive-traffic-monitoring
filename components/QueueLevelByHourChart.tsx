"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "@/providers/TranslationProvider";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LaneFilter = "all" | "north" | "south" | "east";
type TrafficLane = Exclude<LaneFilter, "all">;

interface QueueLevelByHourChartProps {
  startDate: string;
  endDate: string;
  intersectionId?: string;
  lane?: LaneFilter;
}

interface HourlyData {
  hour: string;
  north: number | null;
  south: number | null;
  east: number | null;
  sampleCount: number;
}

const LANES: Array<{
  id: TrafficLane;
  nameKey: string;
  stroke: string;
}> = [
  {
    id: "north",
    nameKey: "traffic.northLane",
    stroke: "#2563eb",
  },
  {
    id: "south",
    nameKey: "traffic.southLane",
    stroke: "#10b981",
  },
  {
    id: "east",
    nameKey: "traffic.eastLane",
    stroke: "#f59e0b",
  },
];

export default function QueueLevelByHourChart({
  startDate,
  endDate,
  intersectionId,
  lane = "all",
}: QueueLevelByHourChartProps) {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState<HourlyData[]>([]);
  const [totalSamples, setTotalSamples] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [visibleLanes, setVisibleLanes] = useState<
    Record<TrafficLane, boolean>
  >({
    north: true,
    south: true,
    east: true,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      if (!startDate || !endDate) {
        return;
      }

      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          lane,
          limit: "5000",
        });

        if (intersectionId) {
          params.set("intersectionId", intersectionId);
        }

        const response = await fetch(
          `/api/analytics/queue-by-hour?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const json = await response.json();

        if (!response.ok || json.success === false) {
          throw new Error(
            json.error ||
              "Gagal memuat level antrian per jam",
          );
        }

        const receivedHours: HourlyData[] =
          Array.isArray(json.hours)
            ? json.hours
            : [];

        const derivedSamples = receivedHours.reduce(
          (sum, item) => sum + Number(item.sampleCount || 0),
          0,
        );

        setChartData(receivedHours);

        setTotalSamples(
          Number(json.totalSamples ?? derivedSamples),
        );
      } catch (error: any) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Queue by hour error:", error);

        setChartData([]);
        setTotalSamples(0);

        toast.error(
          error.message ||
            "Gagal memuat level antrian per jam",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, [
    startDate,
    endDate,
    intersectionId,
    lane,
  ]);

  const displayedLanes = useMemo(() => {
    if (lane === "all") {
      return LANES.map(l => ({ ...l, name: t(l.nameKey) }));
    }

    return LANES.filter((item) => item.id === lane).map(l => ({ ...l, name: t(l.nameKey) }));
  }, [lane, t]);

  const peakInformation = useMemo(() => {
    let peakHour = "-";
    let peakValue = -1;
    let peakLane = "-";

    for (const row of chartData) {
      for (const currentLane of displayedLanes) {
        const rawValue = row[currentLane.id];

        if (rawValue === null || rawValue === undefined) {
          continue;
        }

        const value = Number(rawValue);

        if (value > peakValue) {
          peakValue = value;
          peakHour = row.hour;
          peakLane = currentLane.name;
        }
      }
    }

    return {
      hour: totalSamples > 0 ? peakHour : "-",
      lane: totalSamples > 0 ? peakLane : "-",
      value: totalSamples > 0
        ? Math.max(peakValue, 0)
        : 0,
    };
  }, [
    chartData,
    displayedLanes,
    totalSamples,
  ]);

  const periodLabel =
    startDate === endDate
      ? startDate
      : `${startDate} sampai ${endDate}`;

  const toggleLane = (laneId: TrafficLane) => {
    setVisibleLanes((current) => ({
      ...current,
      [laneId]: !current[laneId],
    }));
  };

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="h-full min-h-[420px] rounded-xl border border-blue-100 bg-white p-5 shadow-lg"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {t('charts.queueByHourTitle')}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {t('charts.queueByHourSubtitle')} {periodLabel}.
          </p>

          <p className="mt-1 text-[10px] font-semibold text-slate-400">
            {totalSamples.toLocaleString("id-ID")} {t('charts.samples')}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 px-4 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500">
            {t('analytics.peakHourAnalysis')}
          </p>

          <p className="text-lg font-black text-blue-800">
            {peakInformation.hour}
          </p>

          <p className="text-[10px] text-blue-600">
            {t('charts.level')} {peakInformation.value.toFixed(2)}
          </p>

          <p className="text-[9px] text-blue-500">
            {peakInformation.lane}
          </p>
        </div>
      </div>

      <div className="my-4 flex flex-wrap gap-2">
        {displayedLanes.map((currentLane) => (
          <button
            key={currentLane.id}
            type="button"
            onClick={() => toggleLane(currentLane.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              visibleLanes[currentLane.id]
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {currentLane.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <ChartLoading t={t} />
      ) : totalSamples === 0 ? (
        <ChartEmpty t={t} />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 20,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="hour"
              tick={{
                fontSize: 10,
                fill: "#64748b",
              }}
            />

            <YAxis
              domain={[0, 2]}
              ticks={[0, 1, 2]}
              tick={{
                fontSize: 11,
                fill: "#64748b",
              }}
            />

            <Tooltip
              formatter={(value: any, name: any) => {
                if (value === null || value === undefined) {
                  return [t('charts.noDataAvailable'), name];
                }

                return [
                  `${t('charts.level')} ${Number(value).toFixed(2)}`,
                  name,
                ];
              }}
            />

            <Legend />

            {displayedLanes.map((currentLane) => {
              if (!visibleLanes[currentLane.id]) {
                return null;
              }

              return (
                <Line
                  key={currentLane.id}
                  type="monotone"
                  dataKey={currentLane.id}
                  name={currentLane.name}
                  stroke={currentLane.stroke}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 5,
                  }}
                  connectNulls={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.article>
  );
}

function ChartLoading({ t }: { t: any }) {
  return (
    <div className="flex h-[300px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

        <p className="text-sm text-slate-500">
          {t('charts.loadingData')}
        </p>
      </div>
    </div>
  );
}

function ChartEmpty({ t }: { t: any }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-5xl text-slate-300">
        show_chart
      </span>

      <p className="mt-3 text-sm font-semibold text-slate-500">
        {t('charts.noDataPeriod')}
      </p>
    </div>
  );
}