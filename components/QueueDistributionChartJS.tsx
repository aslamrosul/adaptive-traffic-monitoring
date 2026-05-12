"use client";

import { useEffect, useRef, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from "chart.js";
import { Pie } from "react-chartjs-2";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

interface QueueDistributionChartJSProps {
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

export default function QueueDistributionChartJS({
  startDate,
  endDate,
  lane = "all",
}: QueueDistributionChartJSProps) {
  const [selectedLane, setSelectedLane] = useState<"north" | "south" | "east" | "west" | "all">(lane);
  const [chartData, setChartData] = useState<QueueData>({
    level0: { percentage: 45, count: 450 },
    level1: { percentage: 36, count: 360 },
    level2: { percentage: 19, count: 190 },
    total: 1000,
  });
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef(null);

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

  // Chart data configuration
  const pieChartData = {
    labels: ["Level 0 - Lancar", "Level 1 - Sedang", "Level 2 - Padat"],
    datasets: [
      {
        data: [chartData.level0.percentage, chartData.level1.percentage, chartData.level2.percentage],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)", // green
          "rgba(234, 179, 8, 0.8)", // yellow
          "rgba(239, 68, 68, 0.8)", // red
        ],
        borderColor: [
          "rgb(34, 197, 94)",
          "rgb(234, 179, 8)",
          "rgb(239, 68, 68)",
        ],
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  // Chart options
  const chartOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          font: {
            size: 14,
            weight: 600 as any,
          },
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const label = context.label || "";
            const value = context.parsed || 0;
            const dataIndex = context.dataIndex;
            let count = 0;

            if (dataIndex === 0) count = chartData.level0.count;
            else if (dataIndex === 1) count = chartData.level1.count;
            else if (dataIndex === 2) count = chartData.level2.count;

            return `${label}: ${value}% (${count} records)`;
          },
        },
      },
    },
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
          <div className="h-80 flex items-center justify-center">
            <Pie ref={chartRef} data={pieChartData} options={chartOptions} />
          </div>
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
