import { authOptions } from "@/lib/auth";
import { sendEmailNotification } from "@/lib/email";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await sendEmailNotification({
      to: session.user.email,
      subject: "Test Email ASTRAEA",
      html: `
        <h2>🚦 ASTRAEA</h2>
        <p>Email notification berhasil aktif.</p>
        <p>Jika muncul alert kemacetan atau perangkat bermasalah, sistem bisa mengirim email ke akun ini.</p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Email test berhasil dikirim",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengirim email",
      },
      { status: 500 },
    );
  }
}