"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useTranslation } from "@/providers/TranslationProvider";

interface QueueDistributionChartRechartsProps {
  startDate: string;
  endDate: string;
  lane?: "north" | "south" | "east" | "west" | "all";
}

interface QueueData {
  level0: { percentage: number; count: number };
  level1: { percentage: number; count: number };
  level2: { percentage: number; count: number };
  total: number;
}

interface ChartDataPoint {
  name: string;
  value: number;
  count: number;
  fill: string;
}

export default function QueueDistributionChartRecharts({
  startDate,
  endDate,
  lane = "all",
}: QueueDistributionChartRechartsProps) {
  const { t } = useTranslation();
  const [selectedLane, setSelectedLane] = useState<"north" | "south" | "east" | "west" | "all">(lane);
  const [chartData, setChartData] = useState<QueueData>({
    level0: { percentage: 45, count: 450 },
    level1: { percentage: 36, count: 360 },
    level2: { percentage: 19, count: 190 },
    total: 1000,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data from API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/queue-distribution?startDate=${startDate}&endDate=${endDate}&lane=${selectedLane}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setChartData({
        level0: { percentage: data.level0.percentage, count: data.level0.count },
        level1: { percentage: data.level1.percentage, count: data.level1.count },
        level2: { percentage: data.level2.percentage, count: data.level2.count },
        total: data.total,
      });
      toast.success("Data berhasil dimuat");
    } catch (error) {
      console.error("Error fetching queue distribution data:", error);
      toast.error("Gagal memuat data distribusi antrian");
      // Keep default data on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when dates or lane changes
  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate, selectedLane]);

  const handleLaneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLane = e.target.value as "north" | "south" | "east" | "west" | "all";
    setSelectedLane(newLane);
  };

  // Prepare chart data for Recharts
  const pieData: ChartDataPoint[] = [
    {
      name: `${t('charts.level')} 0 - ${t('traffic.smooth')}`,
      value: chartData.level0.percentage,
      count: chartData.level0.count,
      fill: "#22c55e", // green
    },
    {
      name: `${t('charts.level')} 1 - ${t('traffic.moderate')}`,
      value: chartData.level1.percentage,
      count: chartData.level1.count,
      fill: "#eab308", // yellow
    },
    {
      name: `${t('charts.level')} 2 - ${t('traffic.congested')}`,
      value: chartData.level2.percentage,
      count: chartData.level2.count,
      fill: "#ef4444", // red
    },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{data.name}</p>
          <p className="text-sm text-slate-600">{data.value}% ({data.count} records)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg lg:text-xl font-bold font-headline text-on-surface mb-2">
          Distribusi Level Antrian
        </h3>
        <p className="text-sm text-slate-500">
          Persentase distribusi level antrian berdasarkan data sensor ultrasonic dari{" "}
          <span className="font-semibold">{startDate}</span> hingga{" "}
          <span className="font-semibold">{endDate}</span>
        </p>
      </div>

      {/* Lane Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-600 mb-2">
          Pilih Jalur:
        </label>
        <select
          value={selectedLane}
          onChange={handleLaneChange}
          className="w-full lg:w-64 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-700 font-medium"
        >
          <option value="all">Semua Jalur</option>
          <option value="north">Jalur Utara</option>
          <option value="south">Jalur Selatan</option>
          <option value="east">Jalur Timur</option>
          <option value="west">Jalur Barat</option>
        </select>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500 font-medium">Memuat data distribusi antrian...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span className="text-sm font-medium text-slate-700">
                    {entry.payload.name}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {/* Level 0 - Lancar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm font-semibold text-slate-600">Level 0 - Lancar</span>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-1">
            {chartData.level0.percentage}%
          </div>
          <div className="text-xs text-slate-500">
            {chartData.level0.count} records
          </div>
          <div className="mt-2 text-[11px] text-slate-600 leading-relaxed">
            Jarak antrian: &gt; 20cm | Durasi hijau: 7 detik
          </div>
        </motion.div>

        {/* Level 1 - Sedang */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-sm font-semibold text-slate-600">Level 1 - Sedang</span>
          </div>
          <div className="text-3xl font-bold text-yellow-600 mb-1">
            {chartData.level1.percentage}%
          </div>
          <div className="text-xs text-slate-500">
            {chartData.level1.count} records
          </div>
          <div className="mt-2 text-[11px] text-slate-600 leading-relaxed">
            Jarak antrian: 10-20cm | Durasi hijau: 10 detik
          </div>
        </motion.div>

        {/* Level 2 - Padat */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 border border-red-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm font-semibold text-slate-600">Level 2 - Padat</span>
          </div>
          <div className="text-3xl font-bold text-red-600 mb-1">
            {chartData.level2.percentage}%
          </div>
          <div className="text-xs text-slate-500">
            {chartData.level2.count} records
          </div>
          <div className="mt-2 text-[11px] text-slate-600 leading-relaxed">
            Jarak antrian: &lt; 10cm | Durasi hijau: 15 detik
          </div>
        </motion.div>
      </div>

      {/* Total Records */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">Total Records:</span>
          <span className="text-2xl font-bold text-blue-600">{chartData.total}</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Data diambil dari sensor ultrasonic di persimpangan selama periode yang dipilih
        </p>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200"
      >
        <h4 className="text-sm font-bold text-indigo-900 mb-2">📊 Interpretasi Data</h4>
        <ul className="text-xs text-indigo-800 space-y-1">
          <li>
            • <span className="font-semibold">Level 0 (Lancar):</span> Lalu lintas lancar, antrian pendek
          </li>
          <li>
            • <span className="font-semibold">Level 1 (Sedang):</span> Lalu lintas mulai padat, antrian sedang
          </li>
          <li>
            • <span className="font-semibold">Level 2 (Padat):</span> Lalu lintas sangat padat, antrian panjang
          </li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
