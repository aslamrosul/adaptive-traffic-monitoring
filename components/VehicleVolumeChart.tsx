"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useT } from "@/lib/useT";

type LaneFilter = "all" | "north" | "south" | "east";

export interface VehicleVolumePoint {
  period: string;
  label: string;

  north: number;
  south: number;
  east: number;

  total: number;
}

interface VehiclePeak {
  label: string;
  count: number;
  laneName: string;
}

interface VehicleVolumeChartProps {
  startDate: string;
  endDate: string;
  intersectionId?: string;
  lane?: LaneFilter;
}

export default function VehicleVolumeChart({
  startDate,
  endDate,
  intersectionId,
  lane = "all",
}: VehicleVolumeChartProps) {
  const t = useT();
  const [data, setData] = useState<VehicleVolumePoint[]>([]);
  const [groupBy, setGroupBy] = useState<"hour" | "day">("day");
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [peak, setPeak] = useState<VehiclePeak | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate) {
      return;
    }

    const controller = new AbortController();

    async function fetchVehicleVolume() {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          lane,
          limit: "20000",
        });

        if (intersectionId && intersectionId !== "all") {
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
            json.error || t('errors.fetchVehicleVolume'),
          );
        }

        setData(Array.isArray(json.data) ? json.data : []);

        setGroupBy(json.groupBy === "hour" ? "hour" : "day");

        setTotalVehicles(Number(json.totalVehicles || 0));

        setPeak(
          json.peak
            ? {
                label: json.peak.label || json.peak.period || "-",
                count: Number(json.peak.count || 0),
                laneName:
                  json.peak.laneName ||
                  json.peak.lane ||
                  "-",
              }
            : null,
        );
      } catch (error: any) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Vehicle volume error:", error);

        setData([]);
        setGroupBy("day");
        setTotalVehicles(0);
        setPeak(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVehicleVolume();

    return () => controller.abort();
  }, [startDate, endDate, intersectionId, lane]);

  const hasData = totalVehicles > 0;

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
      className="h-full rounded-xl border border-blue-100 bg-white p-5 shadow-lg"
    >
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {t('charts.vehicleVolumeTitle')}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {t('charts.vehicleVolumeSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-blue-50 px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase text-blue-500">
              {t('analytics.vehicleVolume')}
            </p>

            <p className="text-xl font-black text-blue-800">
              {totalVehicles.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase text-amber-600">
              {t('traffic.peakHours')}
            </p>

            <p className="text-sm font-black text-amber-800">
              {peak?.label || "-"}
            </p>

            <p className="text-[10px] text-amber-600">
              {peak
                ? `${peak.count.toLocaleString("id-ID")} ${t('charts.vehicles')} · ${peak.laneName}`
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <ChartLoading />
      ) : !hasData ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 12,
              left: -16,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="label"
              tick={{
                fontSize: 10,
                fill: "#64748b",
              }}
              interval="preserveStartEnd"
            />

            <YAxis
              allowDecimals={false}
              tick={{
                fontSize: 10,
                fill: "#64748b",
              }}
            />

            <Tooltip
              formatter={(value: any, name: any) => [
                `${Number(value).toLocaleString("id-ID")} ${t('charts.vehicles')}`,
                name,
              ]}
            />

            <Legend />

            <Bar
              dataKey="north"
              name={t('traffic.northLane')}
              fill="#2563eb"
              radius={[5, 5, 0, 0]}
            />

            <Bar
              dataKey="south"
              name={t('traffic.southLane')}
              fill="#10b981"
              radius={[5, 5, 0, 0]}
            />

            <Bar
              dataKey="east"
              name={t('traffic.eastLane')}
              fill="#f59e0b"
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.article>
  );
}

function ChartLoading() {
  const t = useT();
  return (
    <div className="flex h-[340px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

        <p className="text-sm text-slate-500">
          {t('charts.loadingData')}
        </p>
      </div>
    </div>
  );
}

function ChartEmpty() {
  const t = useT();
  return (
    <div className="flex h-[340px] flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-5xl text-slate-300">
        directions_car
      </span>

      <p className="mt-3 text-sm font-semibold text-slate-500">
        {t('charts.noVehicleData')}
      </p>
    </div>
  );
}