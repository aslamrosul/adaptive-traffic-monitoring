import { scanTrafficByDateRange } from "@/lib/aws-dynamodb";
import {
  getLaneGreenDuration,
  getLaneQueueLevel,
  TRAFFIC_LANES,
} from "@/lib/traffic-adapter";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const EXPECTED_GREEN: Record<number, number> = {
  0: 10,
  1: 20,
  2: 30,
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
    const intersectionId = searchParams.get("intersectionId");
    const limit = Number(searchParams.get("limit") || 5000);

    const items = await scanTrafficByDateRange({
      startDate,
      endDate,
      intersectionId,
      limit,
    });

    const stats: Record<number, { total: number; count: number }> = {
      0: { total: 0, count: 0 },
      1: { total: 0, count: 0 },
      2: { total: 0, count: 0 },
    };

    for (const item of items) {
      for (const lane of TRAFFIC_LANES) {
        const level = getLaneQueueLevel(item, lane);
        const greenDuration = getLaneGreenDuration(item, lane);

        if (stats[level] && greenDuration > 0) {
          stats[level].total += greenDuration;
          stats[level].count++;
        }
      }
    }

    const result: any = {};

    [0, 1, 2].forEach((level) => {
      const expected = EXPECTED_GREEN[level];
      const count = stats[level].count;
      const actual =
        count > 0 ? Math.round((stats[level].total / count) * 10) / 10 : 0;

      const effectiveness =
        actual > 0 ? Math.round((expected / actual) * 1000) / 10 : 0;

      result[`level${level}`] = {
        expected,
        actual,
        effectiveness: Math.min(effectiveness, 100),
        count,
      };
    });

    const totalCount = stats[0].count + stats[1].count + stats[2].count;

    const avgEffectiveness =
      totalCount > 0
        ? Math.round(
            ((result.level0.effectiveness * stats[0].count +
              result.level1.effectiveness * stats[1].count +
              result.level2.effectiveness * stats[2].count) /
              totalCount) *
              10
          ) / 10
        : 0;

    return NextResponse.json({
      success: true,
      level0: result.level0,
      level1: result.level1,
      level2: result.level2,
      summary: {
        totalCount,
        avgEffectiveness,
        period: {
          startDate,
          endDate,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching green duration effectiveness:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch green duration effectiveness",
      },
      { status: 500 }
    );
  }
}