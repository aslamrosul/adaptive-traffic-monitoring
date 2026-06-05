import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import {
  DeleteCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
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

async function findUserById(id: string) {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: awsTables.users,
      FilterExpression: "#id = :id",
      ExpressionAttributeNames: {
        "#id": "id",
      },
      ExpressionAttributeValues: {
        ":id": id,
      },
      Limit: 1,
    })
  );

  return result.Items?.[0] || null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const user = await findUserById(id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengguna tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: removePassword(user),
    });
  } catch (error: any) {
    console.error("Error fetching user:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal memuat pengguna",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const data = await request.json();

    const existingUser = await findUserById(id);

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengguna tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const name = data.name ? String(data.name).trim() : existingUser.name;
    const now = new Date().toISOString();

    const updatedUser: any = {
      ...existingUser,

      // email tidak diubah karena email adalah partition key DynamoDB
      email: existingUser.email,
      id: existingUser.id,

      name,
      phone: data.phone ?? existingUser.phone ?? "",
      location: data.location ?? existingUser.location ?? "",
      role: normalizeRole(data.role ?? existingUser.role),
      status: normalizeStatus(data.status ?? existingUser.status),
      avatar:
        data.avatar ||
        existingUser.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name || "User"
        )}&background=0040a1&color=fff`,
      photoURL: data.photoURL ?? existingUser.photoURL ?? "",
      updatedAt: now,
    };

    if (data.password && String(data.password).trim().length > 0) {
      if (String(data.password).length < 6) {
        return NextResponse.json(
          {
            success: false,
            error: "Password minimal 6 karakter",
          },
          { status: 400 }
        );
      }

      updatedUser.password = await bcrypt.hash(data.password, 10);
      updatedUser.provider = "credentials";
    }

    await dynamo.send(
      new PutCommand({
        TableName: awsTables.users,
        Item: updatedUser,
      })
    );

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil diperbarui",
      data: removePassword(updatedUser),
    });
  } catch (error: any) {
    console.error("Error updating user:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal memperbarui pengguna",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log('🗑️ DELETE user request:', { id });

    const existingUser = await findUserById(id);

    if (!existingUser) {
      console.log('❌ User not found:', { id });
      return NextResponse.json(
        {
          success: false,
          error: "Pengguna tidak ditemukan",
        },
        { status: 404 }
      );
    }

    console.log('🔍 Found user to delete:', { 
      id: existingUser.id, 
      email: existingUser.email,
      name: existingUser.name 
    });

    await dynamo.send(
      new DeleteCommand({
        TableName: awsTables.users,
        Key: {
          email: existingUser.email,
        },
      })
    );

    console.log('✅ User deleted successfully:', { email: existingUser.email });

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil dihapus",
    });
  } catch (error: any) {
    console.error("❌ Error deleting user:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal menghapus pengguna",
      },
      { status: 500 }
    );
  }
}