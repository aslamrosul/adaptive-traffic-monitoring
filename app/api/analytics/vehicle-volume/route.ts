import { scanTrafficByDateRange } from "@/lib/aws-dynamodb";
import {
  calculateVehicleDeltaEvents,
  formatLaneName,
  formatWibDayLabel,
  getSelectedTrafficLanes,
} from "@/lib/vehicle-analytics";
import {
  addDaysToDateValue,
  resolveWibAnalyticsRange,
} from "@/lib/timezone";
import type { TrafficLane } from "@/lib/traffic-adapter";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type GroupBy = "hour" | "day";

interface VolumeBucket {
  period: string;
  label: string;

  north: number;
  south: number;
  east: number;

  total: number;
}

function countInclusiveDays(
  startDate: string,
  endDate: string,
): number {
  const start = new Date(`${startDate}T12:00:00.000Z`);
  const end = new Date(`${endDate}T12:00:00.000Z`);

  const difference =
    Math.floor(
      (end.getTime() - start.getTime()) /
        (24 * 60 * 60 * 1000),
    ) + 1;

  return Math.max(1, difference);
}

function createBucket(
  period: string,
  label: string,
): VolumeBucket {
  return {
    period,
    label,

    north: 0,
    south: 0,
    east: 0,

    total: 0,
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

    const intersectionId =
      searchParams.get("intersectionId");

    const requestedLane =
      searchParams.get("lane") as TrafficLane | "all" | null;

    const requestedGroupBy =
      searchParams.get("groupBy") as GroupBy | null;

    const parsedLimit = Number(
      searchParams.get("limit") || 20000,
    );

    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 100), 50000)
      : 20000;

    const dayCount = countInclusiveDays(
      startDate,
      endDate,
    );

    const groupBy: GroupBy =
      requestedGroupBy === "hour" ||
      requestedGroupBy === "day"
        ? requestedGroupBy
        : dayCount <= 2
          ? "hour"
          : "day";

    /*
     * Ambil satu hari sebelum periode sebagai baseline counter.
     * Baseline diperlukan agar kenaikan counter pada awal periode
     * tetap dapat dihitung.
     */
    const lookbackStartDate =
      addDaysToDateValue(startDate, -1);

    const lookbackStartUtc = new Date(
      `${lookbackStartDate}T00:00:00.000+07:00`,
    ).toISOString();

    const items = await scanTrafficByDateRange({
      startDate: lookbackStartUtc,
      endDate: endUtc,
      intersectionId,
      limit,
    });

    const selectedLanes =
      getSelectedTrafficLanes(requestedLane);

    const events = calculateVehicleDeltaEvents(
      items,
      {
        startUtc,
        endUtc,
      },
    ).filter((event) => {
      return selectedLanes.includes(event.lane);
    });

    const bucketMap = new Map<string, VolumeBucket>();

    if (groupBy === "hour") {
      let currentDate = startDate;

      while (currentDate <= endDate) {
        for (let hour = 0; hour < 24; hour++) {
          const hourText =
            String(hour).padStart(2, "0");

          const period =
            `${currentDate}T${hourText}`;

          const label =
            dayCount === 1
              ? `${hourText}:00`
              : `${currentDate.slice(5)} ${hourText}:00`;

          bucketMap.set(
            period,
            createBucket(period, label),
          );
        }

        currentDate =
          addDaysToDateValue(currentDate, 1);
      }
    } else {
      let currentDate = startDate;

      while (currentDate <= endDate) {
        bucketMap.set(
          currentDate,
          createBucket(
            currentDate,
            formatWibDayLabel(currentDate),
          ),
        );

        currentDate =
          addDaysToDateValue(currentDate, 1);
      }
    }

    for (const event of events) {
      const period =
        groupBy === "hour"
          ? `${event.date}T${String(event.hour).padStart(2, "0")}`
          : event.date;

      const bucket = bucketMap.get(period);

      if (!bucket) {
        continue;
      }

      bucket[event.lane] += event.delta;
      bucket.total += event.delta;
    }

    const data = Array.from(bucketMap.values()).sort(
      (a, b) => a.period.localeCompare(b.period),
    );

    const totalByLane = {
      north: data.reduce(
        (sum, row) => sum + row.north,
        0,
      ),

      south: data.reduce(
        (sum, row) => sum + row.south,
        0,
      ),

      east: data.reduce(
        (sum, row) => sum + row.east,
        0,
      ),
    };

    const totalVehicles =
      totalByLane.north +
      totalByLane.south +
      totalByLane.east;

    const peakBucket = data.reduce<VolumeBucket | null>(
      (peak, current) => {
        if (!peak || current.total > peak.total) {
          return current;
        }

        return peak;
      },
      null,
    );

    let peakLane: TrafficLane | null = null;

    if (peakBucket && peakBucket.total > 0) {
      peakLane = (
        ["north", "south", "east"] as TrafficLane[]
      ).reduce((best, lane) => {
        if (!best) return lane;

        return peakBucket[lane] >
          peakBucket[best]
          ? lane
          : best;
      }, null as TrafficLane | null);
    }

    return NextResponse.json({
      success: true,

      groupBy,

      totalVehicles,
      totalByLane,

      peak: peakBucket
        ? {
            period: peakBucket.period,
            label: peakBucket.label,
            count: peakBucket.total,
            lane: peakLane,
            laneName: formatLaneName(peakLane),
          }
        : null,

      data,

      summary: {
        eventCount: events.length,
        telemetryCount: items.length,

        period: {
          startDate,
          endDate,
          startUtc,
          endUtc,
        },

        intersectionId:
          intersectionId || "all",

        lane: requestedLane || "all",
      },
    });
  } catch (error: any) {
    console.error(
      "Error fetching vehicle volume:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Gagal mengambil volume kendaraan",
      },
      {
        status: 500,
      },
    );
  }
}