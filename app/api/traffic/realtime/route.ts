import { containers } from "@/lib/azure-cosmos";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// GET: Fetch real-time traffic data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const deviceId = searchParams.get("deviceId");
    const intersectionId = searchParams.get("intersectionId");

    let query = "SELECT * FROM c ORDER BY c._ts DESC";
    const parameters: any[] = [];

    if (deviceId) {
      query = "SELECT * FROM c WHERE c.deviceId = @deviceId ORDER BY c._ts DESC";
      parameters.push({ name: "@deviceId", value: deviceId });
    } else if (intersectionId) {
      // Query by intersectionId (which matches deviceId)
      query = "SELECT * FROM c WHERE c.intersectionId = @intersectionId ORDER BY c._ts DESC";
      parameters.push({ name: "@intersectionId", value: intersectionId });
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

// Mapping deviceId to intersectionId
const DEVICE_TO_INTERSECTION: Record<string, string> = {
  "lane-north": "int-001",
  "lane-south": "int-001",
  "lane-east": "int-001",
  "lane-west": "int-001",
};

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

    // Validate queue level (NEW CONCEPT)
    if (data.queueLevel !== undefined && ![0, 1, 2].includes(data.queueLevel)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid queueLevel. Must be 0, 1, or 2",
        },
        { status: 400 }
      );
    }

    // Validate queue length (NEW CONCEPT)
    if (data.queueLength !== undefined && data.queueLength < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid queueLength. Must be >= 0",
        },
        { status: 400 }
      );
    }

    // Validate green duration (NEW CONCEPT)
    if (data.greenDuration !== undefined && ![7, 10, 15].includes(data.greenDuration)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid greenDuration. Must be 7, 10, or 15 seconds",
        },
        { status: 400 }
      );
    }

    // Get intersectionId from deviceId mapping
    const intersectionId = data.intersectionId || DEVICE_TO_INTERSECTION[data.deviceId] || "int-001";

    // Create item with timestamp (NEW CONCEPT: Added queue fields)
    const item = {
      id: `${data.deviceId}-${Date.now()}`,
      intersectionId: intersectionId,
      deviceId: data.deviceId,
      lane: data.lane,
      light: data.light || "red",                    // NEW: Current light status
      vehicleCount: data.vehicleCount || 0,          // NEW: Count in all light conditions
      irState: data.irState || "clear",              // NEW: IR sensor state
      queueLength: data.queueLength || 0,            // NEW: Distance from ultrasonic (cm)
      queueLevel: data.queueLevel !== undefined ? data.queueLevel : 0,  // NEW: 0, 1, or 2
      greenDuration: data.greenDuration || 7,        // NEW: Actual duration used (7, 10, or 15)
      speed: data.speed || 0,
      density: data.density || 0,
      status: data.status || "normal",
      timestamp: new Date().toISOString(),
      _ts: Math.floor(Date.now() / 1000),
    };

    // Log received data for debugging (NEW CONCEPT)
    console.log("📥 Received traffic data from ESP32 (NEW CONCEPT):", {
      intersectionId: item.intersectionId,
      deviceId: item.deviceId,
      lane: item.lane,
      light: item.light,
      vehicleCount: item.vehicleCount,
      queueLength: item.queueLength,
      queueLevel: item.queueLevel,
      greenDuration: item.greenDuration,
      irState: item.irState,
    });

    // Save to Cosmos DB
    const { resource } = await containers.trafficData.items.create(item);

    console.log("✅ Data saved to Cosmos DB:", resource?.id);

    return NextResponse.json({
      success: true,
      message: "Data saved successfully (NEW CONCEPT)",
      id: resource?.id,
      intersectionId: item.intersectionId,
      timestamp: item.timestamp,
      queueLevel: item.queueLevel,
      greenDuration: item.greenDuration,
    });
  } catch (error: any) {
    console.error("❌ Error saving traffic data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save traffic data",
      },
      { status: 500 }
    );
  }
}
