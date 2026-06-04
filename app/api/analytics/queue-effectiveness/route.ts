import { scanTrafficByDateRange } from "@/lib/aws-dynamodb";
import {
  getLaneGreenDuration,
  getLaneQueueLevel,
  TRAFFIC_LANES,
  type TrafficLane,
} from "@/lib/traffic-adapter";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const EXPECTED_GREEN: Record<number, number> = {
  0: 10,
  1: 20,
  2: 30,
};

const LANE_NAMES: Record<string, string> = {
  north: "Jalur Utara",
  south: "Jalur Selatan",
  east: "Jalur Timur",
  west: "Jalur Barat",
};

function toIsoStart(date?: string | null) {
  if (!date) return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (date.includes("T")) return date;
  return `${date}T00:00:00.000Z`;
}

function toIsoEnd(date?: string | null) {
  if (!date) return new Date().toISOString();
  if (date.includes("T")) return date;
  return `${date}T23:59:59.999Z`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const startDate = toIsoStart(searchParams.get("startDate"));
    const endDate = toIsoEnd(searchParams.get("endDate"));
    const lane = searchParams.get("lane") as TrafficLane | "all" | null;
    const intersectionId = searchParams.get("intersectionId");
    const limit = Number(searchParams.get("limit") || 5000);

    const items = await scanTrafficByDateRange({
      startDate,
      endDate,
      intersectionId,
      limit,
    });

    const selectedLanes =
      lane && lane !== "all" && TRAFFIC_LANES.includes(lane as TrafficLane)
        ? [lane as TrafficLane]
        : [...TRAFFIC_LANES];

    const stats: Record<string, Record<number, { total: number; count: number }>> = {};

    for (const currentLane of selectedLanes) {
      stats[currentLane] = {
        0: { total: 0, count: 0 },
        1: { total: 0, count: 0 },
        2: { total: 0, count: 0 },
      };
    }

    for (const item of items) {
      for (const currentLane of selectedLanes) {
        const level = getLaneQueueLevel(item, currentLane);
        const greenDuration = getLaneGreenDuration(item, currentLane);

        if (stats[currentLane]?.[level] && greenDuration > 0) {
          stats[currentLane][level].total += greenDuration;
          stats[currentLane][level].count++;
        }
      }
    }

    const rows: any[] = [];

    for (const currentLane of selectedLanes) {
      [0, 1, 2].forEach((level) => {
        const expectedDuration = EXPECTED_GREEN[level];
        const count = stats[currentLane][level].count;

        const avgGreenDuration =
          count > 0
            ? Math.round((stats[currentLane][level].total / count) * 10) / 10
            : 0;

        const effectiveness =
          avgGreenDuration > 0
            ? Math.min(
                Math.round((expectedDuration / avgGreenDuration) * 1000) / 10,
                100
              )
            : 0;

        rows.push({
          lane: LANE_NAMES[currentLane] || currentLane,
          queueLevel: level,
          count,
          avgGreenDuration,
          effectiveness,
        });
      });
    }

    const totalCount = rows.reduce((sum, row) => sum + row.count, 0);

    const avgEffectiveness =
      totalCount > 0
        ? Math.round(
            (rows.reduce(
              (sum, row) => sum + row.effectiveness * row.count,
              0
            ) /
              totalCount) *
              10
          ) / 10
        : 0;

    return NextResponse.json({
      success: true,
      rows,
      summary: {
        totalRecords: totalCount,
        avgEffectiveness,
        period: {
          startDate,
          endDate,
          intersectionId: intersectionId || "all",
          lane: lane || "all",
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching queue effectiveness:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch queue effectiveness",
      },
      { status: 500 }
    );
  }
}