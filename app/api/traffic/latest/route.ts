import {
  getLatestTrafficByIntersection,
  getRecentTraffic,
} from "@/lib/aws-dynamodb";
import { normalizeTrafficItems } from "@/lib/traffic-adapter";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const intersectionId = searchParams.get("intersectionId");
    const limit = parseInt(searchParams.get("limit") || "10");

    let items: any[] = [];

    if (intersectionId && intersectionId !== "all") {
      items = await getLatestTrafficByIntersection(intersectionId, limit);
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