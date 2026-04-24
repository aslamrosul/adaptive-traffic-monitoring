import { useEffect, useState } from 'react';

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

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trafficTrend, setTrafficTrend] = useState<TrafficTrendData[]>([]);
  const [recentEvents, setRecentEvents] = useState<DashboardEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch data dari multiple endpoints secara parallel
      const [intersectionsRes, trafficRes, analyticsRes, eventsRes] = await Promise.all([
        fetch('/api/intersections'),
        fetch('/api/traffic/realtime?limit=500'),
        fetch('/api/analytics/daily?limit=7'),
        fetch('/api/events?status=open&limit=10'),
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

      // Hitung device stats
      const activeDevices = intersections.filter((i: any) => 
        i.status?.toLowerCase() === 'active'
      ).length;
      const totalDevices = intersections.length;
      const iotPercentage = totalDevices > 0 ? (activeDevices / totalDevices) * 100 : 0;

      // Hitung total kendaraan dari traffic data
      const totalVehicles = traffic.reduce((sum: number, t: any) => sum + (t.vehicleCount || 0), 0);
      
      // Hitung total kendaraan hari ini dari analytics
      const today = new Date().toISOString().split('T')[0];
      const todayAnalytics = analytics.find((a: any) => a.date === today);
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];
      const yesterdayAnalytics = analytics.find((a: any) => a.date === yesterday);
      
      const totalVehiclesToday = todayAnalytics?.summary?.totalVehicles || totalVehicles;
      const totalVehiclesYesterday = yesterdayAnalytics?.summary?.totalVehicles || totalVehiclesToday;
      const changeVsYesterday = totalVehiclesYesterday > 0 
        ? ((totalVehiclesToday - totalVehiclesYesterday) / totalVehiclesYesterday) * 100 
        : 0;

      // Hitung avg wait time dari analytics
      const avgWaitTime = todayAnalytics?.summary?.averageWaitTime || 
        (analytics.length > 0
          ? analytics.reduce((sum: number, a: any) => sum + (a.summary?.averageWaitTime || 0), 0) / analytics.length
          : 45);

      const avgWaitTimeYesterday = yesterdayAnalytics?.summary?.averageWaitTime || avgWaitTime;
      const changeWaitTime = avgWaitTime - avgWaitTimeYesterday;

      // Hitung flow score berdasarkan IoT percentage dan congestion
      const avgCongestion = todayAnalytics?.summary?.averageCongestionIndex || 
        (analytics.length > 0
          ? analytics.reduce((sum: number, a: any) => sum + (a.summary?.averageCongestionIndex || 0), 0) / analytics.length
          : 50);
      
      let flowScore = 'C';
      if (iotPercentage > 90 && avgCongestion < 40) flowScore = 'A';
      else if (iotPercentage > 80 && avgCongestion < 60) flowScore = 'B+';
      else if (iotPercentage > 70 && avgCongestion < 70) flowScore = 'B';

      // Hitung traffic trend per jam dari traffic data
      const hourlyData: { [key: number]: { count: number; total: number } } = {};
      
      // Initialize 24 hours
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = { count: 0, total: 0 };
      }

      // Aggregate traffic data by hour
      traffic.forEach((t: any) => {
        const hour = new Date(t.timestamp).getHours();
        hourlyData[hour].count++;
        hourlyData[hour].total += t.vehicleCount || 0;
      });

      // Calculate average per hour and create trend data
      const trendData: TrafficTrendData[] = [];
      const currentHour = new Date().getHours();
      
      // Show data for last 7 hours including current
      for (let i = 6; i >= 0; i--) {
        const hour = (currentHour - i + 24) % 24;
        const avgVehicles = hourlyData[hour].count > 0 
          ? Math.round(hourlyData[hour].total / hourlyData[hour].count)
          : 0;
        
        trendData.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          vehicles: avgVehicles,
          hour,
          height: 0, // Will be calculated for chart
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
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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
