import { scanTrafficByDateRange } from "@/lib/aws-dynamodb";
import {
  getItemTimestamp,
  getLaneGreenDuration,
  getLaneQueueLevel,
  getLaneVehicleCount,
  TRAFFIC_LANES,
  type TrafficLane,
} from "@/lib/traffic-adapter";
import {
  getWibDateValue,
  resolveWibAnalyticsRange,
} from "@/lib/timezone";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DailyRow {
  date: string;
  intersectionId: string;

  totalVehicles: number;

  vehicleVolume: Record<TrafficLane, number>;

  totalQueueLevel: number;
  queueSamples: number;

  totalGreenDuration: number;
  greenSamples: number;

  level0: number;
  level1: number;
  level2: number;
}

function calculateCounterDelta(
  current: number,
  previous: number | undefined,
): number {
  if (previous === undefined) {
    return 0;
  }

  if (current < previous) {
    // Counter reset ketika ESP32 restart.
    return Math.max(current, 0);
  }

  return Math.max(current - previous, 0);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const intersectionId =
      searchParams.get("intersectionId");

    const parsedLimit = Number(
      searchParams.get("limit") || 20_000,
    );

    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50_000)
      : 20_000;

    const {
      startDate,
      endDate,
      startUtc,
      endUtc,
    } = resolveWibAnalyticsRange(searchParams);

    /*
     * Ambil data sebelum periode sebagai baseline counter.
     * Ini mencegah nilai counter awal periode dianggap kendaraan baru.
     */
    const lookbackStart = new Date(
      new Date(startUtc).getTime() -
        24 * 60 * 60 * 1000,
    ).toISOString();

    const items = await scanTrafficByDateRange({
      startDate: lookbackStart,
      endDate: endUtc,
      intersectionId,
      limit,
    });

    items.sort((a, b) => {
      return (
        new Date(getItemTimestamp(a)).getTime() -
        new Date(getItemTimestamp(b)).getTime()
      );
    });

    const previousCounts = new Map<string, number>();

    const dailyMap = new Map<string, DailyRow>();

    for (const item of items) {
      const timestamp = getItemTimestamp(item);

      const timestampMs = new Date(timestamp).getTime();

      if (!Number.isFinite(timestampMs)) {
        continue;
      }

      const currentIntersectionId =
        item.intersection_id ||
        item.intersectionId ||
        "SIMPANG_TALUN_01";

      const deviceId =
        item.device_id ||
        item.deviceId ||
        item.device ||
        "ESP32_TRAFFIC_01";

      const isInsideRequestedPeriod =
        timestamp >= startUtc &&
        timestamp <= endUtc;

      const day = getWibDateValue(new Date(timestamp));

      const dailyKey = `${day}_${currentIntersectionId}`;

      if (
        isInsideRequestedPeriod &&
        !dailyMap.has(dailyKey)
      ) {
        dailyMap.set(dailyKey, {
          date: day,
          intersectionId: currentIntersectionId,

          totalVehicles: 0,

          vehicleVolume: {
            north: 0,
            south: 0,
            east: 0,
          },

          totalQueueLevel: 0,
          queueSamples: 0,

          totalGreenDuration: 0,
          greenSamples: 0,

          level0: 0,
          level1: 0,
          level2: 0,
        });
      }

      for (const lane of TRAFFIC_LANES) {
        const currentCount =
          getLaneVehicleCount(item, lane);

        const counterKey =
          `${currentIntersectionId}|${deviceId}|${lane}`;

        const previousCount =
          previousCounts.get(counterKey);

        const delta = calculateCounterDelta(
          currentCount,
          previousCount,
        );

        previousCounts.set(counterKey, currentCount);

        if (!isInsideRequestedPeriod) {
          continue;
        }

        const row = dailyMap.get(dailyKey);

        if (!row) {
          continue;
        }

        row.vehicleVolume[lane] += delta;
        row.totalVehicles += delta;

        const queueLevel =
          getLaneQueueLevel(item, lane);

        const greenDuration =
          getLaneGreenDuration(item, lane);

        row.totalQueueLevel += queueLevel;
        row.queueSamples += 1;

        if (greenDuration > 0) {
          row.totalGreenDuration += greenDuration;
          row.greenSamples += 1;
        }

        if (queueLevel === 0) {
          row.level0 += 1;
        } else if (queueLevel === 1) {
          row.level1 += 1;
        } else if (queueLevel === 2) {
          row.level2 += 1;
        }
      }
    }

    const data = Array.from(dailyMap.values())
      .map((row) => {
        const averageQueueLevel =
          row.queueSamples > 0
            ? Math.round(
                (row.totalQueueLevel /
                  row.queueSamples) *
                  100,
              ) / 100
            : 0;

        const averageGreenDuration =
          row.greenSamples > 0
            ? Math.round(
                (row.totalGreenDuration /
                  row.greenSamples) *
                  10,
              ) / 10
            : 0;

        const averageCongestionIndex =
          Math.round((averageQueueLevel / 2) * 1000) /
          10;

        return {
          id: `analytics_${row.intersectionId}_${row.date}`,

          date: row.date,
          intersectionId: row.intersectionId,

          summary: {
            totalVehicles: row.totalVehicles,

            vehicleVolume: {
              north: row.vehicleVolume.north,
              south: row.vehicleVolume.south,
              east: row.vehicleVolume.east,
              total: row.totalVehicles,
            },

            averageGreenDuration,

            // Dipertahankan agar kompatibel dengan kode lama.
            averageWaitTime: averageGreenDuration,

            averageCongestionIndex,
            averageQueueLevel,

            queueSamples: row.queueSamples,

            queueDistribution: {
              level0: row.level0,
              level1: row.level1,
              level2: row.level2,
            },
          },
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({
      success: true,
      source: "dynamodb",
      timezone: "Asia/Jakarta",

      period: {
        startDate,
        endDate,
        queryStartUtc: startUtc,
        queryEndUtc: endUtc,
      },

      count: data.length,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching daily analytics:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Gagal mengambil analitik harian",
      },
      {
        status: 500,
      },
    );
  }
}