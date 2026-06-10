import {
  deleteIoTConfig,
  getIoTConfig,
  saveIoTConfig,
} from "@/lib/iot-config-service";
import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      deviceId: string;
    }>;
  }
) {
  try {
    const { deviceId } = await context.params;
    const config = await getIoTConfig(deviceId);

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: "Konfigurasi perangkat belum tersedia",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error("Error fetching device config:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Gagal mengambil konfigurasi perangkat",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      deviceId: string;
    }>;
  }
) {
  try {
    const { deviceId } = await context.params;
    const body = await request.json();

    const result = await saveIoTConfig({
      ...body,
      deviceId,
      device_id: deviceId,
    });

    // Log IoT config update
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const { dynamo, awsTables } = await import("@/lib/aws-dynamodb");
      const { ScanCommand } = await import("@aws-sdk/lib-dynamodb");
      
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
          type: "iot.config.update",
          action: "Mengubah konfigurasi IoT",
          description: `Mengupdate konfigurasi perangkat ${deviceId}`,
          metadata: {
            deviceId,
            intersectionId: body.intersectionId || body.intersection_id,
          },
        }).catch((error) => {
          console.error("Failed to log IoT config update:", error);
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: result.mqttSent
        ? "Konfigurasi berhasil diperbarui dan dikirim ke ESP32"
        : "Konfigurasi diperbarui, tetapi pengiriman MQTT tidak sepenuhnya berhasil",
      data: result.config,
      mqttSent: result.mqttSent,
      publishResult: result.publishResult,
    });
  } catch (error: any) {
    console.error("Error updating device config:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Gagal memperbarui konfigurasi perangkat",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      deviceId: string;
    }>;
  }
) {
  return PATCH(request, context);
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      deviceId: string;
    }>;
  }
) {
  try {
    const { deviceId } = await context.params;

    await deleteIoTConfig(deviceId);

    return NextResponse.json({
      success: true,
      message: "Konfigurasi perangkat berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Error deleting device config:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Gagal menghapus konfigurasi perangkat",
      },
      { status: 500 }
    );
  }
}