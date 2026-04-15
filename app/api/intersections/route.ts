import { containers } from '@/lib/azure-cosmos';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch all intersections
export async function GET() {
  try {
    const { resources } = await containers.intersections.items
      .query({
        query: 'SELECT * FROM c ORDER BY c.name ASC',
      })
      .fetchAll();

    return NextResponse.json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error: any) {
    console.error('Error fetching intersections:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch intersections',
      },
      { status: 500 }
    );
  }
}

// POST: Create new intersection
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.address || !data.deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, address, deviceId',
        },
        { status: 400 }
      );
    }

    const item = {
      id: data.id || `int_${Date.now()}`,
      name: data.name,
      address: data.address,
      location: {
        lat: data.latitude || 0,
        lng: data.longitude || 0,
      },
      deviceId: data.deviceId,
      status: data.status || 'active',
      lanes: {
        count: data.lanesCount || 4,
        directions: data.lanesDirections || ['north', 'east', 'south', 'west'],
      },
      config: {
        mode: data.configMode || 'auto',
        threshold: {
          low: 50,
          medium: 100,
          high: 200,
          critical: 300,
        },
        alertEnabled: true,
        cycleTime: {
          min: 30,
          max: 120,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await containers.intersections.items.create(item);

    return NextResponse.json({
      success: true,
      message: 'Intersection created successfully',
      data: resource,
    });
  } catch (error: any) {
    console.error('Error creating intersection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create intersection',
      },
      { status: 500 }
    );
  }
}
