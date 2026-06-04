import { getIntersectionById, awsTables, putItem } from "@/lib/aws-dynamodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const item = await getIntersectionById(id);

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: "Intersection not found",
        },
        { status: 404 }
      );
    }

    const data = {
      ...item,
      id: item.id || item.intersection_id,
      intersectionId: item.intersection_id || item.id,
      deviceId: item.deviceId || item.device_id,
      lanes: item.lanes || {
        count: 3,
        directions: ["north", "south", "east"],
      },
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching intersection:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch intersection",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await getIntersectionById(id);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Intersection not found",
        },
        { status: 404 }
      );
    }

    const updated = {
      ...existing,
      ...body,
      intersection_id: id,
      id: existing.id || id,
      updatedAt: new Date().toISOString(),
    };

    await putItem(awsTables.intersections, updated);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating intersection:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update intersection",
      },
      { status: 500 }
    );
  }
}