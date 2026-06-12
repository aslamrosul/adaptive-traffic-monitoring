import { useCallback, useEffect, useState } from "react";

export type TimeRange =
  | "today"
  | "yesterday"
  | "7days"
  | "30days"
  | "custom";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DashboardStats {
  totalVehicles: number;
  totalVehiclesToday: number;
  activeDevices: number;
  totalDevices: number;
  avgWaitTime: number;
  flowScore: string;
  iotPercentage: number;
  changeVsYesterday: number;
  changeWaitTime: number;
}

export interface TrafficTrendData {
  time: string;
  vehicles: number;
  hour: number;
  height: number;
}

export interface DashboardEvent {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  timestamp: string;
  intersectionId: string;
  status: string;
  live?: boolean;
}

const APP_TIMEZONE = "Asia/Jakarta";
const ACTIVE_LANES = ["north", "south", "east"] as const;

function getWibDateValue(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDaysToDateValue(dateValue: string, days: number): string {
  const date = new Date(`${dateValue}T12:00:00.000+07:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getWibHour(timestamp?: string): number {
  if (!timestamp) return 0;

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return 0;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(
    parts.find((part) => part.type === "hour")?.value ?? 0,
  );

  return hour === 24 ? 0 : hour;
}

function getTimestampMs(item: any): number {
  const timestamp =
    item.timestamp || item.processedAt || item.received_at_utc || 0;

  const time = new Date(timestamp).getTime();

  return Number.isFinite(time) ? time : 0;
}

function getTrafficDateMsRange(startDate: string, endDate: string) {
  return {
    startMs: new Date(`${startDate}T00:00:00.000+07:00`).getTime(),
    endMs: new Date(`${endDate}T23:59:59.999+07:00`).getTime(),
  };
}

function getLatestSnapshots(items: any[]) {
  const sorted = [...items].sort(
    (a, b) => getTimestampMs(b) - getTimestampMs(a),
  );

  const map = new Map<string, any>();

  for (const item of sorted) {
    const key =
      item.intersectionId ||
      item.intersection_id ||
      item.deviceId ||
      item.device_id ||
      item.device ||
      item.id;

    if (key && !map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

function calculateVehicleTotalFromLatest(items: any[]) {
  return items.reduce((sum, item) => {
    return sum + Number(item.vehicleCount || 0);
  }, 0);
}

function calculateAverageGreenDuration(items: any[]) {
  const values: number[] = [];

  for (const item of items) {
    for (const lane of ACTIVE_LANES) {
      const value = Number(item?.[lane]?.greenDuration || 0);

      if (value > 0) {
        values.push(value);
      }
    }
  }

  if (values.length === 0) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateCongestionIndex(items: any[]) {
  const values: number[] = [];

  for (const item of items) {
    for (const lane of ACTIVE_LANES) {
      values.push(Number(item?.[lane]?.queueLevel || 0));
    }
  }

  if (values.length === 0) return 0;

  const avgQueueLevel =
    values.reduce((sum, value) => sum + value, 0) / values.length;

  return Math.round((avgQueueLevel / 2) * 100);
}

function calculateFlowScore(iotPercentage: number, congestionIndex: number) {
  if (iotPercentage <= 0) return "-";
  if (congestionIndex <= 20) return "A";
  if (congestionIndex <= 40) return "B";
  if (congestionIndex <= 60) return "C";
  if (congestionIndex <= 80) return "D";
  return "E";
}

function getRangeByFilter(
  timeRange: TimeRange,
  customDates?: DateRange,
) {
  const today = getWibDateValue();

  if (
    timeRange === "custom" &&
    customDates?.startDate &&
    customDates?.endDate
  ) {
    return {
      start: customDates.startDate,
      end: customDates.endDate,
    };
  }

  if (timeRange === "yesterday") {
    const yesterday = addDaysToDateValue(today, -1);

    return {
      start: yesterday,
      end: yesterday,
    };
  }

  if (timeRange === "7days") {
    return {
      start: addDaysToDateValue(today, -7),
      end: today,
    };
  }

  if (timeRange === "30days") {
    return {
      start: addDaysToDateValue(today, -30),
      end: today,
    };
  }

  return {
    start: today,
    end: today,
  };
}

function getPreviousRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00.000+07:00`);
  const end = new Date(`${endDate}T12:00:00.000+07:00`);

  const diffDays =
    Math.max(
      1,
      Math.round(
        (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
      ) + 1,
    );

  const previousEnd = addDaysToDateValue(startDate, -1);
  const previousStart = addDaysToDateValue(previousEnd, -(diffDays - 1));

  return {
    start: previousStart,
    end: previousEnd,
  };
}

function filterTrafficByWibRange(
  items: any[],
  startDate: string,
  endDate: string,
) {
  const { startMs, endMs } = getTrafficDateMsRange(startDate, endDate);

  return items.filter((item) => {
    const time = getTimestampMs(item);
    return time >= startMs && time <= endMs;
  });
}

function buildTrafficTrend(
  traffic: any[],
  timeRange: TimeRange,
): TrafficTrendData[] {
  const hourlyData: Record<number, { count: number; total: number }> = {};

  for (let hour = 0; hour < 24; hour++) {
    hourlyData[hour] = {
      count: 0,
      total: 0,
    };
  }

  for (const item of traffic) {
    const hour = getWibHour(
      item.timestamp || item.processedAt || item.received_at_utc,
    );

    hourlyData[hour].count++;
    hourlyData[hour].total += Number(item.vehicleCount || 0);
  }

  const trendData: TrafficTrendData[] = [];
  const hoursToShow =
    timeRange === "today" ? 7 : timeRange === "yesterday" ? 24 : 24;

  const currentHour = getWibHour(new Date().toISOString());

  for (let i = hoursToShow - 1; i >= 0; i--) {
    const hour =
      timeRange === "today" ? (currentHour - i + 24) % 24 : 23 - i;

    const avgVehicles =
      hourlyData[hour].count > 0
        ? Math.round(hourlyData[hour].total / hourlyData[hour].count)
        : 0;

    trendData.push({
      time: `${String(hour).padStart(2, "0")}:00`,
      vehicles: avgVehicles,
      hour,
      height: 0,
    });
  }

  const maxVehicles = Math.max(
    ...trendData.map((item) => item.vehicles),
    1,
  );

  return trendData.map((item) => ({
    ...item,
    height: Math.round((item.vehicles / maxVehicles) * 100),
  }));
}

export function useDashboardWithFilter(
  timeRange: TimeRange = "today",
  customDates?: DateRange,
  intersectionId: string = "all",
) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trafficTrend, setTrafficTrend] = useState<TrafficTrendData[]>([]);
  const [recentEvents, setRecentEvents] = useState<DashboardEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const safeFetchJson = useCallback(async (url: string) => {
    try {
      const response = await fetch(url, {
        cache: "no-store",
      });

      const json = await response.json().catch(() => ({
        success: false,
        data: [],
      }));

      if (!response.ok || json.success === false) {
        return {
          success: false,
          data: [],
          error: json.error || response.statusText,
        };
      }

      return json;
    } catch (fetchError: any) {
      return {
        success: false,
        data: [],
        error: fetchError.message || "Request failed",
      };
    }
  }, []);

  const fetchDashboardData = useCallback(
    async (isBackgroundRefresh = false) => {
      if (!isBackgroundRefresh) {
        setIsLoading(true);
      }

      setError(null);

      try {
        const dateRange = getRangeByFilter(timeRange, customDates);
        const previousRange = getPreviousRange(
          dateRange.start,
          dateRange.end,
        );

        const intersectionQuery =
          intersectionId && intersectionId !== "all"
            ? `&intersectionId=${encodeURIComponent(intersectionId)}`
            : "";

        const [
          intersectionsData,
          trafficData,
          analyticsData,
          previousAnalyticsData,
        ] = await Promise.all([
          safeFetchJson("/api/intersections"),

          safeFetchJson(
            `/api/traffic/realtime?limit=500&startDate=${dateRange.start}&endDate=${dateRange.end}${intersectionQuery}`,
          ),

          safeFetchJson(
            `/api/analytics/daily?limit=90&startDate=${dateRange.start}&endDate=${dateRange.end}${intersectionQuery}`,
          ),

          safeFetchJson(
            `/api/analytics/daily?limit=90&startDate=${previousRange.start}&endDate=${previousRange.end}${intersectionQuery}`,
          ),
        ]);

        const intersections = intersectionsData.success
          ? intersectionsData.data || []
          : [];

        const rawTraffic = trafficData.success ? trafficData.data || [] : [];

        const analytics = analyticsData.success
          ? analyticsData.data || []
          : [];

        const previousAnalytics = previousAnalyticsData.success
          ? previousAnalyticsData.data || []
          : [];

        const traffic = filterTrafficByWibRange(
          rawTraffic,
          dateRange.start,
          dateRange.end,
        );

        const latestSnapshots = getLatestSnapshots(traffic);

        const scopedIntersections =
          intersectionId && intersectionId !== "all"
            ? intersections.filter(
                (item: any) =>
                  item.id === intersectionId ||
                  item.intersection_id === intersectionId ||
                  item.intersectionId === intersectionId,
              )
            : intersections;

        const activeDevices = scopedIntersections.filter(
          (item: any) =>
            String(item.status || "active").toLowerCase() === "active",
        ).length;

        const totalDevices = scopedIntersections.length;

        const iotPercentage =
          totalDevices > 0 ? (activeDevices / totalDevices) * 100 : 0;

        const periodAnalytics = analytics.filter(
          (item: any) =>
            item.date >= dateRange.start && item.date <= dateRange.end,
        );

        const previousPeriodAnalytics = previousAnalytics.filter(
          (item: any) =>
            item.date >= previousRange.start &&
            item.date <= previousRange.end,
        );

        const realtimeVehicleTotal =
          calculateVehicleTotalFromLatest(latestSnapshots);

        const analyticsVehicleTotal = periodAnalytics.reduce(
          (sum: number, item: any) =>
            sum + Number(item.summary?.totalVehicles || 0),
          0,
        );

        const previousVehicleTotal = previousPeriodAnalytics.reduce(
          (sum: number, item: any) =>
            sum + Number(item.summary?.totalVehicles || 0),
          0,
        );

        const totalVehicles =
          realtimeVehicleTotal > 0
            ? realtimeVehicleTotal
            : analyticsVehicleTotal;

        const totalVehiclesToday = totalVehicles;

        const changeVsYesterday =
          previousVehicleTotal > 0
            ? ((totalVehiclesToday - previousVehicleTotal) /
                previousVehicleTotal) *
              100
            : 0;

        const analyticsAvgWaitTime =
          periodAnalytics.length > 0
            ? periodAnalytics.reduce(
                (sum: number, item: any) =>
                  sum + Number(item.summary?.averageWaitTime || 0),
                0,
              ) / periodAnalytics.length
            : 0;

        const previousAvgWaitTime =
          previousPeriodAnalytics.length > 0
            ? previousPeriodAnalytics.reduce(
                (sum: number, item: any) =>
                  sum + Number(item.summary?.averageWaitTime || 0),
                0,
              ) / previousPeriodAnalytics.length
            : 0;

        const realtimeAvgWaitTime =
          calculateAverageGreenDuration(latestSnapshots);

        const avgWaitTime =
          realtimeAvgWaitTime > 0
            ? realtimeAvgWaitTime
            : analyticsAvgWaitTime;

        const changeWaitTime =
          previousAvgWaitTime > 0
            ? avgWaitTime - previousAvgWaitTime
            : 0;

        const analyticsCongestion =
          periodAnalytics.length > 0
            ? periodAnalytics.reduce(
                (sum: number, item: any) =>
                  sum +
                  Number(item.summary?.averageCongestionIndex || 0),
                0,
              ) / periodAnalytics.length
            : 0;

        const realtimeCongestion =
          calculateCongestionIndex(latestSnapshots);

        const avgCongestion =
          realtimeCongestion > 0
            ? realtimeCongestion
            : analyticsCongestion;

        const flowScore = calculateFlowScore(
          iotPercentage,
          avgCongestion,
        );

        const trendData = buildTrafficTrend(traffic, timeRange);

        setStats({
          totalVehicles,
          totalVehiclesToday,
          activeDevices,
          totalDevices,
          avgWaitTime: Math.round(avgWaitTime),
          flowScore,
          iotPercentage: Math.round(iotPercentage * 10) / 10,
          changeVsYesterday: Math.round(changeVsYesterday * 10) / 10,
          changeWaitTime: Math.round(changeWaitTime),
        });

        setTrafficTrend(trendData);
        setRecentEvents([]);
        setLastUpdated(new Date());
        setIsLoading(false);
        setIsInitialLoad(false);
      } catch (fetchError: any) {
        console.error("Error fetching dashboard data:", fetchError);

        setError(fetchError.message || "Failed to fetch dashboard data");
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    },
    [
      timeRange,
      customDates?.startDate,
      customDates?.endDate,
      intersectionId,
      safeFetchJson,
    ],
  );

  useEffect(() => {
    setIsInitialLoad(true);
    void fetchDashboardData(false);

    if (timeRange === "today") {
      const interval = window.setInterval(() => {
        void fetchDashboardData(true);
      }, 30000);

      return () => window.clearInterval(interval);
    }

    return undefined;
  }, [fetchDashboardData, timeRange]);

  return {
    stats,
    trafficTrend,
    recentEvents,
    isLoading,
    isInitialLoad,
    error,
    lastUpdated,
    refresh: fetchDashboardData,
  };
}