import { authOptions } from "@/lib/auth";
import { authWriteError } from "@/lib/authz";
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
  const denied = authWriteError(
    session ? { user: session.user as { role?: string; email?: string } | null } : null
  );
  if (denied) {
    return NextResponse.json({ success: false, error: denied.error }, { status: denied.status });
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
    // Merge: preset yang tidak dikirim dipertahankan (tak pernah dihapus saat ganti sumber).
    const prev = existing.Item as Record<string, unknown>;
    const prevMjpeg = typeof prev.manual_mjpeg_url === "string" ? prev.manual_mjpeg_url : "";
    const prevHls = typeof prev.manual_hls_url === "string" ? prev.manual_hls_url : "";
    // Migrasi sekali dari model lama bila preset baru masih kosong.
    const legacyMjpeg =
      !prevMjpeg && prev.display_source_type === "mjpeg" && typeof prev.display_url === "string"
        ? prev.display_url
        : "";
    const legacyHls =
      !prevHls && prev.display_source_type === "hls" && typeof prev.display_url === "string"
        ? prev.display_url
        : "";
    const finalMjpeg = checked.config.manual_mjpeg_url || prevMjpeg || legacyMjpeg;
    const finalHls = checked.config.manual_hls_url || prevHls || legacyHls;
    const now = new Date().toISOString();
    const email = String(
      (session?.user as { email?: string } | null)?.email || "unknown"
    );
    await dynamo.send(
      new UpdateCommand({
        TableName: awsTables.cameras,
        Key: { camera_id: cameraId },
        UpdateExpression:
          "SET active_source = :s, manual_mjpeg_url = :m, manual_hls_url = :h, display_enabled = :e, autoplay = :a, display_updated_at = :t, display_updated_by = :b, display_source_type = :s, display_url = :u",
        ExpressionAttributeValues: {
          ":s": checked.config.active_source,
          ":m": finalMjpeg,
          ":h": finalHls,
          ":e": checked.config.enabled,
          ":a": checked.config.autoplay,
          ":t": now,
          ":b": email,
          // Kompat baca lama: display_url = preset aktif (canonical -> kosong).
          ":u":
            checked.config.active_source === "mjpeg"
              ? finalMjpeg
              : checked.config.active_source === "hls"
                ? finalHls
                : "",
        },
      })
    );
    return NextResponse.json({
      success: true,
      data: {
        camera_id: cameraId,
        active_source: checked.config.active_source,
        manual_mjpeg_url: finalMjpeg,
        manual_hls_url: finalHls,
        enabled: checked.config.enabled,
        autoplay: checked.config.autoplay,
        updated_at: now,
        updated_by: email,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
