"use client";

import { useState } from "react";
import AlertsPanel from "@/components/AlertsPanel";
import DashboardStats from "@/components/DashboardStats";
import IntersectionGrid from "@/components/IntersectionGrid";
import TrafficTrendChart from "@/components/TrafficTrendChart";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardTimeFilter from "@/components/DashboardTimeFilter";
import { useSignalR } from "@/lib/hooks/useSignalR";
import type { TimeRange, DateRange } from "@/lib/hooks/useDashboardWithFilter";

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [customDates, setCustomDates] = useState<DateRange | undefined>();
  const { isConnected, latestData, error } = useSignalR();

  const handleFilterChange = (range: TimeRange, dates?: DateRange) => {
    setTimeRange(range);
    if (range === "custom" && dates) {
      setCustomDates(dates);
    } else {
      setCustomDates(undefined);
    }
  };

  return (
    <DashboardLayout title="Sistem Pantauan Lalu Lintas">
      <div className="p-3 lg:p-6 space-y-4 lg:space-y-6 max-w-[1920px] mx-auto">
        {/* SignalR Status - Only show if there's an active connection attempt */}
        {(isConnected || error) && (
          <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
            isConnected 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
            }`} />
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {isConnected ? '🔴 Live Updates Active' : '⚠️ Real-time Unavailable'}
              </p>
              {error && (
                <p className="text-xs text-slate-600 mt-0.5">
                  Using polling fallback (data refreshes every 30s)
                </p>
              )}
              {latestData && isConnected && (
                <p className="text-xs text-slate-600 mt-0.5">
                  Latest: {latestData.deviceId} - {latestData.vehicleCount} vehicles
                </p>
              )}
            </div>
          </div>
        )}

        {/* Time Filter */}
        <DashboardTimeFilter 
          onFilterChange={handleFilterChange}
          currentRange={timeRange}
        />

        {/* Stats Cards */}
        <DashboardStats timeRange={timeRange} customDates={customDates} />
        
        {/* Main Content */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="lg:col-span-8 space-y-4 lg:space-y-6">
            <TrafficTrendChart timeRange={timeRange} customDates={customDates} />
            <IntersectionGrid />
          </div>
          
          <div className="lg:col-span-4">
            <AlertsPanel timeRange={timeRange} customDates={customDates} />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
