import { containers } from '@/lib/azure-cosmos';
import { sendConfigToDevice } from '@/lib/azure-iot-hub';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch configuration for specific device
export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;

    const { resources } = await containers.intersections.items
      .query({
        query: 'SELECT * FROM c WHERE c.type = "iot_config" AND c.deviceId = @deviceId ORDER BY c.updatedAt DESC',
        parameters: [{ name: '@deviceId', value: deviceId }],
      })
      .fetchAll();

    if (resources.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Configuration not found for this device',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: resources[0],
    });
  } catch (error: any) {
    console.error('Error fetching device config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch device configuration',
      },
      { status: 500 }
    );
  }
}

// PATCH: Update configuration for specific device
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    const updates = await request.json();

    // Get existing config
    const { resources } = await containers.intersections.items
      .query({
        query: 'SELECT * FROM c WHERE c.type = "iot_config" AND c.deviceId = @deviceId',
        parameters: [{ name: '@deviceId', value: deviceId }],
      })
      .fetchAll();

    if (resources.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Configuration not found for this device',
      }, { status: 404 });
    }

    const existing = resources[0];

    // Merge updates
    const updatedConfig = {
      ...existing,
      trafficLightConfig: {
        ...existing.trafficLightConfig,
        ...updates.trafficLightConfig,
      },
      sensorConfig: {
        ...existing.sensorConfig,
        ...updates.sensorConfig,
      },
      updatedAt: new Date().toISOString(),
      lastSyncedAt: null, // Reset sync status
    };

    const { resource } = await containers.intersections
      .item(existing.id, deviceId)
      .replace(updatedConfig);

    // Send to ESP32 via Azure IoT Hub MQTT
    const mqttSent = await sendConfigToDevice(updatedConfig as any);
    
    if (mqttSent) {
      resource.lastSyncedAt = new Date().toISOString();
      await containers.intersections.item(existing.id, deviceId).replace(resource);
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      data: resource,
      mqttSent,
    });
  } catch (error: any) {
    console.error('Error updating device config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update device configuration',
      },
      { status: 500 }
    );
  }
}
