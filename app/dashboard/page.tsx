"use client";

import DashboardStats from "@/components/DashboardStats";
import DashboardTimeFilter from "@/components/DashboardTimeFilter";
import Header from "@/components/Header";
import IntersectionGrid from "@/components/IntersectionGrid";
import LaneStatusPanel from "@/components/LaneStatusPanel";
import Sidebar from "@/components/Sidebar";
import TrafficTrendChart from "@/components/TrafficTrendChart";
import TrafficControlPanel from "@/components/traffic/TrafficControlPanel";
import TrafficRoadSimulation from "@/components/traffic/TrafficRoadSimulation";
import type {
  DateRange,
  TimeRange,
} from "@/lib/hooks/useDashboardWithFilter";
import { useIntersections } from "@/lib/hooks/useIntersections";
import { useMqttTraffic } from "@/lib/hooks/useMqttTraffic";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [customDates, setCustomDates] = useState<DateRange | undefined>();
  const [selectedIntersection, setSelectedIntersection] =
    useState<string>("all");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { intersections } = useIntersections();

  const {
    connectionState,
    isConnected,
    latestData,
    error,
    publishMqtt,
    reconnect,
  } = useMqttTraffic();

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarOpen");

    if (savedState !== null) {
      setIsSidebarOpen(savedState === "true");
    } else {
      setIsSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  useEffect(() => {
    if (latestData) {
      setLastUpdate(new Date());
    }
  }, [latestData]);

  const handleToggleSidebar = (open: boolean) => {
    setIsSidebarOpen(open);
    localStorage.setItem("sidebarOpen", String(open));
  };

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

        <main
          className={`flex-1 transition-all duration-300 ease-in-out lg:pt-16 ${
            isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
          }`}
        >
          <div className="p-3 lg:p-6 space-y-4 lg:space-y-6 max-w-[1920px] mx-auto">
            <div
              className={[
                "rounded-xl p-4 border",
                isConnected
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200",
              ].join(" ")}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">
                    sensors
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      MQTT Realtime Status: {connectionState}
                    </h3>

                    <p className="text-xs text-slate-700">
                      Device: {latestData?.deviceId || "-"} • Intersection:{" "}
                      {latestData?.intersectionId || "-"} • Last update:{" "}
                      {lastUpdate
                        ? lastUpdate.toLocaleTimeString("id-ID")
                        : "-"}
                    </p>

                    {error && (
                      <p className="text-xs text-red-700 mt-1">
                        Error: {error}
                      </p>
                    )}
                  </div>
                </div>

                {!isConnected && (
                  <button
                    onClick={reconnect}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold"
                  >
                    Reconnect
                  </button>
                )}
              </div>
            </div>

            <DashboardTimeFilter
              onFilterChange={handleFilterChange}
              currentRange={timeRange}
              onIntersectionChange={handleIntersectionChange}
              selectedIntersection={selectedIntersection}
              intersections={intersections.map((i: any) => ({
                id: i.id,
                name: i.name,
              }))}
            />

            <DashboardStats timeRange={timeRange} customDates={customDates} />

            <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6">
              <div className="xl:col-span-8 space-y-4 lg:space-y-6">
                <TrafficRoadSimulation data={latestData} />
              </div>

              <div className="xl:col-span-4">
                <TrafficControlPanel
                  data={latestData}
                  publishMqtt={publishMqtt}
                />
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
              <div className="lg:col-span-8 space-y-4 lg:space-y-6">
                <TrafficTrendChart
                  timeRange={timeRange}
                  customDates={customDates}
                />
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