import { NextRequest, NextResponse } from "next/server";
import { containers } from "@/lib/azure-cosmos";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role = "operator" } = body;

    // Validation
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

    const container = containers.users;

    // Check if email already exists
    const { resources: existingUsers } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }],
      })
      .fetchAll();

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      password: hashedPassword,
      role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0040a1&color=fff`,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { resource: createdUser } = await container.items.create(newUser);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = createdUser as any;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: "Registrasi berhasil",
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal registrasi" },
      { status: 500 }
    );
  }
}
