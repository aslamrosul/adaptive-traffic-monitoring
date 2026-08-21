"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/useT";

interface LaneStats {
  averageQueueLevel: number;
  level2Percentage: number;
  averageGreenDuration: number;
  detectionRatio: number;
  latestLevel: number;
  latestQueueLength: number;
  samples: number;
}

interface Insight {
  type: "info" | "warning" | "critical";
  title: string;
  message: string;
}

interface Recommendation {
  lane: string;
  level: number;
  currentGreenS: number;
  recommendedGreenS: number;
  action: "increase" | "decrease" | "keep";
  reason: string;
}

interface SummaryData {
  generatedAt: string;
  period: { startDate: string; endDate: string };
  dataStatus: { itemCount: number; hasEnoughData: boolean };
  overview: string;
  keyMetrics: {
    totalSamples: number;
    averageQueueLevel: number;
    peakHour: string | null;
    peakHourLevel2Percentage: number;
    devicesOnline: number;
    devicesOffline: number;
    adaptiveMode: boolean | null;
  };
  lanes: Record<string, LaneStats>;
  insights: Insight[];
  recommendations: Recommendation[];
}

const LANE_LABELS: Record<string, string> = {
  north: "Utara",
  south: "Selatan",
  east: "Timur",
};

export default function AiQuickStats() {
  const t = useT();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/summary");
      const json = await res.json();
      if (json.success) setSummary(json.data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary();
    const interval = setInterval(() => void fetchSummary(), 30000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  const levelColor = (level: number) => {
    if (level >= 2) return "bg-red-100 text-red-700 border-red-200";
    if (level >= 1) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const insightIcon = (type: string) => {
    if (type === "critical") return "error";
    if (type === "warning") return "warning";
    return "info";
  };

  const insightColor = (type: string) => {
    if (type === "critical") return "text-red-500";
    if (type === "warning") return "text-amber-500";
    return "text-blue-500";
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-slate-400">Gagal memuat data</p>
      </div>
    );
  }

  const { keyMetrics, lanes, insights, recommendations } = summary;
  const laneEntries = Object.entries(lanes || {}).filter(
    ([, v]) => v && v.samples > 0,
  );

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-lg text-slate-400">
          monitoring
        </span>
        <h3 className="text-sm font-bold text-slate-700">Status Sistem</h3>
      </div>

      {/* Device status */}
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Status Perangkat
          </p>
          <span
            className={`flex items-center gap-1 text-[10px] font-bold ${
              keyMetrics.devicesOffline === 0
                ? "text-emerald-600"
                : "text-red-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                keyMetrics.devicesOffline === 0
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            {keyMetrics.devicesOffline === 0 ? "ALL ONLINE" : "OFFLINE"}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-800">
            {keyMetrics.devicesOnline}
          </span>
          <span className="text-sm font-semibold text-slate-400">
            / {keyMetrics.devicesOnline + keyMetrics.devicesOffline}
          </span>
          <span className="ml-1 text-[11px] text-slate-400">perangkat aktif</span>
        </div>
      </div>

      {/* Queue levels per lane */}
      {laneEntries.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Level Antrean Terkini
          </p>
          <div className="mt-2 space-y-1.5">
            {laneEntries.map(([lane, stats]) => (
              <div
                key={lane}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-xs font-semibold text-slate-600">
                  {LANE_LABELS[lane] || lane}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${levelColor(
                      stats.latestLevel,
                    )}`}
                  >
                    Lv {stats.latestLevel}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {stats.latestQueueLength} kendaraan
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Sampel
          </p>
          <p className="mt-1 text-lg font-black text-slate-800">
            {keyMetrics.totalSamples.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Rata-rata Lv
          </p>
          <p className="mt-1 text-lg font-black text-slate-800">
            {keyMetrics.averageQueueLevel}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Jam Puncak
          </p>
          <p className="mt-1 text-lg font-black text-slate-800">
            {keyMetrics.peakHour || "-"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Mode Adaptif
          </p>
          <p className="mt-1 text-lg font-black text-slate-800">
            {keyMetrics.adaptiveMode === true
              ? "ON"
              : keyMetrics.adaptiveMode === false
                ? "OFF"
                : "-"}
          </p>
        </div>
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Insight & Alert
          </p>
          {insights.slice(0, 3).map((insight, i) => (
            <div
              key={i}
              className={`rounded-xl border p-2.5 ${
                insight.type === "critical"
                  ? "border-red-200 bg-red-50"
                  : insight.type === "warning"
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`material-symbols-outlined text-sm ${insightColor(
                    insight.type,
                  )}`}
                >
                  {insightIcon(insight.type)}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-700">
                    {insight.title}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
                    {insight.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Rekomendasi Durasi Lampu
          </p>
          {recommendations.slice(0, 3).map((rec, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">
                  {LANE_LABELS[rec.lane] || rec.lane}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    rec.action === "increase"
                      ? "text-red-500"
                      : rec.action === "decrease"
                        ? "text-emerald-500"
                        : "text-slate-400"
                  }`}
                >
                  {rec.action === "increase"
                    ? "↑"
                    : rec.action === "decrease"
                      ? "↓"
                      : "="}{" "}
                  {rec.currentGreenS}s → {rec.recommendedGreenS}s
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data period */}
      <div className="mt-auto pt-2">
        <p className="text-[9px] text-slate-400">
          Periode data: {summary.period.startDate} — {summary.period.endDate}
        </p>
        <p className="text-[9px] text-slate-400">
          Diperbarui: {summary.generatedAt}
        </p>
      </div>
    </div>
  );
}
