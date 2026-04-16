import { containers } from '@/lib/azure-cosmos';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch user settings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        },
        { status: 400 }
      );
    }

    // Query settings from users container
    const { resources } = await containers.users.items
      .query({
        query: 'SELECT c.id, c.settings FROM c WHERE c.id = @userId',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();

    if (resources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const settings = resources[0].settings || {
      general: {
        autoMode: true,
        language: 'id',
        timezone: 'WIB',
      },
      notifications: {
        email: true,
        push: true,
        priorities: {
          extreme: true,
          iotAnomaly: true,
          maintenance: false,
        },
      },
      iot: {
        sensorInterval: 5,
        algorithm: 'adaptive-flow-v2.4',
      },
      security: {
        twoFactorEnabled: true,
        activeSessions: [],
      },
      advanced: {
        debugMode: 'disabled',
        apiRateLimit: 100,
      },
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch settings',
      },
      { status: 500 }
    );
  }
}

// PUT: Update user settings
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Get current user
    const { resources } = await containers.users.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @userId',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();

    if (resources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const user = resources[0];

    // Merge settings
    const updatedSettings = {
      ...user.settings,
      ...data,
    };

    // Update user with new settings
    const updatedUser = {
      ...user,
      settings: updatedSettings,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await containers.users.items.upsert(updatedUser);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: resource.settings,
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update settings',
      },
      { status: 500 }
    );
  }
}
