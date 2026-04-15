"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const intersections = [
  {
    id: 1,
    name: "Simpangan Sarinah",
    status: "PADAT",
    statusColor: "bg-tertiary-container text-on-tertiary-container",
    waitTime: "78s",
    volume: "450 unit/jam",
  },
  {
    id: 2,
    name: "Bundaran HI",
    status: "LANCAR",
    statusColor: "bg-on-primary-container text-primary-fixed",
    waitTime: "32s",
    volume: "320 unit/jam",
  },
  {
    id: 3,
    name: "Slipi Jaya",
    status: "RAMAI",
    statusColor: "bg-yellow-100 text-yellow-800",
    waitTime: "55s",
    volume: "280 unit/jam",
  },
  {
    id: 4,
    name: "Kelapa Gading",
    status: "LANCAR",
    statusColor: "bg-on-primary-container text-primary-fixed",
    waitTime: "25s",
    volume: "150 unit/jam",
  },
];

export default function IntersectionGrid() {
  const router = useRouter();

  const handleClick = (id: number) => {
    router.push(`/persimpangan/${id}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {intersections.map((intersection, idx) => (
        <motion.div
          key={intersection.name}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          onClick={() => handleClick(intersection.id)}
          className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/15 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl">traffic</span>
              </div>
              <div>
                <h5 className="font-headline font-bold text-slate-900 group-hover:text-primary transition-colors">
                  {intersection.name}
                </h5>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 ${intersection.statusColor} text-[10px] font-bold rounded-full`}
                >
                  {intersection.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <span className="material-symbols-outlined text-lg">timer</span>
                Waktu Tunggu
              </span>
              <span className="text-sm font-bold text-slate-900">{intersection.waitTime}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <span className="material-symbols-outlined text-lg">directions_car</span>
                Volume
              </span>
              <span className="text-sm font-bold text-slate-900">{intersection.volume}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              Lihat Detail
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
