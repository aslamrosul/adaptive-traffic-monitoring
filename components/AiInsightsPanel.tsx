"use client";

import { useCallback, useEffect, useState } from "react";
import AiChatBox from "@/components/AiChatBox";
import { useT } from "@/lib/useT";

type TabKey = "summary" | "forecast" | "anomaly" | "chat";

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

interface AiSummaryData {
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

interface ForecastPoint {
  period: string;
  hour: number;
  label: string;
  north: number;
  south: number;
  east: number;
  average: number;
  confidence: "high" | "medium" | "low";
}

interface AnomalyItem {
  type: string;
  severity: "low" | "medium" | "high";
  lane?: string;
  deviceId?: string;
  title: string;
  description: string;
}

interface AiWidgetProps {
  intersectionId?: string;
  startDate?: string;
  endDate?: string;
}

const TABS: { key: TabKey; icon: string }[] = [
  { key: "summary", icon: "summarize" },
  { key: "forecast", icon: "query_stats" },
  { key: "anomaly", icon: "warning" },
  { key: "chat", icon: "chat" },
];

export default function AiInsightsPanel({
  intersectionId,
  startDate,
  endDate,
}: AiWidgetProps) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [summary, setSummary] = useState<AiSummaryData | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[] | null>(null);
  const [forecastMessage, setForecastMessage] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const queryParams = (extra = "") => {
    const params = new URLSearchParams(extra);
    if (intersectionId) params.set("intersectionId", intersectionId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const query = params.toString();
    return query ? `?${query}` : "";
  };

  const fetchAll = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [summaryRes, forecastRes, anomalyRes] = await Promise.all([
          fetch(`/api/ai/summary${queryParams()}`),
          fetch(`/api/ai/forecast${queryParams("hours=6")}`),
          fetch(`/api/ai/anomaly${queryParams()}`),
        ]);

        const summaryJson = await summaryRes.json();
        const forecastJson = await forecastRes.json();
        const anomalyJson = await anomalyRes.json();

        if (!summaryJson.success) throw new Error(summaryJson.error);
        if (!forecastJson.success) throw new Error(forecastJson.error);
        if (!anomalyJson.success) throw new Error(anomalyJson.error);

        setSummary(summaryJson.data);
        setForecast(forecastJson.data.hours || []);
        setForecastMessage(forecastJson.data.message || null);
        setAnomalies(anomalyJson.data.anomalies || []);
      } catch (err: any) {
        setError(err?.message || "Gagal memuat data AI");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intersectionId, startDate, endDate]
  );

  useEffect(() => {
    void fetchAll(false);
    const interval = setInterval(() => void fetchAll(false), 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const levelColor = (level: number) => {
    if (level >= 2) return "text-red-600 bg-red-50";
    if (level >= 1) return "text-yellow-700 bg-yellow-50";
    return "text-emerald-600 bg-emerald-50";
  };

  const severityStyle = (severity: string) => {
    if (severity === "high") return "border-red-200 bg-red-50 text-red-800";
    if (severity === "medium")
      return "border-amber-200 bg-amber-50 text-amber-800";
    return "border-slate-200 bg-slate-50 text-slate-700";
  };

  const severityLabel = (severity: string) =>
    severity === "high"
      ? t("ai.severity.high")
      : severity === "medium"
        ? t("ai.severity.medium")
        : t("ai.severity.low");

  const actionLabel = (action: string) =>
    action === "increase"
      ? t("ai.action.increase")
      : action === "decrease"
        ? t("ai.action.decrease")
        : t("ai.action.keep");

  const confidenceLabel = (confidence: string) =>
    confidence === "high"
      ? t("ai.confidence.high")
      : confidence === "medium"
        ? t("ai.confidence.medium")
        : t("ai.confidence.low");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {t("ai.title")}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("ai.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === tab.key
                    ? "bg-white text-blue-600 shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {tab.icon}
                </span>
                {t(`ai.tabs.${tab.key}`)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void fetchAll(true)}
            disabled={refreshing || loading}
            className="rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
            title={t("ai.refresh")}
          >
            <span
              className={`material-symbols-outlined text-sm ${
                refreshing ? "animate-spin" : ""
              }`}
            >
              refresh
            </span>
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-5">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading && !summary ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : activeTab === "summary" ? (
          <SummaryTab
            t={t}
            summary={summary}
            levelColor={levelColor}
            actionLabel={actionLabel}
          />
        ) : activeTab === "forecast" ? (
          <ForecastTab
            t={t}
            forecast={forecast}
            message={forecastMessage}
            levelColor={levelColor}
            confidenceLabel={confidenceLabel}
          />
        ) : activeTab === "anomaly" ? (
          <AnomalyTab
            t={t}
            anomalies={anomalies}
            severityStyle={severityStyle}
            severityLabel={severityLabel}
          />
        ) : (
          <AiChatBox
            intersectionId={intersectionId}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Summary tab
// ---------------------------------------------------------------------------

function SummaryTab({
  t,
  summary,
  levelColor,
  actionLabel,
}: {
  t: (key: string) => string;
  summary: AiSummaryData | null;
  levelColor: (level: number) => string;
  actionLabel: (action: string) => string;
}) {
  if (!summary) {
    return <p className="text-sm text-slate-500">{t("ai.loading")}</p>;
  }

  const metricChips = [
    {
      label: t("ai.summary.samples"),
      value: summary.keyMetrics.totalSamples.toLocaleString("id-ID"),
    },
    {
      label: t("ai.summary.avgQueue"),
      value: String(summary.keyMetrics.averageQueueLevel),
    },
    {
      label: t("ai.summary.peakHour"),
      value: summary.keyMetrics.peakHour || "-",
    },
    {
      label: t("ai.summary.devicesOnline"),
      value: `${summary.keyMetrics.devicesOnline}/${summary.keyMetrics.devicesOnline + summary.keyMetrics.devicesOffline}`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-800 leading-relaxed">
        <p>{summary.overview}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricChips.map((chip) => (
          <div
            key={chip.label}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {chip.label}
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {chip.value}
            </p>
          </div>
        ))}
      </div>

      {summary.insights.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-900">
            {t("ai.summary.insights")}
          </h3>
          <div className="space-y-2">
            {summary.insights.map((insight, index) => (
              <div
                key={index}
                className={`rounded-xl border p-3 text-sm ${
                  insight.type === "critical"
                    ? "border-red-200 bg-red-50"
                    : insight.type === "warning"
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="font-semibold text-slate-800">
                  {insight.title}
                </p>
                <p className="mt-0.5 text-slate-600">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.recommendations.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-900">
            {t("ai.summary.recommendations")}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">{t("ai.summary.colLane")}</th>
                  <th className="px-3 py-2">{t("ai.summary.colLevel")}</th>
                  <th className="px-3 py-2">{t("ai.summary.colCurrent")}</th>
                  <th className="px-3 py-2">{t("ai.summary.colRecommended")}</th>
                  <th className="px-3 py-2">{t("ai.summary.colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recommendations.map((rec) => (
                  <tr key={rec.lane}>
                    <td className="px-3 py-2 font-semibold text-slate-800">
                      {t(`traffic.${rec.lane}`)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${levelColor(rec.level)}`}
                      >
                        {rec.level}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {rec.currentGreenS}s
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-800">
                      {rec.recommendedGreenS}s
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-semibold text-blue-600">
                        {actionLabel(rec.action)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Forecast tab
// ---------------------------------------------------------------------------

function ForecastTab({
  t,
  forecast,
  message,
  levelColor,
  confidenceLabel,
}: {
  t: (key: string) => string;
  forecast: ForecastPoint[] | null;
  message: string | null;
  levelColor: (level: number) => string;
  confidenceLabel: (confidence: string) => string;
}) {
  if (forecast && forecast.length > 0) {
    return (
      <div>
        <p className="mb-3 text-xs text-slate-500">{message}</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">{t("ai.forecast.colHour")}</th>
                <th className="px-3 py-2">{t("traffic.north")}</th>
                <th className="px-3 py-2">{t("traffic.south")}</th>
                <th className="px-3 py-2">{t("traffic.east")}</th>
                <th className="px-3 py-2">{t("ai.forecast.colAvg")}</th>
                <th className="px-3 py-2">{t("ai.forecast.colConfidence")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forecast.map((point) => (
                <tr key={point.period}>
                  <td className="px-3 py-2 font-semibold text-slate-800">
                    {point.label}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${levelColor(point.north)}`}
                    >
                      {point.north}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${levelColor(point.south)}`}
                    >
                      {point.south}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${levelColor(point.east)}`}
                    >
                      {point.east}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{point.average}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {confidenceLabel(point.confidence)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      {message || t("ai.forecast.noData")}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Anomaly tab
// ---------------------------------------------------------------------------

function AnomalyTab({
  t,
  anomalies,
  severityStyle,
  severityLabel,
}: {
  t: (key: string) => string;
  anomalies: AnomalyItem[] | null;
  severityStyle: (severity: string) => string;
  severityLabel: (severity: string) => string;
}) {
  if (!anomalies) {
    return <p className="text-sm text-slate-500">{t("ai.loading")}</p>;
  }

  if (anomalies.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <span className="material-symbols-outlined text-3xl text-emerald-500">
          verified
        </span>
        <p className="text-sm font-semibold text-emerald-700">
          {t("ai.anomaly.none")}
        </p>
        <p className="text-xs text-emerald-600">
          {t("ai.anomaly.noneDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {anomalies.map((anomaly, index) => (
        <div
          key={index}
          className={`rounded-xl border p-3 ${severityStyle(anomaly.severity)}`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{anomaly.title}</p>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              {severityLabel(anomaly.severity)}
            </span>
          </div>
          <p className="mt-1 text-xs opacity-80">{anomaly.description}</p>
          {anomaly.lane && (
            <p className="mt-1 text-[11px] font-semibold opacity-70">
              {anomaly.lane.toUpperCase()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

