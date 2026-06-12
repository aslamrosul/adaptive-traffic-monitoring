import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function toTimestamp(item: any) {
  return (
    item.timestamp ||
    item.createdAt ||
    item.created_at ||
    item.received_at_utc ||
    item.updatedAt ||
    new Date().toISOString()
  );
}

function normalizeEvent(item: any) {
  const timestamp = toTimestamp(item);

  return {
    id:
      item.id ||
      item.event_id ||
      item.notification_id ||
      `${item.device_id || "event"}_${timestamp}`,

    type:
      item.type ||
      item.category ||
      item.notificationType ||
      "info",

    priority:
      item.priority ||
      item.severity ||
      (item.level === 2 ? "critical" : "normal"),

    title:
      item.title ||
      item.subject ||
      "Notifikasi Sistem",

    description:
      item.description ||
      item.message ||
      item.body ||
      "",

    timestamp,

    intersectionId:
      item.intersectionId ||
      item.intersection_id ||
      "all",

    deviceId:
      item.deviceId ||
      item.device_id ||
      item.device ||
      "",

    status:
      item.status ||
      item.state ||
      "open",
  };
}

function getWibRange(startDate?: string | null, endDate?: string | null) {
  if (!startDate && !endDate) {
    return null;
  }

  const start = new Date(
    `${startDate || endDate}T00:00:00.000+07:00`,
  ).getTime();

  const end = new Date(
    `${endDate || startDate}T23:59:59.999+07:00`,
  ).getTime();

  return {
    start,
    end,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const intersectionId = searchParams.get("intersectionId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Number(searchParams.get("limit") || "50");

    const result = await dynamo.send(
      new ScanCommand({
        TableName: awsTables.notifications,
        Limit: Math.min(Math.max(limit * 5, 50), 500),
      }),
    );

    const range = getWibRange(startDate, endDate);

    const events = (result.Items || [])
      .map(normalizeEvent)
      .filter((event: any) => {
        if (
          status &&
          status !== "all" &&
          String(event.status).toLowerCase() !== status.toLowerCase()
        ) {
          return false;
        }

        if (
          intersectionId &&
          intersectionId !== "all" &&
          event.intersectionId !== intersectionId
        ) {
          return false;
        }

        if (range) {
          const time = new Date(event.timestamp).getTime();

          if (!Number.isFinite(time)) {
            return false;
          }

          if (time < range.start || time > range.end) {
            return false;
          }
        }

        return true;
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: events.length,
      data: events,
      source: "aws-dynamodb-notifications",
    });
  } catch (error: any) {
    if (
      error.name === "ResourceNotFoundException" ||
      String(error.message || "").includes("Cannot do operations on a non-existent table")
    ) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
        message: "Tabel Notifications belum tersedia",
      });
    }

    console.error("Error fetching events from AWS:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil events",
      },
      { status: 500 },
    );
  }
}