import {
  createActivityLog,
  listUserActivities,
} from "@/lib/activity-log-service";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function defaultAvatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User",
  )}&background=0040a1&color=fff`;
}

async function findUserById(userId: string) {
  let exclusiveStartKey: Record<string, any> | undefined;

  do {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: awsTables.users,
        FilterExpression: "#id = :id",
        ExpressionAttributeNames: {
          "#id": "id",
        },
        ExpressionAttributeValues: {
          ":id": userId,
        },
        ExclusiveStartKey: exclusiveStartKey,
        Limit: 100,
      }),
    );

    const found = result.Items?.[0];

    if (found) {
      return found;
    }

    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return null;
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const { id } = await context.params;

    const userId = decodeURIComponent(id || "").trim();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID wajib diisi",
        },
        {
          status: 400,
        },
      );
    }

    const user = await findUserById(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User tidak ditemukan",
        },
        {
          status: 404,
        },
      );
    }

    const settings =
      user.profileSettings ||
      user.settings?.profile ||
      {
        publicProfile: true,
        showEmail: false,
        showActivity: true,
      };

    if (!settings.publicProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profil ini tidak bersifat publik",
        },
        {
          status: 403,
        },
      );
    }

    const activities = settings.showActivity
      ? await listUserActivities({
          userId: String(user.id),
          limit: 8,
        }).catch(() => [])
      : [];

    await createActivityLog({
      userId: String(user.id),
      email: String(user.email || ""),
      name: String(user.name || ""),
      type: "public.profile.view",
      action: "Profil publik dilihat",
      description: "Halaman profil publik pengguna dibuka",
      metadata: {
        publicUserId: user.id,
      },
    }).catch((error) => {
      console.error("Failed to log public profile view:", error);
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name || "User",
        role: user.role || "operator",
        position: user.position || "Operator",
        department: user.department || "Traffic Control Center",
        bio: user.bio || "",
        avatar:
          user.avatar ||
          user.photoURL ||
          defaultAvatar(user.name || "User"),
        memberSince: user.createdAt || null,

        email: settings.showEmail ? user.email : null,

        showActivity: Boolean(settings.showActivity),
        activities,
      },
    });
  } catch (error: any) {
    console.error("Public profile error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Gagal mengambil profil publik",
      },
      {
        status: 500,
      },
    );
  }
}