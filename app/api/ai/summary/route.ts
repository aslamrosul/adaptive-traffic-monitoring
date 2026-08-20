import { getAiSummary } from "@/lib/ai-service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const summary = await getAiSummary({
      intersectionId: searchParams.get("intersectionId"),
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error("Error generating AI summary:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat ringkasan AI" },
      { status: 500 }
    );
  }
}
