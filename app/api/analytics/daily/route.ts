import { containers } from '@/lib/azure-cosmos';
import { NextResponse } from 'next/server';

// GET: Fetch daily analytics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const intersectionId = searchParams.get('intersectionId');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '30');

    let query = 'SELECT * FROM c WHERE 1=1';
    const parameters: any[] = [];

    if (intersectionId) {
      query += ' AND c.intersectionId = @intersectionId';
      parameters.push({ name: '@intersectionId', value: intersectionId });
    }

    if (date) {
      query += ' AND c.date = @date';
      parameters.push({ name: '@date', value: date });
    }

    query += ` ORDER BY c.date DESC OFFSET 0 LIMIT ${limit}`;

    const { resources } = await containers.analyticsDaily.items
      .query({ query, parameters })
      .fetchAll();

    return NextResponse.json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}
