import { containers } from '@/lib/azure-cosmos';
import { sendConfigToDevice } from '@/lib/azure-iot-hub';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch IoT configuration for all devices or specific device
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    let query = 'SELECT * FROM c WHERE c.type = "iot_config"';
    const parameters: any[] = [];

    if (deviceId) {
      query += ' AND c.deviceId = @deviceId';
      parameters.push({ name: '@deviceId', value: deviceId });
    }

    query += ' ORDER BY c.updatedAt DESC';

    const { resources } = await containers.intersections.items
      .query({
        query,
        parameters,
      })
      .fetchAll();

    return NextResponse.json({
      success: true,
      count: resources.length,
      data: deviceId && resources.length > 0 ? resources[0] : resources,
    });
  } catch (error: any) {
    console.error('Error fetching IoT config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch IoT configuration',
      },
      { status: 500 }
    );
  }
}

// POST: Create or update IoT configuration
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: deviceId',
        },
        { status: 400 }
      );
    }

    // Check if config already exists
    const { resources: existing } = await containers.intersections.items
      .query({
        query: 'SELECT * FROM c WHERE c.type = "iot_config" AND c.deviceId = @deviceId',
        parameters: [{ name: '@deviceId', value: data.deviceId }],
      })
      .fetchAll();

    const configData = {
      id: existing.length > 0 ? existing[0].id : `config_${data.deviceId}_${Date.now()}`,
      type: 'iot_config',
      deviceId: data.deviceId,
      intersectionId: data.intersectionId || null,
      trafficLightConfig: {
        // Durasi lampu berdasarkan threshold kendaraan
        rules: data.rules || [
          {
            vehicleThreshold: 10,
            greenDuration: 30,
            yellowDuration: 5,
            redDuration: 25,
            description: 'Low traffic',
          },
          {
            vehicleThreshold: 20,
            greenDuration: 45,
            yellowDuration: 5,
            redDuration: 20,
            description: 'Medium traffic',
          },
          {
            vehicleThreshold: 30,
            greenDuration: 60,
            yellowDuration: 5,
            redDuration: 15,
            description: 'High traffic',
          },
        ],
        // Default durations jika tidak ada kendaraan
        defaultGreenDuration: data.defaultGreenDuration || 30,
        defaultYellowDuration: data.defaultYellowDuration || 5,
        defaultRedDuration: data.defaultRedDuration || 25,
        // Cycle time
        minCycleTime: data.minCycleTime || 60,
        maxCycleTime: data.maxCycleTime || 120,
      },
      sensorConfig: {
        enabled: data.sensorEnabled !== false,
        updateInterval: data.updateInterval || 5000, // ms
        vehicleCountReset: data.vehicleCountReset || 60000, // ms
      },
      mqttConfig: {
        topic: data.mqttTopic || `traffic/${data.deviceId}/config`,
        qos: data.mqttQos || 1,
      },
      status: 'active',
      lastSyncedAt: null,
      createdAt: existing.length > 0 ? existing[0].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.userId || 'system',
    };

    let resource;
    if (existing.length > 0) {
      // Update existing config
      ({ resource } = await containers.intersections.item(configData.id, data.deviceId).replace(configData));
    } else {
      // Create new config
      ({ resource } = await containers.intersections.items.create(configData));
    }

    // Send to ESP32 via Azure IoT Hub MQTT
    const mqttSent = await sendConfigToDevice(configData as any);
    
    if (mqttSent) {
      // Update lastSyncedAt if MQTT was successful
      resource.lastSyncedAt = new Date().toISOString();
      await containers.intersections.item(resource.id, data.deviceId).replace(resource);
    }

    return NextResponse.json({
      success: true,
      message: existing.length > 0 ? 'Configuration updated successfully' : 'Configuration created successfully',
      data: resource,
      mqttSent,
      mqttMessage: mqttSent 
        ? 'Configuration sent to ESP32 via Azure IoT Hub' 
        : 'Configuration saved but could not send to ESP32 (device may be offline)',
    });
  } catch (error: any) {
    console.error('Error saving IoT config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save IoT configuration',
      },
      { status: 500 }
    );
  }
}

// PUT: Update specific configuration
export async function PUT(request: Request) {
  try {
    const data = await request.json();

    if (!data.id || !data.deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: id, deviceId',
        },
        { status: 400 }
      );
    }

    // Get existing config
    const { resource: existing } = await containers.intersections.item(data.id, data.deviceId).read();

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration not found',
        },
        { status: 404 }
      );
    }

    // Update config
    const updatedConfig = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await containers.intersections.item(data.id, data.deviceId).replace(updatedConfig);

    // Send to ESP32 via Azure IoT Hub MQTT
    const mqttSent = await sendConfigToDevice(updatedConfig as any);
    
    if (mqttSent) {
      resource.lastSyncedAt = new Date().toISOString();
      await containers.intersections.item(data.id, data.deviceId).replace(resource);
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      data: resource,
      mqttSent,
    });
  } catch (error: any) {
    console.error('Error updating IoT config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update IoT configuration',
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete configuration
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deviceId = searchParams.get('deviceId');

    if (!id || !deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: id, deviceId',
        },
        { status: 400 }
      );
    }

    await containers.intersections.item(id, deviceId).delete();

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting IoT config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete IoT configuration',
      },
      { status: 500 }
    );
  }
}
