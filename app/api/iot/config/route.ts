import {
  deleteIoTConfig,
  getIoTConfig,
  listIoTConfigs,
  saveIoTConfig,
} from "@/lib/iot-config-service";
import { NextResponse } from "next/server";

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