import { app, InvocationContext } from '@azure/functions';
import { CosmosClient } from '@azure/cosmos';
import axios from 'axios';
import crypto from 'crypto';
import { createClient } from 'redis';

// Cosmos DB client
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT!,
  key: process.env.COSMOS_KEY!
});

const database = cosmosClient.database(process.env.COSMOS_DATABASE || 'TrafficDB');
const container = database.container('traffic-data');
const deviceStatusContainer = database.container('device-status');

// Redis client (optional)
let redisClient: any = null;

async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const useTls = process.env.REDIS_TLS === 'true';

  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6380'),
      ...(useTls && { tls: true })
    },
    password: process.env.REDIS_PASSWORD
  });

  await redisClient.connect();
  return redisClient;
}

export async function ProcessIoTData(blob: Buffer, context: InvocationContext): Promise<void> {
  context.log('Processing blob:', context.triggerMetadata?.name);

  try {
    // Parse IoT Hub wrapper
    const iotHubWrapper = JSON.parse(blob.toString());
    context.log('Parsed IoT Hub wrapper:', iotHubWrapper);

    // Decode Base64 Body to get actual traffic data
    const bodyBuffer = Buffer.from(iotHubWrapper.Body, 'base64');
    const iotData = JSON.parse(bodyBuffer.toString('utf-8'));
    context.log('Decoded traffic data:', iotData);

    // Add metadata
    const processedData = {
      id: `${iotData.deviceId}-${Date.now()}`,
      ...iotData,
      processedAt: new Date().toISOString(),
      intersectionId: extractIntersectionId(iotData.deviceId),
      // Calculate queue level from queue length
      north: {
        ...iotData.north,
        queueLevel: calculateQueueLevel(iotData.north?.queueLength || 0)
      },
      south: {
        ...iotData.south,
        queueLevel: calculateQueueLevel(iotData.south?.queueLength || 0)
      },
      east: {
        ...iotData.east,
        queueLevel: calculateQueueLevel(iotData.east?.queueLength || 0)
      },
      west: {
        ...iotData.west,
        queueLevel: calculateQueueLevel(iotData.west?.queueLength || 0)
      }
    };

    // Save to Cosmos DB
    await container.items.create(processedData);
    context.log('✅ Saved to Cosmos DB:', processedData.id);

    // Update device status
    await updateDeviceStatus(iotData.deviceId, processedData.intersectionId, context);

    // Cache latest data in Redis (optional)
    if (process.env.REDIS_HOST) {
      try {
        const redis = await getRedisClient();
        const cacheKey = `traffic:latest:${processedData.intersectionId}`;
        await redis.setEx(cacheKey, 300, JSON.stringify(processedData)); // 5 min TTL
        context.log('✅ Cached in Redis:', cacheKey);
      } catch (redisError) {
        context.log('⚠️ Redis cache failed (non-critical):', redisError);
      }
    }

    // Send to SignalR for real-time updates
    if (process.env.SIGNALR_CONNECTION_STRING) {
      await sendToSignalR(processedData, context);
      context.log('✅ Sent to SignalR');
    }

  } catch (error) {
    context.error('❌ Error processing blob:', error);
    throw error;
  }
}

function extractIntersectionId(deviceId: string): string {
  // Extract intersection from device ID
  // e.g., "esp32-traffic-monitor" → "intersection-1"
  // Customize based on your device naming convention
  return deviceId.replace('esp32-', 'intersection-');
}

function calculateQueueLevel(queueLength: number): number {
  // Queue level based on ultrasonic sensor distance
  // Level 2: < 10cm (padat)
  // Level 1: 10-20cm (sedang)
  // Level 0: > 20cm (lancar)
  if (queueLength < 10) return 2;
  if (queueLength < 20) return 1;
  return 0;
}

async function sendToSignalR(data: any, context: InvocationContext): Promise<void> {
  try {
    const signalRConnectionString = process.env.SIGNALR_CONNECTION_STRING!;
    
    // Parse SignalR connection string
    const match = signalRConnectionString.match(/Endpoint=(.*?);AccessKey=(.*?);/);
    if (!match) {
      throw new Error('Invalid SignalR connection string');
    }

    const endpoint = match[1];
    const accessKey = match[2];
    const hubName = 'trafficHub';

    // Generate access token
    const token = generateAccessToken(endpoint, accessKey, hubName);
    const url = `${endpoint}/api/v1/hubs/${hubName}`;

    // Send message to all clients
    await axios.post(
      `${url}/:send`,
      {
        target: 'trafficUpdate',
        arguments: [data]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

  } catch (error) {
    context.error('SignalR send failed:', error);
    // Don't throw - SignalR failure shouldn't stop data processing
  }
}

function generateAccessToken(endpoint: string, accessKey: string, hubName: string): string {
  const url = `${endpoint}/api/v1/hubs/${hubName}`;
  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const stringToSign = `${url}\n${expiry}`;
  
  const hmac = crypto.createHmac('sha256', accessKey);
  const signature = hmac.update(stringToSign).digest('base64');
  
  return `${url}\n${expiry}\n${signature}`;
}

async function updateDeviceStatus(deviceId: string, intersectionId: string, context: InvocationContext): Promise<void> {
  try {
    const deviceStatus = {
      id: deviceId,
      deviceId: deviceId,
      intersectionId: intersectionId,
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      lastDataReceived: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Upsert (create or update)
    await deviceStatusContainer.items.upsert(deviceStatus);
    context.log(`✅ Device status updated: ${deviceId}`);
  } catch (error) {
    context.error('⚠️ Device status update failed (non-critical):', error);
    // Don't throw - device status failure shouldn't stop data processing
  }
}

// Register the function
app.storageBlob('ProcessIoTData', {
  path: 'raw-data/{name}.json',
  connection: 'AzureWebJobsStorage',
  handler: ProcessIoTData
});
