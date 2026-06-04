import { scanTrafficByDateRange } from "@/lib/aws-dynamodb";
import {
  getItemTimestamp,
  getLaneQueueLevel,
  TRAFFIC_LANES,
  type TrafficLane,
} from "@/lib/traffic-adapter";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

    const distribution = {
      level0: 0,
      level1: 0,
      level2: 0,
    };

    for (const item of items) {
      const timestamp = getItemTimestamp(item);
      if (timestamp < startDate || timestamp > endDate) continue;

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
        startDate,
        endDate,
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