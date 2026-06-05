import { scanTrafficByDateRange } from "@/lib/aws-dynamodb";
import {
  getItemTimestamp,
  getLaneQueueLevel,
  TRAFFIC_LANES,
  type TrafficLane,
} from "@/lib/traffic-adapter";
import { NextResponse } from "next/server";
import { resolveWibAnalyticsRange } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const { startUtc, endUtc } = resolveWibAnalyticsRange(searchParams);
    const lane = searchParams.get("lane") as TrafficLane | "all" | null;
    const intersectionId = searchParams.get("intersectionId");
    const limit = Number(searchParams.get("limit") || 5000);

    const items = await scanTrafficByDateRange({
      startDate: startUtc,
      endDate: endUtc,
      intersectionId,
      limit,
    });

    const selectedLanes =
      lane && lane !== "all" && TRAFFIC_LANES.includes(lane as TrafficLane)
        ? [lane as TrafficLane]
        : [...TRAFFIC_LANES];

    const distribution = {
      level0: 0,
      level1: 0,
      level2: 0,
    };

    for (const item of items) {
      const timestamp = getItemTimestamp(item);
      if (timestamp < startUtc || timestamp > endUtc) continue;

      for (const currentLane of selectedLanes) {
        const level = getLaneQueueLevel(item, currentLane);

        if (level === 0) distribution.level0++;
        else if (level === 1) distribution.level1++;
        else if (level === 2) distribution.level2++;
      }
    }

    const total =
      distribution.level0 + distribution.level1 + distribution.level2;

    return NextResponse.json({
      success: true,
      level0: {
        count: distribution.level0,
        percentage:
          total > 0
            ? Math.round((distribution.level0 / total) * 1000) / 10
            : 0,
      },
      level1: {
        count: distribution.level1,
        percentage:
          total > 0
            ? Math.round((distribution.level1 / total) * 1000) / 10
            : 0,
      },
      level2: {
        count: distribution.level2,
        percentage:
          total > 0
            ? Math.round((distribution.level2 / total) * 1000) / 10
            : 0,
      },
      total,
      period: {
        startDate: startUtc,
        endDate: endUtc,
        lane: lane || "all",
        intersectionId: intersectionId || "all",
      },
    });
  } catch (error: any) {
    console.error("Error fetching queue distribution:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch queue distribution",
      },
      { status: 500 }
    );
  }
}