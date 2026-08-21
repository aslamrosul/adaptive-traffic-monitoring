"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Source = "webcam" | "rtsp" | "upload";
type DetectionState = "idle" | "connecting" | "streaming" | "error" | "simulated";

interface DetectionBox {
  label: string;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

interface DetectionStats {
  totalVehicles: number;
  car: number;
  truck: number;
  bus: number;
  motorcycle: number;
  bicycle: number;
  fps: number;
  inferenceMs: number;
}

const VEHICLE_CLASSES = [
  { label: "Car", color: "#3b82f6" },
  { label: "Bus", color: "#8b5cf6" },
  { label: "Truck", color: "#f59e0b" },
  { label: "Motorcycle", color: "#10b981" },
  { label: "Bicycle", color: "#ec4899" },
];

export default function VisionLabPage() {
  const [source, setSource] = useState<Source>("webcam");
  const [state, setState] = useState<DetectionState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rtspUrl, setRtspUrl] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [confidence, setConfidence] = useState(0.5);
  const [detectionEnabled, setDetectionEnabled] = useState(true);
  const [boxes, setBoxes] = useState<DetectionBox[]>([]);
  const [stats, setStats] = useState<DetectionStats>({
    totalVehicles: 0, car: 0, truck: 0, bus: 0, motorcycle: 0, bicycle: 0, fps: 0, inferenceMs: 0,
  });
  const [streamLabel, setStreamLabel] = useState("Not connected");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const drawBoxes = useCallback((drawBoxes: DetectionBox[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    for (const b of drawBoxes) {
      const rx = (b.x / 100) * w;
      const ry = (b.y / 100) * h;
      const rw = (b.w / 100) * w;
      const rh = (b.h / 100) * h;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.fillStyle = b.color;
      ctx.font = "bold 13px sans-serif";
      const text = `${b.label} ${(b.confidence * 100).toFixed(0)}%`;
      const tw = ctx.measureText(text).width;
      ctx.fillRect(rx, ry - 18, tw + 8, 18);
      ctx.fillStyle = "#fff";
      ctx.fillText(text, rx + 4, ry - 5);
    }
  }, []);

  const clearBoxes = useCallback(() => {
    setBoxes([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startSimulated = useCallback(() => {
    setState("simulated");
    setErrorMsg(null);
    if (simRef.current) clearInterval(simRef.current);
    let counter = 0;
    simRef.current = setInterval(() => {
      counter += 1;
      const num = 1 + Math.floor(Math.random() * 5);
      const simBoxes: DetectionBox[] = [];
      const newStats: DetectionStats = {
        totalVehicles: counter * num, car: 0, truck: 0, bus: 0, motorcycle: 0, bicycle: 0,
        fps: 25 + Math.random() * 10, inferenceMs: 15 + Math.random() * 20,
      };
      for (let i = 0; i < num; i++) {
        const cls = VEHICLE_CLASSES[Math.floor(Math.random() * VEHICLE_CLASSES.length)];
        const key = cls.label.toLowerCase() as keyof DetectionStats;
        newStats[key] = (newStats[key] as number) + 1;
        simBoxes.push({
          label: cls.label,
          color: cls.color,
          confidence: 0.6 + Math.random() * 0.39,
          x: 5 + Math.random() * 70,
          y: 20 + Math.random() * 50,
          w: 8 + Math.random() * 20,
          h: 10 + Math.random() * 25,
        });
      }
      setStats((s) => ({ ...newStats, totalVehicles: s.totalVehicles + num }));
      setBoxes(simBoxes);
      if (detectionEnabled) drawBoxes(simBoxes);
      else clearBoxes();
    }, 800);
  }, [detectionEnabled, drawBoxes, clearBoxes]);

  const stopSimulated = useCallback(() => {
    if (simRef.current) { clearInterval(simRef.current); simRef.current = null; }
  }, []);

  const startWebcam = useCallback(async () => {
    setState("connecting");
    setErrorMsg(null);
    clearBoxes();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("streaming");
      setStreamLabel(`Webcam ${videoRef.current?.videoWidth || 0}x${videoRef.current?.videoHeight || 0}`);
      if (!wsUrl) startSimulated();
    } catch (err: any) {
      setState("error");
      setErrorMsg(err?.message || "Tidak dapat mengakses webcam. Periksa izin browser.");
    }
  }, [clearBoxes, wsUrl, startSimulated]);

  const stopStream = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const s = videoRef.current.srcObject as MediaStream;
      s.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (videoRef.current) videoRef.current.src = "";
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    stopSimulated();
    setState("idle");
    setStreamLabel("Not connected");
    clearBoxes();
    setStats({ totalVehicles: 0, car: 0, truck: 0, bus: 0, motorcycle: 0, bicycle: 0, fps: 0, inferenceMs: 0 });
  }, [stopSimulated, clearBoxes]);

  const startRtsp = useCallback(() => {
    if (!rtspUrl) {
      setErrorMsg("URL RTSP harus diisi");
      return;
    }
    setErrorMsg(null);
    setState("connecting");
    setStreamLabel(`Menunggu stream dari ${rtspUrl}...`);
    if (videoRef.current) {
      videoRef.current.src = rtspUrl;
      videoRef.current.play().then(() => {
        setState("streaming");
        setStreamLabel(`RTSP Stream`);
        if (!wsUrl) startSimulated();
      }).catch(() => {
        setState("error");
        setErrorMsg("Browser tidak bisa memutar RTSP langsung. Diperlukan server transcode (e.g. MediaMTX). Gunakan URL HLS/WebRTC yang sudah di-transcode.");
      });
    }
  }, [rtspUrl, wsUrl, startSimulated]);

  const startUpload = useCallback(() => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setErrorMsg("Pilih file video dahulu"); return; }
    setErrorMsg(null);
    setState("streaming");
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(file);
      videoRef.current.loop = true;
      void videoRef.current.play();
      setStreamLabel(`File: ${file.name}`);
      if (!wsUrl) startSimulated();
    }
  }, [wsUrl, startSimulated]);

  const connectWs = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (!wsUrl) return;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => { stopSimulated(); setStreamLabel(s => s + " [YOLOv8 connected]"); };
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.detections && Array.isArray(data.detections)) {
            const incoming: DetectionBox[] = data.detections
              .filter((d: any) => d.confidence >= confidence)
              .map((d: any) => ({
                label: d.label || d.class || "vehicle",
                confidence: d.confidence,
                x: d.x, y: d.y, w: d.w, h: d.h,
                color: VEHICLE_CLASSES.find((v) => v.label.toLowerCase() === String(d.label || d.class).toLowerCase())?.color || "#3b82f6",
              }));
            setBoxes(incoming);
            if (detectionEnabled) drawBoxes(incoming); else clearBoxes();
            if (data.stats) setStats(data.stats);
          }
        } catch { /* ignore */ }
      };
      ws.onclose = () => { setStreamLabel(s => s.replace(" [YOLOv8 connected]", "")); };
      ws.onerror = () => { setErrorMsg("WebSocket error — periksa URL server YOLOv8"); };
    } catch (err: any) {
      setErrorMsg("Gagal koneksi WebSocket: " + err.message);
    }
  }, [wsUrl, confidence, detectionEnabled, drawBoxes, clearBoxes, stopSimulated]);

  const disconnectWs = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setStreamLabel((s) => s.replace(" [YOLOv8 connected]", ""));
  }, []);

  useEffect(() => () => { stopStream(); disconnectWs(); }, [stopStream, disconnectWs]);

  useEffect(() => {
    if (state !== "streaming" && state !== "simulated") return;
    if (detectionEnabled) drawBoxes(boxes); else clearBoxes();
  }, [detectionEnabled, boxes, state, drawBoxes, clearBoxes]);

  const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      </div>
      <p className="mt-1 text-base font-black text-slate-800">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Top Bar */}
      <div className="border-b border-slate-700/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 text-white shadow-lg">
            <span className="material-symbols-outlined text-xl">videocam</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight">Vision Lab</h1>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                Staging
              </span>
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[9px] font-mono text-slate-400">v0.1-alpha</span>
            </div>
            <p className="text-[10px] text-slate-400">Computer Vision Playground — YOLOv8 Vehicle Detection</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[10px] font-bold ${state === "streaming" || state === "simulated" ? "text-emerald-400" : state === "connecting" ? "text-amber-400" : state === "error" ? "text-red-400" : "text-slate-500"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${(state === "streaming" || state === "simulated") ? "bg-emerald-400 animate-pulse" : state === "connecting" ? "bg-amber-400 animate-pulse" : state === "error" ? "bg-red-400" : "bg-slate-500"}`} />
            {state.toUpperCase()}
          </span>
          <a href="/dashboard" className="text-[10px] text-slate-400 hover:text-slate-200">&larr; Dashboard</a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4 lg:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Video + Canvas */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-black aspect-video">
              <video
                ref={videoRef}
                className={`h-full w-full object-contain ${state === "idle" ? "hidden" : ""}`}
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
              {state === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-600">
                  <span className="material-symbols-outlined text-5xl">videocam_off</span>
                  <p className="text-sm">Pilih sumber video dan tekan Start</p>
                </div>
              )}
              {state === "connecting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
                  <p className="text-xs">Connecting...</p>
                </div>
              )}
              {/* Overlay info */}
              {(state === "streaming" || state === "simulated") && (
                <div className="absolute left-3 top-3 flex flex-col gap-1">
                  <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono text-emerald-400">{streamLabel}</span>
                  {wsUrl && wsRef.current && (
                    <span className="rounded bg-purple-600/60 px-2 py-0.5 text-[10px] font-mono text-white">YOLOv8 LIVE</span>
                  )}
                  {!wsUrl && (state === "streaming" || state === "simulated") && (
                    <span className="rounded bg-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">SIMULATED</span>
                  )}
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <span className="material-symbols-outlined text-sm align-middle mr-1">error</span>
                {errorMsg}
              </div>
            )}

            {/* Controls */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Sumber Video</label>
                <div className="flex gap-2">
                  {(["webcam", "rtsp", "upload"] as Source[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSource(s)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        source === s ? "bg-blue-600 text-white shadow" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{s === "webcam" ? "photo_camera" : s === "rtsp" ? "cable" : "upload_file"}</span>
                      {s === "webcam" ? "Webcam" : s === "rtsp" ? "RTSP/HLS" : "Upload Video"}
                    </button>
                  ))}
                </div>
              </div>

              {source === "webcam" && (
                <button
                  onClick={state === "streaming" || state === "simulated" ? stopStream : startWebcam}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                    state === "streaming" || state === "simulated"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {state === "streaming" || state === "simulated" ? "Stop Webcam" : "Start Webcam"}
                </button>
              )}

              {source === "rtsp" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={rtspUrl}
                    onChange={(e) => setRtspUrl(e.target.value)}
                    placeholder="rtsp://... atau http://.../stream.m3u8"
                    className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={startRtsp} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Connect</button>
                    <button onClick={stopStream} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">Stop</button>
                  </div>
                  <p className="text-[10px] text-slate-500">Browser tidak mendukung RTSP native. Gunakan MediaMTX untuk transcoding ke HLS/WebRTC.</p>
                </div>
              )}

              {source === "upload" && (
                <div className="space-y-2">
                  <input ref={fileRef} type="file" accept="video/*" className="w-full text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-blue-700" />
                  <div className="flex gap-2">
                    <button onClick={startUpload} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Play</button>
                    <button onClick={stopStream} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">Stop</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-3">
            {/* YOLOv8 Connection */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-purple-400">hub</span>
              <h3 className="text-xs font-bold text-slate-200">YOLOv8 Detection Server</h3>
              </div>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://ec2-host:8080/ws"
                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={wsRef.current ? disconnectWs : connectWs}
                  disabled={!wsUrl}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-40 ${
                    wsRef.current ? "bg-red-600 text-white hover:bg-red-700" : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  {wsRef.current ? "Disconnect" : "Connect WS"}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Hubungkan ke server YOLOv8 inference untuk deteksi real-time. Tanpa koneksi, simulasi aktif.</p>
            </div>

            {/* Detection Settings */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 space-y-3">
              <h3 className="text-xs font-bold text-slate-200">Pengaturan Deteksi</h3>
              <label className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Enable Overlay</span>
                <button
                  onClick={() => setDetectionEnabled(!detectionEnabled)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${detectionEnabled ? "bg-blue-600" : "bg-slate-600"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${detectionEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </label>
              <div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Confidence Threshold</span>
                  <span className="font-mono font-bold text-blue-400">{(confidence * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min={0.1} max={0.9} step={0.05}
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="mt-1 w-full accent-blue-500"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 space-y-2">
              <h3 className="text-xs font-bold text-slate-200">Statistik Deteksi</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 rounded-lg bg-slate-900 p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Kendaraan</p>
                  <p className="text-2xl font-black text-blue-400">{stats.totalVehicles.toLocaleString()}</p>
                </div>
                <StatCard label="Car" value={stats.car} color="#3b82f6" />
                <StatCard label="Truck" value={stats.truck} color="#f59e0b" />
                <StatCard label="Bus" value={stats.bus} color="#8b5cf6" />
                <StatCard label="Motor" value={stats.motorcycle} color="#10b981" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg bg-slate-900 p-2">
                  <p className="text-[9px] font-bold uppercase text-slate-500">FPS</p>
                  <p className="text-sm font-bold text-emerald-400">{stats.fps.toFixed(1)}</p>
                </div>
                <div className="rounded-lg bg-slate-900 p-2">
                  <p className="text-[9px] font-bold uppercase text-slate-500">Inference</p>
                  <p className="text-sm font-bold text-emerald-400">{stats.inferenceMs.toFixed(0)}ms</p>
                </div>
              </div>
            </div>

            {/* Guide */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
              <h3 className="text-xs font-bold text-slate-200 mb-2">Status Lingkungan</h3>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Browser Webcam</span>
                  <span className="text-emerald-400 font-bold">Available</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RTSP Direct</span>
                  <span className="text-amber-400 font-bold">Need Transcoder</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">YOLOv8 Server</span>
                  <span className={wsRef.current ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                    {wsRef.current ? "Connected" : "Not Connected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Simulasi</span>
                  <span className="text-emerald-400 font-bold">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
