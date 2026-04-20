import { containers } from '@/lib/azure-cosmos';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch notifications for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: userId',
        },
        { status: 400 }
      );
    }

    let query = 'SELECT * FROM c WHERE c.userId = @userId';
    const parameters: any[] = [{ name: '@userId', value: userId }];

    if (unreadOnly) {
      query += ' AND c.read = false';
    }

    query += ` ORDER BY c.createdAt DESC OFFSET 0 LIMIT ${limit}`;

    const { resources } = await containers.notifications.items
      .query({ query, parameters })
      .fetchAll();

    return NextResponse.json({
      success: true,
      count: resources.length,
      unreadCount: resources.filter((n: any) => !n.read).length,
      data: resources,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch notifications',
      },
      { status: 500 }
    );
  }
}

// POST: Create new notification
export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.userId || !data.title || !data.message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, title, message',
        },
        { status: 400 }
      );
    }

    const item = {
      id: `notif_${Date.now()}`,
      userId: data.userId,
      type: data.type || 'info',
      category: data.category || 'system',
      title: data.title,
      message: data.message,
      read: false,
      actionUrl: data.actionUrl || null,
      relatedTo: data.relatedTo || null,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
    };

    const { resource } = await containers.notifications.items.create(item);

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      data: resource,
    });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create notification',
      },
      { status: 500 }
    );
  }
}
