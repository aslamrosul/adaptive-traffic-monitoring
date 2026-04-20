import { containers } from '@/lib/azure-cosmos';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch events
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const intersectionId = searchParams.get('intersectionId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = 'SELECT * FROM c WHERE 1=1';
    const parameters: any[] = [];

    if (intersectionId) {
      query += ' AND c.intersectionId = @intersectionId';
      parameters.push({ name: '@intersectionId', value: intersectionId });
    }

    if (status) {
      query += ' AND c.status = @status';
      parameters.push({ name: '@status', value: status });
    }

    if (priority) {
      query += ' AND c.priority = @priority';
      parameters.push({ name: '@priority', value: priority });
    }

    query += ` ORDER BY c.timestamp DESC OFFSET 0 LIMIT ${limit}`;

    const { resources } = await containers.events.items
      .query({ query, parameters })
      .fetchAll();

    return NextResponse.json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch events',
      },
      { status: 500 }
    );
  }
}

// POST: Create new event
export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.intersectionId || !data.type || !data.title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: intersectionId, type, title',
        },
        { status: 400 }
      );
    }

    const item = {
      id: `evt_${Date.now()}`,
      intersectionId: data.intersectionId,
      type: data.type,
      priority: data.priority || 'medium',
      status: data.status || 'open',
      title: data.title,
      description: data.description || '',
      timestamp: new Date().toISOString(),
      reportedBy: data.reportedBy || null,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await containers.events.items.create(item);

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      data: resource,
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create event',
      },
      { status: 500 }
    );
  }
}
