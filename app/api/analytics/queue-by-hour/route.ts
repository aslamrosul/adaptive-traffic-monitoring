import { containers } from "@/lib/azure-cosmos";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET: Queue Level by Hour Analytics (NEW CONCEPT)
 * Returns average queue level per hour for each lane
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const laneFilter = searchParams.get("lane"); // Optional: filter by specific lane

    // Default to today if no date provided
    const date = dateParam || new Date().toISOString().split('T')[0];
    
    // Calculate start and end of day
    const startDate = `${date}T00:00:00.000Z`;
    const endDate = `${date}T23:59:59.999Z`;

    // Build query
    let query = `
      SELECT 
        c.lane,
        c.queueLevel,
        c.timestamp
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
    if (laneFilter) {
      query += ` AND c.lane = @lane`;
      parameters.push({ name: "@lane", value: laneFilter });
    }

    // Execute query
    const { resources } = await containers.trafficData.items
      .query({ query, parameters })
      .fetchAll();

    // Initialize data structure for 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const laneData: Record<string, number[]> = {
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

    // Aggregate data by hour and lane
    resources.forEach((item: any) => {
      const timestamp = new Date(item.timestamp);
      const hour = timestamp.getUTCHours();
      const lane = item.lane;

      if (laneData[lane] !== undefined) {
        laneData[lane][hour] += item.queueLevel;
        laneCounts[lane][hour]++;
      }
    });

    // Calculate averages
    const lanes = ['north', 'south', 'east', 'west'];
    lanes.forEach((lane) => {
      for (let hour = 0; hour < 24; hour++) {
        if (laneCounts[lane][hour] > 0) {
          laneData[lane][hour] = Math.round((laneData[lane][hour] / laneCounts[lane][hour]) * 10) / 10;
        }
      }
    });

    // Build response
    const response: any = {
      hours,
      date,
    };

    // Add lane data (only include filtered lane if specified)
    if (laneFilter) {
      response[laneFilter] = laneData[laneFilter];
    } else {
      lanes.forEach((lane) => {
        response[lane] = laneData[lane];
      });
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: "Queue level by hour retrieved successfully",
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
