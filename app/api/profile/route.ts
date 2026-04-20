import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { containers } from "@/lib/azure-cosmos";

// GET - Ambil data profile dari Cosmos DB
export async function GET(request: NextRequest) {
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

    const container = containers.users;

    // Query user by email
    const { resources: users } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: session.user.email }],
      })
      .fetchAll();

    if (users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const user = users[0];

    // Transform database user to profile format
    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "+62 812-3456-7890",
      position: user.role === "admin" ? "Administrator" : "Operator",
      department: "Traffic Control Center",
      bio: user.bio || "Operator sistem monitoring lalu lintas.",
      avatar: user.avatar,
      memberSince: user.createdAt,
      lastLogin: user.updatedAt,
      accountType: user.role === "admin" ? "Premium" : "Standard",
      stats: {
        totalLogin: user.reportsCreated || 0,
        incidentsHandled: 0,
        reportsCreated: user.reportsCreated || 0,
        activeHours: user.activeHours || 0,
      },
      performance: {
        responseTime: 95,
        accuracy: 98,
        efficiency: 92,
      },
      skills: [
        "Traffic Management",
        "IoT Systems",
        "Data Analysis",
        "Emergency Response",
      ],
      settings: {
        publicProfile: true,
        showEmail: false,
        showActivity: true,
      },
    };

    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch profile",
      },
      { status: 500 }
    );
  }
}

// PUT - Update data profile di Cosmos DB
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

    // Validasi data
    if (body.email && !body.email.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 }
      );
    }

    const container = containers.users;

    // Get current user
    const { resources: users } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: session.user.email }],
      })
      .fetchAll();

    if (users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const user = users[0];

    // Update allowed fields only
    const updatedUser = {
      ...user,
      name: body.name || user.name,
      phone: body.phone || user.phone,
      bio: body.bio || user.bio,
      updatedAt: new Date().toISOString(),
    };

    // Update in database
    await container.item(user.id, user.email).replace(updatedUser);

    // Return updated profile
    const profileData = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || "+62 812-3456-7890",
      position: updatedUser.role === "admin" ? "Administrator" : "Operator",
      department: "Traffic Control Center",
      bio: updatedUser.bio || "Operator sistem monitoring lalu lintas.",
      avatar: updatedUser.avatar,
      memberSince: updatedUser.createdAt,
      lastLogin: updatedUser.updatedAt,
      accountType: updatedUser.role === "admin" ? "Premium" : "Standard",
      stats: {
        totalLogin: updatedUser.reportsCreated || 0,
        incidentsHandled: 0,
        reportsCreated: updatedUser.reportsCreated || 0,
        activeHours: updatedUser.activeHours || 0,
      },
      performance: {
        responseTime: 95,
        accuracy: 98,
        efficiency: 92,
      },
      skills: [
        "Traffic Management",
        "IoT Systems",
        "Data Analysis",
        "Emergency Response",
      ],
      settings: {
        publicProfile: true,
        showEmail: false,
        showActivity: true,
      },
    };

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: profileData,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
      },
      { status: 500 }
    );
  }
}

// DELETE - Hapus akun (soft delete)
export async function DELETE(request: NextRequest) {
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

    const container = containers.users;

    // Get current user
    const { resources: users } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: session.user.email }],
      })
      .fetchAll();

    if (users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const user = users[0];

    // Soft delete - update status to inactive
    const updatedUser = {
      ...user,
      status: "inactive",
      updatedAt: new Date().toISOString(),
    };

    await container.item(user.id, user.email).replace(updatedUser);

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Account delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete account",
      },
      { status: 500 }
    );
  }
}
