import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/azure-cosmos";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validasi input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Cek email sudah terdaftar
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // TODO: Hash password dengan bcryptjs
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru ke database
    const newUser = await createUser({
      name,
      email,
      password, // TODO: Gunakan hashedPassword
      provider: "credentials",
    });

    return NextResponse.json(
      {
        message: "Akun berhasil dibuat",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mendaftar" },
      { status: 500 }
    );
  }
}
