"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HourlyData {
  hour: string;
  vehicleCount: number;
  queueLevel: number;
}

interface TrafficTrendChartProps {
  timeRange?: string;
  customDates?: any;
}

export default function TrafficTrendChart({ timeRange, customDates }: TrafficTrendChartProps) {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLane, setSelectedLane] = useState<string>("all");
  const [period, setPeriod] = useState("today");

  const fetchChartData = async () => {
    setIsLoading(true);
    try {
      // Fetch traffic data
      const response = await fetch('/api/traffic/realtime?limit=500');
      const result = await response.json();

      if (result.success && result.data) {
        // Filter by lane if not "all"
        let filteredData = result.data;
        if (selectedLane !== "all") {
          filteredData = result.data.filter((item: any) => 
            item.lane?.toLowerCase() === selectedLane.toLowerCase()
          );
        }

        // Group by hour
        const hourlyMap = new Map<number, { vehicles: number[]; queueLevels: number[] }>();
        
        // Initialize 24 hours
        for (let i = 0; i < 24; i++) {
          hourlyMap.set(i, { vehicles: [], queueLevels: [] });
        }

        // Aggregate data
        filteredData.forEach((item: any) => {
          const hour = new Date(item.timestamp).getHours();
          const data = hourlyMap.get(hour);
          
          if (data) {
            data.vehicles.push(item.vehicleCount || 0);
            
            // Calculate queue level from queueLength if not provided
            let queueLevel = item.queueLevel ?? 0;
            if (item.queueLength !== undefined && item.queueLevel === undefined) {
              if (item.queueLength > 20) queueLevel = 0;
              else if (item.queueLength >= 10) queueLevel = 1;
              else queueLevel = 2;
            }
            data.queueLevels.push(queueLevel);
          }
        });

        // Calculate averages and create chart data
        const chartData: HourlyData[] = [];
        const currentHour = new Date().getHours();
        
        // Show last 12 hours for better visibility
        for (let i = 11; i >= 0; i--) {
          const hour = (currentHour - i + 24) % 24;
          const data = hourlyMap.get(hour);
          
          if (data) {
            const avgVehicles = data.vehicles.length > 0
              ? Math.round(data.vehicles.reduce((a, b) => a + b, 0) / data.vehicles.length)
              : 0;
            
            const avgQueueLevel = data.queueLevels.length > 0
              ? Math.round((data.queueLevels.reduce((a, b) => a + b, 0) / data.queueLevels.length) * 10) / 10
              : 0;
            
            chartData.push({
              hour: `${hour.toString().padStart(2, '0')}:00`,
              vehicleCount: avgVehicles,
              queueLevel: avgQueueLevel,
            });
          }
        }

        setHourlyData(chartData);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchChartData, 30000);
    return () => clearInterval(interval);
  }, [selectedLane]);

  const handleLaneChange = (lane: string) => {
    setSelectedLane(lane);
  };

  // Prepare chart data
  const chartData = {
    labels: hourlyData.map(d => d.hour),
    datasets: [
      {
        label: 'Vehicle Count',
        data: hourlyData.map(d => d.vehicleCount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y-left',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Queue Level',
        data: hourlyData.map(d => d.queueLevel),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderDash: [5, 5],
        yAxisID: 'y-right',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(249, 115, 22)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            weight: 'bold',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 13,
          weight: 'bold',
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.label === 'Queue Level') {
                const level = Math.round(context.parsed.y);
                const levelText = level === 0 ? 'Lancar' : level === 1 ? 'Sedang' : 'Padat';
                label += `${context.parsed.y} (${levelText})`;
              } else {
                label += context.parsed.y + ' kendaraan';
              }
            }
            return label;
          }
        }
      },
    },
    scales: {
      'y-left': {
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Vehicle Count',
          font: {
            size: 11,
            weight: 'bold',
          },
          color: 'rgb(59, 130, 246)',
        },
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          font: {
            size: 10,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      'y-right': {
        type: 'linear' as const,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Queue Level',
          font: {
            size: 11,
            weight: 'bold',
          },
          color: 'rgb(249, 115, 22)',
        },
        min: 0,
        max: 2,
        ticks: {
          stepSize: 1,
          font: {
            size: 10,
          },
          callback: function(value: any) {
            const labels = ['0 (Lancar)', '1 (Sedang)', '2 (Padat)'];
            return labels[value] || value;
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        ticks: {
          font: {
            size: 10,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
        <div className="h-64 lg:h-80 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-slate-200"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-6">
        <div>
          <h4 className="text-base lg:text-lg font-headline font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">show_chart</span>
            Tren Lalu Lintas & Queue Level
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Vehicle count dan queue level per jam (12 jam terakhir)
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 w-full lg:w-auto">
          {/* Lane Filter */}
          <select
            value={selectedLane}
            onChange={(e) => handleLaneChange(e.target.value)}
            className="flex-1 lg:flex-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="all">Semua Jalur</option>
            <option value="north">Jalur Utara</option>
            <option value="south">Jalur Selatan</option>
            <option value="east">Jalur Timur</option>
            <option value="west">Jalur Barat</option>
          </select>

          {/* Period Filter */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="flex-1 lg:flex-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="today">Hari Ini</option>
            <option value="yesterday">Kemarin</option>
            <option value="week">7 Hari</option>
          </select>

          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchChartData}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh data"
          >
            <span className="material-symbols-outlined text-slate-600">refresh</span>
          </motion.button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 lg:h-80">
        {hourlyData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 inline-block">
                show_chart
              </span>
              <p className="text-sm text-slate-500">Belum ada data untuk ditampilkan</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend Info */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500 rounded"></div>
            <span className="text-slate-600">
              <span className="font-bold">Vehicle Count:</span> Jumlah kendaraan per jam
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-orange-500 rounded border-dashed border-t-2 border-orange-500"></div>
            <span className="text-slate-600">
              <span className="font-bold">Queue Level:</span> 0=Lancar, 1=Sedang, 2=Padat
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
