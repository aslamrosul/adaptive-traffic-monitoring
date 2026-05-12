import { containers } from "@/lib/azure-cosmos";
import type { TrafficDataItem } from "@/lib/types/traffic";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET: Fetch latest traffic data per lane (NEW CONCEPT)
 * Returns the most recent data for each lane with queue level info
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const intersectionId = searchParams.get("intersectionId");
    const deviceId = searchParams.get("deviceId");

    if (!intersectionId && !deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: "intersectionId or deviceId is required",
        },
        { status: 400 }
      );
    }

    // Query to get latest data per lane
    const lanes = ['north', 'south', 'east', 'west'];
    const latestData: Record<string, TrafficDataItem | null> = {
      north: null,
      south: null,
      east: null,
      west: null,
    };

    for (const lane of lanes) {
      let query = `
        SELECT TOP 1 * FROM c 
        WHERE c.lane = @lane
      `;
      const parameters: any[] = [{ name: "@lane", value: lane }];

      if (intersectionId) {
        query += ` AND c.intersectionId = @intersectionId`;
        parameters.push({ name: "@intersectionId", value: intersectionId });
      }

      if (deviceId) {
        query += ` AND c.deviceId = @deviceId`;
        parameters.push({ name: "@deviceId", value: deviceId });
      }

      query += ` ORDER BY c._ts DESC`;

      const { resources } = await containers.trafficData.items
        .query({
          query,
          parameters,
        })
        .fetchAll();

      if (resources.length > 0) {
        latestData[lane] = resources[0] as TrafficDataItem;
      }
    }

    // Format response with NEW CONCEPT structure
    const response = {
      deviceId: deviceId || latestData.north?.deviceId || 'unknown',
      intersectionId: intersectionId || latestData.north?.intersectionId || 'unknown',
      timestamp: Date.now(),
      north: formatLaneData(latestData.north),
      south: formatLaneData(latestData.south),
      east: formatLaneData(latestData.east),
      west: formatLaneData(latestData.west),
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: "Latest traffic data retrieved (NEW CONCEPT)",
    });
  } catch (error: any) {
    console.error("Error fetching latest traffic data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch latest traffic data",
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to format lane data (NEW CONCEPT)
 */
function formatLaneData(data: TrafficDataItem | null) {
  if (!data) {
    return {
      light: 'red' as const,
      vehicleCount: 0,
      irState: 'clear' as const,
      queueLength: 0,
      queueLevel: 0 as const,
      greenDuration: 7,
      timestamp: null,
    };
  }

  return {
    light: data.light || 'red',
    vehicleCount: data.vehicleCount || 0,
    irState: data.irState || 'clear',
    queueLength: data.queueLength || 0,
    queueLevel: data.queueLevel !== undefined ? data.queueLevel : 0,
    greenDuration: data.greenDuration || 7,
    timestamp: data.timestamp,
  };
}
