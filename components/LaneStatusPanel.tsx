"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import {
  formatWithTimezone,
  getTimezoneLabel,
} from "@/lib/user-settings";
import { useT, useLocale } from "@/lib/useT";

interface LaneData {
  name: string;
  direction: string;
  light: string;
  vehicleCount: number;
  queueLevel: number;
  queueLength: number;
  greenDuration: number;
}

interface LaneStatusPanelProps {
  intersectionId?: string;
}

export default function LaneStatusPanel({ intersectionId = "all" }: LaneStatusPanelProps) {
  const t = useT();
  const locale = useLocale();
  const { timezone } = useAppSettings();
  const [lanes, setLanes] = useState<LaneData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [intersectionName, setIntersectionName] = useState<string>(t('lanes.allIntersections'));
  const [laneCount, setLaneCount] = useState<number>(4);

  const hasLoadedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Fetch lane status
  const fetchLaneStatus = async (showRefreshIndicator = false) => {
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
      // Fetch intersection details if specific intersection selected
      if (intersectionId !== "all") {
        const intRes = await fetch(`/api/intersections/${intersectionId}`);
        const intData = await intRes.json();
        
        if (intData.success) {
          setIntersectionName(intData.data.name);
          setLaneCount(intData.data.lanes?.count || 4);
        }
      } else {
        setIntersectionName(t('lanes.allIntersections'));
        setLaneCount(4); // Default 4 lanes for "all"
      }

      // Fetch latest traffic data
      const trafficRes = await fetch(`/api/traffic/latest?intersectionId=${intersectionId}&limit=1`);
      const trafficData = await trafficRes.json();

      if (trafficData.success && trafficData.data.length > 0) {
        const latestData = trafficData.data[0];
        
        // Map lanes based on available data
        const laneDirections = ['north', 'south', 'east', 'west'];

        const lanesData: LaneData[] = laneDirections.slice(0, laneCount).map(direction => {
          const laneData = latestData[direction] || {};
          
          return {
            name: t(`traffic.${direction}`),
            direction,
            light: laneData.light || 'red',
            vehicleCount: laneData.vehicleCount || 0,
            queueLevel: laneData.queueLevel || 0,
            queueLength: laneData.queueLength || 0,
            greenDuration: laneData.greenDuration || 0,
          };
        });

        setLanes(lanesData);
      } else {
        // No data, show empty lanes
        const laneDirections = ['north', 'south', 'east', 'west'];

        const emptyLanes: LaneData[] = laneDirections.slice(0, laneCount).map(direction => ({
          name: t(`traffic.${direction}`),
          direction,
          light: 'unknown',
          vehicleCount: 0,
          queueLevel: 0,
          queueLength: 0,
          greenDuration: 0,
        }));

        setLanes(emptyLanes);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching lane status:', error);
    } finally {
      hasLoadedRef.current = true;
      isFetchingRef.current = false;
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchLaneStatus(false);

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      void fetchLaneStatus(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [intersectionId]);

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-emerald-100 text-emerald-700';
      case 1:
        return 'bg-yellow-100 text-yellow-700';
      case 2:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getLevelText = (level: number) => {
    switch (level) {
      case 0:
        return t('lanes.smooth');
      case 1:
        return t('lanes.moderate');
      case 2:
        return t('lanes.congested');
      default:
        return 'Unknown';
    }
  };

  const getLightColor = (light: string) => {
    switch (light.toLowerCase()) {
      case 'red':
        return 'text-red-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'green':
        return 'text-green-600';
      default:
        return 'text-slate-400';
    }
  };

  const getLightIcon = (light: string) => {
    switch (light.toLowerCase()) {
      case 'red':
        return '🔴';
      case 'yellow':
        return '🟡';
      case 'green':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl lg:text-3xl">
                traffic
              </span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-white text-base lg:text-lg">
                {t('lanes.title')}
              </h3>
              <p className="text-xs lg:text-sm text-white/80 mt-0.5">
                {intersectionName}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: isRefreshing ? 1 : 1.05, rotate: isRefreshing ? 0 : 180 }}
            whileTap={{ scale: isRefreshing ? 1 : 0.95 }}
            onClick={() => void fetchLaneStatus(true)}
            disabled={isRefreshing}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            title="Refresh"
          >
            <span
              className={[
                "material-symbols-outlined text-white text-xl",
                isRefreshing ? "animate-spin" : "",
              ].join(" ")}
            >
              refresh
            </span>
          </motion.button>
        </div>

        {/* Update Info */}
        <div className="flex items-center gap-2 mt-3 text-xs text-white/70">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>{t('lanes.autoRefresh')}</span>
          <span>•</span>
          <span>{t('lanes.lastUpdate')}: {formatWithTimezone(lastUpdate.toISOString(), timezone)} {getTimezoneLabel(timezone)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 lg:p-6">
        {isInitialLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].slice(0, laneCount).map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : lanes.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-slate-300 text-5xl mb-3">
              traffic
            </span>
            <p className="text-slate-500 font-semibold">{t('lanes.noLaneData')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('lanes.selectIntersectionToView')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lanes.map((lane, idx) => (
              <motion.div
                key={lane.direction}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200 hover:border-blue-300 transition-all"
              >
                {/* Lane Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm lg:text-base">
                      {t('lanes.lane')} {lane.name}
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getLightColor(lane.light)}`}>
                      {getLightIcon(lane.light)} {lane.light.toUpperCase()}
                    </span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${getLevelColor(lane.queueLevel)}`}>
                    LEVEL {lane.queueLevel} • {getLevelText(lane.queueLevel)}
                  </div>
                </div>

                {/* Lane Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-blue-600 text-base">
                        schedule
                      </span>
                      <p className="text-xs text-slate-500 font-semibold">{t('lanes.greenLight')}</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {lane.greenDuration}s
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-orange-600 text-base">
                        directions_car
                      </span>
                      <p className="text-xs text-slate-500 font-semibold">{t('lanes.vehicles')}</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {lane.vehicleCount}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-purple-600 text-base">
                        straighten
                      </span>
                      <p className="text-xs text-slate-500 font-semibold">{t('lanes.queueDistance')}</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {lane.queueLength}cm
                    </p>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                  <span className="material-symbols-outlined text-xs">update</span>
                  <span>{formatWithTimezone(lastUpdate.toISOString(), timezone)} {getTimezoneLabel(timezone)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
