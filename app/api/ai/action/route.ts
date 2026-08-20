import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { actionAllowedFor, executeAiAction } from "@/lib/ai-actions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;

    if (!sessionUser?.email) {
      return NextResponse.json(
        { success: false, error: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const type = String(body.type || "").trim();
    const params = body.params || {};

    if (!type) {
      return NextResponse.json(
        { success: false, error: "Jenis aksi wajib diisi" },
        { status: 400 }
      );
    }

    const role = sessionUser.role === "admin" ? "admin" : "operator";
    if (!actionAllowedFor(type, role)) {
      return NextResponse.json(
        { success: false, error: "Anda tidak memiliki izin untuk aksi ini" },
        { status: 403 }
      );
    }

    // Ambil data lengkap user dari DB (untuk logging)
    const dbUser = await dynamo.send(
      new GetCommand({
        TableName: awsTables.users,
        Key: { email: sessionUser.email.toLowerCase() },
      })
    );

    const user = dbUser.Item || {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name || sessionUser.email,
      role: sessionUser.role,
    };

    const result = await executeAiAction(type, params, {
      user: {
        id: String(user.id),
        email: String(user.email),
        name: String(user.name || user.email),
        role: String(user.role),
      },
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error executing AI action:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengeksekusi aksi",
      },
      { status: 500 }
    );
  }
}