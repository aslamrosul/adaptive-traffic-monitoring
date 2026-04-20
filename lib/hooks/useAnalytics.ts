import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface DailyAnalytics {
  id: string;
  intersectionId: string;
  date: string;
  summary: {
    totalVehicles: number;
    averageSpeed: number;
    averageCongestionIndex: number;
    averageWaitTime: number;
    peakHour: string;
    peakVehicleCount: number;
  };
  hourly: {
    hour: number;
    vehicleCount: number;
    averageSpeed: number;
    congestionLevel: string;
    congestionIndex: number;
  }[];
  efficiency: {
    autoModeTime: number;
    manualModeTime: number;
    autoModeEfficiency: number;
    manualModeEfficiency: number;
  };
  events: {
    total: number;
    bySeverity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    byType: {
      congestion: number;
      accident: number;
      sensor_error: number;
      other: number;
    };
  };
}

export interface TrafficData {
  id: string;
  deviceId: string;
  lane: string;
  vehicleCount: number;
  speed: number;
  density: number;
  status: string;
  timestamp: string;
}

export function useAnalytics(intersectionId?: string, date?: string) {
  const params = new URLSearchParams();
  if (intersectionId) params.append('intersectionId', intersectionId);
  if (date) params.append('date', date);
  
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    count: number;
    data: DailyAnalytics[];
  }>(
    `/api/analytics/daily?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh setiap 1 menit
      revalidateOnFocus: true,
    }
  );

  return {
    analytics: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useRealtimeTraffic(deviceId?: string, limit: number = 100) {
  const params = new URLSearchParams();
  if (deviceId) params.append('deviceId', deviceId);
  params.append('limit', limit.toString());

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    count: number;
    data: TrafficData[];
  }>(
    `/api/traffic/realtime?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 5000, // Refresh setiap 5 detik untuk real-time
      revalidateOnFocus: true,
    }
  );

  return {
    trafficData: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useIntersections() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    count: number;
    data: any[];
  }>(
    '/api/intersections',
    fetcher,
    {
      refreshInterval: 30000, // Refresh setiap 30 detik
    }
  );

  return {
    intersections: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useEvents(intersectionId?: string, status?: string) {
  const params = new URLSearchParams();
  if (intersectionId) params.append('intersectionId', intersectionId);
  if (status) params.append('status', status);

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    count: number;
    data: any[];
  }>(
    `/api/events?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 10000, // Refresh setiap 10 detik
    }
  );

  return {
    events: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
