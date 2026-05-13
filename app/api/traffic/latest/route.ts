import { containers } from "@/lib/azure-cosmos";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET /api/traffic/latest
 * Fetch latest traffic data (grouped by intersection)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const intersectionId = searchParams.get("intersectionId");
    const limit = parseInt(searchParams.get("limit") || "10");

    let query: string;
    const parameters: any[] = [];

    if (intersectionId && intersectionId !== "all") {
      // Get latest data for specific intersection
      query = `
        SELECT TOP ${limit} * FROM c 
        WHERE c.intersectionId = @intersectionId 
        ORDER BY c._ts DESC
      `;
      parameters.push({ name: "@intersectionId", value: intersectionId });
    } else {
      // Get latest data for all intersections
      query = `SELECT TOP ${limit} * FROM c ORDER BY c._ts DESC`;
    }

    const { resources } = await containers.trafficData.items
      .query({ query, parameters })
      .fetchAll();

    return NextResponse.json({
      success: true,
      count: resources.length,
      data: resources,
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
