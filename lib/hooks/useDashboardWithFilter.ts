import { useEffect, useState } from 'react';

export type TimeRange = "today" | "yesterday" | "7days" | "30days" | "custom";

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

export function useDashboardWithFilter(timeRange: TimeRange = "today", customDates?: DateRange) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trafficTrend, setTrafficTrend] = useState<TrafficTrendData[]>([]);
  const [recentEvents, setRecentEvents] = useState<DashboardEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Calculate date range based on filter
  const getDateRange = (): { start: string; end: string } => {
    const today = new Date();
    let end = today.toISOString().split('T')[0];
    let start = end;

    switch (timeRange) {
      case "today":
        start = end;
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        start = yesterday.toISOString().split('T')[0];
        end = start;
        break;
      case "7days":
        const week = new Date(today);
        week.setDate(week.getDate() - 7);
        start = week.toISOString().split('T')[0];
        break;
      case "30days":
        const month = new Date(today);
        month.setDate(month.getDate() - 30);
        start = month.toISOString().split('T')[0];
        break;
      case "custom":
        if (customDates) {
          start = customDates.startDate;
          return { start, end: customDates.endDate };
        }
        break;
    }

    return { start, end };
  };

  const fetchDashboardData = async (isBackgroundRefresh = false) => {
    // Only show loading screen on initial load, not on background refresh
    if (!isBackgroundRefresh) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const dateRange = getDateRange();
      
      // Fetch data dari multiple endpoints secara parallel dengan date filter
      const [intersectionsRes, trafficRes, analyticsRes, eventsRes] = await Promise.all([
        fetch('/api/intersections'),
        fetch(`/api/traffic/realtime?limit=500&startDate=${dateRange.start}&endDate=${dateRange.end}`),
        fetch(`/api/analytics/daily?limit=90&startDate=${dateRange.start}&endDate=${dateRange.end}`),
        fetch(`/api/events?status=open&limit=50&startDate=${dateRange.start}&endDate=${dateRange.end}`),
      ]);

      const intersectionsData = await intersectionsRes.json();
      const trafficData = await trafficRes.json();
      const analyticsData = await analyticsRes.json();
      const eventsData = await eventsRes.json();

      // Calculate stats dari data real
      const intersections = intersectionsData.success ? intersectionsData.data : [];
      const traffic = trafficData.success ? trafficData.data : [];
      const analytics = analyticsData.success ? analyticsData.data : [];
      const events = eventsData.success ? eventsData.data : [];

      // Filter traffic data by date range
      const filteredTraffic = traffic.filter((t: any) => {
        const tDate = new Date(t.timestamp).toISOString().split('T')[0];
        return tDate >= dateRange.start && tDate <= dateRange.end;
      });

      // Hitung device stats
      const activeDevices = intersections.filter((i: any) => 
        i.status?.toLowerCase() === 'active'
      ).length;
      const totalDevices = intersections.length;
      const iotPercentage = totalDevices > 0 ? (activeDevices / totalDevices) * 100 : 0;

      // Hitung total kendaraan dari traffic data dalam range
      const totalVehicles = filteredTraffic.reduce((sum: number, t: any) => sum + (t.vehicleCount || 0), 0);
      
      // Hitung total kendaraan untuk periode yang dipilih
      const periodAnalytics = analytics.filter((a: any) => 
        a.date >= dateRange.start && a.date <= dateRange.end
      );
      
      const totalVehiclesToday = periodAnalytics.reduce((sum: number, a: any) => 
        sum + (a.summary?.totalVehicles || 0), 0) || totalVehicles;

      // Hitung comparison (untuk today dan yesterday)
      let changeVsYesterday = 0;
      if (timeRange === "today") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];
        const yesterdayAnalytics = analytics.find((a: any) => a.date === yesterdayDate);
        const totalVehiclesYesterday = yesterdayAnalytics?.summary?.totalVehicles || totalVehiclesToday;
        changeVsYesterday = totalVehiclesYesterday > 0 
          ? ((totalVehiclesToday - totalVehiclesYesterday) / totalVehiclesYesterday) * 100 
          : 0;
      }

      // Hitung avg wait time dari analytics dalam range
      const avgWaitTime = periodAnalytics.length > 0
        ? periodAnalytics.reduce((sum: number, a: any) => sum + (a.summary?.averageWaitTime || 0), 0) / periodAnalytics.length
        : 45;

      // Hitung change wait time (untuk today)
      let changeWaitTime = 0;
      if (timeRange === "today") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];
        const yesterdayAnalytics = analytics.find((a: any) => a.date === yesterdayDate);
        const avgWaitTimeYesterday = yesterdayAnalytics?.summary?.averageWaitTime || avgWaitTime;
        changeWaitTime = avgWaitTime - avgWaitTimeYesterday;
      }

      // Hitung flow score berdasarkan IoT percentage dan congestion
      const avgCongestion = periodAnalytics.length > 0
        ? periodAnalytics.reduce((sum: number, a: any) => sum + (a.summary?.averageCongestionIndex || 0), 0) / periodAnalytics.length
        : 50;
      
      let flowScore = 'C';
      if (iotPercentage > 90 && avgCongestion < 40) flowScore = 'A';
      else if (iotPercentage > 80 && avgCongestion < 60) flowScore = 'B+';
      else if (iotPercentage > 70 && avgCongestion < 70) flowScore = 'B';

      // Hitung traffic trend - berbeda untuk setiap time range
      const trendData: TrafficTrendData[] = [];
      
      if (timeRange === "today" || timeRange === "yesterday") {
        // Hourly data untuk hari ini/kemarin
        const hourlyData: { [key: number]: { count: number; total: number } } = {};
        
        for (let i = 0; i < 24; i++) {
          hourlyData[i] = { count: 0, total: 0 };
        }

        filteredTraffic.forEach((t: any) => {
          const hour = new Date(t.timestamp).getHours();
          hourlyData[hour].count++;
          hourlyData[hour].total += t.vehicleCount || 0;
        });

        // Show last 7 hours for today, all 24 hours for yesterday
        const hoursToShow = timeRange === "today" ? 7 : 24;
        const currentHour = new Date().getHours();
        
        for (let i = hoursToShow - 1; i >= 0; i--) {
          const hour = timeRange === "today" ? (currentHour - i + 24) % 24 : (24 - hoursToShow + i);
          const avgVehicles = hourlyData[hour].count > 0 
            ? Math.round(hourlyData[hour].total / hourlyData[hour].count)
            : 0;
          
          trendData.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            vehicles: avgVehicles,
            hour,
            height: 0,
          });
        }
      } else {
        // Daily data untuk 7 days / 30 days / custom
        const dailyData: { [key: string]: { count: number; total: number } } = {};
        
        // Initialize dates in range
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          dailyData[dateStr] = { count: 0, total: 0 };
        }

        // Aggregate traffic data by date
        filteredTraffic.forEach((t: any) => {
          const dateStr = new Date(t.timestamp).toISOString().split('T')[0];
          if (dailyData[dateStr]) {
            dailyData[dateStr].count++;
            dailyData[dateStr].total += t.vehicleCount || 0;
          }
        });

        // Create trend data - show max 7 data points
        const dates = Object.keys(dailyData).sort();
        const step = Math.ceil(dates.length / 7);
        
        dates.forEach((date, idx) => {
          if (idx % step === 0 || idx === dates.length - 1) {
            const avgVehicles = dailyData[date].count > 0 
              ? Math.round(dailyData[date].total / dailyData[date].count)
              : 0;
            
            const dateObj = new Date(date);
            const label = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            
            trendData.push({
              time: label,
              vehicles: avgVehicles,
              hour: idx,
              height: 0,
            });
          }
        });
      }

      // Calculate heights for chart (0-100 scale)
      const maxVehicles = Math.max(...trendData.map(d => d.vehicles), 1);
      trendData.forEach(d => {
        d.height = Math.round((d.vehicles / maxVehicles) * 100);
      });

      // Process events - mark as live if within last 5 minutes
      const processedEvents = events.map((e: any) => {
        const eventTime = new Date(e.timestamp).getTime();
        const now = Date.now();
        const diffMinutes = (now - eventTime) / (1000 * 60);
        
        return {
          ...e,
          live: diffMinutes < 5 && e.priority === 'critical',
        };
      });

      // Set all data
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
      setRecentEvents(processedEvents);
      setLastUpdated(new Date());
      setIsLoading(false);
      setIsInitialLoad(false);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    // Reset initial load state when filter changes
    setIsInitialLoad(true);
    fetchDashboardData(false);

    // Auto-refresh every 30 seconds only for "today" filter
    if (timeRange === "today") {
      const interval = setInterval(() => {
        fetchDashboardData(true); // Background refresh
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [timeRange, customDates?.startDate, customDates?.endDate]);

  return {
    stats,
    trafficTrend,
    recentEvents,
    isLoading,
    error,
    lastUpdated,
    refresh: fetchDashboardData,
  };
}
