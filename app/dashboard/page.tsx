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
import { useT } from "@/lib/useT";

import type {
  DateRange,
  TimeRange,
} from "@/lib/hooks/useDashboardWithFilter";

import { useIntersections } from "@/lib/hooks/useIntersections";
import {
  normalizeMqttTraffic,
  type TrafficUpdate,
  useMqttTraffic,
} from "@/lib/hooks/useMqttTraffic";

import { useAppSettings } from "@/lib/hooks/useAppSettings";
import { useActivityLogger } from "@/lib/hooks/useActivityLogger";
import {
  formatWithTimezone,
  getTimezoneLabel,
} from "@/lib/user-settings";

import { useEffect, useMemo, useState } from "react";

function pickNewestTraffic(
  a?: TrafficUpdate | null,
  b?: TrafficUpdate | null,
): TrafficUpdate | null {
  if (!a) return b ?? null;
  if (!b) return a;

  const ta = new Date(a.timestamp).getTime();
  const tb = new Date(b.timestamp).getTime();

  if (Number.isNaN(ta)) return b;
  if (Number.isNaN(tb)) return a;

  return tb > ta ? b : a;
}

export default function DashboardPage() {
  const t = useT();
  const { timezone } = useAppSettings();

  useActivityLogger({
    type: "dashboard.view",
    action: t('dashboard.activityLog.action') || "Membuka dashboard monitoring",
    description: t('dashboard.activityLog.description') || "Pengguna membuka halaman dashboard realtime",
  });

  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [customDates, setCustomDates] = useState<DateRange | undefined>();
  const [selectedIntersection, setSelectedIntersection] =
    useState<string>("all");

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);

  /**
   * Ini fallback data dari API DynamoDB untuk persimpangan yang dipilih.
   * Dipakai ketika data realtime MQTT per-device belum masuk ke latestByDevice.
   */
  const [selectedLatestFromApi, setSelectedLatestFromApi] =
    useState<TrafficUpdate | null>(null);

  const { intersections } = useIntersections();

  const {
    connectionState,
    isConnected,
    latestData,
    latestByDevice,
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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isControlPanelOpen) {
        setIsControlPanelOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isControlPanelOpen]);

  useEffect(() => {
    if (isControlPanelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isControlPanelOpen]);

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
      return t('intersections.allIntersections') || "Semua Persimpangan";
    }

    const intersection = intersections.find(
      (item: any) =>
        item.id === selectedIntersection ||
        item.intersection_id === selectedIntersection,
    );

    return intersection?.name ?? selectedIntersection;
  }, [intersections, selectedIntersection]);

  const selectedIntersectionData = useMemo(() => {
    if (selectedIntersection === "all") {
      return null;
    }

    return (
      intersections.find(
        (item: any) =>
          item.id === selectedIntersection ||
          item.intersection_id === selectedIntersection,
      ) ?? null
    );
  }, [intersections, selectedIntersection]);

  const selectedDeviceId =
    selectedIntersectionData?.deviceId ||
    selectedIntersectionData?.device_id ||
    null;

  /**
   * Ambil latest data dari API berdasarkan intersection yang dipilih.
   * Ini mencegah UI fallback ke latestData global milik device lain.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadSelectedLatest() {
      try {
        const endpoint =
          selectedIntersection === "all"
            ? "/api/traffic/latest?limit=1"
            : `/api/traffic/latest?intersectionId=${encodeURIComponent(
                selectedIntersection,
              )}&limit=1`;

        const response = await fetch(endpoint, {
          cache: "no-store",
        });

        const json = await response.json();

        if (
          cancelled ||
          !response.ok ||
          !json.success ||
          !Array.isArray(json.data) ||
          json.data.length === 0
        ) {
          if (!cancelled) {
            setSelectedLatestFromApi(null);
          }

          return;
        }

        const normalized = normalizeMqttTraffic(json.data[0]);

        // Jangan sampai data simpang lain masuk saat sedang pilih simpang tertentu
        if (
          selectedIntersection !== "all" &&
          normalized.intersectionId !== selectedIntersection
        ) {
          if (!cancelled) {
            setSelectedLatestFromApi(null);
          }

          return;
        }

        setSelectedLatestFromApi(normalized);
        setLastUpdate(new Date());
      } catch (fetchError) {
        console.error(
          "Gagal mengambil latest traffic persimpangan:",
          fetchError,
        );

        if (!cancelled) {
          setSelectedLatestFromApi(null);
        }
      }
    }

    loadSelectedLatest();

    // Polling fallback, karena MQTT WebSocket kamu kadang connected tapi tidak menerima telemetry
    const intervalId = window.setInterval(loadSelectedLatest, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedIntersection]);

  /**
   * Data final untuk Road Simulation dan TrafficControlPanel.
   *
   * Aturan:
   * - Semua Persimpangan  -> latestData global.
   * - Persimpangan khusus -> latestByDevice[deviceId].
   * - Kalau MQTT belum ada -> selectedLatestFromApi.
   * - Jangan fallback ke latestData global saat pilih persimpangan khusus.
   */
  const realtimeData = useMemo(() => {
    if (selectedIntersection === "all") {
      return pickNewestTraffic(latestData, selectedLatestFromApi);
    }

    const mqttDeviceData =
      selectedDeviceId && latestByDevice[selectedDeviceId]
        ? latestByDevice[selectedDeviceId]
        : null;

    return pickNewestTraffic(mqttDeviceData, selectedLatestFromApi);
  }, [
    selectedIntersection,
    selectedDeviceId,
    latestByDevice,
    latestData,
    selectedLatestFromApi,
  ]);

  const formattedLastUpdate = useMemo(() => {
    if (realtimeData?.timestamp) {
      return `${formatWithTimezone(realtimeData.timestamp, timezone)} ${getTimezoneLabel(
        timezone,
      )}`;
    }

    if (lastUpdate) {
      return `${formatWithTimezone(lastUpdate.toISOString(), timezone)} ${getTimezoneLabel(
        timezone,
      )}`;
    }

    return "-";
  }, [lastUpdate, realtimeData?.timestamp, timezone]);

  const filterIntersections = useMemo(
    () =>
      intersections.map((item: any) => ({
        id: item.id ?? item.intersection_id,
        name: item.name,
      })),
    [intersections],
  );

  return (
    <div className="flex min-h-screen overflow-hidden bg-surface">
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
                      Device: {realtimeData?.deviceId || "-"} · Persimpangan:{" "}
                      {realtimeData?.intersectionId || "-"} · Terakhir
                      diperbarui: {formattedLastUpdate}
                    </p>

                    {selectedIntersection !== "all" && !realtimeData && (
                      <p className="mt-1 text-xs font-medium text-amber-700">
                        Belum ada data telemetry untuk persimpangan yang
                        dipilih.
                      </p>
                    )}

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
                    {t("common.reconnect")}
                  </button>
                )}
              </div>
            </section>

            <DashboardTimeFilter
              onFilterChange={handleFilterChange}
              currentRange={timeRange}
              onIntersectionChange={handleIntersectionChange}
              selectedIntersection={selectedIntersection}
              intersections={filterIntersections}
            />

            <DashboardStats
              timeRange={timeRange}
              customDates={customDates}
              intersectionId={selectedIntersection}
            />

            <section className="grid grid-cols-1 items-start gap-4 lg:gap-6 xl:grid-cols-12">
              <div className="space-y-4 lg:space-y-6 xl:col-span-8">
                <TrafficRoadSimulation
                  key={realtimeData?.deviceId || selectedIntersection}
                  data={realtimeData}
                />

                <TrafficTrendChart
                  timeRange={timeRange}
                  customDates={customDates}
                  intersectionId={selectedIntersection}
                />

                <IntersectionGrid />
              </div>

              <aside className="space-y-4 lg:space-y-6 xl:col-span-4">
                <TrafficControlPanel
                  key={realtimeData?.deviceId || selectedIntersection}
                  data={realtimeData}
                  publishMqtt={publishMqtt}
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('dashboard.laneStatus') || 'Status jalur'}
                    </p>

                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedIntersectionName}
                    </h2>
                  </div>

                  <LaneStatusPanel intersectionId={selectedIntersection} />
                </div>
              </aside>
            </section>
          </div>
        </main>
      </div>

      {isControlPanelOpen && (
        <button
          type="button"
          aria-label="Tutup panel kontrol"
          onClick={() => setIsControlPanelOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <button
        type="button"
        onClick={() => setIsControlPanelOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-2xl lg:hidden"
        aria-label="Buka panel kontrol"
      >
        <span className="material-symbols-outlined">
          tune
        </span>
      </button>
    </div>
  );
}