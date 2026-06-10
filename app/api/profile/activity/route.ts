import { authOptions } from "@/lib/auth";
import { listUserActivities, createActivityLog } from "@/lib/activity-log-service";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getCurrentUser(email: string) {
  const result = await dynamo.send(
    new GetCommand({
      TableName: awsTables.users,
      Key: {
        email: email.toLowerCase(),
      },
    }),
  );

  return result.Item || null;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const user = await getCurrentUser(session.user.email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 20);

    const activities = await listUserActivities({
      userId: user.id,
      limit,
    });

    return NextResponse.json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error: any) {
    console.error("Profile activity error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Gagal mengambil aktivitas pengguna",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const user = await getCurrentUser(session.user.email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    const body = await request.json();

    const activityType =
      typeof body.type === "string" && body.type.trim()
        ? body.type.trim()
        : "system.action";

    const action =
      typeof body.action === "string" && body.action.trim()
        ? body.action.trim()
        : "Aktivitas pengguna";

    await createActivityLog({
      userId: String(user.id),
      email: String(user.email),
      name: String(user.name || ""),
      type: activityType as any,
      action,
      description: body.description || "",
      metadata: body.metadata || {},
    });

    return NextResponse.json({
      success: true,
      message: "Activity logged successfully",
    });
  } catch (error: any) {
    console.error("Log activity error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to log activity",
      },
      {
        status: 500,
      },
    );
  }
}
