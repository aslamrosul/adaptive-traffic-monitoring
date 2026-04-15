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
    const { resource } = await containers.intersections.item(id, id).read();

    if (!resource) {
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
      data: resource,
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

    // Read existing item
    const { resource: existing } = await containers.intersections
      .item(id, id)
      .read();

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Intersection not found',
        },
        { status: 404 }
      );
    }

    // Update item
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await containers.intersections
      .item(id, id)
      .replace(updated);

    return NextResponse.json({
      success: true,
      message: 'Intersection updated successfully',
      data: resource,
    });
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
    await containers.intersections.item(id, id).delete();

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
