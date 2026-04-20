import { containers } from '@/lib/azure-cosmos';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch reports
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const intersectionId = searchParams.get('intersectionId');
    const status = searchParams.get('status');
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

    query += ` ORDER BY c.createdAt DESC OFFSET 0 LIMIT ${limit}`;

    const { resources } = await containers.reports.items
      .query({ query, parameters })
      .fetchAll();

    return NextResponse.json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch reports',
      },
      { status: 500 }
    );
  }
}

// POST: Create new report
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
      id: `rpt_${Date.now()}`,
      intersectionId: data.intersectionId,
      type: data.type,
      priority: data.priority || 'medium',
      status: 'submitted',
      title: data.title,
      description: data.description || '',
      reportedBy: {
        userId: data.userId || 'anonymous',
        userName: data.userName || 'Anonymous User',
        userEmail: data.userEmail || '',
        userRole: data.userRole || 'user',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await containers.reports.items.create(item);

    return NextResponse.json({
      success: true,
      message: 'Report created successfully',
      data: resource,
    });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create report',
      },
      { status: 500 }
    );
  }
}
