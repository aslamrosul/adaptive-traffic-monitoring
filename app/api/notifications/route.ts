import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import {
  DeleteCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id || null;
}

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);

    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 50), 1),
      100,
    );

    const result = await dynamo.send(
      new QueryCommand({
        TableName: awsTables.notifications,
        KeyConditionExpression: "user_id = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );

    let items = result.Items || [];

    if (unreadOnly) {
      items = items.filter((item: any) => !item.read);
    }

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
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

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
    const notificationId =
      body.notification_id || `notif_${Date.now()}`;

    const item = {
      user_id: userId,
      created_at: body.created_at || now,

      notification_id: notificationId,
      id: notificationId,

      type: body.type || body.severity || "info",
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
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    if (body.markAllAsRead) {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: awsTables.notifications,
          KeyConditionExpression: "user_id = :userId",
          ExpressionAttributeValues: {
            ":userId": userId,
          },
          Limit: 100,
        }),
      );

      const items = result.Items || [];

      await Promise.all(
        items.map((item: any) =>
          dynamo.send(
            new UpdateCommand({
              TableName: awsTables.notifications,
              Key: {
                user_id: userId,
                created_at: item.created_at,
              },
              UpdateExpression:
                "SET #read = :read, updatedAt = :updatedAt",
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

    const createdAt = body.created_at || body.createdAt;

    if (!createdAt) {
      return NextResponse.json(
        {
          success: false,
          error: "created_at wajib diisi",
        },
        { status: 400 },
      );
    }

    await dynamo.send(
      new UpdateCommand({
        TableName: awsTables.notifications,
        Key: {
          user_id: userId,
          created_at: createdAt,
        },
        UpdateExpression:
          "SET #read = :read, updatedAt = :updatedAt",
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
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const createdAt = searchParams.get("created_at");

    if (!createdAt) {
      return NextResponse.json(
        {
          success: false,
          error: "created_at wajib diisi",
        },
        { status: 400 },
      );
    }

    await dynamo.send(
      new DeleteCommand({
        TableName: awsTables.notifications,
        Key: {
          user_id: userId,
          created_at: createdAt,
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