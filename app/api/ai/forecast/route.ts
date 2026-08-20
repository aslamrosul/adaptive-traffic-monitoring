import { getAiForecast } from "@/lib/ai-service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedHours = Number(searchParams.get("hours") || 6);

    const forecast = await getAiForecast({
      intersectionId: searchParams.get("intersectionId"),
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      hours: Number.isFinite(parsedHours) ? parsedHours : 6,
    });

    return NextResponse.json({ success: true, data: forecast });
  } catch (error: any) {
    console.error("Error generating AI forecast:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat prediksi AI" },
      { status: 500 }
    );
  }
}
