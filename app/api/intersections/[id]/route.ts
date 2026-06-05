import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalizeIntersection(item: any) {
  if (!item) return null;

  const intersectionId = item.intersection_id || item.id;

  return {
    ...item,

    id: intersectionId,
    intersection_id: intersectionId,
    intersectionId,

    device_id: item.device_id || item.deviceId || "",
    deviceId: item.deviceId || item.device_id || "",

    name: item.name || intersectionId,
    address: item.address || "-",
    status: item.status || "active",

    lanes: item.lanes || {
      count: 3,
      directions: ["north", "south", "east"],
    },

    config: item.config || {
      mode: "auto",
      cycleTime: {
        min: 30,
        max: 120,
      },
    },

    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const result = await dynamo.send(
      new GetCommand({
        TableName: awsTables.intersections,
        Key: {
          intersection_id: id,
        },
      })
    );

    const data = normalizeIntersection(result.Item);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Persimpangan tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching intersection:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal memuat persimpangan",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existingResult = await dynamo.send(
      new GetCommand({
        TableName: awsTables.intersections,
        Key: {
          intersection_id: id,
        },
      })
    );

    if (!existingResult.Item) {
      return NextResponse.json(
        {
          success: false,
          error: "Persimpangan tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const updated = normalizeIntersection({
      ...existingResult.Item,
      ...body,

      id,
      intersection_id: id,

      device_id:
        body.device_id ||
        body.deviceId ||
        existingResult.Item.device_id ||
        existingResult.Item.deviceId,

      deviceId:
        body.deviceId ||
        body.device_id ||
        existingResult.Item.deviceId ||
        existingResult.Item.device_id,

      updatedAt: new Date().toISOString(),
    });

    await dynamo.send(
      new PutCommand({
        TableName: awsTables.intersections,
        Item: updated,
      })
    );

    return NextResponse.json({
      success: true,
      message: "Persimpangan berhasil diperbarui",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating intersection:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal memperbarui persimpangan",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await dynamo.send(
      new DeleteCommand({
        TableName: awsTables.intersections,
        Key: {
          intersection_id: id,
        },
      })
    );

    return NextResponse.json({
      success: true,
      message: "Persimpangan berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Error deleting intersection:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal menghapus persimpangan",
      },
      { status: 500 }
    );
  }
}