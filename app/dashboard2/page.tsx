"use client";

import DashboardStats from "@/components/DashboardStats";
import DashboardTimeFilter from "@/components/DashboardTimeFilter";
import Header from "@/components/Header";
import IntersectionGrid from "@/components/IntersectionGrid";
import LaneStatusPanel from "@/components/LaneStatusPanel";
import Sidebar from "@/components/Sidebar";
import AiStatusBadge from "@/components/AiStatusBadge";
import { useCameraLiveMap } from "@/lib/hooks/useCameraLive";
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
    north: "http://10.100.122.135",
    south: "",
    east: "",
    west: "",
  });
  const [camView, setCamView] = useState<"all" | CamLane>("all");
  const camLiveMap = useCameraLiveMap(selectedIntersection);
  const [isSimOpen, setIsSimOpen] = useState(true);
  const [camSource, setCamSource] = useState<Record<CamLane, "mjpeg" | "hls" | "webcam" | "upload">>({
    north: "mjpeg",
    south: "mjpeg",
    east: "mjpeg",
    west: "mjpeg",
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

  // Persist IP biar tidak hilang reload (rekomendasi)
  useEffect(() => {
    try {
      const savedUrls = localStorage.getItem("dashboard2_camUrls");
      if (savedUrls) setCamUrls(JSON.parse(savedUrls));
      const savedView = localStorage.getItem("dashboard2_camView") as "all" | CamLane | null;
      if (savedView) setCamView(savedView);
      const savedSource = localStorage.getItem("dashboard2_camSource");
      if (savedSource) setCamSource(JSON.parse(savedSource));
      const savedSim = localStorage.getItem("dashboard_simOpen");
      if (savedSim !== null) setIsSimOpen(savedSim === "true");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("dashboard_simOpen", String(isSimOpen));
    } catch {}
  }, [isSimOpen]);
  useEffect(() => {
    localStorage.setItem("dashboard2_camUrls", JSON.stringify(camUrls));
  }, [camUrls]);
  useEffect(() => {
    localStorage.setItem("dashboard2_camView", camView);
  }, [camView]);
  useEffect(() => {
    localStorage.setItem("dashboard2_camSource", JSON.stringify(camSource));
  }, [camSource]);

  const [yoloUrl, setYoloUrl] = useState("wss://vision.astraea.my.id/yolo-ws/ws");
  const [yoloEnabled, setYoloEnabled] = useState<Record<CamLane, boolean>>({ north: false, south: false, east: false, west: false });
  const [yoloLab, setYoloLab] = useState(false);
  const yoloWsRefs = useRef<Record<CamLane, WebSocket | null>>({ north: null, south: null, east: null, west: null });
  const yoloCanvasRefs = useRef<Record<CamLane, HTMLCanvasElement | null>>({ north: null, south: null, east: null, west: null });
  const yoloTimerRefs = useRef<Record<CamLane, ReturnType<typeof setInterval> | null>>({ north: null, south: null, east: null, west: null });
  const yoloSendCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [yoloBoxes, setYoloBoxes] = useState<Record<CamLane, { label: string; confidence: number; x: number; y: number; w: number; h: number; color: string }[]>>({ north: [], south: [], east: [], west: [] });
  const [yoloStats, setYoloStats] = useState<Record<CamLane, { totalVehicles: number; fps: number }>>({ north: { totalVehicles: 0, fps: 0 }, south: { totalVehicles: 0, fps: 0 }, east: { totalVehicles: 0, fps: 0 }, west: { totalVehicles: 0, fps: 0 } });
  const [yoloLastAt, setYoloLastAt] = useState<Record<CamLane, number>>({ north: 0, south: 0, east: 0, west: 0 });
  // Sumber data simulasi jalan: sensor (MQTT/ESP32) atau kamera (YOLO browser)
  const [simSource, setSimSource] = useState<"auto" | "sensor" | "camera">("auto");

  const drawYoloBoxes = (lane: CamLane, boxes: typeof yoloBoxes[CamLane]) => {
    const canvas = yoloCanvasRefs.current[lane];
    if (!canvas) return;
    const container = document.getElementById(`cam-card-${lane}`);
    const video = (container?.querySelector("video") as HTMLVideoElement) || (camVideoRefs.current[lane] as any);
    const img = (container?.querySelector(`img[data-lane="${lane}"]`) as HTMLImageElement) || (document.querySelector(`img[data-lane="${lane}"]`) as HTMLImageElement) || (container?.querySelector("img") as HTMLImageElement);
    const el: any = video && video.videoWidth ? video : img && (img as any).naturalWidth ? img : null;
    if (!canvas || !el) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = (el as HTMLVideoElement).videoWidth || (el as HTMLImageElement).naturalWidth || (el as any).width || 640;
    const h = (el as HTMLVideoElement).videoHeight || (el as HTMLImageElement).naturalHeight || (el as any).height || 480;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    for (const b of boxes) {
      const rx = (b.x / 100) * w, ry = (b.y / 100) * h, rw = (b.w / 100) * w, rh = (b.h / 100) * h;
      ctx.strokeStyle = b.color; ctx.lineWidth = 2; ctx.strokeRect(rx, ry, rw, rh);
      ctx.fillStyle = b.color; ctx.font = "bold 11px sans-serif";
      const txt = `${b.label} ${(b.confidence * 100).toFixed(0)}%`;
      const tw = ctx.measureText(txt).width;
      ctx.fillRect(rx, ry - 14, tw + 8, 14); ctx.fillStyle = "#fff"; ctx.fillText(txt, rx + 4, ry - 3);
    }
  };

  // redraw ketika boxes berubah (fix overlay tidak kelihatan)
  useEffect(() => {
    ALL_LANES.forEach((lane) => {
      const boxes = yoloBoxes[lane as CamLane];
      if (boxes?.length) drawYoloBoxes(lane as CamLane, boxes);
      else {
        const c = yoloCanvasRefs.current[lane as CamLane];
        if (c) { const ctx = c.getContext("2d"); if (ctx) ctx.clearRect(0, 0, c.width, c.height); }
      }
    });
  }, [yoloBoxes]);

  const connectYoloLane = (lane: CamLane) => {
    if (yoloWsRefs.current[lane]) yoloWsRefs.current[lane]?.close();
    const ws = new WebSocket(yoloUrl);
    yoloWsRefs.current[lane] = ws;
    ws.onopen = () => {
      // kirim frame tiap 100ms
      if (!yoloSendCanvasRef.current) yoloSendCanvasRef.current = document.createElement("canvas");
      const canvas = yoloSendCanvasRef.current!;
      yoloTimerRefs.current[lane] = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const container = document.getElementById(`cam-card-${lane}`);
        const vid = (container?.querySelector("video") as HTMLVideoElement) || camVideoRefs.current[lane];
        const img = (container?.querySelector(`img[data-lane="${lane}"]`) as HTMLImageElement) || (document.querySelector(`img[data-lane="${lane}"]`) as HTMLImageElement) || (container?.querySelector("img") as HTMLImageElement);
        let srcEl: any = null;
        if (vid && vid.videoWidth && vid.readyState >= 2) srcEl = vid;
        else if (img && (img as any).naturalWidth) srcEl = img;
        if (!srcEl) return;
        const W = 640; const H = 480;
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const sendDrawn = () => {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          if (ws.bufferedAmount > 1024 * 500) return; // jangan numpuk jika YOLO lambat
          ws.send(JSON.stringify({ type: "frame", data: dataUrl }));
        };
        try {
          ctx.drawImage(srcEl, 0, 0, W, H);
          sendDrawn();
        } catch {
          // Canvas ketainted (MJPEG tanpa CORS) → fallback ambil snapshot ber-CORS
          try {
            const src = (img as HTMLImageElement)?.currentSrc || (img as HTMLImageElement)?.src || "";
            const snap = src.includes("/esp32-cam-stream")
              ? src.replace("/esp32-cam-stream", "/esp32-cam-snapshot")
              : src.includes(":81/stream")
                ? src.replace(":81/stream", "/capture.jpg")
                : null;
            if (!snap) return;
            fetch(snap, { mode: "cors" })
              .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`snapshot ${r.status}`))))
              .then((b) => createImageBitmap(b))
              .then((bmp) => {
                if (ws.readyState !== WebSocket.OPEN) return;
                try {
                  ctx.drawImage(bmp, 0, 0, W, H);
                  sendDrawn();
                } catch {}
              })
              .catch(() => {});
          } catch {}
        }
      }, 500); // 2 FPS biar tidak overload model (fix overlay stuck)
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.detections) {
          const colorMap: Record<string, string> = { car: "#3b82f6", "mobil penumpang": "#3b82f6", bus: "#8b5cf6", truck: "#f59e0b", truk: "#f59e0b", motorcycle: "#10b981", motor: "#10b981", "sepeda motor": "#10b981", bicycle: "#ec4899", unmotorized: "#ec4899", pedestrian: "#fb7185", "pejalan kaki": "#fb7185", person: "#fb7185" };
          const boxes = data.detections.map((d: any) => ({ label: d.label, confidence: d.confidence, x: d.x, y: d.y, w: d.w, h: d.h, color: colorMap[String(d.label || "").toLowerCase()] || "#3b82f6" }));
          setYoloBoxes((s) => ({ ...s, [lane]: boxes }));
          if (data.stats) {
            setYoloStats((s) => ({ ...s, [lane]: { totalVehicles: data.stats.totalVehicles || 0, fps: data.stats.fps || 0 } }));
            setYoloLastAt((s) => ({ ...s, [lane]: Date.now() }));
          }
          drawYoloBoxes(lane, boxes);
        }
      } catch {}
    };
    ws.onclose = () => {
      if (yoloTimerRefs.current[lane]) { clearInterval(yoloTimerRefs.current[lane]!); yoloTimerRefs.current[lane] = null; }
      // auto-reconnect jika masih enabled (fix overlay stuck / keepalive timeout)
      if (yoloEnabled[lane]) setTimeout(() => connectYoloLane(lane), 2000);
    };
    ws.onerror = () => { try { ws.close(); } catch {} };
  };
  const disconnectYoloLane = (lane: CamLane) => {
    setYoloEnabled((s) => ({ ...s, [lane]: false }));
    yoloWsRefs.current[lane]?.close(); yoloWsRefs.current[lane] = null;
    if (yoloTimerRefs.current[lane]) { clearInterval(yoloTimerRefs.current[lane]!); yoloTimerRefs.current[lane] = null; }
    setYoloBoxes((s) => ({ ...s, [lane]: [] }));
  };
  useEffect(() => () => { ALL_LANES.forEach((l) => disconnectYoloLane(l as CamLane)); }, []);

  // Persist pilihan sumber simulasi
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dashboard_simSource") as "auto" | "sensor" | "camera" | null;
      if (saved === "auto" || saved === "sensor" || saved === "camera") setSimSource(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("dashboard_simSource", simSource);
    } catch {}
  }, [simSource]);

  // Data untuk simulasi jalan: fusion kamera (hitung YOLO) + sensor (lampu/level).
  // - sensor: murni MQTT/ESP32 (IR + HC-SR04)
  // - camera: vehicleCount per lane dari YOLO browser, lampu/level tetap sensor
  // - auto: pakai YOLO bila fresh (<5 dtk), else fallback sensor per lane
  const simData = useMemo(() => {
    if (!realtimeData) return realtimeData;
    if (simSource === "sensor") return realtimeData;
    const now = Date.now();
    const useLaneYolo = (lane: CamLane) => {
      if (simSource === "camera") return (yoloLastAt[lane] || 0) > 0;
      return now - (yoloLastAt[lane] || 0) < 5000;
    };
    let changed = false;
    const next: any = { ...realtimeData };
    for (const lane of ALL_LANES as readonly CamLane[]) {
      if (!useLaneYolo(lane)) continue;
      const count = Math.max(0, Math.floor(yoloStats[lane]?.totalVehicles ?? 0));
      const prev = (realtimeData as any)?.[lane];
      if (!prev) continue;
      next[lane] = {
        ...prev,
        vehicleCount: count,
        vehicleDetected: count > 0,
      };
      if (count !== prev.vehicleCount) changed = true;
    }
    void changed;
    return next as typeof realtimeData;
  }, [realtimeData, simSource, yoloStats, yoloLastAt]);

  const updateCamUrl = (lane: CamLane, url: string) =>
    setCamUrls((s) => ({ ...s, [lane]: url.replace(/\/$/, "") }));

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
                        IP custom per jalur — bisa MJPEG/HLS/Webcam/Upload (mirip Vision Lab)
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

                  {/* YOLO WS untuk deteksi seperti Vision Lab */}
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 p-2">
                    <span className="material-symbols-outlined text-sm text-purple-600">smart_toy</span>
                    <input
                      value={yoloUrl}
                      onChange={(e) => setYoloUrl(e.target.value)}
                      placeholder="wss://vision.astraea.my.id/yolo-ws/ws"
                      className="min-w-[220px] flex-1 rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-purple-600">Overlay AI (Lab) — visualisasi eksperimental, bukan sumber inferensi kontrol lampu</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !yoloLab;
                        setYoloLab(next);
                        for (const lane of visibleCamLanes) {
                          if (next) { setYoloEnabled((prev) => ({ ...prev, [lane]: true })); connectYoloLane(lane); }
                          else { disconnectYoloLane(lane); setYoloEnabled((prev) => ({ ...prev, [lane]: false })); }
                        }
                      }}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${yoloLab ? "bg-purple-600 text-white" : "bg-white text-purple-700 border border-purple-300"}`}
                    >
                      {yoloLab ? "Lab ON" : "Lab OFF"}
                    </button>
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
                              aria-label={`Pengaturan kamera ${lane}`}
                              className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
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
                          {camSource[lane] === "webcam" ? (
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
                            ref={(el) => {
                              yoloCanvasRefs.current[lane] = el;
                            }}
                            className="pointer-events-none absolute inset-0 h-full w-full"
                          />
                          <div className="pointer-events-none absolute bottom-1 left-1 max-w-[90%] truncate rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-white">
                            {camUrls[lane] || "-"} {yoloStats[lane]?.totalVehicles ? `• ${yoloStats[lane].totalVehicles} kendaraan` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span>Pengaturan per kamera via tombol <span className="material-symbols-outlined text-xs">tune</span> • Fullscreen per layar via <span className="material-symbols-outlined text-xs">fullscreen</span></span>
                    <a href="/vision-lab-7x9k-alpha" target="_blank" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700">
                      Vision Lab ↗
                    </a>
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
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">URL / IP Kamera</label>
                        <input
                          value={camUrls[camSettingsLane]}
                          onChange={(e) => updateCamUrl(camSettingsLane, e.target.value)}
                          placeholder="http://10.100.122.135 atau https://...m3u8"
                          className="mb-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                        />
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Sumber</label>
                        <div className="mb-3 flex flex-wrap gap-1">
                          {(["mjpeg", "hls", "webcam", "upload"] as const).map((src) => (
                            <button
                              key={src}
                              type="button"
                              onClick={() => { if (src === "webcam") void startCamWebcam(camSettingsLane); else if (src === "upload") camFileRefs.current[camSettingsLane]?.click(); else setCamSource((s) => ({ ...s, [camSettingsLane]: src })); }}
                              className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize ${camSource[camSettingsLane] === src ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                              {src}
                            </button>
                          ))}
                        </div>
                        <p className="mb-3 text-[10px] leading-relaxed text-slate-400">MJPEG = `http://IP:81/stream` (ESP32-CAM) • HLS = URL `m3u8` (mis. Bantul via `/bantul-stream/...`) • Webcam = kamera laptop • Upload = file video/gambar.</p>
                        <button type="button" onClick={() => setCamSettingsLane(null)} className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-700">
                          Selesai
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* ===== SIMULASI JALAN (bisa tutup/buka; count bisa dari kamera YOLO / sensor) ===== */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Simulasi Jalan • {simSource === "camera" ? "Mode Kamera" : simSource === "sensor" ? "Mode Sensor" : "Mode Otomatis"}
                      </p>
                      <h2 className="text-lg font-bold text-slate-900">
                        {selectedIntersectionName} — Animasi Lalu Lintas
                      </h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-1 rounded-full border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Sumber data simulasi">
                        {(["auto", "sensor", "camera"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSimSource(s)}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${simSource === s ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
                          >
                            {s === "auto" ? "Otomatis" : s === "sensor" ? "Sensor" : "Kamera"}
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
                      : simSource === "camera"
                        ? "Hitungan dari deteksi YOLO kamera di browser; lampu/level tetap dari sensor."
                        : "Otomatis: pakai hitungan YOLO bila ada & fresh (<5 dtk) per jalur, else fallback sensor."}
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