"use client";

import { useState, useEffect } from "react";
import DashboardStats from "@/components/DashboardStats";
import IntersectionGrid from "@/components/IntersectionGrid";
import TrafficTrendChart from "@/components/TrafficTrendChart";
import DashboardTimeFilter from "@/components/DashboardTimeFilter";
import LaneStatusPanel from "@/components/LaneStatusPanel";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useSignalR } from "@/lib/hooks/useSignalR";
import { useIntersections } from "@/lib/hooks/useIntersections";
import type { TimeRange, DateRange } from "@/lib/hooks/useDashboardWithFilter";

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [customDates, setCustomDates] = useState<DateRange | undefined>();
  const [selectedIntersection, setSelectedIntersection] = useState<string>("all");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Fetch intersections for dropdown
  const { intersections } = useIntersections();
  
  // SignalR real-time connection
  const { 
    connectionState, 
    isConnected, 
    latestData, 
    error,
    reconnect 
  } = useSignalR();

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState !== null) {
      setIsSidebarOpen(savedState === 'true');
    } else {
      // Default: open on desktop, closed on mobile
      setIsSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);
  
  // Save sidebar state to localStorage whenever it changes
  const handleToggleSidebar = (open: boolean) => {
    setIsSidebarOpen(open);
    localStorage.setItem('sidebarOpen', String(open));
  };

  // Update last update time when new data arrives
  useEffect(() => {
    if (latestData) {
      setLastUpdate(new Date());
    }
  }, [latestData]);

  const handleFilterChange = (range: TimeRange, dates?: DateRange) => {
    setTimeRange(range);
    if (range === "custom" && dates) {
      setCustomDates(dates);
    } else {
      setCustomDates(undefined);
    }
  };

  const handleIntersectionChange = (intersectionId: string) => {
    setSelectedIntersection(intersectionId);
  };

  return (
    <div className="flex min-h-screen bg-surface overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={handleToggleSidebar} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header 
          title="Sistem Pantauan Lalu Lintas"
          onToggleSidebar={() => handleToggleSidebar(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          connectionState={connectionState}
          isConnected={isConnected}
        />
        
        <main className={`flex-1 transition-all duration-300 ease-in-out lg:pt-16 ${
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}>
          <div className="p-3 lg:p-6 space-y-4 lg:space-y-6 max-w-[1920px] mx-auto">

            {/* Real-time Data Preview (only when connected and has data) */}
            {isConnected && latestData && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-blue-600 text-xl">
                    sensors
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-blue-900">
                      Live Data Stream
                    </h3>
                    <p className="text-xs text-blue-700">
                      Device: {latestData.deviceId} • {new Date(latestData.timestamp).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                
                {/* Quick Lane Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {(['north', 'south', 'east', 'west'] as const).map((lane) => {
                    const laneData = latestData[lane];
                    const levelColor = laneData.queueLevel === 0 ? 'emerald' : laneData.queueLevel === 1 ? 'yellow' : 'red';
                    
                    return (
                      <div key={lane} className={`bg-white rounded-lg p-2 border border-${levelColor}-200`}>
                        <p className="text-xs font-semibold text-slate-600 mb-1 capitalize">
                          {lane === 'north' ? 'Utara' : lane === 'south' ? 'Selatan' : lane === 'east' ? 'Timur' : 'Barat'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-lg`}>
                            {laneData.queueLevel === 0 ? '🟢' : laneData.queueLevel === 1 ? '🟡' : '🔴'}
                          </span>
                          <div className="text-xs">
                            <p className="font-bold text-slate-900">Level {laneData.queueLevel}</p>
                            <p className="text-slate-600">{laneData.vehicleCount} kendaraan</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time Filter */}
            <DashboardTimeFilter 
              onFilterChange={handleFilterChange}
              currentRange={timeRange}
              onIntersectionChange={handleIntersectionChange}
              selectedIntersection={selectedIntersection}
              intersections={intersections.map(i => ({ id: i.id, name: i.name }))}
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
                <LaneStatusPanel intersectionId={selectedIntersection} />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
