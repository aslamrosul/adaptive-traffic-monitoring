import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import {
  DeleteCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Number(searchParams.get("limit") || 50);

    const result = await dynamo.send(
      new ScanCommand({
        TableName: awsTables.notifications,
        Limit: Math.min(Math.max(limit, 1), 200),
      }),
    );

    let items = result.Items || [];

    if (unreadOnly) {
      items = items.filter((item: any) => !item.read);
    }

    items = items.sort((a: any, b: any) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    );

    return NextResponse.json({
      success: true,
      count: items.length,
      unreadCount: items.filter((item: any) => !item.read).length,
      data: items,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch notifications",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || !body.message) {
      return NextResponse.json(
        {
          success: false,
          error: "title dan message wajib diisi",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const item = {
      notification_id: body.notification_id || `notif_${Date.now()}`,
      id: body.id || body.notification_id || `notif_${Date.now()}`,
      type: body.type || "info",
      severity: body.severity || body.type || "info",
      category: body.category || "system",
      title: body.title,
      message: body.message,
      read: false,
      actionUrl: body.actionUrl || null,
      relatedTo: body.relatedTo || null,
      intersection_id: body.intersection_id || null,
      device_id: body.device_id || null,
      lane: body.lane || null,
      metadata: body.metadata || {},
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: awsTables.notifications,
        Item: item,
      }),
    );

    return NextResponse.json({
      success: true,
      message: "Notification created successfully",
      data: item,
    });
  } catch (error: any) {
    console.error("Error creating notification:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create notification",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (body.markAllAsRead) {
      const result = await dynamo.send(
        new ScanCommand({
          TableName: awsTables.notifications,
          Limit: 500,
        }),
      );

      const items = result.Items || [];

      await Promise.all(
        items.map((item: any) =>
          dynamo.send(
            new UpdateCommand({
              TableName: awsTables.notifications,
              Key: {
                notification_id: item.notification_id || item.id,
              },
              UpdateExpression: "SET #read = :read, updatedAt = :updatedAt",
              ExpressionAttributeNames: {
                "#read": "read",
              },
              ExpressionAttributeValues: {
                ":read": true,
                ":updatedAt": new Date().toISOString(),
              },
            }),
          ),
        ),
      );

      return NextResponse.json({
        success: true,
        message: "Semua notifikasi ditandai dibaca",
      });
    }

    const id = body.id || body.notification_id;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "id wajib diisi",
        },
        { status: 400 },
      );
    }

    await dynamo.send(
      new UpdateCommand({
        TableName: awsTables.notifications,
        Key: {
          notification_id: id,
        },
        UpdateExpression: "SET #read = :read, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#read": "read",
        },
        ExpressionAttributeValues: {
          ":read": body.read ?? true,
          ":updatedAt": new Date().toISOString(),
        },
      }),
    );

    return NextResponse.json({
      success: true,
      message: "Notifikasi diperbarui",
    });
  } catch (error: any) {
    console.error("Error updating notification:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update notification",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "id wajib diisi",
        },
        { status: 400 },
      );
    }

    await dynamo.send(
      new DeleteCommand({
        TableName: awsTables.notifications,
        Key: {
          notification_id: id,
        },
      }),
    );

    return NextResponse.json({
      success: true,
      message: "Notifikasi dihapus",
    });
  } catch (error: any) {
    console.error("Error deleting notification:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete notification",
      },
      { status: 500 },
    );
  }
}