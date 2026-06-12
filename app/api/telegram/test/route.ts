import { authOptions } from "@/lib/auth";
import { execFile } from "child_process";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { promisify } from "util";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const botToken = String(
      body.botToken || process.env.TELEGRAM_BOT_TOKEN || "",
    ).trim();

    const chatId = String(
      body.chatId || process.env.TELEGRAM_CHAT_ID || "",
    ).trim();

    if (!botToken || !chatId) {
      return NextResponse.json(
        { success: false, error: "Bot token dan chat ID wajib diisi" },
        { status: 400 },
      );
    }

    const text = `🚦 ASTRAEA Test\n\nTelegram notification berhasil aktif untuk ${
      session.user.name || session.user.email || "user"
    }.`;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const { stdout, stderr } = await execFileAsync(
      "curl",
      [
        "-sS",
        "-X",
        "POST",
        url,
        "-d",
        `chat_id=${chatId}`,
        "-d",
        `text=${text}`,
      ],
      {
        timeout: 15000,
      },
    );

    if (stderr) {
      console.error("Telegram curl stderr:", stderr);
    }

    const result = JSON.parse(stdout);

    if (!result.ok) {
      throw new Error(result.description || "Telegram API gagal");
    }

    return NextResponse.json({
      success: true,
      message: "Test Telegram berhasil dikirim",
    });
  } catch (error: any) {
    console.error("Telegram test error:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Gagal test Telegram" },
      { status: 500 },
    );
  }
}