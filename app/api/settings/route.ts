import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const defaultSettings = {
  general: {
    autoMode: true,
    language: "id",
    timezone: "WIB",
  },
  notifications: {
    email: true,
    push: true,
    priorities: {
      extreme: true,
      iotAnomaly: true,
      maintenance: false,
    },
  },
  iot: {
    sensorInterval: 5,
    algorithm: "adaptive-flow-v2.4",
  },
  security: {
    twoFactorEnabled: false,
    activeSessions: [],
  },
  advanced: {
    debugMode: "disabled",
    apiRateLimit: 100,
  },
};

function deepMerge(target: any, source: any) {
  const output = { ...target };

  for (const key of Object.keys(source || {})) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      output[key] = deepMerge(output[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

async function getUserFromSessionOrQuery(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (session?.user?.email) {
    const result = await dynamo.send(
      new GetCommand({
        TableName: awsTables.users,
        Key: {
          email: session.user.email.trim().toLowerCase(),
        },
      })
    );

    return result.Item || null;
  }

  if (userId) {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: awsTables.users,
        FilterExpression: "#id = :id",
        ExpressionAttributeNames: {
          "#id": "id",
        },
        ExpressionAttributeValues: {
          ":id": userId,
        },
        Limit: 1,
      })
    );

    return result.Items?.[0] || null;
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromSessionOrQuery(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found or unauthorized",
        },
        { status: 404 }
      );
    }

    const settings = deepMerge(defaultSettings, user.settings || {});

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error("Error fetching settings:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch settings",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromSessionOrQuery(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found or unauthorized",
        },
        { status: 404 }
      );
    }

    const data = await request.json();

    const updatedSettings = deepMerge(
      deepMerge(defaultSettings, user.settings || {}),
      data
    );

    const updatedUser = {
      ...user,
      settings: updatedSettings,
      updatedAt: new Date().toISOString(),
    };

    await dynamo.send(
      new PutCommand({
        TableName: awsTables.users,
        Item: updatedUser,
      })
    );

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: updatedSettings,
    });
  } catch (error: any) {
    console.error("Error updating settings:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update settings",
      },
      { status: 500 }
    );
  }
}