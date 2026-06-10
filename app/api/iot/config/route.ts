import {
  deleteIoTConfig,
  getIoTConfig,
  listIoTConfigs,
  saveIoTConfig,
} from "@/lib/iot-config-service";
import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");

    if (deviceId) {
      const config = await getIoTConfig(deviceId);

      return NextResponse.json({
        success: true,
        data: config,
      });
    }

    const configs = await listIoTConfigs();

    return NextResponse.json({
      success: true,
      count: configs.length,
      data: configs,
    });
  } catch (error: any) {
    console.error("Error fetching IoT configs:", error);

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const deviceId = body.deviceId || body.device_id;

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Device ID wajib diisi",
        },
        { status: 400 }
      );
    }

    const result = await saveIoTConfig(body);

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
        ? "Konfigurasi berhasil disimpan dan dikirim ke ESP32"
        : "Konfigurasi disimpan, tetapi pengiriman MQTT tidak sepenuhnya berhasil",
      data: result.config,
      mqttSent: result.mqttSent,
      publishResult: result.publishResult,
    });
  } catch (error: any) {
    console.error("Error saving IoT config:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Gagal menyimpan konfigurasi perangkat",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter deviceId wajib diisi",
        },
        { status: 400 }
      );
    }

    await deleteIoTConfig(deviceId);

    return NextResponse.json({
      success: true,
      message: "Konfigurasi berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Error deleting IoT config:", error);

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