import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function defaultAvatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=0040a1&color=fff`;
}

function buildProfileData(user: any) {
  const name = user.name || "User";
  const role = user.role || "operator";

  return {
    id: user.id,
    name,
    email: user.email,
    phone: user.phone || "",
    position:
      user.position ||
      (role === "admin" ? "Administrator" : "Operator"),
    department: user.department || "Traffic Control Center",
    bio: user.bio || "Operator sistem monitoring lalu lintas.",
    avatar: user.avatar || user.photoURL || defaultAvatar(name),
    memberSince: user.createdAt || new Date().toISOString(),
    lastLogin: user.updatedAt || user.createdAt || new Date().toISOString(),
    accountType: role === "admin" ? "Premium" : "Standard",
    stats: {
      totalLogin: user.totalLogin || 0,
      incidentsHandled: user.incidentsHandled || 0,
      reportsCreated: user.reportsCreated || 0,
      activeHours: user.activeHours || 0,
    },
    performance: user.performance || {
      responseTime: 95,
      accuracy: 98,
      efficiency: 92,
    },
    skills: user.skills || [
      "Traffic Management",
      "IoT Systems",
      "Data Analysis",
      "Emergency Response",
    ],
    settings: user.profileSettings || {
      publicProfile: true,
      showEmail: false,
      showActivity: true,
    },
  };
}

async function getCurrentUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await dynamo.send(
    new GetCommand({
      TableName: awsTables.users,
      Key: {
        email: normalizedEmail,
      },
    })
  );

  return result.Item || null;
}

export async function GET() {
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

    const user = await getCurrentUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: buildProfileData(user),
    });
  } catch (error: any) {
    console.error("Profile fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch profile",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();

    const currentUser = await getCurrentUserByEmail(session.user.email);

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Email tidak diubah karena email adalah partition key DynamoDB.
    const updatedUser = {
      ...currentUser,
      name: body.name || currentUser.name,
      phone: body.phone ?? currentUser.phone ?? "",
      position: body.position ?? currentUser.position,
      department: body.department ?? currentUser.department,
      bio: body.bio ?? currentUser.bio,
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
      message: "Profile updated successfully",
      data: buildProfileData(updatedUser),
    });
  } catch (error: any) {
    console.error("Profile update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update profile",
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

    const currentUser = await getCurrentUserByEmail(session.user.email);

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const updatedUser = {
      ...currentUser,
      status: "inactive",
      deletedAt: new Date().toISOString(),
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
      message: "Account deactivated successfully",
    });
  } catch (error: any) {
    console.error("Profile delete error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete profile",
      },
      { status: 500 }
    );
  }
}