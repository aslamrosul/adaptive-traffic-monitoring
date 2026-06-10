import { authOptions } from "@/lib/auth";
import https from "https";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function sendTelegramMessage(options: {
  botToken: string;
  chatId: string;
  text: string;
}) {
  return new Promise<any>((resolve, reject) => {
    const body = new URLSearchParams({
      chat_id: options.chatId,
      text: options.text,
      parse_mode: "HTML",
      disable_web_page_preview: "true",
    }).toString();

    const request = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${options.botToken}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 10000,
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            const json = JSON.parse(data);

            if (!json.ok) {
              reject(
                new Error(json.description || "Telegram API gagal"),
              );
              return;
            }

            resolve(json);
          } catch {
            reject(new Error(data || "Telegram response tidak valid"));
          }
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("Telegram request timeout"));
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.write(body);
    request.end();
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
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
        {
          success: false,
          error: "Bot token dan chat ID wajib diisi",
        },
        { status: 400 },
      );
    }

    await sendTelegramMessage({
      botToken,
      chatId,
      text: `🚦 <b>Aerial Command Test</b>\n\nTelegram notification berhasil aktif untuk ${
        session.user.name || session.user.email || "user"
      }.`,
    });

    return NextResponse.json({
      success: true,
      message: "Test Telegram berhasil dikirim",
    });
  } catch (error: any) {
    console.error("Telegram test error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal test Telegram",
      },
      { status: 500 },
    );
  }
}