import { NextRequest, NextResponse } from "next/server";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role = "operator" } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await dynamo.send(
      new GetCommand({
        TableName: awsTables.users,
        Key: {
          email: normalizedEmail,
        },
      })
    );

    if (existing.Item) {
      return NextResponse.json(
        { success: false, error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const newUser = {
      email: normalizedEmail,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      name,
      password: hashedPassword,
      role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=0040a1&color=fff`,
      status: "active",
      provider: "credentials",
      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: awsTables.users,
        Item: newUser,
        ConditionExpression: "attribute_not_exists(email)",
      })
    );

    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: "Registrasi berhasil",
    });
  } catch (error: any) {
    console.error("Register error:", error);

    if (error.name === "ConditionalCheckFailedException") {
      return NextResponse.json(
        { success: false, error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Gagal registrasi" },
      { status: 500 }
    );
  }
}