"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface GreenDurationChartProps {
  data: Array<{
    queueLevel: 0 | 1 | 2;
    avgDuration: number;
    count: number;
  }>;
  isLoading?: boolean;
}

export default function GreenDurationChart({
  data,
  isLoading = false,
}: GreenDurationChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { queueLevel: 0, label: "Level 0", avgDuration: 7, count: 450, color: "#10b981" },
        { queueLevel: 1, label: "Level 1", avgDuration: 10, count: 350, color: "#f59e0b" },
        { queueLevel: 2, label: "Level 2", avgDuration: 15, count: 200, color: "#ef4444" },
      ];
    }
    return data.map((d) => ({
      ...d,
      label: `Level ${d.queueLevel}`,
      color:
        d.queueLevel === 0 ? "#10b981" : d.queueLevel === 1 ? "#f59e0b" : "#ef4444",
    }));
  }, [data]);

  const maxDuration = useMemo(
    () => Math.max(...chartData.map((d) => d.avgDuration)),
    [chartData]
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Memuat data durasi lampu hijau...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100"
    >
      <h3 className="text-sm lg:text-base font-bold font-headline text-on-surface mb-4">
        Durasi Lampu Hijau vs Level Antrian
      </h3>
      <p className="text-[9px] lg:text-[10px] text-slate-500 mb-6">
        Korelasi antara level antrian dan durasi lampu hijau yang diterapkan.
      </p>

      <div className="h-64 lg:h-80 flex items-end justify-center gap-6 lg:gap-12 px-4 lg:px-8">
        {chartData.map((item, idx) => {
          const barHeight = (item.avgDuration / maxDuration) * 100;

          return (
            <motion.div
              key={`bar-${idx}`}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="flex flex-col items-center gap-3 lg:gap-4"
              style={{ transformOrigin: "bottom" }}
            >
              {/* Bar */}
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  className="rounded-t-lg hover:brightness-110 transition-all cursor-pointer"
                  style={{
                    backgroundColor: item.color,
                    width: "60px",
                    height: `${barHeight * 2}px`,
                    minHeight: "40px",
                  }}
                  whileHover={{ scale: 1.05 }}
                  title={`${item.label}: ${item.avgDuration}s`}
                />

                {/* Duration Label */}
                <div className="text-center">
                  <p className="text-lg lg:text-xl font-black font-headline text-on-surface">
                    {item.avgDuration}s
                  </p>
                  <p className="text-[9px] lg:text-[10px] text-slate-500 font-semibold">
                    Durasi Rata-rata
                  </p>
                </div>
              </div>

              {/* Queue Level Label */}
              <div className="text-center">
                <p className="text-xs lg:text-sm font-bold text-on-surface">
                  {item.label}
                </p>
                <p className="text-[8px] lg:text-[9px] text-slate-500">
                  {item.count} data
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-6 lg:mt-8 p-3 lg:p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-[9px] lg:text-[10px] text-slate-600 leading-relaxed">
          <span className="font-bold">Mapping Durasi Lampu Hijau:</span> Level 0 (Lancar) = 7 detik,
          Level 1 (Sedang) = 10 detik, Level 2 (Padat) = 15 detik. Sistem adaptif menyesuaikan
          durasi berdasarkan kondisi antrian real-time.
        </p>
      </div>
    </motion.div>
  );
}
