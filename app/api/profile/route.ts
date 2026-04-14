import { NextRequest, NextResponse } from "next/server";

// Simulasi database (dalam production, gunakan database real)
let profileData = {
  id: "user-001",
  name: "Admin Pusat",
  email: "admin@aerialcommand.id",
  phone: "+62 812-3456-7890",
  position: "Operator Senior",
  department: "Traffic Control Center",
  bio: "Operator berpengalaman dengan spesialisasi dalam manajemen lalu lintas perkotaan dan sistem IoT.",
  avatar: "https://ui-avatars.com/api/?name=Admin+Pusat&background=0040a1&color=fff",
  memberSince: "2024-01-15",
  lastLogin: new Date().toISOString(),
  accountType: "Premium",
  stats: {
    totalLogin: 1247,
    incidentsHandled: 89,
    reportsCreated: 156,
    activeHours: 2340,
  },
  performance: {
    responseTime: 95,
    accuracy: 98,
    efficiency: 92,
  },
  skills: [
    "Traffic Management",
    "IoT Systems",
    "Data Analysis",
    "Emergency Response",
    "System Administration",
    "Report Generation",
  ],
  settings: {
    publicProfile: true,
    showEmail: false,
    showActivity: true,
  },
};

// GET - Ambil data profile
export async function GET(request: NextRequest) {
  try {
    // Simulasi delay network
    await new Promise((resolve) => setTimeout(resolve, 300));

    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch profile",
      },
      { status: 500 }
    );
  }
}

// PUT - Update data profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validasi data
    if (body.email && !body.email.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 }
      );
    }

    // Update data
    profileData = {
      ...profileData,
      ...body,
      // Jangan izinkan update fields tertentu
      id: profileData.id,
      memberSince: profileData.memberSince,
      stats: profileData.stats,
      performance: profileData.performance,
    };

    // Simulasi delay network
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: profileData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
      },
      { status: 500 }
    );
  }
}

// DELETE - Hapus akun (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Dalam production, ini akan soft delete atau hard delete
    // Untuk demo, kita hanya return success
    
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete account",
      },
      { status: 500 }
    );
  }
}
