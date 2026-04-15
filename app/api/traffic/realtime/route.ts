import { NextResponse } from "next/server";
import { containers } from "@/lib/azure-cosmos";

export const dynamic = 'force-dynamic';

// GET: Fetch real-time traffic data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const deviceId = searchParams.get("deviceId");

    let query = "SELECT * FROM c ORDER BY c._ts DESC";
    const parameters: any[] = [];

    if (deviceId) {
      query = "SELECT * FROM c WHERE c.deviceId = @deviceId ORDER BY c._ts DESC";
      parameters.push({ name: "@deviceId", value: deviceId });
    }

    query += ` OFFSET 0 LIMIT ${limit}`;

    const { resources } = await containers.trafficData.items
      .query({
        query,
        parameters,
      })
      .fetchAll();

    return NextResponse.json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error: any) {
    console.error("Error fetching traffic data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch traffic data",
      },
      { status: 500 }
    );
  }
}

// POST: Receive data from ESP32 or external sources
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.deviceId || !data.lane) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: deviceId, lane",
        },
        { status: 400 }
      );
    }

    // Create item with timestamp
    const item = {
      id: `${data.deviceId}-${Date.now()}`,
      deviceId: data.deviceId,
      lane: data.lane,
      vehicleCount: data.vehicleCount || 0,
      speed: data.speed || 0,
      density: data.density || 0,
      status: data.status || "normal",
      timestamp: new Date().toISOString(),
      _ts: Math.floor(Date.now() / 1000),
    };

    // Save to Cosmos DB
    const { resource } = await containers.trafficData.items.create(item);

    return NextResponse.json({
      success: true,
      message: "Data saved successfully",
      id: resource?.id,
    });
  } catch (error: any) {
    console.error("Error saving traffic data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save traffic data",
      },
      { status: 500 }
    );
  }
}
