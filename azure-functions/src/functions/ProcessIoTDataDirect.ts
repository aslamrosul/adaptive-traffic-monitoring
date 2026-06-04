import { app, InvocationContext } from '@azure/functions';
import { CosmosClient } from '@azure/cosmos';
import { BlobServiceClient } from '@azure/storage-blob';
import { createClient } from 'redis';
import axios from 'axios';
import crypto from 'crypto';

// Cosmos DB client
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT!,
  key: process.env.COSMOS_KEY!
});

const database = cosmosClient.database(process.env.COSMOS_DATABASE || 'TrafficDB');
const trafficDataContainer = database.container('traffic-data');
const deviceStatusContainer = database.container('device-status');

// Blob Storage client (for cold path / analytics)
let blobServiceClient: BlobServiceClient | null = null;

function getBlobServiceClient(): BlobServiceClient | null {
  if (!process.env.AzureWebJobsStorage || process.env.AzureWebJobsStorage === 'UseDevelopmentStorage=true') {
    return null; // Skip blob storage in local dev
  }
  
  if (!blobServiceClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AzureWebJobsStorage);
  }
  return blobServiceClient;
}

// Redis client (optional, for caching latest data)
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

/**
 * Process IoT Hub messages directly (Event Hub trigger)
 * HOT PATH: Real-time processing
 * IoT Hub → Function → Cosmos DB → SignalR
 */
export async function ProcessIoTDataDirect(
  messages: any[], 
  context: InvocationContext
): Promise<void> {
  context.log(`📥 Processing ${messages.length} IoT Hub messages`);

  for (const message of messages) {
    try {
      context.log('Raw message:', JSON.stringify(message));

      // Parse message (IoT Hub sends as object, not base64)
      const iotData = typeof message === 'string' ? JSON.parse(message) : message;
      
      context.log('Parsed IoT data:', iotData);

      // Validate required fields
      if (!iotData.deviceId) {
        context.warn('⚠️ Missing deviceId, skipping message');
        continue;
      }

      // Add metadata and process
      const processedData = {
        id: `${iotData.deviceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...iotData,
        processedAt: new Date().toISOString(),
        intersectionId: iotData.deviceId, // Use deviceId as intersectionId
        
        // Process each lane with new format (densityLevel, queueDetected)
        north: processLaneData(iotData.north),
        south: processLaneData(iotData.south),
        east: processLaneData(iotData.east),
        west: processLaneData(iotData.west)
      };

      // Save to Cosmos DB (traffic-data container)
      await trafficDataContainer.items.create(processedData);
      context.log(`✅ Saved to Cosmos DB: ${processedData.id}`);

      // DUAL WRITE: Save to Blob Storage for analytics (Spark, Synapse)
      await saveToBlobStorage(processedData, context);

      // Update device status
      await updateDeviceStatus(iotData.deviceId, context);

      // Cache latest data in Redis (optional)
      if (process.env.REDIS_HOST) {
        try {
          const redis = await getRedisClient();
          const cacheKey = `traffic:latest:${processedData.intersectionId}`;
          await redis.setEx(cacheKey, 300, JSON.stringify(processedData)); // 5 min TTL
          context.log(`✅ Cached in Redis: ${cacheKey}`);
        } catch (redisError) {
          context.warn('⚠️ Redis cache failed (non-critical):', redisError);
        }
      }

      // Send to SignalR for real-time dashboard updates
      if (process.env.SIGNALR_CONNECTION_STRING) {
        await sendToSignalR(processedData, context);
        context.log('✅ Sent to SignalR');
      }

    } catch (error) {
      context.error('❌ Error processing message:', error);
      // Continue processing other messages
    }
  }

  context.log(`✅ Processed ${messages.length} messages`);
}

/**
 * Process lane data with new format
 */
function processLaneData(laneData: any): any {
  if (!laneData) {
    return {
      light: 'red',
      vehicleCount: 0,
      densityLevel: 0,
      queueDetected: false,
      queueLength: 0,
      queueLevel: 0
    };
  }

  return {
    light: laneData.light || 'red',
    vehicleCount: laneData.vehicleCount || 0,
    densityLevel: laneData.densityLevel || 0,
    queueDetected: laneData.queueDetected || false,
    queueLength: laneData.queueLength || 0,
    // Calculate queueLevel from queueLength (for backward compatibility)
    queueLevel: calculateQueueLevel(laneData.queueLength || 0)
  };
}

/**
 * Calculate queue level from queue length (in meters)
 * Level 0: 0m (lancar)
 * Level 1: 1-20m (sedang)
 * Level 2: >20m (padat)
 */
function calculateQueueLevel(queueLength: number): number {
  if (queueLength === 0) return 0;
  if (queueLength <= 20) return 1;
  return 2;
}

/**
 * Update device status in Cosmos DB
 */
async function updateDeviceStatus(
  deviceId: string, 
  context: InvocationContext
): Promise<void> {
  try {
    const deviceStatus = {
      id: deviceId,
      deviceId: deviceId,
      intersectionId: deviceId,
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      lastDataReceived: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Upsert (create or update)
    await deviceStatusContainer.items.upsert(deviceStatus);
    context.log(`✅ Device status updated: ${deviceId}`);
  } catch (error) {
    context.warn('⚠️ Device status update failed (non-critical):', error);
  }
}

/**
 * Save to Blob Storage for analytics (COLD PATH)
 * Data Lake for Spark, Synapse, Databricks
 */
async function saveToBlobStorage(
  data: any,
  context: InvocationContext
): Promise<void> {
  try {
    const blobClient = getBlobServiceClient();
    if (!blobClient) {
      context.log('⚠️ Blob storage not configured, skipping cold path');
      return;
    }

    // Container for analytics data lake
    const containerName = 'analytics-data-lake';
    const containerClient = blobClient.getContainerClient(containerName);
    
    // Create container if not exists
    await containerClient.createIfNotExists();

    // Organize by date for partitioning (Spark-friendly)
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    
    // Path: /year=2024/month=05/day=13/hour=10/device-timestamp.json
    const blobName = `year=${year}/month=${month}/day=${day}/hour=${hour}/${data.deviceId}-${data.timestamp}.json`;
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload JSON data
    const jsonData = JSON.stringify(data, null, 2);
    await blockBlobClient.upload(jsonData, Buffer.byteLength(jsonData), {
      blobHTTPHeaders: { blobContentType: 'application/json' }
    });
    
    context.log(`✅ Saved to Blob Storage (analytics): ${blobName}`);
  } catch (error) {
    context.warn('⚠️ Blob storage save failed (non-critical):', error);
  }
}

/**
 * Send data to SignalR for real-time updates
 */
async function sendToSignalR(
  data: any, 
  context: InvocationContext
): Promise<void> {
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
    context.warn('⚠️ SignalR send failed (non-critical):', error);
  }
}

/**
 * Generate SignalR access token
 */
function generateAccessToken(
  endpoint: string, 
  accessKey: string, 
  hubName: string
): string {
  const url = `${endpoint}/api/v1/hubs/${hubName}`;
  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const stringToSign = `${url}\n${expiry}`;
  
  const hmac = crypto.createHmac('sha256', accessKey);
  const signature = hmac.update(stringToSign).digest('base64');
  
  return `${url}\n${expiry}\n${signature}`;
}

// Register Event Hub trigger (IoT Hub built-in endpoint)
app.eventHub('ProcessIoTDataDirect', {
  connection: 'IOT_HUB_EVENT_HUB_CONNECTION',
  eventHubName: 'traffic-iot-slam1', // Your IoT Hub name
  cardinality: 'many',
  handler: ProcessIoTDataDirect
});
