import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RegistryRow {
  camera_id: string;
  intersection_id?: string;
  approach_id?: string;
  active_source?: string;
  manual_mjpeg_url?: string;
  manual_hls_url?: string;
  display_source_type?: string;
  display_url?: string;
  display_enabled?: boolean;
  autoplay?: boolean;
  display_updated_at?: string;
  display_updated_by?: string;
}

function safeView(item: RegistryRow) {
  // Model baru + fallback baca lama (migrasi malas, non-destruktif).
  const legacyType =
    item.display_source_type === "mjpeg" || item.display_source_type === "hls"
      ? item.display_source_type
      : "canonical";
  const legacyUrl = item.display_url || "";
  const active = item.active_source || legacyType;
  const mjpeg = item.manual_mjpeg_url || (legacyType === "mjpeg" ? legacyUrl : "") || "";
  const hls = item.manual_hls_url || (legacyType === "hls" ? legacyUrl : "") || "";
  return {
    camera_id: item.camera_id,
    intersection_id: item.intersection_id || "",
    approach_id: item.approach_id || "",
    active_source: active,
    manual_mjpeg_url: mjpeg,
    manual_hls_url: hls,
    // Kompat baca lama:
    source_type: active,
    url: active === "mjpeg" ? mjpeg : active === "hls" ? hls : "",
    enabled: item.display_enabled !== false,
    autoplay: item.autoplay !== false,
    updated_at: item.display_updated_at || null,
    updated_by: item.display_updated_by || null,
  };
}

// GET /api/cameras/display-config?intersectionId= — field aman saja.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const intersectionId = searchParams.get("intersectionId");
    const result = await dynamo.send(
      new ScanCommand({ TableName: awsTables.cameras, Limit: 500 })
    );
    let items = ((result.Items || []) as RegistryRow[]).filter((c) => c.camera_id);
    if (intersectionId && intersectionId !== "all") {
      items = items.filter((c) => c.intersection_id === intersectionId);
    }
    items.sort((a, b) => String(a.camera_id).localeCompare(String(b.camera_id)));
    return NextResponse.json(
      { success: true, count: items.length, data: items.map(safeView) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat konfigurasi";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
