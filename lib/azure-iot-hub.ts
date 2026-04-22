// Azure IoT Hub MQTT Integration
import { Client as ServiceClient } from 'azure-iot-device';
import { Mqtt as MqttProtocol } from 'azure-iot-device-mqtt';

interface IoTConfig {
  deviceId: string;
  trafficLightConfig: {
    rules: Array<{
      vehicleThreshold: number;
      greenDuration: number;
      yellowDuration: number;
      redDuration: number;
      description: string;
    }>;
    defaultGreenDuration: number;
    defaultYellowDuration: number;
    defaultRedDuration: number;
    minCycleTime: number;
    maxCycleTime: number;
  };
  sensorConfig: {
    enabled: boolean;
    updateInterval: number;
    vehicleCountReset: number;
  };
}

// Get device connection string from environment
function getDeviceConnectionString(deviceId: string): string | null {
  const connectionStrings: Record<string, string> = {
    'lane-north': process.env.ESP32_LANE_NORTH || '',
    'lane-south': process.env.ESP32_LANE_SOUTH || '',
    'lane-east': process.env.ESP32_LANE_EAST || '',
    'lane-west': process.env.ESP32_LANE_WEST || '',
  };

  return connectionStrings[deviceId] || null;
}

// Send configuration to ESP32 via Azure IoT Hub (Cloud-to-Device message)
export async function sendConfigToDevice(config: IoTConfig): Promise<boolean> {
  try {
    const connectionString = getDeviceConnectionString(config.deviceId);
    
    if (!connectionString) {
      console.error(`No connection string found for device: ${config.deviceId}`);
      return false;
    }

    // Create device client
    const client = ServiceClient.fromConnectionString(connectionString, MqttProtocol);

    // Connect to IoT Hub
    await client.open();
    console.log(`Connected to Azure IoT Hub for device: ${config.deviceId}`);

    // Prepare message payload
    const message = {
      type: 'config_update',
      timestamp: new Date().toISOString(),
      config: {
        rules: config.trafficLightConfig.rules,
        defaults: {
          green: config.trafficLightConfig.defaultGreenDuration,
          yellow: config.trafficLightConfig.defaultYellowDuration,
          red: config.trafficLightConfig.defaultRedDuration,
        },
        cycleTime: {
          min: config.trafficLightConfig.minCycleTime,
          max: config.trafficLightConfig.maxCycleTime,
        },
        sensor: config.sensorConfig,
      },
    };

    // Send as device twin desired properties update
    // This is the recommended way to send configuration to devices
    const twin = await client.getTwin();
    await twin.properties.desired.update({
      trafficConfig: message.config,
      lastUpdated: message.timestamp,
    });

    console.log(`Configuration sent to device ${config.deviceId} via device twin`);

    // Close connection
    await client.close();

    return true;
  } catch (error) {
    console.error('Error sending config to device:', error);
    return false;
  }
}

// Broadcast configuration to all devices
export async function broadcastConfigToAllDevices(config: IoTConfig): Promise<{
  success: boolean;
  results: Record<string, boolean>;
}> {
  const deviceIds = ['lane-north', 'lane-south', 'lane-east', 'lane-west'];
  const results: Record<string, boolean> = {};

  for (const deviceId of deviceIds) {
    const deviceConfig = { ...config, deviceId };
    results[deviceId] = await sendConfigToDevice(deviceConfig);
  }

  const allSuccess = Object.values(results).every(r => r);

  return {
    success: allSuccess,
    results,
  };
}

// Get device twin (current state and desired state)
export async function getDeviceTwin(deviceId: string): Promise<any> {
  try {
    const connectionString = getDeviceConnectionString(deviceId);
    
    if (!connectionString) {
      throw new Error(`No connection string found for device: ${deviceId}`);
    }

    const client = ServiceClient.fromConnectionString(connectionString, MqttProtocol);
    await client.open();

    const twin = await client.getTwin();
    const twinData = {
      desired: twin.properties.desired,
      reported: twin.properties.reported,
    };

    await client.close();

    return twinData;
  } catch (error) {
    console.error('Error getting device twin:', error);
    throw error;
  }
}
