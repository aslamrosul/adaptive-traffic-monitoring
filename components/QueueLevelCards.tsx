"use client";

import { formatWib } from "@/lib/timezone";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/providers/TranslationProvider";

interface LaneData {
  lane: string;
  queueLevel: 0 | 1 | 2;
  queueLength: number;
  greenDuration: number;
  vehicleCount: number;
  light: 'red' | 'yellow' | 'green';
  timestamp: string;
}

interface QueueLevelBadge {
  color: string;
  bgColor: string;
  text: string;
  icon: string;
}

function getQueueLevelBadge(level: number, t: any): QueueLevelBadge {
  switch (level) {
    case 0:
      return {
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-100',
        text: t('traffic.smooth'),
        icon: '🟢'
      };
    case 1:
      return {
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
        text: t('traffic.moderate'),
        icon: '🟡'
      };
    case 2:
      return {
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        text: t('traffic.congested'),
        icon: '🔴'
      };
    default:
      return {
        color: 'text-slate-700',
        bgColor: 'bg-slate-100',
        text: 'Unknown',
        icon: '⚪'
      };
  }
}

function getLaneName(lane: string, t: any): string {
  const laneMap: Record<string, string> = {
    'north': t('traffic.north'),
    'south': t('traffic.south'),
    'east': t('traffic.east'),
    'west': t('traffic.west'),
  };
  return laneMap[lane.toLowerCase()] || lane;
}

function getLightColor(light: string, t: any): { bg: string; text: string } {
  switch (light) {
    case 'red':
      return { bg: 'bg-red-500', text: t('traffic.redLight') };
    case 'yellow':
      return { bg: 'bg-yellow-500', text: t('traffic.yellowLight') };
    case 'green':
      return { bg: 'bg-green-500', text: t('traffic.greenLight') };
    default:
      return { bg: 'bg-slate-500', text: 'Off' };
  }
}

export default function QueueLevelCards() {
  const { t } = useTranslation();
  const [laneData, setLaneData] = useState<LaneData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const hasLoadedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const fetchQueueData = async (showRefreshIndicator = false) => {
    // Mencegah request bertumpuk
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    // Skeleton hanya ketika load pertama
    if (!hasLoadedRef.current) {
      setIsInitialLoading(true);
    } else if (showRefreshIndicator) {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch('/api/traffic/realtime?limit=100');
      const result = await response.json();

      if (result.success && result.data) {
        // Group by lane and get latest data for each
        const laneMap = new Map<string, any>();
        
        result.data.forEach((item: any) => {
          const lane = item.lane?.toLowerCase() || 'unknown';
          const existing = laneMap.get(lane);
          
          // Keep the most recent data for each lane
          if (!existing || new Date(item.timestamp) > new Date(existing.timestamp)) {
            laneMap.set(lane, item);
          }
        });

        // Convert to array and calculate queue level if not provided
        const lanes: LaneData[] = Array.from(laneMap.values()).map((item: any) => {
          // Calculate queue level from queueLength if not provided
          let queueLevel: 0 | 1 | 2 = item.queueLevel ?? 0;
          
          if (item.queueLength !== undefined && item.queueLevel === undefined) {
            if (item.queueLength > 20) {
              queueLevel = 0; // Lancar
            } else if (item.queueLength >= 10 && item.queueLength <= 20) {
              queueLevel = 1; // Sedang
            } else {
              queueLevel = 2; // Padat
            }
          }

          return {
            lane: item.lane || 'unknown',
            queueLevel,
            queueLength: item.queueLength || 0,
            greenDuration: item.greenDuration || 0,
            vehicleCount: item.vehicleCount || 0,
            light: item.light || 'red',
            timestamp: item.timestamp,
          };
        });

        // Sort by lane order: north, south, east, west
        const laneOrder = ['north', 'south', 'east', 'west'];
        lanes.sort((a, b) => {
          const aIndex = laneOrder.indexOf(a.lane.toLowerCase());
          const bIndex = laneOrder.indexOf(b.lane.toLowerCase());
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });

        setLaneData(lanes);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching queue data:', error);
    } finally {
      hasLoadedRef.current = true;
      isFetchingRef.current = false;
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchQueueData(false);

    // Auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(() => {
      void fetchQueueData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isInitialLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-headline font-bold text-slate-900">
            Status Antrian Per Jalur
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 rounded-xl animate-pulse border border-slate-200">
              <div className="h-4 bg-slate-200 rounded w-20 mb-3"></div>
              <div className="h-6 bg-slate-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (laneData.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-headline font-bold text-slate-900">
            Status Antrian Per Jalur
          </h3>
        </div>
        <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 inline-block">
            traffic
          </span>
          <p className="text-slate-500 text-sm">Belum ada data antrian</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-headline font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">traffic</span>
            Status Antrian Per Jalur
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Update otomatis setiap 5 detik • 
            {lastUpdated && (
              <span className="ml-1">
                Terakhir: {lastUpdated.toLocaleTimeString('id-ID', { timeZone: "Asia/Jakarta" })} WIB
              </span>
            )}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: isRefreshing ? 1 : 1.05 }}
          whileTap={{ scale: isRefreshing ? 1 : 0.95 }}
          onClick={() => void fetchQueueData(true)}
          disabled={isRefreshing}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          title="Refresh data"
        >
          <span
            className={[
              "material-symbols-outlined text-slate-600",
              isRefreshing ? "animate-spin" : "",
            ].join(" ")}
          >
            refresh
          </span>
        </motion.button>
      </div>

      {/* Lane Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {laneData.map((lane, idx) => {
          const badge = getQueueLevelBadge(lane.queueLevel, t);
          const lightColor = getLightColor(lane.light, t);

          return (
            <motion.div
              key={lane.lane}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all"
            >
              {/* Lane Name & Light Status */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 text-sm lg:text-base">
                  {t('traffic.lane')} {getLaneName(lane.lane, t)}
                </h4>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${lightColor.bg} animate-pulse`}></div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {lightColor.text}
                  </span>
                </div>
              </div>

              {/* Queue Level Badge */}
              <div className={`${badge.bgColor} ${badge.color} rounded-lg p-2.5 mb-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{badge.icon}</span>
                  <div>
                    <p className="text-[10px] font-semibold opacity-70 uppercase tracking-wide">
                      Level {lane.queueLevel}
                    </p>
                    <p className="text-sm font-bold leading-none">
                      {badge.text}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                {/* Green Duration */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    Lampu hijau
                  </span>
                  <span className="font-bold text-slate-900">
                    {lane.greenDuration}s
                  </span>
                </div>

                {/* Vehicle Count */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">directions_car</span>
                    Kendaraan
                  </span>
                  <span className="font-bold text-slate-900">
                    {lane.vehicleCount}
                  </span>
                </div>

                {/* Queue Length */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">straighten</span>
                    Jarak antrian
                  </span>
                  <span className="font-bold text-slate-900">
                    {lane.queueLength}cm
                  </span>
                </div>
              </div>

              {/* Timestamp */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">update</span>
                  {formatWib(lane.timestamp)} WIB
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <p className="text-xs font-semibold text-slate-600 mb-2">Keterangan Queue Level:</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span>🟢</span>
            <span className="text-slate-600">
              <span className="font-bold">Level 0:</span> {'>'}20cm (7s)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🟡</span>
            <span className="text-slate-600">
              <span className="font-bold">Level 1:</span> 10-20cm (10s)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🔴</span>
            <span className="text-slate-600">
              <span className="font-bold">Level 2:</span> {'<'}10cm (15s)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
