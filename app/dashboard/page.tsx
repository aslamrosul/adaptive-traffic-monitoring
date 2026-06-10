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
import { formatWib } from "@/lib/timezone";
import { useEffect, useMemo, useState } from "react";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import {
  formatWithTimezone,
  getTimezoneLabel,
} from "@/lib/user-settings";

export default function DashboardPage() {
  const { timezone } = useAppSettings();
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
      return;
    }

    setIsSidebarOpen(window.innerWidth >= 1024);
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
      return;
    }

    setCustomDates(undefined);
  };

  const handleIntersectionChange = (intersectionId: string) => {
    setSelectedIntersection(intersectionId);
  };

  const selectedIntersectionName = useMemo(() => {
    if (selectedIntersection === "all") {
      return "Semua Persimpangan";
    }

    const intersection = intersections.find(
      (item: any) =>
        item.id === selectedIntersection ||
        item.intersection_id === selectedIntersection,
    );

    return intersection?.name ?? selectedIntersection;
  }, [intersections, selectedIntersection]);

  return (
    <div className="flex min-h-screen bg-surface overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header
          title="Sistem Pantauan Lalu Lintas"
          onToggleSidebar={() => handleToggleSidebar(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          connectionState={connectionState}
          isConnected={isConnected}
        />

        <main
          className={[
            "flex-1 transition-all duration-300 ease-in-out lg:pt-16",
            isSidebarOpen ? "lg:ml-64" : "lg:ml-20",
          ].join(" ")}
        >
          <div className="mx-auto max-w-[1920px] space-y-4 p-3 lg:space-y-6 lg:p-6">
            {/* MQTT STATUS */}
            <section
              className={[
                "rounded-xl border p-4",
                isConnected
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50",
              ].join(" ")}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-xl">
                    sensors
                  </span>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        MQTT Realtime Status
                      </h3>

                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                          isConnected
                            ? "bg-emerald-200 text-emerald-800"
                            : "bg-red-200 text-red-800",
                        ].join(" ")}
                      >
                        {connectionState}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-700">
                      Device: {latestData?.deviceId || "-"} · Persimpangan:{" "}
                      {latestData?.intersectionId || "-"} · Terakhir diperbarui:{" "}
                      {latestData?.timestamp
                        ? `${formatWithTimezone(latestData.timestamp, timezone)} ${getTimezoneLabel(timezone)}`
                        : lastUpdate
                        ? `${formatWithTimezone(lastUpdate.toISOString(), timezone)} ${getTimezoneLabel(timezone)}`
                        : "-"}
                    </p>

                    {error && (
                      <p className="mt-1 text-xs font-medium text-red-700">
                        Error: {error}
                      </p>
                    )}
                  </div>
                </div>

                {!isConnected && (
                  <button
                    type="button"
                    onClick={reconnect}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                  >
                    Hubungkan Ulang
                  </button>
                )}
              </div>
            </section>

            {/* FILTER */}
            <DashboardTimeFilter
              onFilterChange={handleFilterChange}
              currentRange={timeRange}
              onIntersectionChange={handleIntersectionChange}
              selectedIntersection={selectedIntersection}
              intersections={intersections.map((item: any) => ({
                id: item.id ?? item.intersection_id,
                name: item.name,
              }))}
            />

            {/* STATISTICS */}
            <DashboardStats
              timeRange={timeRange}
              customDates={customDates}
            />

            {/* MAIN DASHBOARD GRID */}
            <section className="grid grid-cols-1 items-start gap-4 lg:gap-6 xl:grid-cols-12">
              {/* LEFT COLUMN */}
              <div className="space-y-4 lg:space-y-6 xl:col-span-8">
                <TrafficRoadSimulation data={latestData} />

                <TrafficTrendChart
                  timeRange={timeRange}
                  customDates={customDates}
                />

                <IntersectionGrid />
              </div>

              {/* RIGHT COLUMN */}
              <aside className="space-y-4 lg:space-y-6 xl:col-span-4">
                <TrafficControlPanel
                  data={latestData}
                  publishMqtt={publishMqtt}
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status jalur
                    </p>

                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedIntersectionName}
                    </h2>
                  </div>

                  <LaneStatusPanel
                    intersectionId={selectedIntersection}
                  />
                </div>
              </aside>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}