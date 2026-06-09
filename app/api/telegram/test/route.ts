import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

    const botToken = String(body.botToken || process.env.TELEGRAM_BOT_TOKEN || "");
    const chatId = String(body.chatId || process.env.TELEGRAM_CHAT_ID || "");

    if (!botToken || !chatId) {
      return NextResponse.json(
        { success: false, error: "Bot token dan chat ID wajib diisi" },
        { status: 400 },
      );
    }

    const text = `🚦 Aerial Command Test\n\nTelegram notification berhasil aktif untuk ${session.user.name || session.user.email}.`;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      },
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.description || "Gagal mengirim Telegram");
    }

    return NextResponse.json({
      success: true,
      message: "Test Telegram berhasil dikirim",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal test Telegram" },
      { status: 500 },
    );
  }
}