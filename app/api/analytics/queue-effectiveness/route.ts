import { containers } from "@/lib/azure-cosmos";
import { QUEUE_LEVEL_CONFIG } from "@/lib/types/traffic";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET: Queue Effectiveness Table (NEW CONCEPT)
 * Returns effectiveness metrics per lane and queue level
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const lane = searchParams.get("lane"); // Optional filter

    // Default to last 7 days if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate 
      ? new Date(startDate) 
      : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Build query
    let query = `
      SELECT 
        c.lane,
        c.queueLevel,
        c.greenDuration
      FROM c
      WHERE c.timestamp >= @startDate 
        AND c.timestamp <= @endDate
        AND IS_DEFINED(c.queueLevel)
        AND IS_DEFINED(c.greenDuration)
    `;

    const parameters: any[] = [
      { name: "@startDate", value: start.toISOString() },
      { name: "@endDate", value: end.toISOString() },
    ];

    // Add lane filter if specified
    if (lane) {
      query += ` AND c.lane = @lane`;
      parameters.push({ name: "@lane", value: lane });
    }

    // Execute query
    const { resources } = await containers.trafficData.items
      .query({ query, parameters })
      .fetchAll();

    // Aggregate data by lane and queue level
    const stats: Record<string, Record<number, { total: number; count: number }>> = {};
    const lanes = ['north', 'south', 'east', 'west'];

    lanes.forEach((l) => {
      stats[l] = {
        0: { total: 0, count: 0 },
        1: { total: 0, count: 0 },
        2: { total: 0, count: 0 },
      };
    });

    resources.forEach((item: any) => {
      const l = item.lane;
      const level = item.queueLevel;
      
      if (stats[l] && stats[l][level] !== undefined) {
        stats[l][level].total += item.greenDuration;
        stats[l][level].count++;
      }
    });

    // Build response table
    const table: any[] = [];

    lanes.forEach((l) => {
      [0, 1, 2].forEach((level) => {
        const expected = QUEUE_LEVEL_CONFIG[level as 0 | 1 | 2].greenDuration;
        const count = stats[l][level].count;
        const avgGreenDuration = count > 0 
          ? Math.round((stats[l][level].total / count) * 10) / 10 
          : 0;
        
        // Effectiveness = (expected / actual) * 100
        const effectiveness = avgGreenDuration > 0
          ? Math.min(Math.round((expected / avgGreenDuration) * 100 * 10) / 10, 100)
          : 0;

        table.push({
          lane: l,
          queueLevel: level,
          count,
          avgGreenDuration,
          expectedDuration: expected,
          effectiveness,
          status: effectiveness >= 95 ? 'excellent' : effectiveness >= 85 ? 'good' : 'needs-improvement',
        });
      });
    });

    // Sort by lane and queue level
    table.sort((a, b) => {
      if (a.lane !== b.lane) {
        return lanes.indexOf(a.lane) - lanes.indexOf(b.lane);
      }
      return a.queueLevel - b.queueLevel;
    });

    // Calculate summary statistics
    const totalCount = table.reduce((sum, row) => sum + row.count, 0);
    const avgEffectiveness = totalCount > 0
      ? Math.round(
          (table.reduce((sum, row) => sum + row.effectiveness * row.count, 0) / totalCount) * 10
        ) / 10
      : 0;

    const summary = {
      totalRecords: totalCount,
      avgEffectiveness,
      excellentCount: table.filter((r) => r.status === 'excellent').length,
      goodCount: table.filter((r) => r.status === 'good').length,
      needsImprovementCount: table.filter((r) => r.status === 'needs-improvement').length,
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    };

    return NextResponse.json({
      success: true,
      data: table,
      summary,
      message: "Queue effectiveness table retrieved successfully",
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
