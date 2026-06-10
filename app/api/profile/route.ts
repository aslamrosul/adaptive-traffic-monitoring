import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log-service";

export const dynamic = "force-dynamic";

function defaultAvatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User",
  )}&background=0040a1&color=fff`;
}

function toNumber(value: any, fallback = 0) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function buildProfileData(user: any) {
  const name = user.name || "User";
  const role = user.role || "operator";

  const reportsCreated = toNumber(user.reportsCreated, 0);
  const reportsCompleted = toNumber(user.reportsCompleted, 0);
  const incidentsHandled = toNumber(user.incidentsHandled, reportsCompleted);
  const activeHours = toNumber(user.activeHours, 0);
  const totalLogin = toNumber(user.totalLogin, 0);

  const performance = user.performance || null;

  const skills =
    Array.isArray(user.skills) && user.skills.length > 0
      ? user.skills
      : [];

  const profileSettings =
    user.profileSettings ||
    user.settings?.profile ||
    {
      publicProfile: true,
      showEmail: false,
      showActivity: true,
    };

  return {
    id: user.id,
    name,
    email: user.email,

    phone: user.phone || "",
    position:
      user.position ||
      (role === "admin" ? "Administrator" : "Operator"),

    department:
      user.department ||
      (role === "admin"
        ? "System Administration"
        : "Traffic Control Center"),

    bio:
      user.bio ||
      "Operator sistem monitoring lalu lintas.",

    avatar:
      user.avatar ||
      user.photoURL ||
      defaultAvatar(name),

    role,
    status: user.status || "active",
    provider: user.provider || "credentials",

    memberSince:
      user.createdAt ||
      user.created_at ||
      new Date().toISOString(),

    lastLogin:
      user.lastLoginAt ||
      user.lastLogin ||
      user.updatedAt ||
      user.createdAt ||
      new Date().toISOString(),

    accountType:
      role === "admin"
        ? "Premium"
        : "Standard",

    stats: {
      totalLogin,
      incidentsHandled,
      reportsCreated,
      activeHours,
    },

    performance,

    skills,

    settings: profileSettings,

    achievements: buildAchievements({
      role,
      totalLogin,
      reportsCreated,
      incidentsHandled,
      activeHours,
      provider: user.provider,
      status: user.status,
    }),
  };
}

function buildAchievements(input: {
  role: string;
  totalLogin: number;
  reportsCreated: number;
  incidentsHandled: number;
  activeHours: number;
  provider?: string;
  status?: string;
}) {
  return [
    {
      id: "verified-operator",
      title: "Verified Operator",
      description: "Akun operator sudah aktif dan terverifikasi",
      icon: "verified_user",
      color: "bg-blue-100 text-blue-600",
      earned: input.status === "active",
    },
    {
      id: "realtime-monitoring",
      title: "Realtime Monitoring",
      description: "Dapat memantau status persimpangan secara realtime",
      icon: "sensors",
      color: "bg-green-100 text-green-600",
      earned: true,
    },
    {
      id: "iot-controller",
      title: "IoT Controller",
      description: "Memiliki akses konfigurasi perangkat IoT",
      icon: "memory",
      color: "bg-purple-100 text-purple-600",
      earned: input.role === "admin" || input.role === "operator",
    },
    {
      id: "report-maker",
      title: "Report Maker",
      description: "Membuat minimal 10 laporan sistem",
      icon: "description",
      color: "bg-orange-100 text-orange-600",
      earned: input.reportsCreated >= 10,
    },
    {
      id: "active-operator",
      title: "Active Operator",
      description: "Aktif menggunakan sistem minimal 10 jam",
      icon: "timer",
      color: "bg-cyan-100 text-cyan-600",
      earned: input.activeHours >= 10,
    },
  ];
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

    // Optional: Log profile view (dapat dinonaktifkan jika terlalu banyak)
    // await createActivityLog({
    //   userId: user.id,
    //   email: user.email,
    //   name: user.name,
    //   type: "profile.view",
    //   action: "Membuka halaman profil",
    //   description: "Pengguna melihat halaman profil pribadi",
    // }).catch((error) => {
    //   console.error("Failed to log profile view:", error);
    // });

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

      skills: Array.isArray(body.skills)
        ? body.skills
        : currentUser.skills,

      performance:
        body.performance ??
        currentUser.performance,

      profileSettings:
        body.settings ??
        body.profileSettings ??
        currentUser.profileSettings ??
        currentUser.settings?.profile,

      updatedAt: new Date().toISOString(),
    };

    await dynamo.send(
      new PutCommand({
        TableName: awsTables.users,
        Item: updatedUser,
      })
    );

    // Log profile update
    await createActivityLog({
      userId: String(currentUser.id),
      email: String(currentUser.email),
      name: String(updatedUser.name || currentUser.name),
      type:
        body.settings || body.profileSettings
          ? "profile.settings.update"
          : "profile.update",
      action:
        body.settings || body.profileSettings
          ? "Mengubah pengaturan profil"
          : "Memperbarui profil",
      description:
        body.settings || body.profileSettings
          ? "Pengguna memperbarui preferensi privasi profil"
          : "Pengguna memperbarui informasi profil",
      metadata: {
        changedFields: Object.keys(body || {}).filter(
          (key) => key !== "email"
        ),
      },
    }).catch((error) => {
      console.error("Failed to log profile update:", error);
    });

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