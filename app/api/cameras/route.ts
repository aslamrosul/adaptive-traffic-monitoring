import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { createHash, randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function requireLogin() {
  const session = await getServerSession(authOptions);
  return (session?.user as any) || null;
}

function stripSecret(item: any) {
  const { device_token_hash, ...rest } = item || {};
  return rest;
}

// GET /api/cameras?intersectionId=... — daftar kamera (tanpa hash token)
export async function GET(request: Request) {
  const user = await requireLogin();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const intersectionId = searchParams.get("intersectionId");
    const result = await dynamo.send(
      new ScanCommand({
        TableName: awsTables.cameras,
        Limit: 500,
      })
    );
    let items = (result.Items || []).map(stripSecret);
    if (intersectionId && intersectionId !== "all") {
      items = items.filter((c: any) => c.intersection_id === intersectionId);
    }
    items.sort((a: any, b: any) => String(a.camera_id).localeCompare(String(b.camera_id)));
    return NextResponse.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat kamera" },
      { status: 500 }
    );
  }
}

// POST /api/cameras — provisioning (admin): {camera_id, intersection_id, approach_id}
// Token plaintext dikembalikan SEKALI, yang disimpan hanya hash SHA-256.
export async function POST(request: Request) {
  const user = await requireLogin();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Khusus admin" }, { status: 403 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const camera_id = String(body.camera_id || "").trim();
    const intersection_id = String(body.intersection_id || body.intersectionId || "").trim();
    const approach_id = String(body.approach_id || body.approachId || "").trim();
    if (!camera_id || !intersection_id || !approach_id) {
      return NextResponse.json(
        { success: false, error: "camera_id, intersection_id, approach_id wajib diisi" },
        { status: 400 }
      );
    }
    const existing = await dynamo.send(
      new GetCommand({ TableName: awsTables.cameras, Key: { camera_id } })
    );
    if (existing.Item) {
      return NextResponse.json(
        { success: false, error: "camera_id sudah terdaftar" },
        { status: 409 }
      );
    }
    const token = randomBytes(32).toString("base64url");
    const now = new Date().toISOString();
    const item = {
      camera_id,
      intersection_id,
      approach_id,
      device_token_hash: createHash("sha256").update(token).digest("hex"),
      enabled: true,
      firmware_version: "",
      health_state: "OFFLINE",
      created_at: now,
      created_by: user.email,
    };
    await dynamo.send(new PutCommand({ TableName: awsTables.cameras, Item: item }));
    return NextResponse.json({ success: true, data: { ...stripSecret(item), token } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal provisioning kamera" },
      { status: 500 }
    );
  }
}
