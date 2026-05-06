"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTrafficStore } from "@/lib/store";

export default function IntersectionGrid() {
  const router = useRouter();
  const { intersections, fetchIntersections, isLoading, isInitialLoad } = useTrafficStore();

  useEffect(() => {
    if (intersections.length === 0) {
      fetchIntersections();
    }
  }, [intersections.length, fetchIntersections]);

  const handleClick = (id: string) => {
    router.push(`/persimpangan/${id}`);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('padat') || statusLower.includes('macet') || statusLower.includes('critical')) {
      return "bg-red-100 text-red-800";
    } else if (statusLower.includes('ramai') || statusLower.includes('sedang') || statusLower.includes('medium')) {
      return "bg-yellow-100 text-yellow-800";
    } else if (statusLower.includes('lancar') || statusLower.includes('active')) {
      return "bg-green-100 text-green-800";
    }
    return "bg-slate-100 text-slate-800";
  };

  const getStatusLabel = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('active')) return 'AKTIF';
    if (statusLower.includes('inactive')) return 'NONAKTIF';
    return status?.toUpperCase() || 'AKTIF';
  };

  if (isInitialLoad && intersections.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                <div>
                  <div className="h-5 w-32 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 w-16 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-12 bg-slate-100 rounded-lg"></div>
              <div className="h-12 bg-slate-100 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show first 4 intersections for dashboard
  const displayIntersections = intersections.slice(0, 4);

  if (displayIntersections.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 inline-block">
          traffic
        </span>
        <p className="text-slate-500">Belum ada data simpangan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayIntersections.map((intersection, idx) => (
          <motion.div
            key={intersection.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => handleClick(intersection.id)}
            className="bg-surface-container-lowest p-3 rounded-lg shadow-sm border border-outline-variant/15 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary text-lg">traffic</span>
                </div>
                <div>
                  <h5 className="font-headline font-bold text-slate-900 group-hover:text-primary transition-colors text-xs">
                    {intersection.name}
                  </h5>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 ${getStatusColor(intersection.status)} text-[10px] font-bold rounded-full`}
                  >
                    {getStatusLabel(intersection.status)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-md">
                <span className="flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  Lokasi
                </span>
                <span className="text-[10px] font-bold text-slate-900 truncate max-w-[120px]">
                  {intersection.address || 'Jakarta'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-md">
                <span className="flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                  <span className="material-symbols-outlined text-xs">sensors</span>
                  Device ID
                </span>
                <span className="text-[10px] font-bold text-slate-900 font-mono">
                  {intersection.deviceId || 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] font-bold text-primary flex items-center gap-0.5">
                Lihat Detail
                <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* View All Button */}
      {intersections.length > 4 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => router.push('/persimpangan')}
          className="w-full py-3 bg-white border-2 border-primary/20 rounded-lg text-primary font-bold text-sm hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2 group"
        >
          <span>Lihat Semua Persimpangan</span>
          <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </motion.button>
      )}
    </div>
  );
}
