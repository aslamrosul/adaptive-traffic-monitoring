import {
  getLatestTrafficByDevice,
  getLatestTrafficByIntersection,
  getRecentTraffic,
  scanTrafficByDateRange,
} from "@/lib/aws-dynamodb";
import { selectFirstMatchingDevice } from "@/lib/controller-telemetry";
import { normalizeTrafficItems } from "@/lib/traffic-adapter";
import { resolveWibAnalyticsRange } from "@/lib/timezone";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = Number(searchParams.get("limit") || "100");
    const intersectionId = searchParams.get("intersectionId");
    // V6.7.4: filter device opsional (konsisten dengan /api/traffic/latest).
    const deviceId = searchParams.get("deviceId")?.trim() || null;

    const hasDateFilter =
      searchParams.has("date") ||
      searchParams.has("startDate") ||
      searchParams.has("endDate");

    let items: any[] = [];

    if (hasDateFilter) {
      const { startUtc, endUtc } =
        resolveWibAnalyticsRange(searchParams);

      items = await scanTrafficByDateRange({
        startDate: startUtc,
        endDate: endUtc,
        intersectionId,
        limit,
      });

      if (deviceId) {
        items = selectFirstMatchingDevice(items, deviceId, limit);
      }
    } else if (intersectionId && intersectionId !== "all") {
      if (deviceId) {
        items = await getLatestTrafficByDevice(
          intersectionId,
          deviceId,
          limit,
        );
      } else {
        items = await getLatestTrafficByIntersection(
          intersectionId,
          limit,
        );
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
    console.error(
      "Error fetching realtime traffic from DynamoDB:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message || "Failed to fetch traffic data",
      },
      { status: 500 },
    );
  }
}