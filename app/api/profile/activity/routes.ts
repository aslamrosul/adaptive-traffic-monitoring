import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMin < 60) return `${diffMin} menit yang lalu`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam yang lalu`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} hari yang lalu`;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const now = new Date();

  const activities = [
    {
      id: "login",
      action: "Login ke sistem",
      description: "Pengguna berhasil masuk ke dashboard",
      time: timeAgo(new Date(now.getTime() - 2 * 60000)),
      icon: "login",
      color: "text-green-600 bg-green-100",
    },
    {
      id: "dashboard",
      action: "Membuka dashboard monitoring",
      description: "Melihat status persimpangan dan perangkat IoT",
      time: timeAgo(new Date(now.getTime() - 10 * 60000)),
      icon: "dashboard",
      color: "text-blue-600 bg-blue-100",
    },
    {
      id: "notifications",
      action: "Melihat notifikasi sistem",
      description: "Memantau alert antrean, sensor, dan koneksi perangkat",
      time: timeAgo(new Date(now.getTime() - 45 * 60000)),
      icon: "notifications",
      color: "text-purple-600 bg-purple-100",
    },
    {
      id: "profile",
      action: "Membuka halaman profil",
      description: "Memeriksa informasi akun dan preferensi pengguna",
      time: timeAgo(new Date(now.getTime() - 90 * 60000)),
      icon: "person",
      color: "text-orange-600 bg-orange-100",
    },
  ];

  return NextResponse.json({
    success: true,
    data: activities,
  });
}