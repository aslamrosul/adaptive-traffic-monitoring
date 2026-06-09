import { authOptions } from "@/lib/auth";
import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const defaultSettings = {
  language: "id",
  timezone: "Asia/Jakarta",

  browserNotification: false,
  emailNotification: false,
  telegramNotification: false,

  telegramBotToken: "",
  telegramChatId: "",

  queueAlert: true,
  deviceOfflineAlert: true,
  dummyModeAlert: true,
  weakWifiAlert: true,

  autoMode: true,
  sensorInterval: 5,
};

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return null;

  const result = await dynamo.send(
    new GetCommand({
      TableName: awsTables.users,
      Key: {
        email: session.user.email.toLowerCase(),
      },
    }),
  );

  return result.Item || null;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...defaultSettings,
      ...(user.appSettings || {}),
    },
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();

  const appSettings = {
    ...defaultSettings,
    ...(user.appSettings || {}),
    ...body,
  };

  await dynamo.send(
    new PutCommand({
      TableName: awsTables.users,
      Item: {
        ...user,
        appSettings,
        updatedAt: new Date().toISOString(),
      },
    }),
  );

  return NextResponse.json({
    success: true,
    message: "Pengaturan berhasil disimpan",
    data: appSettings,
  });
}