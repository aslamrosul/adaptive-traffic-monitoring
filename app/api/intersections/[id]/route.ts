import { containers } from '@/lib/azure-cosmos';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch single intersection by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('Fetching intersection with ID:', id);
    
    // Query by id since partition key is deviceId
    const { resources } = await containers.intersections.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();

    if (!resources || resources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Intersection not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resources[0],
    });
  } catch (error: any) {
    console.error('Error fetching intersection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch intersection',
      },
      { status: 500 }
    );
  }
}

// PATCH: Update intersection
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Query to find the item first
    const { resources } = await containers.intersections.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();

    if (!resources || resources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Intersection not found',
        },
        { status: 404 }
      );
    }

    const existing = resources[0];
    const oldDeviceId = existing.deviceId;
    const newDeviceId = data.deviceId || oldDeviceId;

    // Check if deviceId is being changed
    if (newDeviceId !== oldDeviceId) {
      // If deviceId changes, we need to delete old item and create new one
      // because deviceId is the partition key and cannot be updated
      
      // Create new item with new deviceId
      const newItem = {
        ...existing,
        ...data,
        id: existing.id, // Keep same id
        deviceId: newDeviceId, // New partition key
        updatedAt: new Date().toISOString(),
      };

      // Delete old item
      await containers.intersections.item(existing.id, oldDeviceId).delete();

      // Create new item
      const { resource } = await containers.intersections.items.create(newItem);

      return NextResponse.json({
        success: true,
        message: 'Intersection updated successfully (deviceId changed)',
        data: resource,
      });
    } else {
      // Normal update (deviceId not changed)
      const updated = {
        ...existing,
        ...data,
        id: existing.id, // Keep original id
        deviceId: existing.deviceId, // Keep original deviceId
        updatedAt: new Date().toISOString(),
      };

      // Use deviceId as partition key
      const { resource } = await containers.intersections
        .item(existing.id, existing.deviceId)
        .replace(updated);

      return NextResponse.json({
        success: true,
        message: 'Intersection updated successfully',
        data: resource,
      });
    }
  } catch (error: any) {
    console.error('Error updating intersection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update intersection',
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete intersection
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Query to find the item first
    const { resources } = await containers.intersections.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();

    if (!resources || resources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Intersection not found',
        },
        { status: 404 }
      );
    }

    const existing = resources[0];
    
    // Use deviceId as partition key
    await containers.intersections.item(existing.id, existing.deviceId).delete();

    return NextResponse.json({
      success: true,
      message: 'Intersection deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting intersection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete intersection',
      },
      { status: 500 }
    );
  }
}
