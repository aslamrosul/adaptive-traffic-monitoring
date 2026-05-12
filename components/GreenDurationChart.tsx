"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface GreenDurationChartProps {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
}

interface LevelData {
  expected: number;
  actual: number;
  effectiveness: number;
  count: number;
}

interface ChartDataPoint {
  level: string;
  expected: number;
  actual: number;
}

export default function GreenDurationChart({
  startDate,
  endDate,
}: GreenDurationChartProps) {
  const [chartData, setChartData] = useState<{
    level0: LevelData;
    level1: LevelData;
    level2: LevelData;
  }>({
    level0: { expected: 7, actual: 7.2, effectiveness: 97.1, count: 450 },
    level1: { expected: 10, actual: 10.5, effectiveness: 95.2, count: 350 },
    level2: { expected: 15, actual: 15.8, effectiveness: 94.9, count: 200 },
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data from API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/green-duration-effectiveness?startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setChartData({
        level0: data.level0 || { expected: 7, actual: 7.2, effectiveness: 97.1, count: 450 },
        level1: data.level1 || { expected: 10, actual: 10.5, effectiveness: 95.2, count: 350 },
        level2: data.level2 || { expected: 15, actual: 15.8, effectiveness: 94.9, count: 200 },
      });
      toast.success("Data berhasil dimuat");
    } catch (error) {
      console.error("Error fetching green duration data:", error);
      toast.error("Gagal memuat data durasi lampu hijau");
      // Keep default data on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  // Prepare chart data
  const barChartData: ChartDataPoint[] = useMemo(() => {
    return [
      {
        level: "Level 0\n(Lancar)",
        expected: chartData.level0.expected,
        actual: chartData.level0.actual,
      },
      {
        level: "Level 1\n(Sedang)",
        expected: chartData.level1.expected,
        actual: chartData.level1.actual,
      },
      {
        level: "Level 2\n(Padat)",
        expected: chartData.level2.expected,
        actual: chartData.level2.actual,
      },
    ];
  }, [chartData]);

  // Calculate overall effectiveness
  const overallEffectiveness = useMemo(() => {
    const totalSamples =
      chartData.level0.count + chartData.level1.count + chartData.level2.count;
    const weightedEffectiveness =
      (chartData.level0.effectiveness * chartData.level0.count +
        chartData.level1.effectiveness * chartData.level1.count +
        chartData.level2.effectiveness * chartData.level2.count) /
      totalSamples;
    return weightedEffectiveness;
  }, [chartData]);

  // Calculate total samples
  const totalSamples = useMemo(() => {
    return chartData.level0.count + chartData.level1.count + chartData.level2.count;
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800 mb-2">{payload[0].payload.level}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {entry.value.toFixed(1)}s
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg lg:text-xl font-bold font-headline text-on-surface mb-2">
          Durasi Lampu Hijau vs Level Antrian
        </h3>
        <p className="text-sm text-slate-500">
          Perbandingan durasi yang diharapkan vs durasi aktual dari{" "}
          <span className="font-semibold">{startDate}</span> hingga{" "}
          <span className="font-semibold">{endDate}</span>
        </p>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500 font-medium">Memuat data durasi lampu hijau...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={barChartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="level"
                stroke="#64748b"
                style={{ fontSize: "12px" }}
                tick={{ fill: "#64748b" }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: "12px" }}
                tick={{ fill: "#64748b" }}
                label={{ value: "Duration (seconds)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span className="text-sm font-medium text-slate-700">{value}</span>
                )}
              />

              {/* Expected Duration Bar */}
              <Bar
                dataKey="expected"
                fill="rgb(156, 163, 175)"
                name="Expected Duration"
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              />

              {/* Actual Duration Bar */}
              <Bar
                dataKey="actual"
                fill="rgb(59, 130, 246)"
                name="Actual Duration"
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Effectiveness Badges */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
      >
        {/* Level 0 */}
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="text-sm font-semibold text-slate-600 mb-2">Level 0 - Lancar</div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {chartData.level0.effectiveness.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mb-1">
            {chartData.level0.actual.toFixed(1)}s / {chartData.level0.expected}s
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            {chartData.level0.count} samples
          </div>
        </div>

        {/* Level 1 */}
        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
          <div className="text-sm font-semibold text-slate-600 mb-2">Level 1 - Sedang</div>
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {chartData.level1.effectiveness.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mb-1">
            {chartData.level1.actual.toFixed(1)}s / {chartData.level1.expected}s
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            {chartData.level1.count} samples
          </div>
        </div>

        {/* Level 2 */}
        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-200">
          <div className="text-sm font-semibold text-slate-600 mb-2">Level 2 - Padat</div>
          <div className="text-3xl font-bold text-red-600 mb-2">
            {chartData.level2.effectiveness.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mb-1">
            {chartData.level2.actual.toFixed(1)}s / {chartData.level2.expected}s
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            {chartData.level2.count} samples
          </div>
        </div>
      </motion.div>

      {/* Overall Effectiveness */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h4 className="font-bold text-slate-800 mb-1">
              📊 Overall System Effectiveness
            </h4>
            <p className="text-sm text-slate-600">
              Based on {totalSamples.toLocaleString()} samples from {startDate} to {endDate}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">
              {overallEffectiveness.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {overallEffectiveness >= 95
                ? "✅ Excellent"
                : overallEffectiveness >= 90
                ? "✅ Good"
                : overallEffectiveness >= 85
                ? "⚠️ Fair"
                : "❌ Needs Improvement"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Duration Mapping Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200"
      >
        <h4 className="font-bold text-sm text-indigo-900 mb-3">
          🎯 Expected Duration Mapping
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
            <div>
              <p className="text-xs font-semibold text-indigo-900">Level 0 (Lancar)</p>
              <p className="text-[11px] text-indigo-700">Queue &gt; 20cm → 7 seconds</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1 flex-shrink-0"></div>
            <div>
              <p className="text-xs font-semibold text-indigo-900">Level 1 (Sedang)</p>
              <p className="text-[11px] text-indigo-700">Queue 10-20cm → 10 seconds</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
            <div>
              <p className="text-xs font-semibold text-indigo-900">Level 2 (Padat)</p>
              <p className="text-[11px] text-indigo-700">Queue &lt; 10cm → 15 seconds</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Analysis Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200"
      >
        <h4 className="font-bold text-sm text-amber-900 mb-2">💡 Interpretasi Data</h4>
        <ul className="text-xs text-amber-800 space-y-1">
          <li>
            • <span className="font-semibold">Effectiveness &gt; 95%:</span> Sistem berjalan
            optimal, durasi aktual sangat sesuai dengan yang diharapkan
          </li>
          <li>
            • <span className="font-semibold">Effectiveness 90-95%:</span> Sistem berjalan baik,
            ada sedikit penyimpangan durasi
          </li>
          <li>
            • <span className="font-semibold">Effectiveness &lt; 90%:</span> Perlu investigasi,
            ada penyimpangan signifikan dari durasi yang diharapkan
          </li>
          <li>
            • <span className="font-semibold">Actual &gt; Expected:</span> Lampu hijau lebih
            lama dari yang direncanakan
          </li>
        </ul>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200"
      >
        <h4 className="font-bold text-sm text-purple-900 mb-2">🔧 Rekomendasi</h4>
        <ul className="text-xs text-purple-800 space-y-1">
          {overallEffectiveness < 90 && (
            <>
              <li>• Periksa kalibrasi sensor ultrasonic di lapangan</li>
              <li>• Verifikasi logika pendeteksian level antrian</li>
              <li>• Audit sistem kontrol lampu lalu lintas</li>
            </>
          )}
          {overallEffectiveness >= 90 && overallEffectiveness < 95 && (
            <>
              <li>• Monitor penyimpangan durasi secara berkala</li>
              <li>• Lakukan fine-tuning parameter sistem</li>
              <li>• Analisis pola penyimpangan per level</li>
            </>
          )}
          {overallEffectiveness >= 95 && (
            <>
              <li>• ✅ Sistem berjalan dengan baik</li>
              <li>• Lanjutkan monitoring rutin</li>
              <li>• Dokumentasikan konfigurasi optimal</li>
            </>
          )}
        </ul>
      </motion.div>
    </motion.div>
  );
}
