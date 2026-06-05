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

type HourlyLaneValues = Record<
  TrafficLane,
  Array<number | null>
>;

type HourlyLaneCounts = Record<
  TrafficLane,
  number[]
>;

function createHourlyValues(): HourlyLaneValues {
  return {
    north: new Array(24).fill(null),
    south: new Array(24).fill(null),
    east: new Array(24).fill(null),
  };
}

function createHourlyCounts(): HourlyLaneCounts {
  return {
    north: new Array(24).fill(0),
    south: new Array(24).fill(0),
    east: new Array(24).fill(0),
  };
}

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
      ? Math.min(Math.max(parsedLimit, 1), 20_000)
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

    const laneCounts = createHourlyCounts();
    const laneAverages = createHourlyValues();

    for (const item of items) {
      const timestamp = getItemTimestamp(item);
      const hour = getWibHour(timestamp);

      for (const lane of selectedLanes) {
        const queueLevel = getLaneQueueLevel(item, lane);

        laneTotals[lane][hour] += queueLevel;
        laneCounts[lane][hour] += 1;
      }
    }

    for (const lane of selectedLanes) {
      for (let hour = 0; hour < 24; hour++) {
        const count = laneCounts[lane][hour];

        if (count === 0) {
          laneAverages[lane][hour] = null;
          continue;
        }

        laneAverages[lane][hour] =
          Math.round(
            (laneTotals[lane][hour] / count) * 100,
          ) / 100;
      }
    }

    const hours = Array.from(
      {
        length: 24,
      },
      (_, hour) => {
        const sampleCount = selectedLanes.reduce(
          (sum, lane) => sum + laneCounts[lane][hour],
          0,
        );

        return {
          hour: `${String(hour).padStart(2, "0")}:00`,

          north: selectedLanes.includes("north")
            ? laneAverages.north[hour]
            : null,

          south: selectedLanes.includes("south")
            ? laneAverages.south[hour]
            : null,

          east: selectedLanes.includes("east")
            ? laneAverages.east[hour]
            : null,

          sampleCount,
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

      intersectionId: intersectionId || "all",
      selectedLanes,

      itemCount: items.length,
      totalSamples,

      hours,
    });
  } catch (error: any) {
    console.error("Error fetching queue by hour:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Gagal mengambil level antrian per jam",
      },
      {
        status: 500,
      },
    );
  }
}