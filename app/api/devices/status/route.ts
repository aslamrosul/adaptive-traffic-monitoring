import { NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

// Lazy initialization - only create client when needed
let cosmosClient: CosmosClient | null = null;
let deviceStatusContainer: any = null;

function getDeviceStatusContainer() {
  if (!deviceStatusContainer) {
    cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT!,
      key: process.env.COSMOS_KEY!
    });
    const database = cosmosClient.database(process.env.COSMOS_DATABASE || 'TrafficDB');
    deviceStatusContainer = database.container('device-status');
  }
  return deviceStatusContainer;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const intersectionId = searchParams.get('intersectionId');

    let query = 'SELECT * FROM c';
    const parameters: any[] = [];

    // Filter by deviceId
    if (deviceId) {
      query += ' WHERE c.deviceId = @deviceId';
      parameters.push({ name: '@deviceId', value: deviceId });
    }
    // Filter by intersectionId
    else if (intersectionId) {
      query += ' WHERE c.intersectionId = @intersectionId';
      parameters.push({ name: '@intersectionId', value: intersectionId });
    }

    query += ' ORDER BY c.updatedAt DESC';

    const container = getDeviceStatusContainer();
    const { resources } = await container.items
      .query({
        query,
        parameters
      })
      .fetchAll();

    // Calculate stats
    const stats = {
      total: resources.length,
      online: resources.filter((d: any) => d.status === 'online').length,
      offline: resources.filter((d: any) => d.status === 'offline').length,
      error: resources.filter((d: any) => d.status === 'error').length
    };

    // Check for stale devices (no heartbeat in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const staleDevices = resources.filter((d: any) => {
      const lastHeartbeat = new Date(d.lastHeartbeat);
      return lastHeartbeat < fiveMinutesAgo && d.status === 'online';
    });

    return NextResponse.json({
      success: true,
      stats,
      devices: resources,
      staleDevices: staleDevices.map((d: any) => d.deviceId)
    });

  } catch (error: any) {
    console.error('Error fetching device status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Manual update device status (for testing)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceId, intersectionId, status } = body;

    if (!deviceId || !intersectionId) {
      return NextResponse.json(
        { success: false, error: 'deviceId and intersectionId required' },
        { status: 400 }
      );
    }

    const deviceStatus = {
      id: deviceId,
      deviceId,
      intersectionId,
      status: status || 'online',
      lastHeartbeat: new Date().toISOString(),
      lastDataReceived: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const container = getDeviceStatusContainer();
    await container.items.upsert(deviceStatus);

    return NextResponse.json({
      success: true,
      message: 'Device status updated',
      data: deviceStatus
    });

  } catch (error: any) {
    console.error('Error updating device status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
