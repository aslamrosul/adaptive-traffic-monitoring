import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/analytics/green-duration-effectiveness
 * 
 * Fetches green light duration effectiveness data comparing expected vs actual durations
 * for each queue level within a date range.
 * 
 * Query Parameters:
 * - startDate: ISO date string (YYYY-MM-DD)
 * - endDate: ISO date string (YYYY-MM-DD)
 * 
 * Response:
 * {
 *   level0: { expected, actual, effectiveness, count },
 *   level1: { expected, actual, effectiveness, count },
 *   level2: { expected, actual, effectiveness, count }
 * }
 */

interface LevelData {
  expected: number;
  actual: number;
  effectiveness: number;
  count: number;
}

interface ResponseData {
  level0: LevelData;
  level1: LevelData;
  level2: LevelData;
}

// Expected green light durations for each queue level
const EXPECTED_DURATIONS: Record<number, number> = {
  0: 7,   // Level 0 (Lancar): 7 seconds
  1: 10,  // Level 1 (Sedang): 10 seconds
  2: 15,  // Level 2 (Padat): 15 seconds
};

// Mock data generator for demonstration
function generateMockData(startDate: string, endDate: string): ResponseData {
  // In production, this would query Cosmos DB
  // For now, return realistic mock data
  
  return {
    level0: {
      expected: 7,
      actual: 7.2,
      effectiveness: 97.1,
      count: 450,
    },
    level1: {
      expected: 10,
      actual: 10.5,
      effectiveness: 95.2,
      count: 350,
    },
    level2: {
      expected: 15,
      actual: 15.8,
      effectiveness: 94.9,
      count: 200,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate parameters are required" },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: "Dates must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return NextResponse.json(
        { error: "startDate must be before endDate" },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Cosmos DB query
    // Example implementation:
    /*
    const client = await getCosmosClient();
    const container = client.database("traffic_db").container("events");

    const query = `
      SELECT 
        c.queueLevel,
        AVG(c.greenDuration) as avgDuration,
        COUNT(1) as count
      FROM c
      WHERE c.timestamp >= @startDate 
        AND c.timestamp <= @endDate
        AND c.queueLevel IN (0, 1, 2)
      GROUP BY c.queueLevel
    `;

    const { resources } = await container.items
      .query(query, {
        parameters: [
          { name: "@startDate", value: startDate + "T00:00:00Z" },
          { name: "@endDate", value: endDate + "T23:59:59Z" },
        ],
      })
      .fetchAll();

    // Process results...
    */

    // For now, return mock data
    const data = generateMockData(startDate, endDate);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching green duration effectiveness data:", error);
    return NextResponse.json(
      { error: "Failed to fetch green duration effectiveness data" },
      { status: 500 }
    );
  }
}
