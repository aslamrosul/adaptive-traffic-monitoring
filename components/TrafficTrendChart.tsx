"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const chartData = [
  { time: "06:00", height: 24 },
  { time: "09:00", height: 32 },
  { time: "12:00", height: 48 },
  { time: "15:00", height: 56 },
  { time: "18:00", height: 40 },
  { time: "21:00", height: 32 },
  { time: "00:00", height: 16 },
];

export default function TrafficTrendChart() {
  const [period, setPeriod] = useState("today");

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
          className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-600 focus:ring-primary cursor-pointer"
        >
          <option value="today">Hari Ini</option>
          <option value="yesterday">Kemarin</option>
          <option value="week">7 Hari Terakhir</option>
        </select>
      </div>

      <div className="relative h-64 w-full bg-slate-50/50 rounded-xl overflow-hidden flex items-end px-4 gap-2">
        {chartData.map((data, idx) => (
          <motion.div
            key={data.time}
            initial={{ height: 0 }}
            animate={{ height: `${data.height * 4}px` }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            className="w-full bg-gradient-to-t from-primary/30 to-primary/0 rounded-t-sm relative group cursor-pointer hover:from-primary/40"
          >
            <div className="absolute -top-1 left-0 w-full h-[2px] bg-primary"></div>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {Math.round(data.height * 10)} kendaraan
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
        {chartData.map((data) => (
          <span key={data.time}>{data.time}</span>
        ))}
      </div>
    </div>
  );
}
