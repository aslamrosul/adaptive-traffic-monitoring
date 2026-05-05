"use client";

import { useState } from "react";
import AlertsPanel from "@/components/AlertsPanel";
import DashboardStats from "@/components/DashboardStats";
import IntersectionGrid from "@/components/IntersectionGrid";
import TrafficTrendChart from "@/components/TrafficTrendChart";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardTimeFilter from "@/components/DashboardTimeFilter";
import type { TimeRange, DateRange } from "@/lib/hooks/useDashboardWithFilter";

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [customDates, setCustomDates] = useState<DateRange | undefined>();

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
