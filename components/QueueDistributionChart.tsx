"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface QueueDistributionChartProps {
  data: Array<{
    level: 0 | 1 | 2;
    count: number;
    percentage: number;
  }>;
  isLoading?: boolean;
}

export default function QueueDistributionChart({
  data,
  isLoading = false,
}: QueueDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { level: 0, label: "Level 0 (Lancar)", count: 45, percentage: 45, color: "#10b981" },
        { level: 1, label: "Level 1 (Sedang)", count: 35, percentage: 35, color: "#f59e0b" },
        { level: 2, label: "Level 2 (Padat)", count: 20, percentage: 20, color: "#ef4444" },
      ];
    }
    return data.map((d) => ({
      ...d,
      label: `Level ${d.level} ${
        d.level === 0 ? "(Lancar)" : d.level === 1 ? "(Sedang)" : "(Padat)"
      }`,
      color:
        d.level === 0 ? "#10b981" : d.level === 1 ? "#f59e0b" : "#ef4444",
    }));
  }, [data]);

  const total = useMemo(
    () => chartData.reduce((sum, d) => sum + d.count, 0),
    [chartData]
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Memuat data distribusi antrian...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100"
    >
      <h3 className="text-sm lg:text-base font-bold font-headline text-on-surface mb-4">
        Distribusi Antrian
      </h3>
      <p className="text-[9px] lg:text-[10px] text-slate-500 mb-6">
        Persentase distribusi level antrian berdasarkan data sensor ultrasonic.
      </p>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8">
        {/* Pie Chart */}
        <div className="relative w-40 h-40 lg:w-48 lg:h-48 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {chartData.map((item, idx) => {
              const startAngle = chartData
                .slice(0, idx)
                .reduce((sum, d) => sum + (d.percentage / 100) * 360, 0);
              const endAngle = startAngle + (item.percentage / 100) * 360;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const x1 = 50 + 40 * Math.cos(startRad);
              const y1 = 50 + 40 * Math.sin(startRad);
              const x2 = 50 + 40 * Math.cos(endRad);
              const y2 = 50 + 40 * Math.sin(endRad);

              const largeArc = endAngle - startAngle > 180 ? 1 : 0;

              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
                `Z`,
              ].join(" ");

              return (
                <motion.path
                  key={`slice-${idx}`}
                  d={pathData}
                  fill={item.color}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl lg:text-2xl font-black font-headline text-on-surface">
              {total}
            </span>
            <span className="text-[9px] lg:text-[10px] text-slate-400 font-semibold">
              Total Data
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 lg:gap-4">
          {chartData.map((item, idx) => (
            <motion.div
              key={`legend-${idx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + idx * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-3 h-3 lg:w-4 lg:h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></div>
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-semibold text-on-surface">
                  {item.label}
                </p>
                <p className="text-[9px] lg:text-[10px] text-slate-500">
                  {item.count} ({item.percentage}%)
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
