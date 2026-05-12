import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: List all devices from Azure IoT Hub
export async function GET(request: Request) {
  try {
    // Check for connection string
    const connectionString = process.env.IOT_HUB_CONNECTION_STRING;

    if (!connectionString) {
      console.warn('⚠️ IOT_HUB_CONNECTION_STRING not configured');
      
      // Return empty list with helpful message
      return NextResponse.json({
        success: true,
        count: 0,
        activeCount: 0,
        devices: [],
        activeDevices: [],
        message: 'IoT Hub connection string not configured. Please add IOT_HUB_CONNECTION_STRING to .env.local',
      });
    }

    // Dynamically import azure-iothub (only when connection string exists)
    const { Registry } = await import('azure-iothub');

    // Create IoT Hub registry client
    const registry = Registry.fromConnectionString(connectionString);

    // Get all devices
    const devices = await new Promise<any[]>((resolve, reject) => {
      registry.list((err, deviceList) => {
        if (err) {
          reject(err);
        } else {
          resolve(deviceList || []);
        }
      });
    });

    // Format device list
    const formattedDevices = devices.map((device) => ({
      deviceId: device.deviceId,
      status: device.status, // 'enabled' or 'disabled'
      connectionState: device.connectionState, // 'Connected' or 'Disconnected'
      lastActivityTime: device.lastActivityTime,
      cloudToDeviceMessageCount: device.cloudToDeviceMessageCount,
      authentication: {
        type: device.authentication?.type || 'sas',
      },
    }));

    // Filter only enabled devices for dropdown
    const activeDevices = formattedDevices.filter(
      (d) => d.status === 'enabled'
    );

    return NextResponse.json({
      success: true,
      count: formattedDevices.length,
      activeCount: activeDevices.length,
      devices: formattedDevices,
      activeDevices: activeDevices,
    });
  } catch (error: any) {
    console.error('Error fetching IoT Hub devices:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch devices from IoT Hub',
      },
      { status: 500 }
    );
  }
}

// POST: Create new device in Azure IoT Hub
export async function POST(request: Request) {
  try {
    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    const connectionString = process.env.IOT_HUB_CONNECTION_STRING;

    if (!connectionString) {
      return NextResponse.json(
        {
          success: false,
          error: 'IoT Hub connection string not configured',
        },
        { status: 500 }
      );
    }

    const { Registry } = await import('azure-iothub');
    const registry = Registry.fromConnectionString(connectionString);

    // Create device with symmetric key authentication
    const device = {
      deviceId: deviceId,
      status: 'enabled',
      authentication: {
        symmetricKey: {
          primaryKey: null, // Auto-generate
          secondaryKey: null, // Auto-generate
        },
      },
    };

    const createdDevice = await new Promise<any>((resolve, reject) => {
      registry.create(device, (err, deviceInfo) => {
        if (err) {
          reject(err);
        } else {
          resolve(deviceInfo);
        }
      });
    });

    // Generate connection string for ESP32
    const iotHubName = process.env.AZURE_IOT_HUB_NAME || 'your-iot-hub';
    const deviceConnectionString = `HostName=${iotHubName}.azure-devices.net;DeviceId=${deviceId};SharedAccessKey=${createdDevice.authentication.symmetricKey.primaryKey}`;

    return NextResponse.json({
      success: true,
      message: 'Device created successfully in IoT Hub',
      device: {
        deviceId: createdDevice.deviceId,
        status: createdDevice.status,
        connectionState: createdDevice.connectionState,
        primaryKey: createdDevice.authentication.symmetricKey.primaryKey,
        secondaryKey: createdDevice.authentication.symmetricKey.secondaryKey,
        connectionString: deviceConnectionString,
      },
    });
  } catch (error: any) {
    console.error('Error creating device:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create device in IoT Hub',
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove device from Azure IoT Hub
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'deviceId is required',
        },
        { status: 400 }
      );
    }

    const connectionString = process.env.IOT_HUB_CONNECTION_STRING;

    if (!connectionString) {
      return NextResponse.json(
        {
          success: false,
          error: 'IoT Hub connection string not configured',
        },
        { status: 500 }
      );
    }

    const { Registry } = await import('azure-iothub');
    const registry = Registry.fromConnectionString(connectionString);

    // Delete device
    await new Promise<void>((resolve, reject) => {
      registry.delete(deviceId, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Device ${deviceId} deleted successfully from IoT Hub`,
    });
  } catch (error: any) {
    console.error('Error deleting device:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete device from IoT Hub',
      },
      { status: 500 }
    );
  }
}
