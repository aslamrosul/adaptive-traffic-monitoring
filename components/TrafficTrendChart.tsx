"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const chartData = [
  { time: "06:00", height: 24, vehicles: 240 },
  { time: "09:00", height: 32, vehicles: 320 },
  { time: "12:00", height: 48, vehicles: 480 },
  { time: "15:00", height: 56, vehicles: 560 },
  { time: "18:00", height: 40, vehicles: 400 },
  { time: "21:00", height: 32, vehicles: 320 },
  { time: "00:00", height: 16, vehicles: 160 },
];

export default function TrafficTrendChart() {
  const [period, setPeriod] = useState("today");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h4 className="text-lg font-headline font-bold text-slate-900">
            Tren Lalu Lintas Harian
          </h4>
          <p className="text-sm text-slate-500">
            Volume kendaraan per jam di 4 simpangan utama
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-600 focus:ring-primary cursor-pointer px-3 py-2"
        >
          <option value="today">Hari Ini</option>
          <option value="yesterday">Kemarin</option>
          <option value="week">7 Hari Terakhir</option>
        </select>
      </div>

      <div className="relative">
        {/* Tooltip */}
        {hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg z-10"
          >
            <div className="text-center">
              <p className="text-xs text-slate-300">{chartData[hoveredIndex].time}</p>
              <p className="text-lg">{chartData[hoveredIndex].vehicles} kendaraan</p>
            </div>
          </motion.div>
        )}

        <div className="relative h-64 w-full bg-slate-50/50 rounded-xl overflow-hidden flex items-end px-4 gap-2">
          {chartData.map((data, idx) => (
            <motion.div
              key={data.time}
              initial={{ height: 0 }}
              animate={{ height: `${data.height * 4}px` }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`w-full rounded-t-sm relative group cursor-pointer transition-all ${
                hoveredIndex === idx
                  ? "bg-gradient-to-t from-primary/50 to-primary/10"
                  : "bg-gradient-to-t from-primary/30 to-primary/0"
              }`}
            >
              <div
                className={`absolute -top-1 left-0 w-full h-[2px] transition-colors ${
                  hoveredIndex === idx ? "bg-primary" : "bg-primary/70"
                }`}
              ></div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          {chartData.map((data) => (
            <span key={data.time}>{data.time}</span>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-slate-500 font-semibold mb-1">Puncak</p>
          <p className="text-lg font-bold text-slate-900">560</p>
          <p className="text-[10px] text-slate-400">15:00</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 font-semibold mb-1">Rata-rata</p>
          <p className="text-lg font-bold text-slate-900">340</p>
          <p className="text-[10px] text-slate-400">kendaraan/jam</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 font-semibold mb-1">Terendah</p>
          <p className="text-lg font-bold text-slate-900">160</p>
          <p className="text-[10px] text-slate-400">00:00</p>
        </div>
      </div>
    </div>
  );
}
