"use client";

import DashboardStats from "@/components/DashboardStats";
import DashboardTimeFilter from "@/components/DashboardTimeFilter";
import Header from "@/components/Header";
import IntersectionGrid from "@/components/IntersectionGrid";
import LaneStatusPanel from "@/components/LaneStatusPanel";
import Sidebar from "@/components/Sidebar";
import AiStatusBadge from "@/components/AiStatusBadge";
import AnnotatedPreview from "@/components/AnnotatedPreview";
import { useCameraDisplay, resolveLaneSource } from "@/lib/hooks/useCameraDisplay";
import { resolveInitialIntersection } from "@/lib/intersection-select";
import { useCameraLiveMap } from "@/lib/hooks/useCameraLive";
import TrafficTrendChart from "@/components/TrafficTrendChart";
import TrafficControlPanel from "@/components/traffic/TrafficControlPanel";
import TrafficRoadSimulation from "@/components/traffic/TrafficRoadSimulation";
import { useT } from "@/lib/useT";
import { useSession } from "next-auth/react";

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

import { useEffect, useMemo, useRef, useState } from "react";

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
  const { data: sessData } = useSession();
  const isCamAdmin = ((sessData?.user as { role?: string } | undefined)?.role || "") === "admin";

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
      if (window.innerWidth >= 1024) {
        document.body.style.overflow = "hidden";
      } else {
        const el = document.getElementById("traffic-control-panel");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        el?.classList.add("ring-4", "ring-blue-300");
        const timer = setTimeout(
          () => el?.classList.remove("ring-4", "ring-blue-300"),
          2000,
        );
        return () => {
          clearTimeout(timer);
          document.body.style.overflow = "unset";
        };
      }
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

  // ===== CAMERA MULTI-JALUR (eksperimen dashboard2) — auto-support 4 jalur =====
  const ALL_LANES = ["north", "south", "east", "west"] as const;
  type CamLane = typeof ALL_LANES[number];
  const [camUrls, setCamUrls] = useState<Record<CamLane, string>>({
    north: "",
    south: "",
    east: "",
    west: "",
  });
  const [camView, setCamView] = useState<"all" | CamLane>("all");
  const camLiveMap = useCameraLiveMap(selectedIntersection);
  const [isSimOpen, setIsSimOpen] = useState(true);
  const [camSource, setCamSource] = useState<Record<CamLane, "canonical" | "mjpeg" | "hls" | "webcam" | "upload">>({
    north: "canonical",
    south: "canonical",
    east: "canonical",
    west: "canonical",
  });
  const camVideoRefs = useRef<Record<CamLane, HTMLVideoElement | null>>({
    north: null,
    south: null,
    east: null,
    west: null,
  });
  const camFileRefs = useRef<Record<CamLane, HTMLInputElement | null>>({
    north: null,
    south: null,
    east: null,
    west: null,
  });
  const [camSettingsLane, setCamSettingsLane] = useState<CamLane | null>(null);
  const { byApproach: dispCfg, reload: reloadDisp } = useCameraDisplay(
    selectedIntersection === "all" ? null : selectedIntersection
  );
  const [laneCamId, setLaneCamId] = useState<Record<CamLane, string>>({
    north: "", south: "", east: "", west: "",
  });
  const [snapTick, setSnapTick] = useState(0);
  const [cfgSaveState, setCfgSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [cfgSaveError, setCfgSaveError] = useState("");
  const [cfgMigrated, setCfgMigrated] = useState(false);
  const [formSource, setFormSource] = useState<"canonical" | "mjpeg" | "hls">("canonical");
  const [formMjpeg, setFormMjpeg] = useState("");
  const [formHls, setFormHls] = useState("");
  const [syncedKey, setSyncedKey] = useState("");
  const migratedRef = useState(() => ({ done: false }))[0];
  useEffect(() => {
    if (!camSettingsLane) return;
    const e = dispCfg[camSettingsLane];
    setFormSource(e?.active_source === "mjpeg" || e?.active_source === "hls" ? e.active_source : "canonical");
    setFormMjpeg(e?.manual_mjpeg_url || "");
    setFormHls(e?.manual_hls_url || "");
    setCfgSaveState("idle");
    setCfgSaveError("");
  }, [camSettingsLane, dispCfg]);

  const toggleCamFullscreen = (lane: CamLane) => {
    const el = document.getElementById(`cam-card-${lane}`);
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void (el as HTMLElement).requestFullscreen?.();
  };

  // Layar kamera ngikutin jumlah jalur persimpangan yang dipilih
  // (mis. 3 jalur → 3 layar, 2 jalur → 2 layar)
  const visibleCamLanes = useMemo(() => {
    const normalize = (v: unknown): CamLane | null => {
      const s = String(v ?? "").trim().toLowerCase();
      return (ALL_LANES as readonly string[]).includes(s) ? (s as CamLane) : null;
    };
    if (selectedIntersection !== "all" && selectedIntersectionData) {
      const d: any = selectedIntersectionData;
      const dirs = d?.lanes?.directions ?? d?.lanesDirections ?? d?.lanes_directions ?? null;
      if (Array.isArray(dirs)) {
        const list = dirs.map(normalize).filter((x): x is CamLane => !!x);
        if (list.length) return [...new Set(list)] as CamLane[];
      }
      const count = Number(d?.lanes?.count ?? d?.lanesCount ?? d?.lanes_count ?? NaN);
      if (Number.isFinite(count) && count > 0) {
        return (ALL_LANES as readonly CamLane[]).slice(0, Math.min(count, ALL_LANES.length)) as CamLane[];
      }
    } else if (selectedIntersection === "all") {
      const set = new Set<CamLane>();
      for (const item of intersections as any[]) {
        const dirs = item?.lanes?.directions ?? item?.lanesDirections ?? null;
        if (Array.isArray(dirs)) dirs.forEach((x) => { const n = normalize(x); if (n) set.add(n); });
      }
      if (set.size) return (ALL_LANES as readonly CamLane[]).filter((l) => set.has(l)) as CamLane[];
    }
    return [...ALL_LANES] as CamLane[];
  }, [intersections, selectedIntersection, selectedIntersectionData]);

  // Kalau pindah persimpangan dan lane yang dipilih tidak ada di sana → balik ke "all"
  useEffect(() => {
    if (camView !== "all" && !visibleCamLanes.includes(camView)) setCamView("all");
    if (camSettingsLane && !visibleCamLanes.includes(camSettingsLane)) setCamSettingsLane(null);
  }, [visibleCamLanes, camView, camSettingsLane]);

  // Preferensi UI lokal (bukan source of truth kamera).
  useEffect(() => {
    try {
      const savedView = localStorage.getItem("dashboard2_camView") as "all" | CamLane | null;
      if (savedView) setCamView(savedView);
      const savedSim = localStorage.getItem("dashboard_simOpen");
      if (savedSim !== null) setIsSimOpen(savedSim === "true");
    } catch {}
  }, []);
  // Default intersection operasional (STEP 16).
  // Default intersection SEKALI per sesi halaman (STEP 2): pilihan user selalu menang.
  const didResolveIntersection = useRef(false);
  useEffect(() => {
    if (didResolveInitialRef()) return;
    if (selectedIntersection !== "all") {
      didResolveIntersection.current = true;
      return;
    }
    const list = (intersections || []) as Array<{ id?: string; intersection_id?: string; status?: string }>;
    if (!list.length) return;
    const pid = resolveInitialIntersection(list);
    didResolveIntersection.current = true;
    if (pid && pid !== "all") setSelectedIntersection(pid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intersections, selectedIntersection]);
  function didResolveInitialRef() {
    return didResolveIntersection.current;
  }
  // Sinkronisasi sumber efektif SEKALI per kombinasi (server > registry > lokal).
  useEffect(() => {
    const liveKeys = Object.keys(camLiveMap).sort().join(",");
    const dispKeys = Object.keys(dispCfg).sort().join(",");
    const key = `${selectedIntersection}|${dispKeys}|${liveKeys}`;
    if (key === syncedKey) return;
    setSyncedKey(key);
    const nextSource: Partial<Record<CamLane, "canonical" | "mjpeg" | "hls" | "webcam" | "upload">> = {};
    const nextUrls: Partial<Record<CamLane, string>> = {};
    const nextIds: Partial<Record<CamLane, string>> = {};
    for (const lane of ALL_LANES) {
      const e = dispCfg[lane];
      const live = camLiveMap[lane];
      const r = resolveLaneSource({
        serverEntry: e || null,
        registered: !!live?.camera_id,
      });
      if (r.kind === "canonical" || r.kind === "mjpeg" || r.kind === "hls") {
        nextSource[lane] = r.kind;
        nextUrls[lane] = r.url;
        nextIds[lane] = e?.camera_id || live?.camera_id || "";
      }
    }
    if (!migratedRef.done) {
      migratedRef.done = true;
      try {
        const lu = JSON.parse(localStorage.getItem("dashboard2_camUrls") || "{}");
        const ls = JSON.parse(localStorage.getItem("dashboard2_camSource") || "{}");
        let moved = false;
        for (const lane of ALL_LANES) {
          if (nextSource[lane] || dispCfg[lane] || camLiveMap[lane]) continue;
          const u = typeof lu[lane] === "string" ? lu[lane] : "";
          const t = ls[lane];
          if ((t === "mjpeg" || t === "hls") && u && !u.startsWith("blob:")) {
            nextSource[lane] = t;
            nextUrls[lane] = u;
            moved = true;
          }
        }
        if (moved) setCfgMigrated(true);
      } catch {}
    }
    if (Object.keys(nextSource).length) {
      setCamSource((st) => ({ ...st, ...nextSource }));
      setCamUrls((st) => ({ ...st, ...nextUrls }));
      setLaneCamId((st) => ({ ...st, ...nextIds }));
    }
  }, [selectedIntersection, dispCfg, camLiveMap, syncedKey, migratedRef]);
  useEffect(() => {
    const t = setInterval(() => setSnapTick((v) => v + 1), 1500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("dashboard_simOpen", String(isSimOpen));
    } catch {}
  }, [isSimOpen]);
  useEffect(() => {
    localStorage.setItem("dashboard2_camView", camView);
  }, [camView]);

  // Mode tampilan simulasi jalan (data selalu telemetri kanonis).
  const [simSource, setSimSource] = useState<"auto" | "sensor">("auto");



  // Persist pilihan sumber simulasi
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dashboard_simSource") as "auto" | "sensor" | null;
      if (saved === "auto" || saved === "sensor") setSimSource(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("dashboard_simSource", simSource);
    } catch {}
  }, [simSource]);

  // Data simulasi = telemetri kanonis realtime (tanpa YOLO browser).
  const simData = realtimeData;

  const updateCamUrl = (lane: CamLane, url: string) =>
    setCamUrls((s) => ({ ...s, [lane]: url.replace(/\/$/, "") }));

  const saveCamConfig = async (lane: CamLane) => {
    if (selectedIntersection === "all") {
      setCfgSaveState("failed");
      setCfgSaveError("Pilih satu persimpangan untuk mengatur kamera.");
      return;
    }
    if (formSource !== "canonical" && formSource !== "mjpeg" && formSource !== "hls") {
      setCfgSaveState("failed");
      setCfgSaveError("webcam/upload hanya lokal — tidak disimpan ke server.");
      return;
    }
    const entry = dispCfg[lane];
    const live = camLiveMap[lane];
    const cameraId = entry?.camera_id || live?.camera_id || laneCamId[lane] || "";
    if (!cameraId) {
      setCfgSaveState("failed");
      setCfgSaveError("Kamera belum terdaftar untuk jalur ini.");
      return;
    }
    const mjpeg = formSource === "mjpeg" ? formMjpeg.trim() : "";
    const hls = formSource === "hls" ? formHls.trim() : "";
    const url = formSource === "mjpeg" ? mjpeg : formSource === "hls" ? hls : "";
    if ((formSource === "mjpeg" || formSource === "hls") && !url) {
      setCfgSaveState("failed");
      setCfgSaveError("Isi URL dulu untuk sumber mjpeg/hls.");
      return;
    }
    if (typeof window !== "undefined" && window.location.protocol === "https:" && url.toLowerCase().startsWith("http://")) {
      setCfgSaveState("failed");
      setCfgSaveError("URL http:// akan diblokir browser (mixed content) — pakai https://.");
      return;
    }
    setCfgSaveState("saving");
    setCfgSaveError("");
    try {
      const body: Record<string, unknown> = { active_source: formSource };
      if (formSource === "mjpeg") body.manual_mjpeg_url = mjpeg;
      if (formSource === "hls") body.manual_hls_url = hls;
      const res = await fetch(
        `/api/cameras/${encodeURIComponent(cameraId)}/display-config`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Gagal menyimpan");
      setCfgSaveState("saved");
      reloadDisp();
    } catch (e: unknown) {
      setCfgSaveState("failed");
      setCfgSaveError(e instanceof Error ? e.message : "Gagal menyimpan");
    }
  };

  const startCamWebcam = async (lane: CamLane) => {
    setCamSource((s) => ({ ...s, [lane]: "webcam" }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
      // tunggu next tick biar <video> sudah render dengan source=webcam
      setTimeout(async () => {
        const vid = camVideoRefs.current[lane];
        if (vid) {
          vid.srcObject = stream;
          try { await vid.play(); } catch {}
        }
      }, 100);
    } catch (e: any) {
      alert(e?.message || "Gagal akses webcam — cek izin browser (harus HTTPS + Allow Camera)");
    }
  };

  const handleCamUpload = (lane: CamLane, file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateCamUrl(lane, url);
    setCamSource((s) => ({ ...s, [lane]: "upload" }));
  };

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
                {/* ===== CAMERA LIVE MULTI-JALUR (di atas, biar langsung ke kamera) ===== */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Live Camera • {visibleCamLanes.length} Jalur
                      </p>
                      <h2 className="text-lg font-bold text-slate-900">
                        {selectedIntersectionName} — Kamera Persimpangan
                      </h2>
                      <p className="text-xs text-slate-500">
                        IP custom per jalur — bisa MJPEG/HLS/Webcam/Upload
                      </p>
                    </div>
                    <div className="flex gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setCamView("all")}
                        className={`rounded-full px-3 py-1 text-xs font-bold ${camView === "all" ? "bg-slate-900 text-white shadow" : "text-slate-600"}`}
                      >
                        Semua {visibleCamLanes.length} Layar
                      </button>
                      {visibleCamLanes.map((lane) => (
                        <button
                          key={lane}
                          type="button"
                          onClick={() => setCamView(lane)}
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${camView === lane ? "bg-blue-600 text-white shadow" : "text-slate-600"}`}
                        >
                          {lane}
                        </button>
                      ))}
                    </div>
                  </div>


                  <div className={camView === "all" ? "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-2" : "grid grid-cols-1 gap-3"}>
                    {(camView === "all" ? visibleCamLanes : ([camView] as const)).map((lane, idx, arr) => (
                      <div key={lane} id={`cam-card-${lane}`} className={`rounded-xl border border-slate-200 bg-slate-50 p-2 fullscreen:bg-slate-900 fullscreen:p-4 ${camView === "all" && arr.length === 3 && idx === 2 ? "md:col-span-2" : ""}`}>
                        <div className="mb-2 flex items-center justify-between gap-1">
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                            {lane}
                          </span>
                          <div className="flex items-center gap-1">
                            <AiStatusBadge live={camLiveMap[lane]} />
                            
                            <button
                              type="button"
                              onClick={() => setCamSettingsLane(lane)}
                              disabled={selectedIntersection === "all"}
                              title={selectedIntersection === "all" ? "Pilih satu persimpangan untuk mengatur kamera." : `Pengaturan kamera ${lane}`}
                              aria-label={`Pengaturan kamera ${lane}`}
                              className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                            >
                              <span className="material-symbols-outlined text-base">tune</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCamFullscreen(lane)}
                              aria-label={`Fullscreen kamera ${lane}`}
                              className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                            >
                              <span className="material-symbols-outlined text-base">fullscreen</span>
                            </button>
                          </div>
                        </div>
                        <input
                          ref={(el) => {
                            camFileRefs.current[lane] = el;
                          }}
                          type="file"
                          accept="video/*,image/*"
                          className="hidden"
                          onChange={(e) => handleCamUpload(lane, e.target.files?.[0] || null)}
                        />
                        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-black aspect-[4/3] fullscreen:aspect-auto fullscreen:h-full">
                          {camSource[lane] === "canonical" && laneCamId[lane] ? (
                            <AnnotatedPreview
                              cameraId={laneCamId[lane]}
                              tick={snapTick}
                              alt={`Kamera ${lane}`}
                              className="h-full w-full object-contain"
                            />
                          ) : camSource[lane] === "canonical" ? (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-900 p-3 text-center">
                              <span className="material-symbols-outlined text-2xl text-slate-400">videocam_off</span>
                              <p className="text-[11px] font-bold text-white">Kamera belum terdaftar</p>
                            </div>
                          ) : camSource[lane] === "webcam" ? (
                            <video
                              ref={(el) => {
                                camVideoRefs.current[lane] = el;
                              }}
                              className="h-full w-full object-contain"
                              playsInline
                              muted
                            />
                          ) : camSource[lane] === "hls" && camUrls[lane]?.includes("m3u8") ? (
                            <video
                              ref={(el) => {
                                camVideoRefs.current[lane] = el;
                              }}
                              src={camUrls[lane]}
                              controls
                              crossOrigin="anonymous"
                              className="h-full w-full object-contain"
                              playsInline
                              muted
                              data-lane-video={lane}
                            />
                          ) : camSource[lane] === "upload" && camUrls[lane]?.startsWith("blob:") ? (
                            camUrls[lane].endsWith(".jpg") || camUrls[lane].includes("image") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img data-lane={lane} crossOrigin="anonymous" src={camUrls[lane]} alt={`Cam ${lane} upload`} className="h-full w-full object-contain" />
                            ) : (
                              <video data-lane-video={lane} src={camUrls[lane]} controls crossOrigin="anonymous" className="h-full w-full object-contain" playsInline muted />
                            )
                          ) : camUrls[lane] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            // TANPA crossOrigin: Chrome menolak render MJPEG multipart bila diminta CORS
                            <img
                              data-lane={lane}
                              src={
                                camUrls[lane].startsWith("blob:") || camUrls[lane].endsWith(".jpg") || camUrls[lane].endsWith(".jpeg") || camUrls[lane].includes("/stream") || camUrls[lane].includes("m3u8")
                                  ? camUrls[lane]
                                  : `${camUrls[lane]}:81/stream`
                              }
                              alt={`Cam ${lane}`}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">Isi URL / Webcam / Upload</div>
                          )}
                          <canvas
                            className="pointer-events-none absolute inset-0 h-full w-full"
                          />
                          <div className="pointer-events-none absolute bottom-1 left-1 max-w-[90%] truncate rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-white">
                            {camUrls[lane] || "-"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span>Pengaturan per kamera via tombol <span className="material-symbols-outlined text-xs">tune</span> • Fullscreen per layar via <span className="material-symbols-outlined text-xs">fullscreen</span></span>
                  </div>
                  {camSettingsLane && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setCamSettingsLane(null)}>
                      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-bold capitalize text-slate-900">Pengaturan Kamera {camSettingsLane}</h3>
                          <button type="button" onClick={() => setCamSettingsLane(null)} aria-label="Tutup" className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                        {selectedIntersection === "all" ? (
                          <p className="mb-3 rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-700">
                            Pilih satu persimpangan untuk mengatur kamera.
                          </p>
                        ) : (
                          <>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Sumber</label>
                            <div className="mb-3 flex flex-wrap gap-1">
                              {(["canonical", "mjpeg", "hls"] as const).map((src) => (
                                <button
                                  key={src}
                                  type="button"
                                  onClick={() => setFormSource(src)}
                                  className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize ${formSource === src ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                >
                                  {src === "canonical" ? "Canonical ASTRAEA" : src.toUpperCase()}
                                </button>
                              ))}
                            </div>
                            {formSource === "canonical" ? (
                              <p className="mb-3 text-[11px] text-slate-500">
                                Sumber otomatis dari Camera Registry. URL manual tidak diperlukan.
                              </p>
                            ) : (
                              <>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                  URL {formSource === "mjpeg" ? "MJPEG" : "HLS"}
                                </label>
                                <input
                                  value={formSource === "mjpeg" ? formMjpeg : formHls}
                                  onChange={(e) => {
                                    if (formSource === "mjpeg") setFormMjpeg(e.target.value);
                                    else setFormHls(e.target.value);
                                  }}
                                  placeholder={formSource === "mjpeg" ? "https://.../stream" : "https://.../index.m3u8"}
                                  className="mb-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                                />
                              </>
                            )}
                            <p className="mb-3 text-[10px] leading-relaxed text-slate-400">Webcam & Upload hanya lokal (tidak tersimpan ke server).</p>
                            {cfgSaveState === "failed" && cfgSaveError && (
                              <p className="mb-3 text-xs font-bold text-red-600">{cfgSaveError}</p>
                            )}
                            {cfgSaveState === "saved" && (
                              <p className="mb-3 text-xs font-bold text-emerald-600">Tersimpan di server.</p>
                            )}
                            {!isCamAdmin && (
                              <p className="mb-2 text-[11px] text-slate-500">
                                Konfigurasi hanya dapat disimpan oleh admin.
                              </p>
                            )}
                            <div className="flex gap-2">
                              {isCamAdmin && (
                              <button
                                type="button"
                                onClick={() => void saveCamConfig(camSettingsLane)}
                                disabled={cfgSaveState === "saving"}
                                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                {cfgSaveState === "saving" ? "Menyimpan..." : "Simpan ke Server"}
                              </button>
                              )}
                              <button type="button" onClick={() => setCamSettingsLane(null)} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-700">
                                Selesai
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {/* ===== SIMULASI JALAN (animasi dari telemetri kanonis) ===== */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Simulasi Jalan (Lab/Eksperimental) • {simSource === "sensor" ? "Mode Sensor" : "Mode Otomatis"}
                      </p>
                      <h2 className="text-lg font-bold text-slate-900">
                        {selectedIntersectionName} — Animasi Lalu Lintas
                      </h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-1 rounded-full border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Sumber data simulasi">
                        {(["auto", "sensor"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSimSource(s)}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${simSource === s ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
                          >
                            {s === "auto" ? "Otomatis" : "Sensor"}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSimOpen((v) => !v)}
                        aria-expanded={isSimOpen}
                        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <span className="material-symbols-outlined text-base">
                          {isSimOpen ? "expand_less" : "expand_more"}
                        </span>
                        {isSimOpen ? "Tutup" : "Buka"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {simSource === "sensor"
                      ? "Hitungan murni ESP32 sensor (IR + HC-SR04) via MQTT."
                      : "Otomatis: telemetri kanonis terbaru per jalur (Server 2 + sensor)."
                  }
                  </p>
                  {isSimOpen && (
                    <div className="mt-3">
                      <TrafficRoadSimulation
                        key={`${simSource}-${simData?.deviceId || selectedIntersection}`}
                        data={simData}
                      />
                    </div>
                  )}
                </section>

                <TrafficTrendChart
                  timeRange={timeRange}
                  customDates={customDates}
                  intersectionId={selectedIntersection}
                />

                <IntersectionGrid />
              </div>

              <aside
                id="traffic-control-panel"
                className="scroll-mt-20 space-y-4 lg:space-y-6 xl:col-span-4"
              >
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

      <button
        type="button"
        onClick={() => setIsControlPanelOpen((current) => !current)}
        className="fixed bottom-5 left-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-2xl lg:hidden"
        aria-label="Buka panel kontrol"
      >
        <span className="material-symbols-outlined">
          tune
        </span>
      </button>
    </div>
  );
}