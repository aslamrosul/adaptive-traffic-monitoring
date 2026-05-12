import { containers } from "@/lib/azure-cosmos";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET: Queue Level Distribution Analytics (NEW CONCEPT)
 * Returns distribution of queue levels (0, 1, 2) over a time period
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const lane = searchParams.get("lane"); // Optional: filter by lane

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
    let query = `
      SELECT c.queueLevel
      FROM c
      WHERE c.timestamp >= @startDate 
        AND c.timestamp <= @endDate
        AND IS_DEFINED(c.queueLevel)
    `;

    const parameters: any[] = [
      { name: "@startDate", value: startDate },
      { name: "@endDate", value: endDate },
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

    // Calculate distribution
    const distribution = {
      level0: 0,
      level1: 0,
      level2: 0,
    };

    resources.forEach((item: any) => {
      if (item.queueLevel === 0) distribution.level0++;
      else if (item.queueLevel === 1) distribution.level1++;
      else if (item.queueLevel === 2) distribution.level2++;
    });

    const total = distribution.level0 + distribution.level1 + distribution.level2;

    // Calculate percentages
    const response = {
      level0: {
        count: distribution.level0,
        percentage: total > 0 ? Math.round((distribution.level0 / total) * 100 * 10) / 10 : 0,
      },
      level1: {
        count: distribution.level1,
        percentage: total > 0 ? Math.round((distribution.level1 / total) * 100 * 10) / 10 : 0,
      },
      level2: {
        count: distribution.level2,
        percentage: total > 0 ? Math.round((distribution.level2 / total) * 100 * 10) / 10 : 0,
      },
      total,
      period: {
        startDate,
        endDate,
        lane: lane || "all",
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: "Queue distribution retrieved successfully",
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
