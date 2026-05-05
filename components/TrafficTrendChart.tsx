"use client";

import { useDashboardWithFilter, type TimeRange, type DateRange } from "@/lib/hooks/useDashboardWithFilter";
import { motion } from "framer-motion";
import { useState } from "react";

interface TrafficTrendChartProps {
  timeRange: TimeRange;
  customDates?: DateRange;
}

export default function TrafficTrendChart({ timeRange, customDates }: TrafficTrendChartProps) {
  const { trafficTrend, isLoading, stats } = useDashboardWithFilter(timeRange, customDates);
  const [period, setPeriod] = useState("today");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate summary stats from trend data
  const peakData = trafficTrend.length > 0 
    ? trafficTrend.reduce((max, curr) => curr.vehicles > max.vehicles ? curr : max, trafficTrend[0])
    : { time: "00:00", vehicles: 0 };
  
  const lowestData = trafficTrend.length > 0
    ? trafficTrend.reduce((min, curr) => curr.vehicles < min.vehicles ? curr : min, trafficTrend[0])
    : { time: "00:00", vehicles: 0 };
  
  const avgVehicles = trafficTrend.length > 0
    ? Math.round(trafficTrend.reduce((sum, curr) => sum + curr.vehicles, 0) / trafficTrend.length)
    : 0;

  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
        <div className="h-64 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-2 lg:p-3 rounded-lg shadow-lg border border-blue-100 card-hover">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h4 className="text-xs lg:text-sm font-headline font-bold text-slate-900">
            Tren Lalu Lintas Harian
          </h4>
          <p className="text-[9px] lg:text-[10px] text-slate-500">
            Volume kendaraan per jam
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md text-[10px] font-bold text-slate-700 focus:ring-blue-500 cursor-pointer px-2 py-1 hover:from-blue-100 hover:to-indigo-100 transition-all"
        >
          <option value="today">Hari Ini</option>
          <option value="yesterday">Kemarin</option>
          <option value="week">7 Hari</option>
        </select>
      </div>

      <div className="relative">
        {/* Tooltip */}
        {hoveredIndex !== null && trafficTrend[hoveredIndex] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg z-10"
          >
            <div className="text-center">
              <p className="text-[9px] text-slate-300">{trafficTrend[hoveredIndex].time}</p>
              <p className="text-sm">{trafficTrend[hoveredIndex].vehicles}</p>
            </div>
          </motion.div>
        )}

        <div className="relative h-56 lg:h-64 w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg overflow-hidden flex items-end px-2 gap-1 border border-blue-100">
          {trafficTrend.length > 0 ? (
            trafficTrend.map((data, idx) => (
              <motion.div
                key={`${data.time}-${idx}`}
                initial={{ height: 0 }}
                animate={{ height: `${data.height * 2.4}px` }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`w-full rounded-t-sm relative group cursor-pointer transition-all ${
                  hoveredIndex === idx
                    ? "bg-gradient-to-t from-blue-600 to-blue-400"
                    : "bg-gradient-to-t from-blue-500 to-blue-300"
                }`}
              >
                <div
                  className={`absolute -top-1 left-0 w-full h-[2px] transition-colors ${
                    hoveredIndex === idx ? "bg-blue-700" : "bg-blue-600"
                  }`}
                ></div>
              </motion.div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              Tidak ada data tersedia
            </div>
          )}
        </div>

        <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          {trafficTrend.map((data, idx) => (
            <span key={`label-${idx}`}>{data.time}</span>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[9px] text-slate-500 font-semibold mb-0">Puncak</p>
          <p className="text-sm font-bold text-slate-900">{peakData.vehicles}</p>
          <p className="text-[8px] text-slate-400">{peakData.time}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-slate-500 font-semibold mb-0">Rata-rata</p>
          <p className="text-sm font-bold text-slate-900">{avgVehicles}</p>
          <p className="text-[8px] text-slate-400">per jam</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-slate-500 font-semibold mb-0">Terendah</p>
          <p className="text-sm font-bold text-slate-900">{lowestData.vehicles}</p>
          <p className="text-[8px] text-slate-400">{lowestData.time}</p>
        </div>
      </div>
    </div>
  );
}
