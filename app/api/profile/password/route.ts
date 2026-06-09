import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const oldPassword = String(body.oldPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Semua field password wajib diisi" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password baru minimal 6 karakter" },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Konfirmasi password tidak sama" },
        { status: 400 },
      );
    }

    const result = await dynamo.send(
      new GetCommand({
        TableName: awsTables.users,
        Key: { email: session.user.email.toLowerCase() },
      }),
    );

    const user = result.Item;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    if (user.provider === "google" || !user.password) {
      return NextResponse.json(
        {
          success: false,
          error: "Akun Google tidak memakai password lokal",
        },
        { status: 400 },
      );
    }

    const valid = await bcrypt.compare(oldPassword, user.password);

    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Password lama salah" },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await dynamo.send(
      new PutCommand({
        TableName: awsTables.users,
        Item: {
          ...user,
          password: hashed,
          updatedAt: new Date().toISOString(),
        },
      }),
    );

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengubah password" },
      { status: 500 },
    );
  }
}