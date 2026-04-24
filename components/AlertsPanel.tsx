"use client";

import { useDashboard } from "@/lib/hooks/useDashboard";
import { useTrafficStore } from "@/lib/store";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AlertsPanel() {
  const router = useRouter();
  const { recentEvents, isLoading } = useDashboard();
  const { intersections, fetchIntersections } = useTrafficStore();

  useEffect(() => {
    if (intersections.length === 0) {
      fetchIntersections();
    }
  }, [intersections.length, fetchIntersections]);

  const liveCount = recentEvents.filter((e) => e.live).length;

  const getEventIcon = (type: string, priority: string) => {
    if (priority === 'critical') return 'warning';
    if (type === 'congestion') return 'traffic';
    if (type === 'accident') return 'car_crash';
    if (type === 'maintenance') return 'engineering';
    if (type === 'system') return 'info';
    return 'notifications';
  };

  const getEventIconStyle = (priority: string) => {
    if (priority === 'critical') return { bg: 'bg-red-100', color: 'text-red-700' };
    if (priority === 'high') return { bg: 'bg-orange-100', color: 'text-orange-700' };
    if (priority === 'medium') return { bg: 'bg-yellow-100', color: 'text-yellow-700' };
    return { bg: 'bg-blue-100', color: 'text-blue-700' };
  };

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const eventTime = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - eventTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} mnt`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari`;
  };

  const getIntersectionName = (intersectionId: string) => {
    const intersection = intersections.find(i => i.id === intersectionId);
    return intersection?.name || intersectionId;
  };

  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/15 overflow-hidden sticky top-24 animate-pulse">
        <div className="p-6 border-b border-slate-100">
          <div className="h-6 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/15 overflow-hidden sticky top-24">
      <header className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h4 className="font-headline font-bold text-slate-900">Peringatan Terbaru</h4>
        {liveCount > 0 && (
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded text-[10px] font-black"
          >
            {liveCount} LIVE
          </motion.span>
        )}
      </header>

      <div className="p-0">
        {recentEvents.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 inline-block">
              check_circle
            </span>
            <p className="text-sm text-slate-500">Tidak ada peringatan saat ini</p>
          </div>
        ) : (
          recentEvents.slice(0, 5).map((event, idx) => {
            const iconStyle = getEventIconStyle(event.priority);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 border-b border-slate-50 hover:bg-slate-50 transition-colors group cursor-pointer"
                onClick={() => router.push(`/persimpangan/${event.intersectionId}`)}
              >
                <div className="flex gap-4">
                  <div
                    className={`w-10 h-10 rounded-full ${iconStyle.bg} ${iconStyle.color} flex items-center justify-center shrink-0`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {getEventIcon(event.type, event.priority)}
                    </span>
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{event.title}</p>
                        {event.live && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-600 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                            LIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 ml-2">
                        {getTimeAgo(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {event.description || getIntersectionName(event.intersectionId)}
                    </p>
                    <div className="pt-2">
                      <button className="text-[10px] font-bold text-primary uppercase tracking-wider group-hover:underline">
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <footer className="p-4 bg-slate-50 text-center">
        <button
          onClick={() => router.push("/persimpangan")}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          Lihat Semua Riwayat
        </button>
      </footer>
    </div>
  );
}
