import {
  getLatestTrafficByDevice,
  getLatestTrafficByIntersection,
  getRecentTraffic,
} from "@/lib/aws-dynamodb";
import { selectFirstMatchingDevice } from "@/lib/controller-telemetry";
import { normalizeTrafficItems } from "@/lib/traffic-adapter";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const intersectionId = searchParams.get("intersectionId");
    // V6.7.4: fallback controller WAJIB milik device yang sama.
    const deviceId = searchParams.get("deviceId")?.trim() || null;
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10") || 10, 1),
      100,
    );

    let items: any[] = [];

    if (intersectionId && intersectionId !== "all") {
      if (deviceId) {
        items = await getLatestTrafficByDevice(
          intersectionId,
          deviceId,
          limit,
        );
      } else {
        items = await getLatestTrafficByIntersection(intersectionId, limit);
      }
    } else if (deviceId) {
      items = selectFirstMatchingDevice(
        await getRecentTraffic(100),
        deviceId,
        limit,
      );
    } else {
      items = await getRecentTraffic(limit);
    }

    const data = normalizeTrafficItems(items);

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching latest traffic from DynamoDB:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch latest traffic data",
      },
      { status: 500 }
    );
  }
}