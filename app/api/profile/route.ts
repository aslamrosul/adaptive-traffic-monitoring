import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  createActivityLog,
  getUserActivityStats,
} from "@/lib/activity-log-service";

export const dynamic = "force-dynamic";

// Translation helper
function getTranslation(lang: string = 'id') {
  const translations: Record<string, any> = {
    id: {
      verifiedOperator: "Verified Operator",
      verifiedOperatorDesc: "Akun operator sudah aktif dan terverifikasi",
      realtimeMonitoring: "Realtime Monitoring",
      realtimeMonitoringDesc: "Pernah membuka dashboard monitoring realtime",
      iotController: "IoT Controller",
      iotControllerDesc: "Pernah mengubah konfigurasi perangkat IoT",
      profileComplete: "Profile Complete",
      profileCompleteDesc: "Profil, bio, dan keahlian sudah dilengkapi",
      activeUser: "Active User",
      activeUserDesc: "Memiliki minimal 5 aktivitas di sistem",
      reportMaker: "Report Maker",
      reportMakerDesc: "Pernah mengekspor data atau membuat laporan",
      securityAware: "Security Aware",
      securityAwareDesc: "Pernah memperbarui password atau pengaturan privasi",
      dataAnalyst: "Data Analyst",
      dataAnalystDesc: "Pernah membuka halaman analitik sistem",
      administrator: "Administrator",
      operator: "Operator",
      systemAdministration: "System Administration",
      trafficControlCenter: "Traffic Control Center",
      operatorBio: "Operator sistem monitoring lalu lintas.",
      premium: "Premium",
      standard: "Standard",
    },
    en: {
      verifiedOperator: "Verified Operator",
      verifiedOperatorDesc: "Operator account is active and verified",
      realtimeMonitoring: "Realtime Monitoring",
      realtimeMonitoringDesc: "Has opened realtime monitoring dashboard",
      iotController: "IoT Controller",
      iotControllerDesc: "Has changed IoT device configuration",
      profileComplete: "Profile Complete",
      profileCompleteDesc: "Profile, bio, and skills are completed",
      activeUser: "Active User",
      activeUserDesc: "Has at least 5 activities in the system",
      reportMaker: "Report Maker",
      reportMakerDesc: "Has exported data or created reports",
      securityAware: "Security Aware",
      securityAwareDesc: "Has updated password or privacy settings",
      dataAnalyst: "Data Analyst",
      dataAnalystDesc: "Has opened analytics page",
      administrator: "Administrator",
      operator: "Operator",
      systemAdministration: "System Administration",
      trafficControlCenter: "Traffic Control Center",
      operatorBio: "Traffic monitoring system operator.",
      premium: "Premium",
      standard: "Standard",
    },
  };

  return translations[lang] || translations.id;
}

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

async function buildProfileData(user: any, lang: string = 'id') {
  const t = getTranslation(lang);
  const name = user.name || "User";
  const role = user.role || "operator";

  const reportsCreated = toNumber(user.reportsCreated, 0);
  const reportsCompleted = toNumber(user.reportsCompleted, 0);
  const incidentsHandled = toNumber(user.incidentsHandled, reportsCompleted);
  const storedActiveHours = toNumber(user.activeHours, 0);
  const totalLogin = toNumber(user.totalLogin, 0);

  const activityStats = user.id
    ? await getUserActivityStats({
        userId: String(user.id),
      }).catch(() => ({
        totalActivities: 0,
        totalLogin: 0,
        dashboardViews: 0,
        analyticsViews: 0,
        profileUpdates: 0,
        profileExports: 0,
        settingsUpdates: 0,
        avatarUploads: 0,
        passwordChanges: 0,
        iotConfigUpdates: 0,
        reportExports: 0,
        reportsCreated: 0,
        activeMinutes: 0,
        activeHours: 0,
        performance: null,
        byType: {},
      }))
    : {
        totalActivities: 0,
        totalLogin: 0,
        dashboardViews: 0,
        analyticsViews: 0,
        profileUpdates: 0,
        profileExports: 0,
        settingsUpdates: 0,
        avatarUploads: 0,
        passwordChanges: 0,
        iotConfigUpdates: 0,
        reportExports: 0,
        reportsCreated: 0,
        activeMinutes: 0,
        activeHours: 0,
        performance: null,
        byType: {},
      };

  const activeHours = Math.max(
    storedActiveHours,
    Number(activityStats.activeHours || 0),
  );

  const performance =
    activityStats.performance ||
    user.performance ||
    {
      responseTime: null,
      accuracy: null,
      efficiency: null,
      averageResponseMinutes: null,
    };

  const skills = Array.isArray(user.skills) ? user.skills : [];

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
      (role === "admin" ? t.administrator : t.operator),

    department:
      user.department ||
      (role === "admin"
        ? t.systemAdministration
        : t.trafficControlCenter),

    bio:
      user.bio ||
      t.operatorBio,

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
      role === "admin" ? t.premium : t.standard,

    stats: {
      totalLogin: Math.max(totalLogin, activityStats.totalLogin),
      incidentsHandled,
      reportsCreated,
      activeHours,
      totalActivities: activityStats.totalActivities,
    },

    performance,
    skills,
    settings: profileSettings,

    achievements: buildAchievements({
      role,
      totalLogin: Math.max(totalLogin, activityStats.totalLogin),
      reportsCreated,
      incidentsHandled,
      activeHours,
      provider: user.provider,
      status: user.status,
      skills,
      profileSettings,
      activityStats,
      lang,
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
  skills: string[];
  profileSettings: {
    publicProfile?: boolean;
    showEmail?: boolean;
    showActivity?: boolean;
  };
  activityStats: {
    totalActivities: number;
    dashboardViews: number;
    analyticsViews: number;
    profileUpdates: number;
    profileExports: number;
    settingsUpdates: number;
    avatarUploads: number;
    passwordChanges: number;
    iotConfigUpdates: number;
    reportExports: number;
  };
  lang?: string;
}) {
  const t = getTranslation(input.lang);
  const profileComplete =
    Boolean(input.skills.length > 0) &&
    input.activityStats.profileUpdates > 0;

  return [
    {
      id: "verified-operator",
      title: t.verifiedOperator,
      description: t.verifiedOperatorDesc,
      icon: "verified_user",
      color: "bg-blue-100 text-blue-600",
      earned: input.status === "active",
    },
    {
      id: "realtime-monitoring",
      title: t.realtimeMonitoring,
      description: t.realtimeMonitoringDesc,
      icon: "sensors",
      color: "bg-green-100 text-green-600",
      earned: input.activityStats.dashboardViews > 0,
    },
    {
      id: "iot-controller",
      title: t.iotController,
      description: t.iotControllerDesc,
      icon: "memory",
      color: "bg-purple-100 text-purple-600",
      earned:
        input.role === "admin" ||
        input.activityStats.iotConfigUpdates > 0,
    },
    {
      id: "profile-complete",
      title: t.profileComplete,
      description: t.profileCompleteDesc,
      icon: "assignment_ind",
      color: "bg-cyan-100 text-cyan-600",
      earned: profileComplete,
    },
    {
      id: "active-user",
      title: t.activeUser,
      description: t.activeUserDesc,
      icon: "bolt",
      color: "bg-orange-100 text-orange-600",
      earned: input.activityStats.totalActivities >= 5,
    },
    {
      id: "report-maker",
      title: t.reportMaker,
      description: t.reportMakerDesc,
      icon: "description",
      color: "bg-yellow-100 text-yellow-600",
      earned:
        input.reportsCreated >= 1 ||
        input.activityStats.reportExports > 0,
    },
    {
      id: "security-aware",
      title: t.securityAware,
      description: t.securityAwareDesc,
      icon: "admin_panel_settings",
      color: "bg-red-100 text-red-600",
      earned:
        input.activityStats.passwordChanges > 0 ||
        input.activityStats.settingsUpdates > 0,
    },
    {
      id: "data-analyst",
      title: t.dataAnalyst,
      description: t.dataAnalystDesc,
      icon: "analytics",
      color: "bg-indigo-100 text-indigo-600",
      earned: input.activityStats.analyticsViews > 0,
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'id';
    
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
      data: await buildProfileData(user, lang),
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
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'id';
    
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
        : currentUser.skills || [],

      performance:
        body.performance ??
        currentUser.performance,

      profileSettings:
        body.settings ??
        body.profileSettings ??
        currentUser.profileSettings ??
        currentUser.settings?.profile ??
        {
          publicProfile: true,
          showEmail: false,
          showActivity: true,
        },

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
      data: await buildProfileData(updatedUser, lang),
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