"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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

type LaneFilter = "all" | "north" | "south" | "east";

interface GreenDurationChartProps {
  startDate: string;
  endDate: string;
  intersectionId?: string;
  lane?: LaneFilter;
}

interface LevelData {
  expected: number;
  actual: number;
  effectiveness: number;
  count: number;
}

interface GreenDurationResponse {
  success?: boolean;
  level0?: LevelData;
  level1?: LevelData;
  level2?: LevelData;
  totalSamples?: number;
  averageEffectiveness?: number;
  error?: string;
}

interface ChartDataPoint {
  level: string;
  expected: number;
  actual: number;
  effectiveness: number;
  count: number;
}

function createEmptyLevel(expected: number): LevelData {
  return {
    expected,
    actual: 0,
    effectiveness: 0,
    count: 0,
  };
}

function createEmptyData() {
  return {
    level0: createEmptyLevel(10),
    level1: createEmptyLevel(20),
    level2: createEmptyLevel(30),
  };
}

export default function GreenDurationChart({
  startDate,
  endDate,
  intersectionId = "all",
  lane = "all",
}: GreenDurationChartProps) {
  const [chartData, setChartData] = useState(createEmptyData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!startDate || !endDate) {
      return;
    }

    const controller = new AbortController();

    async function fetchData() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          lane,
          limit: "5000",
        });

        if (intersectionId && intersectionId !== "all") {
          params.set("intersectionId", intersectionId);
        }

        const response = await fetch(
          `/api/analytics/green-duration-effectiveness?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result: GreenDurationResponse = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(
            result.error || "Gagal mengambil data durasi lampu hijau"
          );
        }

        setChartData({
          level0: result.level0 || createEmptyLevel(10),
          level1: result.level1 || createEmptyLevel(20),
          level2: result.level2 || createEmptyLevel(30),
        });
      } catch (fetchError: any) {
        if (fetchError.name === "AbortError") {
          return;
        }

        console.error("Error fetching green duration analytics:", fetchError);

        setError(
          fetchError.message || "Gagal memuat data durasi lampu hijau"
        );

        setChartData(createEmptyData());
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, [startDate, endDate, intersectionId, lane]);

  const preparedChartData = useMemo<ChartDataPoint[]>(() => {
    return [
      {
        level: "Level 0",
        expected: chartData.level0.expected,
        actual: chartData.level0.actual,
        effectiveness: chartData.level0.effectiveness,
        count: chartData.level0.count,
      },
      {
        level: "Level 1",
        expected: chartData.level1.expected,
        actual: chartData.level1.actual,
        effectiveness: chartData.level1.effectiveness,
        count: chartData.level1.count,
      },
      {
        level: "Level 2",
        expected: chartData.level2.expected,
        actual: chartData.level2.actual,
        effectiveness: chartData.level2.effectiveness,
        count: chartData.level2.count,
      },
    ];
  }, [chartData]);

  const totalSamples = useMemo(() => {
    return preparedChartData.reduce((total, item) => total + item.count, 0);
  }, [preparedChartData]);

  const overallEffectiveness = useMemo(() => {
    if (totalSamples === 0) {
      return 0;
    }

    const weightedTotal = preparedChartData.reduce((total, item) => {
      return total + item.effectiveness * item.count;
    }, 0);

    return Math.round((weightedTotal / totalSamples) * 10) / 10;
  }, [preparedChartData, totalSamples]);

  const getEffectivenessClass = (effectiveness: number) => {
    if (effectiveness >= 95) {
      return "text-emerald-600";
    }

    if (effectiveness >= 85) {
      return "text-amber-600";
    }

    return "text-red-600";
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
  }) => {
    if (!active || !payload?.length) {
      return null;
    }

    const item = payload[0]?.payload as ChartDataPoint;

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
        <p className="mb-2 text-sm font-bold text-slate-900">{label}</p>

        <div className="space-y-1 text-xs">
          <p className="text-slate-600">
            Target:{" "}
            <span className="font-bold text-slate-900">
              {item.expected.toFixed(1)} detik
            </span>
          </p>

          <p className="text-slate-600">
            Aktual:{" "}
            <span className="font-bold text-blue-600">
              {item.actual.toFixed(1)} detik
            </span>
          </p>

          <p className="text-slate-600">
            Efektivitas:{" "}
            <span
              className={`font-bold ${getEffectivenessClass(
                item.effectiveness
              )}`}
            >
              {item.effectiveness.toFixed(1)}%
            </span>
          </p>

          <p className="text-slate-600">
            Sampel:{" "}
            <span className="font-bold text-slate-900">{item.count}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="h-full rounded-xl border border-blue-100 bg-white p-4 shadow-lg lg:p-6"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 lg:text-xl">
            Durasi Hijau vs Level Antrian
          </h3>

          <p className="mt-1 text-xs text-slate-500 lg:text-sm">
            Perbandingan target durasi hijau dengan rata-rata durasi aktual.
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-3 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Efektivitas Keseluruhan
          </p>

          <p
            className={`text-2xl font-black ${getEffectivenessClass(
              overallEffectiveness
            )}`}
          >
            {overallEffectiveness.toFixed(1)}%
          </p>

          <p className="text-[10px] text-slate-500">
            {totalSamples.toLocaleString("id-ID")} sampel
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-80 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="text-sm text-slate-500">
              Memuat efektivitas durasi hijau...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-80 items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <div>
            <span className="material-symbols-outlined text-4xl text-red-400">
              error
            </span>

            <p className="mt-2 font-bold text-red-700">
              Data gagal dimuat
            </p>

            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        </div>
      ) : totalSamples === 0 ? (
        <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <div>
            <span className="material-symbols-outlined text-5xl text-slate-300">
              bar_chart_off
            </span>

            <p className="mt-2 font-bold text-slate-700">
              Belum ada data durasi hijau
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Tidak ditemukan telemetry pada periode dan filter yang dipilih.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={preparedChartData}
                margin={{
                  top: 12,
                  right: 12,
                  left: -10,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="level"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit="s"
                />

                <Tooltip content={<CustomTooltip />} />

                <Legend
                  formatter={(value) => (
                    <span className="text-xs font-semibold text-slate-600">
                      {value}
                    </span>
                  )}
                />

                <Bar
                  dataKey="expected"
                  name="Target Durasi"
                  fill="#94a3b8"
                  radius={[8, 8, 0, 0]}
                />

                <Bar
                  dataKey="actual"
                  name="Durasi Aktual"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {preparedChartData.map((item, index) => {
              const styles = [
                "border-emerald-200 bg-emerald-50",
                "border-amber-200 bg-amber-50",
                "border-red-200 bg-red-50",
              ];

              return (
                <div
                  key={item.level}
                  className={`rounded-xl border p-4 ${styles[index]}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {item.level}
                  </p>

                  <p
                    className={`mt-2 text-2xl font-black ${getEffectivenessClass(
                      item.effectiveness
                    )}`}
                  >
                    {item.effectiveness.toFixed(1)}%
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Aktual {item.actual.toFixed(1)}s / target{" "}
                    {item.expected.toFixed(1)}s
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.count.toLocaleString("id-ID")} sampel
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.section>
  );
}