// Utility functions untuk analytics calculations

export interface HourlyStats {
  time: string;
  hour: number;
  intensity: number;
  vehicleCount: number;
  congestionIndex: number;
}

export interface WeeklyStats {
  day: string;
  utara: number;
  timur: number;
  barat: number;
  selatan: number;
  total: number;
}

/**
 * Calculate hourly statistics from traffic data
 */
export function calculateHourlyStats(trafficData: any[]): HourlyStats[] {
  const hourlyMap = new Map<number, { count: number; totalVehicles: number; totalCongestion: number }>();

  // Group by hour
  trafficData.forEach((data) => {
    const hour = new Date(data.timestamp).getHours();
    if (!hourlyMap.has(hour)) {
      hourlyMap.set(hour, { count: 0, totalVehicles: 0, totalCongestion: 0 });
    }
    const stats = hourlyMap.get(hour)!;
    stats.count++;
    stats.totalVehicles += data.vehicleCount || 0;
    stats.totalCongestion += data.congestionIndex || 0;
  });

  // Generate 24-hour stats
  const stats: HourlyStats[] = [];
  for (let hour = 0; hour < 24; hour += 2) {
    const data = hourlyMap.get(hour);
    if (data) {
      const avgVehicles = Math.round(data.totalVehicles / data.count);
      const avgCongestion = Math.round(data.totalCongestion / data.count);
      stats.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour,
        intensity: Math.min(100, avgCongestion),
        vehicleCount: avgVehicles,
        congestionIndex: avgCongestion,
      });
    } else {
      // Fill missing hours with low values
      stats.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour,
        intensity: 5,
        vehicleCount: 20,
        congestionIndex: 5,
      });
    }
  }

  return stats;
}

/**
 * Calculate weekly statistics from analytics data
 */
export function calculateWeeklyStats(analyticsData: any[]): WeeklyStats[] {
  const dayNames = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  const weeklyMap = new Map<string, { utara: number; timur: number; barat: number; selatan: number }>();

  // Group by day of week
  analyticsData.forEach((data) => {
    const date = new Date(data.date);
    const dayName = dayNames[date.getDay()];

    if (!weeklyMap.has(dayName)) {
      weeklyMap.set(dayName, { utara: 0, timur: 0, barat: 0, selatan: 0 });
    }

    const stats = weeklyMap.get(dayName)!;

    // Aggregate from hourly data
    if (data.hourly && Array.isArray(data.hourly)) {
      const totalVehicles = data.hourly.reduce((sum: number, h: any) => sum + (h.vehicleCount || 0), 0);
      const avgCongestion = data.hourly.reduce((sum: number, h: any) => sum + (h.congestionIndex || 0), 0) / data.hourly.length;

      // Distribute across lanes (simplified - in real app, would use lane-specific data)
      const perLane = Math.round(avgCongestion / 4);
      stats.utara += perLane;
      stats.timur += perLane;
      stats.barat += perLane;
      stats.selatan += perLane;
    }
  });

  // Generate stats for all days
  const stats: WeeklyStats[] = [];
  const orderedDays = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];

  orderedDays.forEach((day) => {
    const data = weeklyMap.get(day);
    if (data) {
      stats.push({
        day,
        utara: Math.min(100, Math.round(data.utara)),
        timur: Math.min(100, Math.round(data.timur)),
        barat: Math.min(100, Math.round(data.barat)),
        selatan: Math.min(100, Math.round(data.selatan)),
        total: Math.min(400, Math.round(data.utara + data.timur + data.barat + data.selatan)),
      });
    } else {
      // Default values for days without data
      const isWeekend = day === 'SABTU' || day === 'MINGGU';
      const baseValue = isWeekend ? 30 : 60;
      stats.push({
        day,
        utara: baseValue,
        timur: baseValue - 10,
        barat: baseValue - 20,
        selatan: baseValue - 5,
        total: baseValue * 4 - 35,
      });
    }
  });

  return stats;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get week range (start and end date)
 */
export function getWeekRange(weekOffset: number = 0): { start: Date; end: Date } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start of week

  const start = new Date(today);
  start.setDate(today.getDate() + diff - (weekOffset * 7));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Calculate congestion level from index
 */
export function getCongestionLevel(index: number): 'low' | 'medium' | 'high' | 'critical' {
  if (index < 30) return 'low';
  if (index < 60) return 'medium';
  if (index < 85) return 'high';
  return 'critical';
}

/**
 * Get congestion color
 */
export function getCongestionColor(index: number): string {
  if (index < 30) return '#10b981'; // green
  if (index < 60) return '#f59e0b'; // yellow
  if (index < 85) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Calculate average from array of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Calculate percentage change
 */
export function percentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format number with thousand separator
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('id-ID');
}

/**
 * Get time of day label
 */
export function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Pagi';
  if (hour >= 12 && hour < 15) return 'Siang';
  if (hour >= 15 && hour < 18) return 'Sore';
  return 'Malam';
}

/**
 * Check if time is rush hour
 */
export function isRushHour(hour: number): boolean {
  return (hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 19);
}
