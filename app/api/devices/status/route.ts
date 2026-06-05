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

  return {
    device_id: item.device_id || item.deviceId || item.device,
    deviceId: item.deviceId || item.device_id || item.device,

    intersection_id:
      item.intersection_id || item.intersectionId || null,

    intersectionId:
      item.intersectionId || item.intersection_id || null,

    status: isOnline ? "online" : "offline",

    last_seen: lastSeen,
    lastSeen,

    wifi_rssi: item.wifi_rssi ?? null,
    uptime_s: item.uptime_s ?? null,

    auto_mode: item.auto_mode ?? false,
    adaptive_mode: item.adaptive_mode ?? false,
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
        })
      );

      if (!result.Item) {
        return NextResponse.json(
          {
            success: false,
            error: "Device tidak ditemukan",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: normalizeDevice(result.Item),
      });
    }

    const result = await dynamo.send(
      new ScanCommand({
        TableName: awsTables.deviceStatus,
        Limit: 500,
      })
    );

    const devices = (result.Items || [])
      .map(normalizeDevice)
      .filter((device: any) => Boolean(device.device_id))
      .sort((a: any, b: any) =>
        String(a.device_id).localeCompare(String(b.device_id))
      );

    return NextResponse.json({
      success: true,
      count: devices.length,
      stats: {
        total: devices.length,
        online: devices.filter((d: any) => d.status === "online").length,
        offline: devices.filter((d: any) => d.status === "offline").length,
      },
      data: devices,
      devices,
    });
  } catch (error: any) {
    console.error("Error fetching device status:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal memuat device",
      },
      { status: 500 }
    );
  }
}