import { containers } from "@/lib/azure-cosmos";
import { QUEUE_LEVEL_CONFIG } from "@/lib/types/traffic";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET: Green Duration Effectiveness Analytics (NEW CONCEPT)
 * Compares expected vs actual green duration for each queue level
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "startDate and endDate are required (ISO string format)",
        },
        { status: 400 }
      );
    }

    // Build query
    const query = `
      SELECT 
        c.queueLevel,
        c.greenDuration
      FROM c
      WHERE c.timestamp >= @startDate 
        AND c.timestamp <= @endDate
        AND IS_DEFINED(c.queueLevel)
        AND IS_DEFINED(c.greenDuration)
    `;

    const parameters = [
      { name: "@startDate", value: startDate },
      { name: "@endDate", value: endDate },
    ];

    // Execute query
    const { resources } = await containers.trafficData.items
      .query({ query, parameters })
      .fetchAll();

    // Aggregate data by queue level
    const stats: Record<number, { total: number; count: number }> = {
      0: { total: 0, count: 0 },
      1: { total: 0, count: 0 },
      2: { total: 0, count: 0 },
    };

    resources.forEach((item: any) => {
      const level = item.queueLevel;
      if (stats[level] !== undefined) {
        stats[level].total += item.greenDuration;
        stats[level].count++;
      }
    });

    // Calculate effectiveness for each level
    const response: any = {};

    [0, 1, 2].forEach((level) => {
      const expected = QUEUE_LEVEL_CONFIG[level as 0 | 1 | 2].greenDuration;
      const count = stats[level].count;
      const actual = count > 0 ? Math.round((stats[level].total / count) * 10) / 10 : 0;
      
      // Effectiveness = (expected / actual) * 100
      // If actual is close to expected, effectiveness is high
      const effectiveness = actual > 0 
        ? Math.round((expected / actual) * 100 * 10) / 10 
        : 0;

      response[`level${level}`] = {
        expected,
        actual,
        effectiveness: Math.min(effectiveness, 100), // Cap at 100%
        count,
      };
    });

    // Add summary
    const totalCount = stats[0].count + stats[1].count + stats[2].count;
    const avgEffectiveness = totalCount > 0
      ? Math.round(
          ((response.level0.effectiveness * stats[0].count +
            response.level1.effectiveness * stats[1].count +
            response.level2.effectiveness * stats[2].count) /
            totalCount) *
            10
        ) / 10
      : 0;

    response.summary = {
      totalCount,
      avgEffectiveness,
      period: {
        startDate,
        endDate,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: "Green duration effectiveness retrieved successfully",
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
