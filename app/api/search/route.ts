import { awsTables, scanTable } from "@/lib/aws-dynamodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function contains(value: unknown, query: string): boolean {
  return String(value ?? "")
    .toLowerCase()
    .includes(query.toLowerCase());
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = String(searchParams.get("q") || "").trim();

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const [intersections, devices, users] = await Promise.all([
      scanTable(awsTables.intersections, 100),
      scanTable(awsTables.deviceStatus, 100),
      scanTable(awsTables.users, 100),
    ]);

    const results: Array<{
      id: string;
      type: "intersection" | "device" | "user";
      title: string;
      subtitle: string;
      href: string;
      icon: string;
      status: string;
    }> = [];

    for (const item of intersections) {
      const intersectionId = item.intersection_id || item.id;
      const deviceId = item.device_id || item.deviceId;

      const matched =
        contains(item.name, query) ||
        contains(item.address, query) ||
        contains(intersectionId, query) ||
        contains(deviceId, query);

      if (matched) {
        results.push({
          id: `intersection-${intersectionId}`,
          type: "intersection",
          title: item.name || intersectionId,
          subtitle: `${item.address || "-"} • ${deviceId || "Tanpa device"}`,
          href: `/persimpangan/${intersectionId}`,
          icon: "traffic",
          status: item.status || "active",
        });
      }
    }

    for (const item of devices) {
      const deviceId = item.device_id || item.device;
      const intersectionId = item.intersection_id;

      const matched =
        contains(deviceId, query) ||
        contains(intersectionId, query) ||
        contains(item.status, query);

      if (matched) {
        results.push({
          id: `device-${deviceId}`,
          type: "device",
          title: deviceId || "Unknown Device",
          subtitle: `Device IoT • ${intersectionId || "-"}`,
          href: intersectionId
            ? `/persimpangan/${intersectionId}`
            : "/iot-config",
          icon: "sensors",
          status: item.status || "online",
        });
      }
    }

    for (const item of users) {
      const matched =
        contains(item.name, query) ||
        contains(item.email, query) ||
        contains(item.role, query);

      if (matched) {
        results.push({
          id: `user-${item.id || item.email}`,
          type: "user",
          title: item.name || item.email,
          subtitle: `${item.role || "operator"} • ${item.email}`,
          href: "/pengguna",
          icon: "person",
          status: item.status || "active",
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results.slice(0, 15),
    });
  } catch (error: any) {
    console.error("Global search error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal melakukan pencarian",
      },
      { status: 500 }
    );
  }
}