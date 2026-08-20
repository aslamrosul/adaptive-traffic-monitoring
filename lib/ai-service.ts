import "server-only";

import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  awsTables,
  dynamo,
  getRecentTraffic,
  scanTrafficByDateRange,
} from "@/lib/aws-dynamodb";
import {
  TRAFFIC_LANES,
  getItemTimestamp,
  normalizeTrafficItem,
  type TrafficLane,
} from "@/lib/traffic-adapter";
import {
  APP_TIMEZONE,
  addDaysToDateValue,
  getWibDateValue,
  getWibHour,
  wibDateRangeToUtc,
} from "@/lib/timezone";

const LANE_NAMES: TrafficLane[] = [...TRAFFIC_LANES];

/** Durasi hijau yang direkomendasikan per level antrian (detik). */
const RECOMMENDED_GREEN_BY_LEVEL: Record<number, number> = {
  0: 10,
  1: 20,
  2: 30,
};

const DEFAULT_INTERSECTION = "SIMPANG_TALUN_01";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiRecommendation {
  lane: TrafficLane;
  level: number;
  currentGreenS: number;
  recommendedGreenS: number;
  action: "increase" | "decrease" | "keep";
  reason: string;
}

export interface AiInsight {
  type: "info" | "warning" | "critical";
  title: string;
  message: string;
}

export interface AiLaneStats {
  averageQueueLevel: number;
  level2Percentage: number;
  averageGreenDuration: number;
  detectionRatio: number;
  latestLevel: number;
  latestQueueLength: number;
  samples: number;
}

export interface AiSummary {
  generatedAt: string;
  intersectionId: string | null;
  period: { startDate: string; endDate: string };
  dataStatus: { itemCount: number; hasEnoughData: boolean };
  overview: string;
  keyMetrics: {
    totalSamples: number;
    averageQueueLevel: number;
    peakHour: string | null;
    peakHourLabel: string | null;
    peakHourLevel2Percentage: number;
    devicesOnline: number;
    devicesOffline: number;
    adaptiveMode: boolean | null;
  };
  lanes: Partial<Record<TrafficLane, AiLaneStats>>;
  insights: AiInsight[];
  recommendations: AiRecommendation[];
}

export interface AiForecastPoint {
  period: string;
  hour: number;
  label: string;
  north: number;
  south: number;
  east: number;
  average: number;
  confidence: "high" | "medium" | "low";
}

export interface AiForecast {
  generatedAt: string;
  intersectionId: string | null;
  hours: AiForecastPoint[];
  method: string;
  message: string | null;
}

export type AiAnomalyType =
  | "queue-spike"
  | "zero-activity"
  | "device-offline"
  | "light-stuck";

export interface AiAnomaly {
  type: AiAnomalyType;
  severity: "low" | "medium" | "high";
  lane?: TrafficLane;
  deviceId?: string;
  title: string;
  description: string;
}

export interface AiAnomalyResult {
  generatedAt: string;
  intersectionId: string | null;
  anomalies: AiAnomaly[];
  summary: { total: number; high: number; medium: number; low: number };
}

export interface AiChatAction {
  label: string;
  href: string;
}

export interface AiChatResponse {
  answer: string;
  source: "ai" | "template";
  actions: AiChatAction[];
}

export interface AiRequestContext {
  intersectionId?: string | null;
  startDate?: string;
  endDate?: string;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampLevel(value: number): number {
  if (value < 0) return 0;
  if (value > 2) return 2;
  return round2(value);
}

function toBool(value: any): boolean {
  if (typeof value === "boolean") return value;
  return value === "true" || value === 1 || value === "1";
}

function resolveRange(ctx: AiRequestContext) {
  const today = getWibDateValue();
  const startDate = ctx.startDate || today;
  const endDate = ctx.endDate || startDate;
  const { startUtc, endUtc } = wibDateRangeToUtc(startDate, endDate);
  return { startDate, endDate, startUtc, endUtc };
}

function scanDeviceStatus(limit = 500) {
  return dynamo.send(
    new ScanCommand({
      TableName: awsTables.deviceStatus,
      Limit: limit,
    })
  );
}

async function getDeviceOnlineStats() {
  try {
    const result = await scanDeviceStatus();
    const devices = (result.Items || []).filter((d) => d.device_id);
    let online = 0;
    let offline = 0;

    for (const device of devices) {
      const lastSeen =
        device.last_seen || device.lastSeen || device.updated_at || null;
      const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
      const isOnline =
        lastSeenTime > 0 && Date.now() - lastSeenTime < 2 * 60 * 1000;
      if (isOnline) online += 1;
      else offline += 1;
    }

    return { online, offline, devices };
  } catch {
    return { online: 0, offline: 0, devices: [] as any[] };
  }
}

/** Ambil telemetry terbaru (dinormalisasi) untuk intersection atau global. */
async function getLatestNormalized(
  intersectionId: string | null | undefined
): Promise<any[]> {
  const items = await getRecentTraffic(50);
  const normalized = items.map(normalizeTrafficItem);

  if (intersectionId) {
    return normalized.filter(
      (item) => item.intersectionId === intersectionId
    );
  }

  return normalized;
}

function laneLevelOf(normalizedItem: any, lane: TrafficLane): number {
  return Number(normalizedItem?.[lane]?.queueLevel ?? 0);
}

function laneQueueLengthOf(normalizedItem: any, lane: TrafficLane): number {
  return Number(normalizedItem?.[lane]?.queueLength ?? 0);
}

function laneGreenDurationOf(
  normalizedItem: any,
  lane: TrafficLane
): number {
  return Number(normalizedItem?.[lane]?.greenDuration ?? 0);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export async function getAiSummary(
  ctx: AiRequestContext
): Promise<AiSummary> {
  const { startDate, endDate, startUtc, endUtc } = resolveRange(ctx);
  const intersectionId = ctx.intersectionId || null;

  const [items, latest, deviceStats] = await Promise.all([
    scanTrafficByDateRange({
      startDate: startUtc,
      endDate: endUtc,
      intersectionId: intersectionId || undefined,
      limit: 10000,
    }),
    getLatestNormalized(intersectionId),
    getDeviceOnlineStats(),
  ]);

  const newest =
    latest.find(
      (item) =>
        !intersectionId || item.intersectionId === intersectionId
    ) || null;

  // Statistik agregat per jalur
  const laneTotals: Record<TrafficLane, { level: number; green: number; detected: number; level2: number }> = {
    north: { level: 0, green: 0, detected: 0, level2: 0 },
    south: { level: 0, green: 0, detected: 0, level2: 0 },
    east: { level: 0, green: 0, detected: 0, level2: 0 },
  };
  const laneSamples: Record<TrafficLane, number> = {
    north: 0,
    south: 0,
    east: 0,
  };

  for (const item of items) {
    for (const lane of LANE_NAMES) {
      const level = Number(item[`${lane}_density_level`] ?? 0);
      const green = Number(item[`${lane}_green_duration_s`] ?? 0);
      const detected = toBool(item[`${lane}_vehicle_detected`]);

      laneTotals[lane].level += level;
      laneTotals[lane].green += green;
      if (detected) laneTotals[lane].detected += 1;
      if (level >= 2) laneTotals[lane].level2 += 1;
      laneSamples[lane] += 1;
    }
  }

  const lanes: Partial<Record<TrafficLane, AiLaneStats>> = {};
  let totalQueueLevel = 0;
  let totalSamples = 0;

  for (const lane of LANE_NAMES) {
    const count = laneSamples[lane];
    const avgLevel = count > 0 ? laneTotals[lane].level / count : 0;
    totalQueueLevel += laneTotals[lane].level;
    totalSamples += count;

    lanes[lane] = {
      averageQueueLevel: round2(avgLevel),
      level2Percentage:
        count > 0 ? Math.round((laneTotals[lane].level2 / count) * 1000) / 10 : 0,
      averageGreenDuration:
        count > 0 ? round2(laneTotals[lane].green / count) : 0,
      detectionRatio:
        count > 0 ? Math.round((laneTotals[lane].detected / count) * 1000) / 10 : 0,
      latestLevel: newest ? laneLevelOf(newest, lane) : 0,
      latestQueueLength: newest ? laneQueueLengthOf(newest, lane) : 0,
      samples: count,
    };
  }

  const averageQueueLevel =
    totalSamples > 0 ? round2(totalQueueLevel / totalSamples) : 0;

  // Jam puncak (WIB): jam dengan persentase level 2 tertinggi
  const hourLevel2 = new Array(24).fill(0) as number[];
  const hourCounts = new Array(24).fill(0) as number[];
  for (const item of items) {
    const hour = getWibHour(getItemTimestamp(item));
    let hasLevel2 = false;
    for (const lane of LANE_NAMES) {
      if (Number(item[`${lane}_density_level`] ?? 0) >= 2) {
        hasLevel2 = true;
        break;
      }
    }
    if (hasLevel2) hourLevel2[hour] += 1;
    hourCounts[hour] += 1;
  }
  let peakHour: number | null = null;
  let peakPct = 0;
  for (let hour = 0; hour < 24; hour += 1) {
    const pct = hourCounts[hour] > 0 ? (hourLevel2[hour] / hourCounts[hour]) * 100 : 0;
    if (pct > peakPct) {
      peakPct = pct;
      peakHour = hour;
    }
  }

  // Insight otomatis
  const insights: AiInsight[] = [];
  const congested = LANE_NAMES.filter(
    (lane) => (lanes[lane]?.latestLevel ?? 0) >= 2
  );

  if (congested.length > 0) {
    insights.push({
      type: "warning",
      title: "Antrean panjang terdeteksi",
      message: `Jalur ${congested
        .map((lane) => lane.toUpperCase())
        .join(", ")} berada pada level 2. Pertimbangkan menambah durasi lampu hijau.`,
    });
  } else if (totalSamples > 0) {
    insights.push({
      type: "info",
      title: "Lalu lintas relatif lancar",
      message: `Rata-rata level antrean ${averageQueueLevel} pada periode ini.`,
    });
  }

  if (peakHour !== null) {
    insights.push({
      type: "info",
      title: "Jam puncak kemacetan",
      message: `Kepadatan level 2 paling tinggi terjadi sekitar pukul ${String(
        peakHour
      ).padStart(2, "0")}:00 WIB (${Math.round(peakPct)}% sampel).`,
    });
  }

  if (deviceStats.offline > 0) {
    insights.push({
      type: "warning",
      title: "Perangkat offline",
      message: `${deviceStats.offline} perangkat terdeteksi offline (tidak mengirim data dalam 2 menit terakhir).`,
    });
  }

  const adaptiveMode = newest?.adaptiveMode ?? null;
  if (adaptiveMode === true) {
    insights.push({
      type: "info",
      title: "Mode adaptif aktif",
      message:
        "Durasi lampu hijau menyesuaikan level antrean secara otomatis.",
    });
  }

  // Rekomendasi durasi hijau per jalur
  const recommendations: AiRecommendation[] = [];
  for (const lane of LANE_NAMES) {
    const stats = lanes[lane];
    if (!stats) continue;
    const level = Math.round(stats.averageQueueLevel);
    const recommendedGreenS = RECOMMENDED_GREEN_BY_LEVEL[level] ?? 10;
    const currentGreenS = stats.averageGreenDuration;

    if (currentGreenS <= 0 && stats.samples === 0) continue;

    let action: AiRecommendation["action"] = "keep";
    let reason = `Level antrean ${level} membutuhkan ±${recommendedGreenS} detik hijau.`;

    if (currentGreenS > 0 && recommendedGreenS - currentGreenS >= 5) {
      action = "increase";
      reason = `Level antrean ${level} (rata-rata ${stats.averageQueueLevel}); tambah durasi hijau ke ${recommendedGreenS} detik untuk mengurai antrean.`;
    } else if (
      currentGreenS > 0 &&
      currentGreenS - recommendedGreenS >= 10
    ) {
      action = "decrease";
      reason = `Durasi hijau saat ini (${currentGreenS}s) berlebih untuk level antrean ${level}; turunkan ke ${recommendedGreenS} detik agar jalur lain kebagian waktu.`;
    }

    recommendations.push({
      lane,
      level,
      currentGreenS: round2(currentGreenS),
      recommendedGreenS,
      action,
      reason,
    });
  }

  const hasEnoughData = totalSamples >= 30;
  const mostCongested =
    congested.length > 0
      ? congested[0]
      : LANE_NAMES.reduce((best, lane) => {
          const avg = lanes[lane]?.averageQueueLevel ?? 0;
          const bestAvg = lanes[best]?.averageQueueLevel ?? 0;
          return avg > bestAvg ? lane : best;
        }, LANE_NAMES[0]);

  const overview = !hasEnoughData
    ? `Data untuk periode ${startDate} – ${endDate} masih terbatas (${totalSamples} sampel). Ringkasan ini akan semakin akurat seiring bertambahnya data.`
    : `Pada periode ${startDate} – ${endDate}, sistem memantau ${totalSamples} sampel telemetri${
        intersectionId ? ` dari persimpangan ${intersectionId}` : " dari semua persimpangan"
      }. Rata-rata level antrean ${averageQueueLevel}${
        peakHour !== null
          ? ` dengan kepadatan puncak sekitar pukul ${String(peakHour).padStart(
              2,
              "0"
            )}:00 WIB`
          : ""
      }. Jalur terpadat adalah ${mostCongested.toUpperCase()}${
        adaptiveMode === true
          ? " dan mode adaptif sedang aktif menyesuaikan durasi lampu"
          : ""
      }.`;

  return {
    generatedAt: new Date().toISOString(),
    intersectionId,
    period: { startDate, endDate },
    dataStatus: { itemCount: totalSamples, hasEnoughData },
    overview,
    keyMetrics: {
      totalSamples,
      averageQueueLevel,
      peakHour: peakHour !== null ? String(peakHour).padStart(2, "0") + ":00" : null,
      peakHourLabel:
        peakHour !== null
          ? String(peakHour).padStart(2, "0") + ":00 WIB"
          : null,
      peakHourLevel2Percentage: Math.round(peakPct * 10) / 10,
      devicesOnline: deviceStats.online,
      devicesOffline: deviceStats.offline,
      adaptiveMode,
    },
    lanes,
    insights,
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// Forecast
// ---------------------------------------------------------------------------

export async function getAiForecast(
  ctx: AiRequestContext & { hours?: number }
): Promise<AiForecast> {
  const { startDate, endDate, startUtc, endUtc } = resolveRange(ctx);
  const intersectionId = ctx.intersectionId || null;
  const hours = Math.min(Math.max(ctx.hours ?? 6, 1), 24);

  const items = await scanTrafficByDateRange({
    startDate: startUtc,
    endDate: endUtc,
    intersectionId: intersectionId || undefined,
    limit: 20000,
  });

  if (items.length < 20) {
    return {
      generatedAt: new Date().toISOString(),
      intersectionId,
      hours: [],
      method: "statistical-baseline",
      message:
        "Data historis belum cukup untuk membuat prediksi (perlu minimal 20 sampel dalam rentang ini).",
    };
  }

  // Baseline per jam-dalam-sehari per jalur
  const baseline: Record<TrafficLane, { sum: number; count: number }[]> = {
    north: Array.from({ length: 24 }, () => ({ sum: 0, count: 0 })),
    south: Array.from({ length: 24 }, () => ({ sum: 0, count: 0 })),
    east: Array.from({ length: 24 }, () => ({ sum: 0, count: 0 })),
  };

  const byDayHour: Record<
    TrafficLane,
    { sum: number; count: number }[][]
  > = {
    north: Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }))
    ),
    south: Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }))
    ),
    east: Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }))
    ),
  };

  for (const item of items) {
    const ts = getItemTimestamp(item);
    const hour = getWibHour(ts);
    const day = new Date(ts).getUTCDay();

    for (const lane of LANE_NAMES) {
      const level = Number(item[`${lane}_density_level`] ?? 0);
      baseline[lane][hour].sum += level;
      baseline[lane][hour].count += 1;
      byDayHour[lane][day][hour].sum += level;
      byDayHour[lane][day][hour].count += 1;
    }
  }

  const now = new Date();
  const currentWibHour = getWibHour(now.toISOString());
  const currentDay = now.getUTCDay();

  const baselineAvg = (lane: TrafficLane, hour: number): number => {
    const b = baseline[lane][hour];
    return b.count > 0 ? b.sum / b.count : 0;
  };

  // Tren: selisih rata-rata jam terakhir yang teramati terhadap baseline
  const recentDeviation: Record<TrafficLane, number[]> = {
    north: [],
    south: [],
    east: [],
  };
  for (let back = 1; back <= 4; back += 1) {
    const hour = (currentWibHour - back + 24) % 24;
    for (const lane of LANE_NAMES) {
      const observed = baselineAvg(lane, hour);
      const expected = baselineAvg(lane, hour);
      recentDeviation[lane].push(observed - expected);
    }
  }

  const trend = (lane: TrafficLane): number => {
    const devs = recentDeviation[lane].filter((d) => Number.isFinite(d));
    if (devs.length === 0) return 0;
    return devs.reduce((sum, d) => sum + d, 0) / devs.length;
  };

  const forecast: AiForecastPoint[] = [];
  for (let i = 1; i <= hours; i += 1) {
    const target = new Date(now.getTime() + i * 60 * 60 * 1000);
    const targetWibHour = getWibHour(target.toISOString());
    const targetDay = target.getUTCDay();

    const values: Record<TrafficLane, number> = {
      north: 0,
      south: 0,
      east: 0,
    };
    let confidences: ("high" | "medium" | "low")[] = [];

    for (const lane of LANE_NAMES) {
      const weekday = byDayHour[lane][targetDay][targetWibHour];
      const weekdayAvg =
        weekday.count > 0 ? weekday.sum / weekday.count : null;
      const hourAvg = baselineAvg(lane, targetWibHour);

      let predicted: number;
      let confidence: "high" | "medium" | "low";

      if (weekdayAvg !== null && weekday.count >= 10) {
        predicted = 0.7 * weekdayAvg + 0.3 * hourAvg + trend(lane);
        confidence = "high";
      } else if (weekdayAvg !== null) {
        predicted = 0.5 * weekdayAvg + 0.5 * hourAvg + trend(lane);
        confidence = "medium";
      } else if (baseline[lane][targetWibHour].count > 0) {
        predicted = hourAvg + trend(lane);
        confidence = "medium";
      } else {
        predicted = 0;
        confidence = "low";
      }

      values[lane] = clampLevel(predicted);
      confidences.push(confidence);
    }

    const confidence = confidences.includes("low")
      ? "low"
      : confidences.includes("medium")
        ? "medium"
        : "high";

    forecast.push({
      period: target.toISOString(),
      hour: targetWibHour,
      label: `${String(targetWibHour).padStart(2, "0")}:00 WIB`,
      north: values.north,
      south: values.south,
      east: values.east,
      average: round2((values.north + values.south + values.east) / 3),
      confidence,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    intersectionId,
    hours: forecast,
    method: "statistical-baseline",
    message:
      "Prediksi dihitung dari rata-rata historis per jam + tren beberapa jam terakhir (level antrean 0–2).",
  };
}

// ---------------------------------------------------------------------------
// Anomalies
// ---------------------------------------------------------------------------

export async function getAiAnomalies(
  ctx: AiRequestContext
): Promise<AiAnomalyResult> {
  const { startDate, endDate, startUtc, endUtc } = resolveRange(ctx);
  const intersectionId = ctx.intersectionId || null;

  const [items, deviceStats] = await Promise.all([
    scanTrafficByDateRange({
      startDate: startUtc,
      endDate: endUtc,
      intersectionId: intersectionId || undefined,
      limit: 20000,
    }),
    getDeviceOnlineStats(),
  ]);

  const anomalies: AiAnomaly[] = [];
  const seen = new Set<string>();

  const push = (anomaly: AiAnomaly) => {
    const key = `${anomaly.type}:${anomaly.lane || ""}:${anomaly.deviceId || ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      anomalies.push(anomaly);
    }
  };

  // 1. Device offline
  for (const device of deviceStats.devices) {
    const lastSeen =
      device.last_seen || device.lastSeen || device.updated_at || null;
    const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
    const isOnline =
      lastSeenTime > 0 && Date.now() - lastSeenTime < 2 * 60 * 1000;

    if (!isOnline && device.device_id) {
      push({
        type: "device-offline",
        severity: "high",
        deviceId: device.device_id,
        title: "Perangkat tidak mengirim data",
        description: `Device ${device.device_id}${
          lastSeen
            ? ` terakhir terlihat ${new Date(lastSeen).toLocaleString("id-ID", {
                timeZone: APP_TIMEZONE,
              })}`
            : " tidak pernah tercatat"
        }. Kemungkinan mati atau kehilangan koneksi.`,
      });
    }
  }

  // 2. Statistik per jalur per jam
  const perLane = LANE_NAMES.map((lane) => {
    let samples = 0;
    let detected = 0;
    let level2 = 0;
    let levelSum = 0;
    let greenZero = 0;
    let greenSum = 0;

    const hourlyLevel: { sum: number; count: number }[] = Array.from(
      { length: 24 },
      () => ({ sum: 0, count: 0 })
    );

    for (const item of items) {
      const level = Number(item[`${lane}_density_level`] ?? 0);
      const green = Number(item[`${lane}_green_duration_s`] ?? 0);
      const isDetected = toBool(item[`${lane}_vehicle_detected`]);

      samples += 1;
      if (isDetected) detected += 1;
      if (level >= 2) level2 += 1;
      levelSum += level;
      if (green === 0) greenZero += 1;
      greenSum += green;

      const hour = getWibHour(getItemTimestamp(item));
      hourlyLevel[hour].sum += level;
      hourlyLevel[hour].count += 1;
    }

    return { lane, samples, detected, level2, levelSum, greenZero, greenSum, hourlyLevel };
  });

  for (const stats of perLane) {
    if (stats.samples === 0) continue;

    const avgLevel = stats.levelSum / stats.samples;
    const detectionRatio = stats.detected / stats.samples;
    const level2Pct = (stats.level2 / stats.samples) * 100;

    // 2a. Kepadatan ekstrem berulang (potensi insiden/kemacetan parah)
    if (level2Pct >= 40 && avgLevel >= 1) {
      push({
        type: "queue-spike",
        severity: "high",
        lane: stats.lane,
        title: "Kemacetan parah berulang",
        description: `Jalur ${stats.lane.toUpperCase()} berada di level 2 pada ${Math.round(
          level2Pct
        )}% sampel (rata-rata level ${round2(avgLevel)}). Berpotensi kecelakaan atau hambatan.`,
      });
    }

    // 2b. Lonjakan level pada jam tertentu
    for (let hour = 0; hour < 24; hour += 1) {
      const h = stats.hourlyLevel[hour];
      if (h.count >= 5) {
        const hourAvg = h.sum / h.count;
        if (hourAvg >= 1.5 && avgLevel <= 0.8) {
          push({
            type: "queue-spike",
            severity: "medium",
            lane: stats.lane,
            title: "Lonjakan antrean",
            description: `Level antrean melonjak ke ${round2(
              hourAvg
            )} sekitar pukul ${String(hour).padStart(
              2,
              "0"
            )}:00 WIB padahal rata-rata periode hanya ${round2(avgLevel)}.`,
          });
        }
      }
    }

    // 2c. Sensor tidak mendeteksi kendaraan sama sekali (kemungkinan rusak)
    if (detectionRatio < 0.1 && avgLevel === 0 && stats.samples >= 10) {
      push({
        type: "zero-activity",
        severity: "medium",
        lane: stats.lane,
        title: "Sensor/arus data tidak aktif",
        description: `Jalur ${stats.lane.toUpperCase()} tidak mendeteksi kendaraan di ${Math.round(
          (1 - detectionRatio) * 100
        )}% sampel (${stats.samples} sampel). Kemungkinan sensor rusak atau kabel putus.`,
      });
    }

    // 2d. Durasi hijau selalu 0 (lampu tidak melaporkan durasi)
    if (stats.greenZero / stats.samples >= 0.8 && stats.samples >= 5) {
      push({
        type: "light-stuck",
        severity: "low",
        lane: stats.lane,
        title: "Durasi lampu hijau tidak terlaporkan",
        description: `Jalur ${stats.lane.toUpperCase()} melaporkan durasi hijau 0 pada ${Math.round(
          (stats.greenZero / stats.samples) * 100
        )}% sampel. Periksa pembacaan controller lampu.`,
      });
    }
  }

  const summary = {
    total: anomalies.length,
    high: anomalies.filter((a) => a.severity === "high").length,
    medium: anomalies.filter((a) => a.severity === "medium").length,
    low: anomalies.filter((a) => a.severity === "low").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    intersectionId,
    anomalies,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Chat (template fallback + optional LLM)
// ---------------------------------------------------------------------------

function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function intentMatch(
  normalized: string,
  keywords: string[]
): boolean {
  return keywords.some((keyword) => normalized.includes(keyword));
}

// ---------------------------------------------------------------------------
// Navigasi bantuan (halaman aplikasi)
// ---------------------------------------------------------------------------

export const AI_PAGE_MAP: { keys: string[]; label: string; href: string }[] = [
  { keys: ["dashboard", "beranda", "home", "pantauan", "status"], label: "Dashboard", href: "/dashboard" },
  { keys: ["analis", "analitik", "analytics", "grafik", "chart", "prediksi", "forecast", "statistik"], label: "Analitik", href: "/Analist" },
  { keys: ["persimpangan", "intersection", "simpang", "simpangan"], label: "Persimpangan", href: "/persimpangan" },
  { keys: ["iot", "config", "konfigurasi", "perangkat", "device", "kontrol", "lampu", "pengaturan lampu"], label: "IoT Config", href: "/iot-config" },
  { keys: ["panduan", "tutorial", "bantuan", "help", "guide", "cara pakai", "petunjuk"], label: "Panduan", href: "/panduan" },
  { keys: ["laporan", "report", "insiden"], label: "Laporan", href: "/laporan" },
  { keys: ["notifikasi", "notif", "peringatan"], label: "Notifikasi", href: "/notifikasi" },
  { keys: ["profil", "profile", "akun", "pengaturan akun"], label: "Profil", href: "/profile" },
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ");
}

/** Tentukan halaman yang relevan dari pertanyaan & jawaban (maks 3). */
function getSuggestedActions(question: string, answer: string): AiChatAction[] {
  const haystack = `${normalizeText(question)} ${normalizeText(answer)}`;
  const found = AI_PAGE_MAP.filter((page) =>
    page.keys.some((key) => haystack.includes(key))
  ).slice(0, 3);

  const hasDashboard = found.some((page) => page.href === "/dashboard");
  if (!hasDashboard && found.length < 3) {
    found.unshift(AI_PAGE_MAP[0]);
  }

  return found.slice(0, 3).map((page) => ({ label: page.label, href: page.href }));
}

const AI_GUIDE_TEXT = [
  "Panduan penggunaan sistem ASTRAEA (Adaptive Smart Traffic System):",
  "1. Dashboard (/dashboard) — pantau status real-time semua persimpangan: level antrean tiap jalur (0=lancar, 1=sedang, 2=padat), durasi lampu hijau, dan notifikasi.",
  "2. Kontrol Lampu (di Dashboard / menu IoT Config) — atur mode otomatis/adaptif dan durasi hijau per level antrean, lalu kirim ke perangkat lewat MQTT.",
  "3. Analitik (/Analist) — lihat grafik volume kendaraan, antrean per jam, distribusi level, heatmap, dan efektivitas durasi lampu.",
  "4. Persimpangan (/persimpangan) — kelola data persimpangan, jalur, dan perangkat yang terhubung.",
  "5. IoT Config (/iot-config) — atur konfigurasi perangkat (ESP32) dan kirimkan via MQTT retained.",
  "6. Laporan (/laporan) — buat laporan insiden atau anomali lalu lintas.",
  "7. Profil (/profile) — kelola akun, zona waktu, dan preferensi notifikasi.",
  "Gunakan tombol navigasi di bawah untuk langsung membuka halaman yang dimaksud.",
].join("\n");

/**
 * Ringkasan 5 bulan terakhir sebagai konteks tambahan untuk LLM,
 * sehingga AI tetap bisa menjawab walau rentang tanggal yang diminta
 * pengguna memiliki sedikit/0 sampel.
 */
async function getAiHistoryContext(
  ctx: AiRequestContext
): Promise<{
  period: string;
  totalSamples: number;
  averageQueueLevel: number | null;
  perLane: { lane: string; averageQueueLevel: number; level2Percentage: number; samples: number }[];
  peakHour: string | null;
  devicesOffline: number;
} | null> {
  try {
    const today = getWibDateValue();
    const start = ctx.startDate || addDaysToDateValue(today, -150);
    const end = ctx.endDate || today;
    const { startUtc, endUtc } = wibDateRangeToUtc(start, end);

    const items = await scanTrafficByDateRange({
      startDate: startUtc,
      endDate: endUtc,
      intersectionId: ctx.intersectionId || undefined,
      limit: 50000,
    });

    const laneTotals: Record<TrafficLane, { level: number; level2: number }> = {
      north: { level: 0, level2: 0 },
      south: { level: 0, level2: 0 },
      east: { level: 0, level2: 0 },
    };
    const laneSamples: Record<TrafficLane, number> = { north: 0, south: 0, east: 0 };
    const hourLevel2 = new Array(24).fill(0) as number[];
    const hourCounts = new Array(24).fill(0) as number[];

    for (const item of items) {
      const hour = getWibHour(getItemTimestamp(item));
      hourCounts[hour] += 1;
      let anyLevel2 = false;
      for (const lane of LANE_NAMES) {
        const level = Number(item[`${lane}_density_level`] ?? 0);
        laneTotals[lane].level += level;
        laneSamples[lane] += 1;
        if (level >= 2) {
          laneTotals[lane].level2 += 1;
          anyLevel2 = true;
        }
      }
      if (anyLevel2) hourLevel2[hour] += 1;
    }

    const totalSamples = laneSamples.north + laneSamples.south + laneSamples.east;
    if (totalSamples === 0) return null;

    const perLane = LANE_NAMES.map((lane) => ({
      lane: lane.toUpperCase(),
      averageQueueLevel: round2(
        laneSamples[lane] > 0 ? laneTotals[lane].level / laneSamples[lane] : 0
      ),
      level2Percentage:
        laneSamples[lane] > 0
          ? Math.round((laneTotals[lane].level2 / laneSamples[lane]) * 1000) / 10
          : 0,
      samples: laneSamples[lane],
    }));

    let peakHour: number | null = null;
    let peakPct = 0;
    for (let hour = 0; hour < 24; hour += 1) {
      const pct = hourCounts[hour] > 0 ? (hourLevel2[hour] / hourCounts[hour]) * 100 : 0;
      if (pct > peakPct) {
        peakPct = pct;
        peakHour = hour;
      }
    }

    const deviceStats = await getDeviceOnlineStats();
    const laneSampleTotal = laneSamples.north + laneSamples.south + laneSamples.east;
    const levelSum =
      laneTotals.north.level + laneTotals.south.level + laneTotals.east.level;

    return {
      period: `${start} – ${end}`,
      totalSamples: laneSampleTotal,
      averageQueueLevel: round2(levelSum / laneSampleTotal),
      perLane,
      peakHour: peakHour !== null ? `${String(peakHour).padStart(2, "0")}:00 WIB` : null,
      devicesOffline: deviceStats.offline,
    };
  } catch (error) {
    console.error("AI history context failed:", error);
    return null;
  }
}

export async function getAiChatAnswer(
  question: string,
  ctx: AiRequestContext
): Promise<AiChatResponse> {
  const [summary, anomalies, forecast, history] = await Promise.all([
    getAiSummary(ctx),
    getAiAnomalies(ctx),
    getAiForecast({ ...ctx, hours: 6 }),
    getAiHistoryContext(ctx),
  ]);

  const templateAnswer = buildTemplateAnswer(question, {
    summary,
    anomalies,
    forecast,
    history,
  });

  const pageList = AI_PAGE_MAP.map(
    (page) => `- ${page.label}: ${page.href}`
  ).join("\n");

  // Opsional: gunakan LLM bila API key disediakan
  const apiKey = process.env.AI_LLM_API_KEY;
  if (apiKey) {
    try {
      const baseUrl =
        process.env.AI_LLM_BASE_URL || "https://api.openai.com/v1";
      const model = process.env.AI_LLM_MODEL || "gpt-4o-mini";

      const systemPrompt = [
        "Kamu adalah asisten AI untuk sistem Adaptive Traffic Monitoring bernama ASTRAEA.",
        "Jawab dalam Bahasa Indonesia, singkat, jelas, dan ramah.",
        "Bila pengguna bertanya tentang cara menggunakan aplikasi/tutorial/panduan, jelaskan langkah-langkahnya dan sebutkan halaman yang relevan.",
        "Jangan gunakan penulisan Markdown seperti **bold**, *italic*, atau [link](url) — gunakan teks biasa saja. Jika perlu menunjuk halaman, cukup tulis nama halaman dan path-nya, misal: Dashboard (/dashboard).",
        "Daftar halaman aplikasi:",
        pageList,
        "Konteks data pada rentang tanggal yang diminta pengguna:",
        JSON.stringify({
          summary: {
            overview: summary.overview,
            keyMetrics: summary.keyMetrics,
            lanes: summary.lanes,
            insights: summary.insights,
            recommendations: summary.recommendations,
          },
          anomalies: anomalies.anomalies,
          forecast: forecast.hours,
        }),
        "Riwayat 5 bulan terakhir (konteks tambahan bila data pada rentang yang diminta terbatas):",
        JSON.stringify(history),
      ].join("\n");

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content?.trim();
        if (answer) {
          return {
            answer,
            source: "ai",
            actions: getSuggestedActions(question, answer),
          };
        }
      } else {
        const errorText = await response.text().catch(() => "");
        console.error("AI LLM HTTP error", response.status, errorText.slice(0, 300));
      }
    } catch (error) {
      console.error("AI LLM call failed:", error);
      // fallback ke template
    }
  }

  return {
    answer: templateAnswer,
    source: "template",
    actions: getSuggestedActions(question, templateAnswer),
  };
}

function buildTemplateAnswer(
  question: string,
  data: {
    summary: AiSummary;
    anomalies: AiAnomalyResult;
    forecast: AiForecast;
    history?: Awaited<ReturnType<typeof getAiHistoryContext>>;
  }
): string {
  const normalized = normalizeQuestion(question);
  const { summary, anomalies, forecast, history } = data;

  const rangeEmpty = summary.keyMetrics.totalSamples === 0;

  const congestedLane =
    LANE_NAMES.reduce((best, lane) => {
      const avg = summary.lanes[lane]?.averageQueueLevel ?? 0;
      const bestAvg = summary.lanes[best]?.averageQueueLevel ?? 0;
      return avg > bestAvg ? lane : best;
    }, LANE_NAMES[0]);

  const congestedLaneFromHistory =
    history && history.perLane.length > 0
      ? history.perLane.reduce((best, lane) =>
          lane.averageQueueLevel > best.averageQueueLevel ? lane : best
        )
      : null;

  if (
    intentMatch(normalized, [
      "paling padat",
      "termacet",
      "macet",
      "congested",
      "padat",
      "ramai",
      "sibuk",
      "paling ramai",
      "most congested",
    ])
  ) {
    const stats = summary.lanes[congestedLane];
    const useHistory = rangeEmpty && history;
    const laneLabel = useHistory && congestedLaneFromHistory
      ? congestedLaneFromHistory.lane
      : congestedLane.toUpperCase();
    const laneStats = useHistory && congestedLaneFromHistory
      ? congestedLaneFromHistory
      : stats;
    const periodNote = useHistory && history
      ? ` (rata-rata ${history.period})`
      : "";
    return `Jalur paling padat${rangeEmpty ? " berdasarkan data 5 bulan terakhir" : " saat ini"} adalah ${laneLabel} dengan rata-rata level antrean ${
      laneStats?.averageQueueLevel ?? 0
    } (level 2 = padat).${periodNote}${
      anomalies.summary.total > 0
        ? ` Terdapat ${anomalies.summary.total} anomali terdeteksi: ${anomalies.anomalies
            .slice(0, 2)
            .map((a) => a.title)
            .join(", ")}.`
        : ""
    }`;
  }

  if (
    intentMatch(normalized, [
      "jam sibuk",
      "jam berapa",
      "peak",
      "rush",
      "puncak",
      "tertinggi",
      "jam paling",
    ])
  ) {
    if (summary.keyMetrics.peakHourLabel) {
      return `Kepadatan puncak terjadi sekitar pukul ${summary.keyMetrics.peakHourLabel} dengan ${summary.keyMetrics.peakHourLevel2Percentage}% sampel berada di level 2 (antrean panjang).`;
    }
    if (history?.peakHour) {
      return `Data pada rentang yang diminta masih terbatas, namun berdasarkan 5 bulan terakhir, kepadatan puncak terjadi sekitar pukul ${history.peakHour} (${history.perLane.length} jalur terpantau, ${history.totalSamples} sampel).`;
    }
    return "Data belum cukup untuk menentukan jam puncak pada periode ini.";
  }

  if (
    intentMatch(normalized, [
      "rekomendasi",
      "durasi hijau",
      "lampu hijau",
      "green",
      "saran",
      "tambah",
      "tingkatkan",
      "recommendation",
    ])
  ) {
    if (summary.recommendations.length === 0) {
      return "Belum ada rekomendasi: durasi hijau setiap jalur sudah sesuai level antreannya.";
    }
    const lines = summary.recommendations
      .slice(0, 3)
      .map(
        (r) =>
          `${r.lane.toUpperCase()}: level ${r.level} → rekomendasi ${r.recommendedGreenS}s (sekarang ${r.currentGreenS}s, ${r.action === "increase" ? "naikkan" : r.action === "decrease" ? "turunkan" : "pertahankan"}).`
      );
    return `Rekomendasi durasi lampu hijau:\n${lines.join("\n")}`;
  }

  if (
    intentMatch(normalized, [
      "volume",
      "kendaraan",
      "berapa banyak",
      "jumlah kendaraan",
      "banyak",
      "traffic volume",
    ])
  ) {
    const laneInfo = LANE_NAMES.map(
      (lane) =>
        `${lane.toUpperCase()} (level ${summary.lanes[lane]?.averageQueueLevel ?? 0})`
    ).join(", ");
    return `Periode ini tercatat ${summary.keyMetrics.totalSamples} sampel telemetri. Rata-rata level antrean: ${laneInfo}. Rata-rata keseluruhan: ${summary.keyMetrics.averageQueueLevel}.`;
  }

  if (
    intentMatch(normalized, [
      "anomali",
      "masalah",
      "error",
      "offline",
      "aneh",
      "gangguan",
      "rusak",
      "anomaly",
    ])
  ) {
    if (anomalies.summary.total === 0) {
      return "Tidak ada anomali terdeteksi pada periode ini. Semua jalur dan perangkat terpantau normal.";
    }
    const lines = anomalies.anomalies
      .slice(0, 5)
      .map(
        (a) =>
          `[${a.severity.toUpperCase()}] ${a.title} — ${a.description}`
      );
    return `Terdeteksi ${anomalies.summary.total} anomali (${anomalies.summary.high} high, ${anomalies.summary.medium} medium, ${anomalies.summary.low} low):\n${lines.join("\n")}`;
  }

  if (
    intentMatch(normalized, [
      "prediksi",
      "forecast",
      "kedepan",
      "nanti",
      "besok",
      "ramalan",
      "kemungkinan",
      "akan datang",
    ])
  ) {
    if (forecast.hours.length === 0) {
      return forecast.message || "Belum cukup data untuk prediksi.";
    }
    const next = forecast.hours
      .slice(0, 3)
      .map(
        (h) =>
          `${h.label} → Utara ${h.north}, Selatan ${h.south}, Timur ${h.east} (avg ${h.average}, keyakinan ${h.confidence})`
      );
    return `Perkiraan level antrean beberapa jam ke depan:\n${next.join("\n")}`;
  }

  if (
    intentMatch(normalized, [
      "panduan",
      "tutorial",
      "cara pakai",
      "cara menggunakan",
      "cara memakai",
      "bantuan",
      "petunjuk",
      "guide",
      "how to use",
      "manual",
      "usage",
    ])
  ) {
    return AI_GUIDE_TEXT;
  }

  if (
    intentMatch(normalized, [
      "apa itu",
      "cara kerja",
      "adaptive",
      "sistem",
      "bekerja",
      "how",
      "explain",
      "fungsi",
    ])
  ) {
    return "Sistem Adaptive Traffic Monitoring memantau persimpangan lewat IoT (sensor/kamera) yang mengirim data level antrean tiap jalur. Mode adaptif menyesuaikan durasi lampu hijau berdasarkan kepadatan: level 0 (lancar) ±10s, level 1 (sedang) ±20s, level 2 (padat) ±30s.";
  }

  if (summary.overview) {
    return summary.overview;
  }

  return "Maaf, saya belum bisa menjawab pertanyaan tersebut. Coba tanyakan tentang: jalur paling padat, jam sibuk, rekomendasi durasi hijau, volume kendaraan, anomali, atau prediksi.";
}
