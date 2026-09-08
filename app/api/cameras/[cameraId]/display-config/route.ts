import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { validateDisplayConfig } from "@/lib/camera-display-config";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// PUT /api/cameras/[cameraId]/display-config — simpan display config.
// Login wajib; kamera harus ada di registry; webcam/upload/blob ditolak.
export async function PUT(
  request: Request,
  context: { params: Promise<{ cameraId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { cameraId } = await context.params;
  if (!/^[A-Z0-9_]{3,64}$/.test(cameraId || "")) {
    return NextResponse.json({ success: false, error: "cameraId tidak valid" }, { status: 400 });
  }
  try {
    const existing = await dynamo.send(
      new GetCommand({ TableName: awsTables.cameras, Key: { camera_id: cameraId } })
    );
    if (!existing.Item) {
      return NextResponse.json(
        { success: false, error: "Kamera tidak terdaftar" },
        { status: 404 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const checked = validateDisplayConfig(body);
    if (!checked.ok || !checked.config) {
      return NextResponse.json({ success: false, error: checked.reason }, { status: 400 });
    }
    const now = new Date().toISOString();
    const email = String(
      (session.user as { email?: string } | null)?.email || "unknown"
    );
    await dynamo.send(
      new UpdateCommand({
        TableName: awsTables.cameras,
        Key: { camera_id: cameraId },
        UpdateExpression:
          "SET display_source_type = :s, display_url = :u, display_enabled = :e, autoplay = :a, display_updated_at = :t, display_updated_by = :b",
        ExpressionAttributeValues: {
          ":s": checked.config.source_type,
          ":u": checked.config.url,
          ":e": checked.config.enabled,
          ":a": checked.config.autoplay,
          ":t": now,
          ":b": email,
        },
      })
    );
    return NextResponse.json({
      success: true,
      data: {
        camera_id: cameraId,
        ...checked.config,
        updated_at: now,
        updated_by: email,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
