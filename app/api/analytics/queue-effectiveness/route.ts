import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/analytics/queue-effectiveness
 * 
 * Fetches queue effectiveness data showing average green duration per lane and queue level
 * 
 * Query Parameters:
 * - startDate: ISO date string (YYYY-MM-DD)
 * - endDate: ISO date string (YYYY-MM-DD)
 * 
 * Response:
 * {
 *   rows: [
 *     {
 *       lane: string,
 *       queueLevel: 0 | 1 | 2,
 *       count: number,
 *       avgGreenDuration: number,
 *       effectiveness: number
 *     }
 *   ]
 * }
 */

interface RowData {
  lane: string;
  queueLevel: 0 | 1 | 2;
  count: number;
  avgGreenDuration: number;
  effectiveness: number;
}

interface ResponseData {
  rows: RowData[];
}

// Expected green light durations for each queue level
const EXPECTED_DURATIONS: Record<number, number> = {
  0: 7,   // Level 0 (Lancar): 7 seconds
  1: 10,  // Level 1 (Sedang): 10 seconds
  2: 15,  // Level 2 (Padat): 15 seconds
};

// Lane names
const LANE_NAMES: Record<string, string> = {
  north: "Jalur Utara",
  south: "Jalur Selatan",
  east: "Jalur Timur",
  west: "Jalur Barat",
};

// Mock data generator for demonstration
function generateMockData(): RowData[] {
  return [
    {
      lane: "Jalur Utara",
      queueLevel: 0,
      count: 450,
      avgGreenDuration: 7.2,
      effectiveness: 97.1,
    },
    {
      lane: "Jalur Utara",
      queueLevel: 1,
      count: 320,
      avgGreenDuration: 10.5,
      effectiveness: 95.2,
    },
    {
      lane: "Jalur Utara",
      queueLevel: 2,
      count: 180,
      avgGreenDuration: 15.8,
      effectiveness: 94.9,
    },
    {
      lane: "Jalur Selatan",
      queueLevel: 0,
      count: 480,
      avgGreenDuration: 7.1,
      effectiveness: 98.6,
    },
    {
      lane: "Jalur Selatan",
      queueLevel: 1,
      count: 350,
      avgGreenDuration: 10.3,
      effectiveness: 96.8,
    },
    {
      lane: "Jalur Selatan",
      queueLevel: 2,
      count: 170,
      avgGreenDuration: 15.2,
      effectiveness: 98.7,
    },
    {
      lane: "Jalur Timur",
      queueLevel: 0,
      count: 420,
      avgGreenDuration: 7.3,
      effectiveness: 95.9,
    },
    {
      lane: "Jalur Timur",
      queueLevel: 1,
      count: 310,
      avgGreenDuration: 10.7,
      effectiveness: 93.5,
    },
    {
      lane: "Jalur Timur",
      queueLevel: 2,
      count: 190,
      avgGreenDuration: 16.1,
      effectiveness: 93.1,
    },
    {
      lane: "Jalur Barat",
      queueLevel: 0,
      count: 460,
      avgGreenDuration: 7.0,
      effectiveness: 100.0,
    },
    {
      lane: "Jalur Barat",
      queueLevel: 1,
      count: 340,
      avgGreenDuration: 10.2,
      effectiveness: 97.9,
    },
    {
      lane: "Jalur Barat",
      queueLevel: 2,
      count: 200,
      avgGreenDuration: 15.5,
      effectiveness: 96.7,
    },
  ];
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
        c.lane,
        c.queueLevel,
        COUNT(1) as count,
        AVG(c.greenDuration) as avgGreenDuration
      FROM c
      WHERE c.timestamp >= @startDate 
        AND c.timestamp <= @endDate
        AND c.queueLevel IN (0, 1, 2)
      GROUP BY c.lane, c.queueLevel
      ORDER BY c.lane, c.queueLevel
    `;

    const { resources } = await container.items
      .query(query, {
        parameters: [
          { name: "@startDate", value: startDate + "T00:00:00Z" },
          { name: "@endDate", value: endDate + "T23:59:59Z" },
        ],
      })
      .fetchAll();

    // Process results and calculate effectiveness
    const rows: RowData[] = resources.map((item: any) => {
      const expected = EXPECTED_DURATIONS[item.queueLevel];
      const actual = item.avgGreenDuration;
      const effectiveness = (expected / actual) * 100;

      return {
        lane: LANE_NAMES[item.lane] || item.lane,
        queueLevel: item.queueLevel,
        count: item.count,
        avgGreenDuration: Math.round(actual * 10) / 10,
        effectiveness: Math.round(effectiveness * 10) / 10,
      };
    });
    */

    // For now, return mock data
    const data: ResponseData = {
      rows: generateMockData(),
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching queue effectiveness data:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue effectiveness data" },
      { status: 500 }
    );
  }
}
