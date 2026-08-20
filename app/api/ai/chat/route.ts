import { getAiChatAnswer } from "@/lib/ai-service";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const question = String(body.question || "").trim();

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Pertanyaan tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (question.length > 500) {
      return NextResponse.json(
        { success: false, error: "Pertanyaan terlalu panjang (maks 500 karakter)" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    const isAdmin = sessionUser?.role === "admin";

    const result = await getAiChatAnswer(
      question,
      {
        intersectionId: body.intersectionId || null,
        startDate: body.startDate || undefined,
        endDate: body.endDate || undefined,
      },
      {
        isAdmin,
        userName: sessionUser?.name || sessionUser?.email || "",
      }
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error answering AI chat:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal menjawab pertanyaan",
      },
      { status: 500 }
    );
  }
}