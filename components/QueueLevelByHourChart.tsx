"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface QueueLevelByHourChartProps {
  data: Array<{
    hour: number;
    time: string;
    level0: number;
    level1: number;
    level2: number;
  }>;
  isLoading?: boolean;
}

export default function QueueLevelByHourChart({
  data,
  isLoading = false,
}: QueueLevelByHourChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { hour: 0, time: "00:00", level0: 80, level1: 15, level2: 5 },
        { hour: 2, time: "02:00", level0: 85, level1: 10, level2: 5 },
        { hour: 4, time: "04:00", level0: 90, level1: 8, level2: 2 },
        { hour: 6, time: "06:00", level0: 60, level1: 30, level2: 10 },
        { hour: 8, time: "08:00", level0: 20, level1: 40, level2: 40 },
        { hour: 10, time: "10:00", level0: 15, level1: 35, level2: 50 },
        { hour: 12, time: "12:00", level0: 40, level1: 40, level2: 20 },
        { hour: 14, time: "14:00", level0: 50, level1: 35, level2: 15 },
        { hour: 16, time: "16:00", level0: 25, level1: 35, level2: 40 },
        { hour: 18, time: "18:00", level0: 30, level1: 40, level2: 30 },
        { hour: 20, time: "20:00", level0: 70, level1: 20, level2: 10 },
        { hour: 22, time: "22:00", level0: 75, level1: 18, level2: 7 },
      ];
    }
    return data;
  }, [data]);

  const maxValue = useMemo(
    () =>
      Math.max(
        ...chartData.map((d) => Math.max(d.level0, d.level1, d.level2))
      ),
    [chartData]
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Memuat data level antrian per jam...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-lg p-4 lg:p-6 shadow-lg border border-slate-100"
    >
      <h3 className="text-sm lg:text-base font-bold font-headline text-on-surface mb-4">
        Level Antrian Per Jam
      </h3>
      <p className="text-[9px] lg:text-[10px] text-slate-500 mb-6">
        Tren level antrian sepanjang hari berdasarkan sensor ultrasonic.
      </p>

      <div className="h-64 lg:h-80 flex items-end justify-between gap-1 lg:gap-2 px-2 lg:px-4">
        {chartData.map((item, idx) => {
          const level0Height = (item.level0 / maxValue) * 100;
          const level1Height = (item.level1 / maxValue) * 100;
          const level2Height = (item.level2 / maxValue) * 100;

          return (
            <motion.div
              key={`bar-${idx}`}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.25 + idx * 0.05 }}
              className="flex-1 flex flex-col items-center h-full"
              style={{ transformOrigin: "bottom" }}
            >
              <div className="flex-1 w-full flex items-end justify-center gap-0.5 lg:gap-1">
                {/* Level 0 - Green */}
                {item.level0 > 0 && (
                  <motion.div
                    className="bg-green-500 rounded-t-sm lg:rounded-t-md hover:brightness-110 transition-all cursor-pointer flex-1"
                    style={{ height: `${level0Height}%` }}
                    title={`Level 0: ${item.level0}%`}
                    whileHover={{ scale: 1.05 }}
                  />
                )}

                {/* Level 1 - Yellow */}
                {item.level1 > 0 && (
                  <motion.div
                    className="bg-yellow-500 rounded-t-sm lg:rounded-t-md hover:brightness-110 transition-all cursor-pointer flex-1"
                    style={{ height: `${level1Height}%` }}
                    title={`Level 1: ${item.level1}%`}
                    whileHover={{ scale: 1.05 }}
                  />
                )}

                {/* Level 2 - Red */}
                {item.level2 > 0 && (
                  <motion.div
                    className="bg-red-500 rounded-t-sm lg:rounded-t-md hover:brightness-110 transition-all cursor-pointer flex-1"
                    style={{ height: `${level2Height}%` }}
                    title={`Level 2: ${item.level2}%`}
                    whileHover={{ scale: 1.05 }}
                  />
                )}
              </div>

              <span className="text-[8px] lg:text-[9px] font-bold text-slate-400 mt-2 lg:mt-3">
                {item.time}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-green-500"></div>
          <span className="text-[9px] lg:text-[10px] font-semibold text-slate-600">
            Level 0 (Lancar)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-yellow-500"></div>
          <span className="text-[9px] lg:text-[10px] font-semibold text-slate-600">
            Level 1 (Sedang)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-red-500"></div>
          <span className="text-[9px] lg:text-[10px] font-semibold text-slate-600">
            Level 2 (Padat)
          </span>
        </div>
      </div>
    </motion.div>
  );
}
