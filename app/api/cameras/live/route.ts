import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import {
  fetchLiveStatus,
  mergeCamera,
  type RegistryCamera,
} from "@/lib/camera-live";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/cameras/live — agregasi server-side: registry + live Server 2.
// Token viewer hanya dipakai di server, tak pernah ke browser.
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
    let registry = ((result.Items || []) as RegistryCamera[]).filter((c) => c.camera_id);
    if (intersectionId && intersectionId !== "all") {
      registry = registry.filter((c) => c.intersection_id === intersectionId);
    }
    registry.sort((a, b) => String(a.camera_id).localeCompare(String(b.camera_id)));

    const baseUrl = process.env.VISION_API_BASE || "http://172.31.2.242:8081";
    const viewerToken = process.env.VISION_VIEWER_TOKEN || "";
    const timeoutMs = Math.min(
      Math.max(Number(process.env.VISION_LIVE_TIMEOUT_MS || 3000), 1000),
      10000
    );

    const settled = await Promise.allSettled(
      registry.map(async (reg) => {
        let live = null;
        try {
          live = await fetchLiveStatus(baseUrl, reg.camera_id, viewerToken, timeoutMs);
        } catch {
          live = null;
        }
        return mergeCamera(reg, live);
      })
    );
    const data = settled.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : mergeCamera(registry[i], null) // UNKNOWN bila gagal total
    );
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat status live" },
      { status: 500 }
    );
  }
}
