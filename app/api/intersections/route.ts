import { awsTables, scanTable, putItem } from "@/lib/aws-dynamodb";
import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dynamo } from "@/lib/aws-dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await scanTable(awsTables.intersections, 100);

    const data = items.map((item: any) => ({
      ...item,
      id: item.id || item.intersection_id,
      intersectionId: item.intersection_id || item.id,
      deviceId: item.deviceId || item.device_id,
      name: item.name || item.intersection_id || "Unknown Intersection",
      status: item.status || "active",
      address: item.address || "-",
      lanes: item.lanes || {
        count: 3,
        directions: ["north", "south", "east"],
      },
    }));

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching intersections from DynamoDB:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch intersections",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const intersectionId =
      body.intersection_id || body.intersectionId || body.id || `intersection_${Date.now()}`;

    const item = {
      ...body,
      id: intersectionId,
      intersection_id: intersectionId,
      name: body.name || intersectionId,
      status: body.status || "active",
      lanes: body.lanes || {
        count: 3,
        directions: ["north", "south", "east"],
      },
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await putItem(awsTables.intersections, item);

    // Log intersection creation
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const userResult = await dynamo.send(
        new ScanCommand({
          TableName: awsTables.users,
          FilterExpression: "email = :email",
          ExpressionAttributeValues: {
            ":email": session.user.email.toLowerCase(),
          },
          Limit: 1,
        })
      );

      if (userResult.Items && userResult.Items.length > 0) {
        const user = userResult.Items[0];
        await createActivityLog({
          userId: String(user.id),
          email: String(user.email),
          name: String(user.name),
          type: "intersection.create",
          action: "Menambah persimpangan",
          description: `Menambahkan persimpangan ${item.name}`,
          metadata: {
            intersectionId,
            intersectionName: item.name,
          },
        }).catch((error) => {
          console.error("Failed to log intersection creation:", error);
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error("Error creating intersection:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create intersection",
      },
      { status: 500 }
    );
  }
}