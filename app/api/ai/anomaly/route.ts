import { getAiAnomalies } from "@/lib/ai-service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getAiAnomalies({
      intersectionId: searchParams.get("intersectionId"),
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error detecting AI anomalies:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mendeteksi anomali" },
      { status: 500 }
    );
  }
}
