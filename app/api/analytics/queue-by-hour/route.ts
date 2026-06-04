import { scanTrafficByDateRange } from "@/lib/aws-dynamodb";
import {
  getItemTimestamp,
  getLaneQueueLevel,
  TRAFFIC_LANES,
  type TrafficLane,
} from "@/lib/traffic-adapter";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];
    const laneFilter = searchParams.get("lane") as TrafficLane | "all" | null;
    const intersectionId = searchParams.get("intersectionId");
    const limit = Number(searchParams.get("limit") || 5000);

    const startDate = `${date}T00:00:00.000Z`;
    const endDate = `${date}T23:59:59.999Z`;

    const items = await scanTrafficByDateRange({
      startDate,
      endDate,
      intersectionId,
      limit,
    });

    const selectedLanes =
      laneFilter && laneFilter !== "all" && TRAFFIC_LANES.includes(laneFilter as TrafficLane)
        ? [laneFilter as TrafficLane]
        : [...TRAFFIC_LANES];

    const hours = Array.from({ length: 24 }, (_, i) => i);

    const laneTotals: Record<string, number[]> = {
      north: new Array(24).fill(0),
      south: new Array(24).fill(0),
      east: new Array(24).fill(0),
      west: new Array(24).fill(0),
    };

    const laneCounts: Record<string, number[]> = {
      north: new Array(24).fill(0),
      south: new Array(24).fill(0),
      east: new Array(24).fill(0),
      west: new Array(24).fill(0),
    };

    for (const item of items) {
      const timestamp = getItemTimestamp(item);
      const hour = new Date(timestamp).getUTCHours();

      for (const lane of selectedLanes) {
        const level = getLaneQueueLevel(item, lane);
        laneTotals[lane][hour] += level;
        laneCounts[lane][hour]++;
      }
    }

    function avg(lane: string, hour: number) {
      const count = laneCounts[lane][hour];
      if (count === 0) return 0;
      return Math.round((laneTotals[lane][hour] / count) * 10) / 10;
    }

    const hoursData = hours.map((hour) => ({
      hour: `${String(hour).padStart(2, "0")}:00`,
      north: selectedLanes.includes("north") ? avg("north", hour) : 0,
      south: selectedLanes.includes("south") ? avg("south", hour) : 0,
      east: selectedLanes.includes("east") ? avg("east", hour) : 0,
      west: 0,
    }));

    return NextResponse.json({
      success: true,
      date,
      hours: hoursData,
    });
  } catch (error: any) {
    console.error("Error fetching queue by hour:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch queue by hour",
      },
      { status: 500 }
    );
  }
}