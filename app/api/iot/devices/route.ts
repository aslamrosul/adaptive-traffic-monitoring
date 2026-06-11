import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalizeDevice(item: any) {
  const lastSeen =
    item.last_seen ||
    item.lastSeen ||
    item.updated_at ||
    item.updatedAt ||
    null;

  const lastSeenTime = lastSeen
    ? new Date(lastSeen).getTime()
    : 0;

  const isOnline =
    lastSeenTime > 0 &&
    Date.now() - lastSeenTime < 2 * 60 * 1000;

  const deviceId =
    item.device_id ||
    item.deviceId ||
    item.device ||
    "";

  const intersectionId =
    item.intersection_id ||
    item.intersectionId ||
    null;

  return {
    device_id: deviceId,
    deviceId,

    intersection_id: intersectionId,
    intersectionId,

    status: isOnline ? "online" : "offline",
    connectionState: isOnline ? "Connected" : "Disconnected",

    last_seen: lastSeen,
    lastSeen,
    lastActivityTime: lastSeen,

    wifi_rssi: item.wifi_rssi ?? null,
    wifiRssi: item.wifi_rssi ?? null,

    uptime_s: item.uptime_s ?? null,
    uptimeS: item.uptime_s ?? null,

    auto_mode: item.auto_mode ?? false,
    autoMode: item.auto_mode ?? false,

    adaptive_mode: item.adaptive_mode ?? false,
    adaptiveMode: item.adaptive_mode ?? false,

    dummy_mode: item.dummy_mode ?? false,
    sensor_mode: item.sensor_mode ?? false,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");

    if (deviceId) {
      const result = await dynamo.send(
        new GetCommand({
          TableName: awsTables.deviceStatus,
          Key: {
            device_id: deviceId,
          },
        }),
      );

      if (!result.Item) {
        return NextResponse.json(
          {
            success: false,
            error: "Device tidak ditemukan",
          },
          { status: 404 },
        );
      }

      const device = normalizeDevice(result.Item);

      return NextResponse.json({
        success: true,
        data: device,
        device,
      });
    }

    const result = await dynamo.send(
      new ScanCommand({
        TableName: awsTables.deviceStatus,
        Limit: 500,
      }),
    );

    const devices = (result.Items || [])
      .map(normalizeDevice)
      .filter((device: any) => Boolean(device.device_id))
      .sort((a: any, b: any) =>
        String(a.device_id).localeCompare(String(b.device_id)),
      );

    const activeDevices = devices.filter(
      (device: any) => device.status === "online",
    );

    return NextResponse.json({
      success: true,

      count: devices.length,
      activeCount: activeDevices.length,

      stats: {
        total: devices.length,
        online: activeDevices.length,
        offline: devices.filter((d: any) => d.status === "offline").length,
      },

      data: devices,
      devices,
      activeDevices,
      source: "aws-dynamodb-device-status",
    });
  } catch (error: any) {
    console.error("Error fetching AWS MQTT devices:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal memuat device dari DynamoDB",
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Device dibuat dari ESP32 ketika publish MQTT pertama kali. Upload firmware ESP32 dengan DEVICE_ID baru, lalu device akan muncul otomatis di DeviceStatus.",
    },
    { status: 400 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Hapus device langsung dari tabel DeviceStatus/IoTConfigs jika benar-benar diperlukan.",
    },
    { status: 400 },
  );
}