import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function removePassword(user: any) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function normalizeRole(role: any) {
  const value = String(role || "operator").toLowerCase();

  if (value.includes("admin")) return "admin";
  return "operator";
}

function normalizeStatus(status: any) {
  const value = String(status || "active").toLowerCase();

  if (value === "aktif") return "active";
  if (value === "inactive") return "inactive";
  if (value === "tidak aktif") return "inactive";
  if (value === "offline") return "inactive";

  return "active";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const result = await dynamo.send(
      new ScanCommand({
        TableName: awsTables.users,
        Limit: 500,
      })
    );

    let users = (result.Items || []).map(removePassword);

    if (role) {
      users = users.filter((u: any) => u.role === normalizeRole(role));
    }

    if (status) {
      users = users.filter((u: any) => u.status === normalizeStatus(status));
    }

    users.sort((a: any, b: any) => {
      const nameA = String(a.name || "").toLowerCase();
      const nameB = String(b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal memuat data pengguna",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.email || !data.name || !data.role || !data.password) {
      return NextResponse.json(
        {
          success: false,
          error: "Nama, email, role, dan password wajib diisi",
        },
        { status: 400 }
      );
    }

    if (String(data.password).length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Password minimal 6 karakter",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(data.email).trim().toLowerCase();
    const normalizedName = String(data.name).trim();
    const now = new Date().toISOString();

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const item = {
      email: normalizedEmail,
      id: data.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      name: normalizedName,
      password: hashedPassword,
      role: normalizeRole(data.role),
      phone: data.phone || "",
      photoURL: data.photoURL || "",
      avatar:
        data.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          normalizedName
        )}&background=0040a1&color=fff`,
      location: data.location || "",
      status: normalizeStatus(data.status),
      provider: "credentials",
      reportsCreated: 0,
      reportsCompleted: 0,
      activeHours: 0,
      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: awsTables.users,
        Item: item,
        ConditionExpression: "attribute_not_exists(email)",
      })
    );

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil ditambahkan",
      data: removePassword(item),
    });
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error.name === "ConditionalCheckFailedException") {
      return NextResponse.json(
        {
          success: false,
          error: "Email sudah terdaftar",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal menambahkan pengguna",
      },
      { status: 500 }
    );
  }
}