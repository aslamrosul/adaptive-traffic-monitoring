import { containers } from '@/lib/azure-cosmos';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch all users
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    let query = 'SELECT * FROM c WHERE 1=1';
    const parameters: any[] = [];

    if (role) {
      query += ' AND c.role = @role';
      parameters.push({ name: '@role', value: role });
    }

    if (status) {
      query += ' AND c.status = @status';
      parameters.push({ name: '@status', value: status });
    }

    query += ' ORDER BY c.name ASC';

    const { resources } = await containers.users.items
      .query({ query, parameters })
      .fetchAll();

    return NextResponse.json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch users',
      },
      { status: 500 }
    );
  }
}

// POST: Create new user
export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.email || !data.name || !data.role) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: email, name, role',
        },
        { status: 400 }
      );
    }

    const item = {
      id: `user_${Date.now()}`,
      email: data.email,
      name: data.name,
      role: data.role,
      phone: data.phone || '',
      photoURL: data.photoURL || '',
      location: data.location || '',
      status: 'active',
      reportsCreated: 0,
      reportsCompleted: 0,
      activeHours: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await containers.users.items.create(item);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: resource,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create user',
      },
      { status: 500 }
    );
  }
}
