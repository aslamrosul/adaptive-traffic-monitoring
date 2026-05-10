import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createSession, getSession, deleteSession } from '@/lib/session';

// GET - Get current session (NextAuth + Redis cache)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // If userId provided, get from Redis cache
    if (userId) {
      const cachedSession = await getSession(userId);
      
      if (!cachedSession) {
        return NextResponse.json(
          { error: 'Session not found in cache' },
          { status: 404 }
        );
      }

      return NextResponse.json({ session: cachedSession });
    }

    // Otherwise, get NextAuth session
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { message: "Tidak ada session aktif" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        user: session.user,
        authenticated: true,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

// POST - Create/update Redis session cache
export async function POST(request: Request) {
  try {
    const { userId, email, role, preferences } = await request.json();

    if (!userId || !email || !role) {
      return NextResponse.json(
        { error: 'userId, email, and role are required' },
        { status: 400 }
      );
    }

    const session = await createSession(userId, {
      userId,
      email,
      role,
      preferences: preferences || {}
    });

    return NextResponse.json({ 
      success: true,
      session 
    });

  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

// DELETE - Remove Redis session cache
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    await deleteSession(userId);

    return NextResponse.json({ 
      success: true,
      message: 'Session deleted' 
    });

  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
