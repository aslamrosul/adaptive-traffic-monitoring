"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface QueueLevelByHourChartProps {
  date: string; // ISO date string (YYYY-MM-DD)
}

interface HourlyData {
  hour: string;
  north: number;
  south: number;
  east: number;
  west: number;
}

interface VisibleLanes {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

interface PeakHours {
  north: string;
  south: string;
  east: string;
  west: string;
}

export default function QueueLevelByHourChart({ date }: QueueLevelByHourChartProps) {
  const [chartData, setChartData] = useState<HourlyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleLanes, setVisibleLanes] = useState<VisibleLanes>({
    north: true,
    south: true,
    east: true,
    west: true,
  });

  // Fetch data from API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/queue-by-hour?date=${date}`);

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setChartData(data.hours || generateMockData());
      toast.success("Data berhasil dimuat");
    } catch (error) {
      console.error("Error fetching queue by hour data:", error);
      toast.error("Gagal memuat data antrian per jam");
      // Use mock data on error
      setChartData(generateMockData());
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock data for demonstration
  const generateMockData = (): HourlyData[] => {
    return [
      { hour: "00:00", north: 0.2, south: 0.1, east: 0.15, west: 0.12 },
      { hour: "01:00", north: 0.15, south: 0.1, east: 0.12, west: 0.1 },
      { hour: "02:00", north: 0.1, south: 0.08, east: 0.1, west: 0.08 },
      { hour: "03:00", north: 0.12, south: 0.1, east: 0.12, west: 0.1 },
      { hour: "04:00", north: 0.15, south: 0.12, east: 0.14, west: 0.12 },
      { hour: "05:00", north: 0.3, south: 0.25, east: 0.28, west: 0.26 },
      { hour: "06:00", north: 0.8, south: 0.7, east: 0.75, west: 0.72 },
      { hour: "07:00", north: 1.5, south: 1.4, east: 1.45, west: 1.42 },
      { hour: "08:00", north: 1.8, south: 1.7, east: 1.75, west: 1.72 },
      { hour: "09:00", north: 1.6, south: 1.5, east: 1.55, west: 1.52 },
      { hour: "10:00", north: 1.2, south: 1.1, east: 1.15, west: 1.12 },
      { hour: "11:00", north: 0.9, south: 0.8, east: 0.85, west: 0.82 },
      { hour: "12:00", north: 1.1, south: 1.0, east: 1.05, west: 1.02 },
      { hour: "13:00", north: 0.8, south: 0.7, east: 0.75, west: 0.72 },
      { hour: "14:00", north: 0.6, south: 0.5, east: 0.55, west: 0.52 },
      { hour: "15:00", north: 0.7, south: 0.6, east: 0.65, west: 0.62 },
      { hour: "16:00", north: 1.3, south: 1.2, east: 1.25, west: 1.22 },
      { hour: "17:00", north: 1.9, south: 1.8, east: 1.85, west: 1.82 },
      { hour: "18:00", north: 2.0, south: 1.9, east: 1.95, west: 1.92 },
      { hour: "19:00", north: 1.7, south: 1.6, east: 1.65, west: 1.62 },
      { hour: "20:00", north: 1.2, south: 1.1, east: 1.15, west: 1.12 },
      { hour: "21:00", north: 0.8, south: 0.7, east: 0.75, west: 0.72 },
      { hour: "22:00", north: 0.5, south: 0.4, east: 0.45, west: 0.42 },
      { hour: "23:00", north: 0.3, south: 0.2, east: 0.25, west: 0.22 },
    ];
  };

  // Fetch data when date changes
  useEffect(() => {
    if (date) {
      fetchData();
    }
  }, [date]);

  // Calculate peak hours for each lane
  const peakHours = useMemo<PeakHours>(() => {
    if (chartData.length === 0) {
      return { north: "N/A", south: "N/A", east: "N/A", west: "N/A" };
    }

    const findPeakHour = (lane: keyof Omit<HourlyData, "hour">) => {
      let maxValue = 0;
      let peakHour = "N/A";

      chartData.forEach((data) => {
        if (data[lane] > maxValue) {
          maxValue = data[lane];
          peakHour = data.hour;
        }
      });

      return peakHour;
    };

    return {
      north: findPeakHour("north"),
      south: findPeakHour("south"),
      east: findPeakHour("east"),
      west: findPeakHour("west"),
    };
  }, [chartData]);

  // Toggle lane visibility
  const toggleLane = (lane: keyof VisibleLanes) => {
    setVisibleLanes((prev) => ({
      ...prev,
      [lane]: !prev[lane],
    }));
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800 mb-2">{payload[0].payload.hour}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {entry.value.toFixed(2)} (Level {Math.round(entry.value * 2)})
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format Y-axis labels
  const formatYAxis = (value: number) => {
    if (value === 0) return "0 (Lancar)";
    if (value === 1) return "1 (Sedang)";
    if (value === 2) return "2 (Padat)";
    return value.toFixed(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg lg:text-xl font-bold font-headline text-on-surface mb-2">
          Level Antrian Per Jam
        </h3>
        <p className="text-sm text-slate-500">
          Tren level antrian sepanjang hari untuk tanggal{" "}
          <span className="font-semibold">{date}</span>
        </p>
      </div>

      {/* Lane Toggle Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toggleLane("north")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            visibleLanes.north
              ? "bg-blue-500 text-white shadow-md"
              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
          }`}
        >
          🔵 Jalur Utara
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toggleLane("south")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            visibleLanes.south
              ? "bg-green-500 text-white shadow-md"
              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
          }`}
        >
          🟢 Jalur Selatan
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toggleLane("east")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            visibleLanes.east
              ? "bg-orange-500 text-white shadow-md"
              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
          }`}
        >
          🟠 Jalur Timur
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toggleLane("west")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            visibleLanes.west
              ? "bg-purple-500 text-white shadow-md"
              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
          }`}
        >
          🟣 Jalur Barat
        </motion.button>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500 font-medium">Memuat data antrian per jam...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="hour"
                stroke="#64748b"
                style={{ fontSize: "12px" }}
                tick={{ fill: "#64748b" }}
              />
              <YAxis
                domain={[0, 2]}
                ticks={[0, 0.5, 1, 1.5, 2]}
                tickFormatter={formatYAxis}
                stroke="#64748b"
                style={{ fontSize: "12px" }}
                tick={{ fill: "#64748b" }}
                label={{ value: "Queue Level", angle: -90, position: "insideLeft" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="line"
                formatter={(value) => (
                  <span className="text-sm font-medium text-slate-700">{value}</span>
                )}
              />

              {/* North Lane */}
              {visibleLanes.north && (
                <Line
                  type="monotone"
                  dataKey="north"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth={2.5}
                  dot={{ fill: "rgb(59, 130, 246)", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Jalur Utara"
                  isAnimationActive={true}
                  animationDuration={800}
                  tension={0.4}
                />
              )}

              {/* South Lane */}
              {visibleLanes.south && (
                <Line
                  type="monotone"
                  dataKey="south"
                  stroke="rgb(16, 185, 129)"
                  strokeWidth={2.5}
                  dot={{ fill: "rgb(16, 185, 129)", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Jalur Selatan"
                  isAnimationActive={true}
                  animationDuration={800}
                  tension={0.4}
                />
              )}

              {/* East Lane */}
              {visibleLanes.east && (
                <Line
                  type="monotone"
                  dataKey="east"
                  stroke="rgb(249, 115, 22)"
                  strokeWidth={2.5}
                  dot={{ fill: "rgb(249, 115, 22)", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Jalur Timur"
                  isAnimationActive={true}
                  animationDuration={800}
                  tension={0.4}
                />
              )}

              {/* West Lane */}
              {visibleLanes.west && (
                <Line
                  type="monotone"
                  dataKey="west"
                  stroke="rgb(168, 85, 247)"
                  strokeWidth={2.5}
                  dot={{ fill: "rgb(168, 85, 247)", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Jalur Barat"
                  isAnimationActive={true}
                  animationDuration={800}
                  tension={0.4}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Peak Hours Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
      >
        <h4 className="font-bold text-sm text-slate-800 mb-3">⏰ Jam Puncak Per Jalur</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded p-3 border border-blue-100">
            <p className="text-xs text-slate-500 font-semibold">Jalur Utara</p>
            <p className="text-lg font-bold text-blue-600">{peakHours.north}</p>
          </div>
          <div className="bg-white rounded p-3 border border-green-100">
            <p className="text-xs text-slate-500 font-semibold">Jalur Selatan</p>
            <p className="text-lg font-bold text-green-600">{peakHours.south}</p>
          </div>
          <div className="bg-white rounded p-3 border border-orange-100">
            <p className="text-xs text-slate-500 font-semibold">Jalur Timur</p>
            <p className="text-lg font-bold text-orange-600">{peakHours.east}</p>
          </div>
          <div className="bg-white rounded p-3 border border-purple-100">
            <p className="text-xs text-slate-500 font-semibold">Jalur Barat</p>
            <p className="text-lg font-bold text-purple-600">{peakHours.west}</p>
          </div>
        </div>
      </motion.div>

      {/* Queue Level Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200"
      >
        <h4 className="font-bold text-sm text-indigo-900 mb-3">📊 Penjelasan Level Antrian</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
            <div>
              <p className="text-xs font-semibold text-indigo-900">Level 0 - Lancar</p>
              <p className="text-[11px] text-indigo-700">Antrian &gt; 20cm, Durasi: 7s</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1 flex-shrink-0"></div>
            <div>
              <p className="text-xs font-semibold text-indigo-900">Level 1 - Sedang</p>
              <p className="text-[11px] text-indigo-700">Antrian 10-20cm, Durasi: 10s</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
            <div>
              <p className="text-xs font-semibold text-indigo-900">Level 2 - Padat</p>
              <p className="text-[11px] text-indigo-700">Antrian &lt; 10cm, Durasi: 15s</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200"
      >
        <h4 className="font-bold text-sm text-amber-900 mb-2">💡 Tips Analisis</h4>
        <ul className="text-xs text-amber-800 space-y-1">
          <li>• Klik tombol jalur untuk menampilkan/menyembunyikan data</li>
          <li>• Hover pada grafik untuk melihat detail nilai per jam</li>
          <li>• Jam puncak menunjukkan waktu dengan level antrian tertinggi</li>
          <li>• Gunakan data ini untuk optimasi durasi lampu lalu lintas</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
