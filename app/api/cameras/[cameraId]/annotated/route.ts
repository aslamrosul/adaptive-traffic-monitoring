import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/cameras/[cameraId]/annotated — proxy server-side ke annotated Server 2.
// Auth session wajib; cameraId divalidasi + harus ada di registry;
// token viewer hanya dipakai server -> Server 2, tak pernah ke browser.
export async function GET(
  _request: Request,
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
    const reg = await dynamo.send(
      new GetCommand({ TableName: awsTables.cameras, Key: { camera_id: cameraId } })
    );
    if (!reg.Item) {
      return NextResponse.json(
        { success: false, error: "Kamera tidak terdaftar" },
        { status: 404 }
      );
    }
    const baseUrl = (process.env.VISION_API_BASE || "http://172.31.2.242:8081").replace(/\/$/, "");
    const viewerToken = process.env.VISION_VIEWER_TOKEN || "";
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const headers: Record<string, string> = {};
      if (viewerToken) headers["Authorization"] = `Bearer ${viewerToken}`;
      const upstream = await fetch(
        `${baseUrl}/v1/cameras/${encodeURIComponent(cameraId)}/annotated.jpg`,
        { headers, signal: ctrl.signal, cache: "no-store" }
      );
      if (!upstream.ok || !upstream.body) {
        return NextResponse.json(
          { success: false, error: "Annotated tidak tersedia" },
          { status: 502 }
        );
      }
      return new NextResponse(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "no-store",
        },
      });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Upstream tidak terjangkau" },
      { status: 502 }
    );
  }
}
