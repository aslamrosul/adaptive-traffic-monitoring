import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const dynamic = "force-dynamic";

async function getCurrentUser(email: string) {
  const result = await dynamo.send(
    new GetCommand({
      TableName: awsTables.users,
      Key: {
        email: email.trim().toLowerCase(),
      },
    })
  );

  return result.Item || null;
}

function defaultAvatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=0040a1&color=fff`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const user = await getCurrentUser(session.user.email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file uploaded",
        },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only JPEG, PNG, and WebP are allowed",
        },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "File too large. Maximum size is 5MB",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeEmail = user.email.replace(/[^a-zA-Z0-9]/g, "_");
    const extension = file.name.split(".").pop() || "png";
    const filename = `avatar-${safeEmail}-${Date.now()}.${extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    const updatedUser = {
      ...user,
      avatar: avatarUrl,
      photoURL: avatarUrl,
      updatedAt: new Date().toISOString(),
    };

    await dynamo.send(
      new PutCommand({
        TableName: awsTables.users,
        Item: updatedUser,
      })
    );

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        url: avatarUrl,
        filename,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload avatar",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const user = await getCurrentUser(session.user.email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    if (user.avatar && String(user.avatar).startsWith("/uploads/avatars/")) {
      const filename = String(user.avatar).replace("/uploads/avatars/", "");
      const filepath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "avatars",
        filename
      );

      try {
        await unlink(filepath);
      } catch {
        // file mungkin sudah tidak ada, abaikan
      }
    }

    const avatarUrl = defaultAvatar(user.name);

    const updatedUser = {
      ...user,
      avatar: avatarUrl,
      photoURL: avatarUrl,
      updatedAt: new Date().toISOString(),
    };

    await dynamo.send(
      new PutCommand({
        TableName: awsTables.users,
        Item: updatedUser,
      })
    );

    return NextResponse.json({
      success: true,
      message: "Avatar deleted successfully",
      data: {
        url: avatarUrl,
      },
    });
  } catch (error: any) {
    console.error("Delete avatar error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete avatar",
      },
      { status: 500 }
    );
  }
}