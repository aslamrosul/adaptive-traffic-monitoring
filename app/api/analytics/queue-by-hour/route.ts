import { scanTrafficByDateRange } from "@/lib/aws-dynamodb";
import {
  getItemTimestamp,
  getLaneQueueLevel,
  TRAFFIC_LANES,
  type TrafficLane,
} from "@/lib/traffic-adapter";
import {
  APP_TIMEZONE,
  getWibHour,
  resolveWibAnalyticsRange,
} from "@/lib/timezone";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const {
      startDate,
      endDate,
      startUtc,
      endUtc,
    } = resolveWibAnalyticsRange(searchParams);

    const requestedLane =
      searchParams.get("lane") as TrafficLane | "all" | null;

    const intersectionId =
      searchParams.get("intersectionId");

    const parsedLimit = Number(
      searchParams.get("limit") || 5000,
    );

    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 20000)
      : 5000;

    const selectedLanes: TrafficLane[] =
      requestedLane &&
      requestedLane !== "all" &&
      TRAFFIC_LANES.includes(requestedLane)
        ? [requestedLane]
        : [...TRAFFIC_LANES];

    const items = await scanTrafficByDateRange({
      startDate: startUtc,
      endDate: endUtc,
      intersectionId,
      limit,
    });

    const laneTotals: Record<TrafficLane, number[]> = {
      north: new Array(24).fill(0),
      south: new Array(24).fill(0),
      east: new Array(24).fill(0),
    };

    const laneCounts: Record<TrafficLane, number[]> = {
      north: new Array(24).fill(0),
      south: new Array(24).fill(0),
      east: new Array(24).fill(0),
    };

    const level2Counts = new Array(24).fill(0);

    for (const item of items) {
      const timestamp = getItemTimestamp(item);
      const hour = getWibHour(timestamp);

      for (const lane of selectedLanes) {
        const level = getLaneQueueLevel(
          item,
          lane,
        );

        laneTotals[lane][hour] += level;
        laneCounts[lane][hour] += 1;

        if (level === 2) {
          level2Counts[hour] += 1;
        }
      }
    }

    function calculateLaneAverage(
      lane: TrafficLane,
      hour: number,
    ): number | null {
      const count = laneCounts[lane][hour];

      if (count === 0) {
        return null;
      }

      return (
        Math.round(
          (laneTotals[lane][hour] / count) * 100,
        ) / 100
      );
    }

    const hours = Array.from(
      {
        length: 24,
      },
      (_, hour) => {
        const sampleCount = selectedLanes.reduce(
          (sum, lane) =>
            sum + laneCounts[lane][hour],
          0,
        );

        const totalQueueLevel =
          selectedLanes.reduce(
            (sum, lane) =>
              sum + laneTotals[lane][hour],
            0,
          );

        const average =
          sampleCount > 0
            ? Math.round(
                (totalQueueLevel / sampleCount) * 100,
              ) / 100
            : null;

        let peakLane: TrafficLane | null = null;
        let peakLaneValue = -1;

        for (const lane of selectedLanes) {
          const laneAverage =
            calculateLaneAverage(lane, hour);

          if (
            laneAverage !== null &&
            laneAverage > peakLaneValue
          ) {
            peakLane = lane;
            peakLaneValue = laneAverage;
          }
        }

        return {
          hour:
            `${String(hour).padStart(2, "0")}:00`,

          north: selectedLanes.includes("north")
            ? calculateLaneAverage("north", hour)
            : null,

          south: selectedLanes.includes("south")
            ? calculateLaneAverage("south", hour)
            : null,

          east: selectedLanes.includes("east")
            ? calculateLaneAverage("east", hour)
            : null,

          average,
          sampleCount,

          peakLane,

          level2Percentage:
            sampleCount > 0
              ? Math.round(
                  (level2Counts[hour] / sampleCount) *
                    1000,
                ) / 10
              : 0,
        };
      },
    );

    const totalSamples = selectedLanes.reduce(
      (total, lane) => {
        return (
          total +
          laneCounts[lane].reduce(
            (sum, count) => sum + count,
            0,
          )
        );
      },
      0,
    );

    return NextResponse.json({
      success: true,

      timezone: APP_TIMEZONE,

      startDate,
      endDate,

      queryStartUtc: startUtc,
      queryEndUtc: endUtc,

      itemCount: items.length,
      totalSamples,

      selectedLanes,
      hours,
    });
  } catch (error: any) {
    console.error(
      "Error fetching queue by hour:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Gagal mengambil antrian per jam",
      },
      {
        status: 500,
      },
    );
  }
}