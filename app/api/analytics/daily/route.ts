import { scanTrafficByDateRange } from "@/lib/aws-dynamodb";
import {
  getItemTimestamp,
  getLaneGreenDuration,
  getLaneQueueLevel,
  getLaneVehicleCount,
  TRAFFIC_LANES,
} from "@/lib/traffic-adapter";
import { NextResponse } from "next/server";
import { resolveWibAnalyticsRange } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const intersectionId = searchParams.get("intersectionId");
    const limit = Number(searchParams.get("limit") || 5000);

    const { startUtc, endUtc } = resolveWibAnalyticsRange(searchParams);

    const items = await scanTrafficByDateRange({
      startDate: startUtc,
      endDate: endUtc,
      intersectionId,
      limit,
    });

    const dailyMap = new Map<
      string,
      {
        date: string;
        intersectionId: string;
        totalVehicles: number;
        totalQueueLevel: number;
        queueSamples: number;
        totalGreenDuration: number;
        greenSamples: number;
        level0: number;
        level1: number;
        level2: number;
      }
    >();

    for (const item of items) {
      const timestamp = getItemTimestamp(item);
      const day = new Date(timestamp).toISOString().split("T")[0];
      const key = `${day}_${item.intersection_id || "all"}`;

      if (!dailyMap.has(key)) {
        dailyMap.set(key, {
          date: day,
          intersectionId: item.intersection_id || "SIMPANG_TALUN_01",
          totalVehicles: 0,
          totalQueueLevel: 0,
          queueSamples: 0,
          totalGreenDuration: 0,
          greenSamples: 0,
          level0: 0,
          level1: 0,
          level2: 0,
        });
      }

      const row = dailyMap.get(key)!;

      for (const lane of TRAFFIC_LANES) {
        const vehicleCount = getLaneVehicleCount(item, lane);
        const queueLevel = getLaneQueueLevel(item, lane);
        const greenDuration = getLaneGreenDuration(item, lane);

        row.totalVehicles += vehicleCount;
        row.totalQueueLevel += queueLevel;
        row.queueSamples++;

        if (greenDuration > 0) {
          row.totalGreenDuration += greenDuration;
          row.greenSamples++;
        }

        if (queueLevel === 0) row.level0++;
        else if (queueLevel === 1) row.level1++;
        else if (queueLevel === 2) row.level2++;
      }
    }

    const data = Array.from(dailyMap.values())
      .map((row) => {
        const averageQueueLevel =
          row.queueSamples > 0
            ? Math.round((row.totalQueueLevel / row.queueSamples) * 10) / 10
            : 0;

        const averageWaitTime =
          row.greenSamples > 0
            ? Math.round((row.totalGreenDuration / row.greenSamples) * 10) / 10
            : 0;

        const averageCongestionIndex = Math.round((averageQueueLevel / 2) * 100);

        return {
          id: `analytics_${row.intersectionId}_${row.date}`,
          date: row.date,
          intersectionId: row.intersectionId,
          summary: {
            totalVehicles: row.totalVehicles,
            averageWaitTime,
            averageCongestionIndex,
            averageQueueLevel,
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
      count: data.length,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching daily analytics:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch analytics",
      },
      { status: 500 }
    );
  }
}