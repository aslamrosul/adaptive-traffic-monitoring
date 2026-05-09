# 🔄 Azure IoT to SignalR Real-time Pipeline - Complete Guide

## 📊 Architecture Overview

```
ESP32 (IoT Device)
    ↓ MQTT (8883)
IoT Hub
    ↓ Message Routing
Storage Account (Blob)
    ├─→ Blob Trigger → Azure Function
    │                   ├─→ Redis Cache (latest data, 5 min TTL)
    │                   ├─→ Cosmos DB (persistent storage)
    │                   └─→ SignalR Service (real-time broadcast)
    │                        ↓ WebSocket
    │                   Frontend (Next.js)
    │
    └─→ Databricks (Spark)
         ├─→ Batch Processing (hourly/daily)
         ├─→ Machine Learning (traffic prediction)
         ├─→ Data Aggregation (analytics)
         └─→ Write Results → Cosmos DB (analytics container)
              ↓
         Backend API → Frontend (charts, reports)
```

---

## 🎯 Data Flow Explanation

### **1. ESP32 → IoT Hub**
- ESP32 kirim data via **MQTT** (port 8883, SSL)
- Format: JSON payload
- Frequency: Every 15 seconds

### **2. IoT Hub → Storage Account**
- **Message Routing** otomatis simpan ke Blob Storage
- Container: `raw-data`
- Format: JSON files (1 file per message)

### **3. Storage Account → Azure Function**
- **Blob Trigger** otomatis jalankan function saat ada file baru
- Function baca file, parse JSON, proses data

### **4. Azure Function → Cosmos DB**
- Function simpan data ke Cosmos DB
- Container: `traffic-data`, `intersections`, dll
- Partition key: `/intersectionId`

### **5. Azure Function → SignalR**
- Function kirim data real-time ke SignalR
- SignalR broadcast ke semua connected clients
- Method: `trafficUpdate`

### **6. SignalR → Frontend**
- Frontend connect via WebSocket
- Auto-update dashboard tanpa refresh
- Real-time notifications

### **7. Redis Cache (Optional but Recommended)**
- **Cache latest data** (5 min TTL) untuk API calls
- **Reduce Cosmos DB reads** (hemat RU/s)
- **Rate limiting** untuk API endpoints
- **Session storage** untuk user state

### **8. Databricks + Spark (Big Data Analytics)**
- **Batch processing** raw data dari Storage Account
- **Data aggregation** (hourly, daily, weekly stats)
- **Machine Learning** (traffic prediction, anomaly detection)
- **Write results** ke Cosmos DB analytics container
- **Schedule jobs** via Databricks Workflows

---

## 🛠️ Step-by-Step Setup

## **STEP 1: IoT Hub Setup**

### **1.1 Create IoT Hub**
```bash
# Azure Portal
1. Search "IoT Hub" → Create
2. Resource Group: traffic-monitoring-rg
3. IoT Hub Name: traffic-iot-slam1
4. Region: Southeast Asia
5. Tier: Free (F1) atau Standard (S1)
6. Click "Review + Create"
```

### **1.2 Register Device**
```bash
# Azure Portal → IoT Hub → Devices
1. Click "+ Add Device"
2. Device ID: esp32-traffic-monitor
3. Authentication: Symmetric key (auto-generate)
4. Save
5. Copy "Primary Connection String"
```

### **1.3 Generate SAS Token**
```javascript
// generate-sas-token.js
const crypto = require('crypto');

const connectionString = "HostName=traffic-iot-slam1.azure-devices.net;DeviceId=esp32-traffic-monitor;SharedAccessKey=YOUR_KEY";

const parts = {};
connectionString.split(';').forEach(part => {
  const [key, value] = part.split('=');
  parts[key] = value;
});

const expiry = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
const resourceUri = `${parts.HostName}/devices/${parts.DeviceId}`;
const stringToSign = `${resourceUri}\n${expiry}`;
const hmac = crypto.createHmac('sha256', Buffer.from(parts.SharedAccessKey, 'base64'));
const signature = hmac.update(stringToSign).digest('base64');
const sasToken = `SharedAccessSignature sr=${encodeURIComponent(resourceUri)}&sig=${encodeURIComponent(signature)}&se=${expiry}`;

console.log('SAS Token:', sasToken);
```

---

## **STEP 2: Storage Account Setup**

### **2.1 Create Storage Account**
```bash
# Azure Portal
1. Search "Storage Account" → Create
2. Resource Group: traffic-monitoring-rg
3. Storage Account Name: trafficstoreslam1
4. Region: Southeast Asia
5. Performance: Standard
6. Redundancy: LRS (Locally Redundant)
7. Click "Review + Create"
```

### **2.2 Create Containers**
```bash
# Azure Portal → Storage Account → Containers
1. Click "+ Container"
2. Name: raw-data
3. Public access: Private
4. Create

5. Click "+ Container"
6. Name: processed-data
7. Public access: Private
8. Create
```

### **2.3 Get Connection String**
```bash
# Azure Portal → Storage Account → Access Keys
1. Click "Show keys"
2. Copy "Connection string" (key1)
```

---

## **STEP 3: IoT Hub Message Routing**

### **3.1 Create Custom Endpoint (Storage)**
```bash
# Azure Portal → IoT Hub → Message Routing → Custom Endpoints
1. Click "+ Add"
2. Endpoint type: Storage
3. Endpoint name: storage-endpoint
4. Storage container: raw-data
5. Encoding: JSON
6. File name format: {iothub}/{partition}/{YYYY}/{MM}/{DD}/{HH}/{mm}
7. Batch frequency: 60 seconds
8. Chunk size: 10 MB
9. Click "Create"
```

### **3.2 Create Route**
```bash
# Azure Portal → IoT Hub → Message Routing → Routes
1. Click "+ Add"
2. Name: storage-route
3. Endpoint: storage-endpoint
4. Data source: Device Telemetry Messages
5. Routing query: true (route all messages)
6. Enable route: Yes
7. Click "Save"
```

---

## **STEP 4: Cosmos DB Setup**

### **4.1 Create Cosmos DB Account**
```bash
# Azure Portal
1. Search "Azure Cosmos DB" → Create
2. API: NoSQL
3. Resource Group: traffic-monitoring-rg
4. Account Name: traffic-cosmos-slam1
5. Location: Southeast Asia
6. Capacity mode: Serverless (untuk testing)
7. Click "Review + Create"
```

### **4.2 Create Database & Containers**
```bash
# Azure Portal → Cosmos DB → Data Explorer
1. Click "New Database"
2. Database ID: TrafficDB
3. Click "OK"

4. Click "New Container"
5. Database: Use existing → TrafficDB
6. Container ID: traffic-data
7. Partition key: /intersectionId
8. Click "OK"

9. Repeat untuk containers lain:
   - intersections (partition: /id)
   - users (partition: /id)
   - notifications (partition: /userId)
```

### **4.3 Get Connection String**
```bash
# Azure Portal → Cosmos DB → Keys
1. Copy "PRIMARY CONNECTION STRING"
```

---

## **STEP 5: SignalR Service Setup**

### **5.1 Create SignalR Service**
```bash
# Azure Portal
1. Search "SignalR Service" → Create
2. Resource Group: traffic-monitoring-rg
3. Resource Name: traffic-signalr-slam1
4. Location: Southeast Asia
5. Pricing Tier: Free (1 unit, 20 concurrent connections)
6. Service Mode: Serverless
7. Click "Review + Create"
```

### **5.2 Get Connection String**
```bash
# Azure Portal → SignalR Service → Keys
1. Copy "Connection String" (Primary)
```

---

## **STEP 6: Redis Cache Setup (Optional)**

### **6.1 Create Azure Cache for Redis**
```bash
# Azure Portal
1. Search "Azure Cache for Redis" → Create
2. Resource Group: traffic-monitoring-rg
3. DNS Name: traffic-redis-slam1
4. Location: Southeast Asia
5. Cache type: Basic C0 (250 MB) - FREE tier tidak ada
6. Pricing: ~$16/month untuk Basic C0
7. Click "Review + Create"
```

### **6.2 Get Connection String**
```bash
# Azure Portal → Redis Cache → Access Keys
1. Copy "Primary connection string (StackExchange.Redis)"
# Format: traffic-redis-slam1.redis.cache.windows.net:6380,password=YOUR_KEY,ssl=True,abortConnect=False
```

### **6.3 Use Cases for Redis**

**A. Cache Latest Traffic Data**
```javascript
// Azure Function - Save to Redis after Cosmos DB
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_CONNECTION_STRING
});

await client.connect();

// Cache latest data per intersection (5 min TTL)
await client.setEx(
  `traffic:latest:${intersectionId}`,
  300, // 5 minutes
  JSON.stringify(processedData)
);
```

**B. Backend API - Read from Cache First**
```typescript
// app/api/traffic/latest/route.ts
import { createClient } from 'redis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const intersectionId = searchParams.get('intersectionId');
  
  // Try cache first
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();
  
  const cached = await redis.get(`traffic:latest:${intersectionId}`);
  
  if (cached) {
    console.log('Cache HIT');
    await redis.disconnect();
    return Response.json(JSON.parse(cached));
  }
  
  // Cache MISS - fetch from Cosmos DB
  console.log('Cache MISS - fetching from Cosmos DB');
  const data = await fetchFromCosmosDB(intersectionId);
  
  // Update cache
  await redis.setEx(
    `traffic:latest:${intersectionId}`,
    300,
    JSON.stringify(data)
  );
  
  await redis.disconnect();
  return Response.json(data);
}
```

**C. Rate Limiting**
```typescript
// middleware.ts
import { createClient } from 'redis';

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();
  
  // Allow 100 requests per minute per IP
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60); // 1 minute
  }
  
  await redis.disconnect();
  
  if (count > 100) {
    return new Response('Too many requests', { status: 429 });
  }
  
  return NextResponse.next();
}
```

**D. Session Storage**
```typescript
// Store user session
await redis.setEx(
  `session:${userId}`,
  3600, // 1 hour
  JSON.stringify({ userId, role, preferences })
);

// Get session
const session = await redis.get(`session:${userId}`);
```

### **6.4 Redis Data Structure**

```
Keys:
├─ traffic:latest:{intersectionId}     → Latest traffic data (5 min TTL)
├─ traffic:stats:{intersectionId}      → Aggregated stats (1 hour TTL)
├─ ratelimit:{ip}                      → Request count (1 min TTL)
├─ session:{userId}                    → User session (1 hour TTL)
└─ cache:analytics:{date}              → Daily analytics (24 hour TTL)
```

### **6.5 Environment Variables**
```bash
# .env.local
REDIS_URL=redis://traffic-redis-slam1.redis.cache.windows.net:6380
REDIS_PASSWORD=YOUR_REDIS_KEY
```

---

## **STEP 7: Azure Function Setup**

### **6.1 Create Function App**
```bash
# Azure Portal
1. Search "Function App" → Create
2. Resource Group: traffic-monitoring-rg
3. Function App Name: traffic-function-slam1
4. Runtime: Node.js 20
5. Region: Southeast Asia
6. Operating System: Linux
7. Plan: Consumption (Serverless)
8. Click "Review + Create"
```

### **6.2 Create Function (Blob Trigger)**

**Local Development:**
```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Create function project
func init traffic-function --javascript
cd traffic-function

# Create blob trigger function
func new --name ProcessIoTData --template "Azure Blob Storage trigger"
```

**Function Code (`ProcessIoTData/index.js`):**
```javascript
const { CosmosClient } = require('@azure/cosmos');
const { SignalRService } = require('@azure/communication-signalr');

// Cosmos DB client
const cosmosClient = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const database = cosmosClient.database('TrafficDB');
const container = database.container('traffic-data');

// SignalR client
const signalRConnectionString = process.env.SIGNALR_CONNECTION_STRING;

module.exports = async function (context, myBlob) {
  context.log('Processing blob:', context.bindingData.name);
  
  try {
    // Parse IoT data
    const iotData = JSON.parse(myBlob.toString());
    
    // Add metadata
    const processedData = {
      id: `${iotData.deviceId}-${Date.now()}`,
      ...iotData,
      processedAt: new Date().toISOString(),
      intersectionId: extractIntersectionId(iotData.deviceId)
    };
    
    // Save to Cosmos DB
    await container.items.create(processedData);
    context.log('Saved to Cosmos DB:', processedData.id);
    
    // Send to SignalR
    await sendToSignalR(processedData);
    context.log('Sent to SignalR');
    
  } catch (error) {
    context.log.error('Error processing blob:', error);
    throw error;
  }
};

function extractIntersectionId(deviceId) {
  // Extract intersection from device ID
  // e.g., "esp32-traffic-monitor" → "intersection-1"
  return 'intersection-1';
}

async function sendToSignalR(data) {
  const axios = require('axios');
  
  // Parse SignalR connection string
  const match = signalRConnectionString.match(/Endpoint=(.*?);AccessKey=(.*?);/);
  const endpoint = match[1];
  const accessKey = match[2];
  
  // Generate access token
  const hubName = 'trafficHub';
  const url = `${endpoint}/api/v1/hubs/${hubName}`;
  
  // Send message to all clients
  await axios.post(`${url}/:send`, {
    target: 'trafficUpdate',
    arguments: [data]
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${generateAccessToken(endpoint, accessKey, hubName)}`
    }
  });
}

function generateAccessToken(endpoint, accessKey, hubName) {
  const crypto = require('crypto');
  const url = `${endpoint}/api/v1/hubs/${hubName}`;
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const stringToSign = `${url}\n${expiry}`;
  const hmac = crypto.createHmac('sha256', accessKey);
  const signature = hmac.update(stringToSign).digest('base64');
  return `${url}\n${expiry}\n${signature}`;
}
```

**Function Configuration (`function.json`):**
```json
{
  "bindings": [
    {
      "name": "myBlob",
      "type": "blobTrigger",
      "direction": "in",
      "path": "raw-data/{name}",
      "connection": "STORAGE_CONNECTION_STRING"
    }
  ]
}
```

**Package.json:**
```json
{
  "name": "traffic-function",
  "version": "1.0.0",
  "dependencies": {
    "@azure/cosmos": "^4.0.0",
    "@azure/communication-signalr": "^1.0.0",
    "axios": "^1.6.0"
  }
}
```

### **6.3 Configure Environment Variables**
```bash
# Azure Portal → Function App → Configuration → Application Settings
1. Click "+ New application setting"

2. Add:
   - COSMOS_CONNECTION_STRING: <Cosmos DB connection string>
   - STORAGE_CONNECTION_STRING: <Storage Account connection string>
   - SIGNALR_CONNECTION_STRING: <SignalR connection string>

3. Click "Save"
```

### **6.4 Deploy Function**
```bash
# From local project directory
func azure functionapp publish traffic-function-slam1
```

---

## **STEP 7: Backend API Setup (Next.js)**

### **7.1 Create SignalR Negotiate Endpoint**

**File: `app/api/signalr/negotiate/route.ts`**
```typescript
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const connectionString = process.env.SIGNALR_CONNECTION_STRING!;
  
  // Parse connection string
  const match = connectionString.match(/Endpoint=(.*?);AccessKey=(.*?);/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid connection string' }, { status: 500 });
  }
  
  const endpoint = match[1];
  const accessKey = match[2];
  const hubName = 'trafficHub';
  
  // Generate client access token
  const userId = `user-${Date.now()}`;
  const token = generateClientToken(endpoint, accessKey, hubName, userId);
  
  return NextResponse.json({
    url: `${endpoint}/client/?hub=${hubName}`,
    accessToken: token,
    userId
  });
}

function generateClientToken(endpoint: string, accessKey: string, hubName: string, userId: string): string {
  const url = `${endpoint}/client/?hub=${hubName}`;
  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const stringToSign = `${url}\n${expiry}`;
  const hmac = crypto.createHmac('sha256', accessKey);
  const signature = hmac.update(stringToSign).digest('base64');
  
  return `${url}\n${expiry}\n${signature}`;
}
```

### **7.2 Environment Variables**

**File: `.env.local`**
```bash
SIGNALR_CONNECTION_STRING=Endpoint=https://traffic-signalr-slam1.service.signalr.net;AccessKey=YOUR_KEY;Version=1.0;
COSMOS_ENDPOINT=https://traffic-cosmos-slam1.documents.azure.com:443/
COSMOS_KEY=YOUR_COSMOS_KEY
COSMOS_DATABASE=TrafficDB
```

---

## **STEP 8: Frontend Setup (Next.js)**

### **8.1 Install SignalR Client**
```bash
npm install @microsoft/signalr
```

### **8.2 Create SignalR Hook**

**File: `lib/hooks/useSignalR.ts`**
```typescript
'use client';

import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

interface TrafficData {
  deviceId: string;
  timestamp: number;
  north: {
    light: string;
    vehicleCount: number;
    irState: string;
    queueLength: number;
  };
  south: {
    light: string;
    vehicleCount: number;
    irState: string;
    queueLength: number;
  };
  east: {
    light: string;
    vehicleCount: number;
    irState: string;
    queueLength: number;
  };
}

export function useSignalR() {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState<TrafficData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let hubConnection: signalR.HubConnection;

    async function startConnection() {
      try {
        // Get negotiate info from backend
        const response = await fetch('/api/signalr/negotiate');
        const { url, accessToken } = await response.json();

        // Create connection
        hubConnection = new signalR.HubConnectionBuilder()
          .withUrl(url, { accessTokenFactory: () => accessToken })
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.Information)
          .build();

        // Handle traffic updates
        hubConnection.on('trafficUpdate', (data: TrafficData) => {
          console.log('Received traffic update:', data);
          setLatestData(data);
        });

        // Start connection
        await hubConnection.start();
        console.log('SignalR connected');
        setIsConnected(true);
        setConnection(hubConnection);

      } catch (err) {
        console.error('SignalR connection error:', err);
        setError(err instanceof Error ? err.message : 'Connection failed');
      }
    }

    startConnection();

    return () => {
      if (hubConnection) {
        hubConnection.stop();
      }
    };
  }, []);

  return { connection, isConnected, latestData, error };
}
```

### **8.3 Use in Dashboard**

**File: `app/dashboard/page.tsx`**
```typescript
'use client';

import { useSignalR } from '@/lib/hooks/useSignalR';

export default function DashboardPage() {
  const { isConnected, latestData, error } = useSignalR();

  return (
    <div className="p-6">
      {/* Connection Status */}
      <div className={`p-4 rounded mb-4 ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
        {isConnected ? '🟢 Real-time Connected' : '🔴 Disconnected'}
        {error && <span className="text-red-600 ml-2">{error}</span>}
      </div>

      {/* Latest Data */}
      {latestData && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="font-bold">North Lane</h3>
            <p>Light: {latestData.north.light}</p>
            <p>Vehicles: {latestData.north.vehicleCount}</p>
            <p>Queue: {latestData.north.queueLength} cm</p>
          </div>

          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-bold">South Lane</h3>
            <p>Light: {latestData.south.light}</p>
            <p>Vehicles: {latestData.south.vehicleCount}</p>
            <p>Queue: {latestData.south.queueLength} cm</p>
          </div>

          <div className="p-4 bg-yellow-50 rounded">
            <h3 className="font-bold">East Lane</h3>
            <p>Light: {latestData.east.light}</p>
            <p>Vehicles: {latestData.east.vehicleCount}</p>
            <p>Queue: {latestData.east.queueLength} cm</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## **STEP 10: Databricks + Spark Setup (Big Data Analytics)**

### **10.1 Create Azure Databricks Workspace**
```bash
# Azure Portal
1. Search "Azure Databricks" → Create
2. Resource Group: traffic-monitoring-rg
3. Workspace Name: traffic-databricks-slam1
4. Region: Southeast Asia
5. Pricing Tier: Standard (atau Trial untuk testing)
6. Click "Review + Create"
```

### **10.2 Create Compute Cluster**
```bash
# Databricks Workspace → Compute → Create Cluster
1. Cluster Name: traffic-analytics-cluster
2. Cluster Mode: Standard
3. Databricks Runtime: 13.3 LTS (Scala 2.12, Spark 3.4.1)
4. Node Type: Standard_DS3_v2 (4 cores, 14 GB RAM)
5. Workers: 2 (min) to 4 (max) - autoscaling
6. Auto Termination: 30 minutes
7. Click "Create Cluster"
```

### **10.3 Install Required Libraries**
```bash
# Databricks Workspace → Compute → Select Cluster → Libraries → Install New
1. Library Source: Maven
2. Coordinates: com.azure.cosmos.spark:azure-cosmos-spark_3-4_2-12:4.17.2
3. Install

4. Library Source: PyPI
5. Package: azure-storage-blob
6. Install
```

### **10.4 Create Notebook - Batch Processing**

**Notebook: `Traffic_Data_Processing.py`**

```python
# ========== SETUP ==========
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from datetime import datetime, timedelta

# Storage Account credentials
storage_account = "trafficstoreslam1"
storage_key = dbutils.secrets.get(scope="traffic-secrets", key="storage-key")

spark.conf.set(
  f"fs.azure.account.key.{storage_account}.blob.core.windows.net",
  storage_key
)

# Cosmos DB config
cosmos_endpoint = dbutils.secrets.get(scope="traffic-secrets", key="cosmos-endpoint")
cosmos_key = dbutils.secrets.get(scope="traffic-secrets", key="cosmos-key")
cosmos_database = "TrafficDB"

# ========== READ RAW DATA FROM BLOB ==========
# Read last 1 hour of data
blob_path = f"wasbs://raw-data@{storage_account}.blob.core.windows.net/"

# Define schema
schema = StructType([
  StructField("deviceId", StringType(), True),
  StructField("timestamp", LongType(), True),
  StructField("north", StructType([
    StructField("light", StringType(), True),
    StructField("vehicleCount", IntegerType(), True),
    StructField("irState", StringType(), True),
    StructField("queueLength", IntegerType(), True)
  ]), True),
  StructField("south", StructType([
    StructField("light", StringType(), True),
    StructField("vehicleCount", IntegerType(), True),
    StructField("irState", StringType(), True),
    StructField("queueLength", IntegerType(), True)
  ]), True),
  StructField("east", StructType([
    StructField("light", StringType(), True),
    StructField("vehicleCount", IntegerType(), True),
    StructField("irState", StringType(), True),
    StructField("queueLength", IntegerType(), True)
  ]), True)
])

# Read JSON files
df_raw = spark.read.schema(schema).json(blob_path)

print(f"Total records: {df_raw.count()}")
df_raw.show(5)

# ========== DATA TRANSFORMATION ==========
# Convert timestamp to datetime
df = df_raw.withColumn("datetime", from_unixtime(col("timestamp") / 1000))
df = df.withColumn("date", to_date(col("datetime")))
df = df.withColumn("hour", hour(col("datetime")))

# Flatten nested structure
df_flat = df.select(
  col("deviceId"),
  col("datetime"),
  col("date"),
  col("hour"),
  col("north.vehicleCount").alias("north_vehicles"),
  col("north.queueLength").alias("north_queue"),
  col("south.vehicleCount").alias("south_vehicles"),
  col("south.queueLength").alias("south_queue"),
  col("east.vehicleCount").alias("east_vehicles"),
  col("east.queueLength").alias("east_queue")
)

# ========== HOURLY AGGREGATION ==========
df_hourly = df_flat.groupBy("date", "hour").agg(
  sum("north_vehicles").alias("north_total_vehicles"),
  avg("north_queue").alias("north_avg_queue"),
  sum("south_vehicles").alias("south_total_vehicles"),
  avg("south_queue").alias("south_avg_queue"),
  sum("east_vehicles").alias("east_total_vehicles"),
  avg("east_queue").alias("east_avg_queue"),
  count("*").alias("record_count")
)

df_hourly = df_hourly.withColumn(
  "total_vehicles",
  col("north_total_vehicles") + col("south_total_vehicles") + col("east_total_vehicles")
)

df_hourly = df_hourly.withColumn(
  "congestion_index",
  (col("north_avg_queue") + col("south_avg_queue") + col("east_avg_queue")) / 3
)

print("Hourly aggregation:")
df_hourly.show()

# ========== DAILY AGGREGATION ==========
df_daily = df_flat.groupBy("date").agg(
  sum("north_vehicles").alias("north_total_vehicles"),
  avg("north_queue").alias("north_avg_queue"),
  sum("south_vehicles").alias("south_total_vehicles"),
  avg("south_queue").alias("south_avg_queue"),
  sum("east_vehicles").alias("east_total_vehicles"),
  avg("east_queue").alias("east_avg_queue"),
  count("*").alias("record_count")
)

df_daily = df_daily.withColumn(
  "total_vehicles",
  col("north_total_vehicles") + col("south_total_vehicles") + col("east_total_vehicles")
)

print("Daily aggregation:")
df_daily.show()

# ========== WRITE TO COSMOS DB ==========
# Hourly stats
df_hourly_cosmos = df_hourly.withColumn("id", concat(col("date"), lit("-"), col("hour")))
df_hourly_cosmos = df_hourly_cosmos.withColumn("intersectionId", lit("intersection-1"))
df_hourly_cosmos = df_hourly_cosmos.withColumn("type", lit("hourly"))

df_hourly_cosmos.write \
  .format("cosmos.oltp") \
  .option("spark.synapse.linkedService", "CosmosDb") \
  .option("spark.cosmos.accountEndpoint", cosmos_endpoint) \
  .option("spark.cosmos.accountKey", cosmos_key) \
  .option("spark.cosmos.database", cosmos_database) \
  .option("spark.cosmos.container", "analytics") \
  .mode("append") \
  .save()

print("✅ Hourly stats saved to Cosmos DB")

# Daily stats
df_daily_cosmos = df_daily.withColumn("id", col("date").cast("string"))
df_daily_cosmos = df_daily_cosmos.withColumn("intersectionId", lit("intersection-1"))
df_daily_cosmos = df_daily_cosmos.withColumn("type", lit("daily"))

df_daily_cosmos.write \
  .format("cosmos.oltp") \
  .option("spark.synapse.linkedService", "CosmosDb") \
  .option("spark.cosmos.accountEndpoint", cosmos_endpoint) \
  .option("spark.cosmos.accountKey", cosmos_key) \
  .option("spark.cosmos.database", cosmos_database) \
  .option("spark.cosmos.container", "analytics") \
  .mode("append") \
  .save()

print("✅ Daily stats saved to Cosmos DB")

# ========== TRAFFIC PREDICTION (ML) ==========
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.regression import LinearRegression

# Prepare features for prediction
df_ml = df_hourly.select(
  col("hour").cast("double"),
  col("total_vehicles").cast("double"),
  col("congestion_index").cast("double")
)

# Create feature vector
assembler = VectorAssembler(
  inputCols=["hour", "congestion_index"],
  outputCol="features"
)

df_ml = assembler.transform(df_ml)

# Train model
lr = LinearRegression(featuresCol="features", labelCol="total_vehicles")
model = lr.fit(df_ml)

print(f"Model coefficients: {model.coefficients}")
print(f"Model intercept: {model.intercept}")
print(f"RMSE: {model.summary.rootMeanSquaredError}")

# Predict next hour
from pyspark.sql import Row
next_hour = (datetime.now().hour + 1) % 24
current_congestion = df_hourly.agg(avg("congestion_index")).collect()[0][0]

prediction_data = spark.createDataFrame([
  Row(hour=float(next_hour), congestion_index=float(current_congestion))
])

prediction_data = assembler.transform(prediction_data)
predictions = model.transform(prediction_data)

predicted_vehicles = predictions.select("prediction").collect()[0][0]
print(f"Predicted vehicles for hour {next_hour}: {predicted_vehicles:.0f}")

# Save prediction to Cosmos DB
prediction_result = spark.createDataFrame([{
  "id": f"prediction-{datetime.now().isoformat()}",
  "intersectionId": "intersection-1",
  "type": "prediction",
  "hour": next_hour,
  "predicted_vehicles": int(predicted_vehicles),
  "timestamp": datetime.now().isoformat()
}])

prediction_result.write \
  .format("cosmos.oltp") \
  .option("spark.cosmos.accountEndpoint", cosmos_endpoint) \
  .option("spark.cosmos.accountKey", cosmos_key) \
  .option("spark.cosmos.database", cosmos_database) \
  .option("spark.cosmos.container", "analytics") \
  .mode("append") \
  .save()

print("✅ Prediction saved to Cosmos DB")
```

### **10.5 Create Secrets Scope**
```bash
# Databricks Workspace → Settings → Secrets → Create Scope
1. Scope Name: traffic-secrets
2. Manage Principal: Creator
3. Click "Create"

# Add secrets
databricks secrets put --scope traffic-secrets --key storage-key
databricks secrets put --scope traffic-secrets --key cosmos-endpoint
databricks secrets put --scope traffic-secrets --key cosmos-key
```

### **10.6 Schedule Workflow**
```bash
# Databricks Workspace → Workflows → Create Job
1. Job Name: Traffic Analytics Hourly
2. Task Type: Notebook
3. Notebook: Traffic_Data_Processing
4. Cluster: traffic-analytics-cluster
5. Schedule: Cron (0 * * * *) - every hour
6. Click "Create"
```

### **10.7 Create Analytics Container in Cosmos DB**
```bash
# Azure Portal → Cosmos DB → Data Explorer
1. Click "New Container"
2. Database: TrafficDB
3. Container ID: analytics
4. Partition key: /intersectionId
5. Click "OK"
```

### **10.8 Backend API - Read Analytics**

**File: `app/api/analytics/hourly/route.ts`**
```typescript
import { CosmosClient } from '@azure/cosmos';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  const client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT!,
    key: process.env.COSMOS_KEY!
  });
  
  const container = client
    .database('TrafficDB')
    .container('analytics');
  
  const { resources } = await container.items
    .query({
      query: 'SELECT * FROM c WHERE c.type = @type AND c.date = @date',
      parameters: [
        { name: '@type', value: 'hourly' },
        { name: '@date', value: date }
      ]
    })
    .fetchAll();
  
  return Response.json(resources);
}
```

### **10.9 Frontend - Display Analytics**

**File: `app/analytics/page.tsx`**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

export default function AnalyticsPage() {
  const [hourlyData, setHourlyData] = useState([]);
  
  useEffect(() => {
    fetch('/api/analytics/hourly')
      .then(res => res.json())
      .then(data => setHourlyData(data));
  }, []);
  
  const chartData = {
    labels: hourlyData.map(d => `${d.hour}:00`),
    datasets: [{
      label: 'Total Vehicles',
      data: hourlyData.map(d => d.total_vehicles),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Traffic Analytics</h1>
      <Line data={chartData} />
    </div>
  );
}
```

---

## **STEP 11: Testing End-to-End**

### **9.1 Test ESP32 → IoT Hub**
```bash
# Serial Monitor
✅ WiFi connected
✅ MQTT connected
📤 Data sent successfully!
```

### **9.2 Test IoT Hub → Storage**
```bash
# Azure Portal → Storage Account → Containers → raw-data
# Should see JSON files appearing
```

### **9.3 Test Azure Function**
```bash
# Azure Portal → Function App → Functions → ProcessIoTData → Monitor
# Should see successful executions
```

### **9.4 Test Cosmos DB**
```bash
# Azure Portal → Cosmos DB → Data Explorer → traffic-data
# Should see documents appearing
```

### **9.5 Test SignalR → Frontend**
```bash
# Open browser → http://localhost:3000/dashboard
# Should see:
# 🟢 Real-time Connected
# Data updating automatically
```

### **9.6 Test Databricks Spark Job**
```bash
# Databricks Workspace → Workflows → Traffic Analytics Hourly → Run Now
# Check job logs for success
# Verify data in Cosmos DB analytics container
```

---

## 🔍 Troubleshooting

### **ESP32 not connecting to IoT Hub?**
- Check SAS token not expired
- Check WiFi connection
- Check MQTT port 8883

### **Data not appearing in Storage?**
- Check Message Routing is enabled
- Check custom endpoint configuration
- Wait 60 seconds (batch frequency)

### **Azure Function not triggering?**
- Check STORAGE_CONNECTION_STRING is correct
- Check function is deployed and running
- Check function logs for errors

### **Data not in Cosmos DB?**
- Check COSMOS_CONNECTION_STRING is correct
- Check container names match
- Check partition key is correct

### **SignalR not connecting?**
- Check SIGNALR_CONNECTION_STRING is correct
- Check negotiate endpoint returns valid token
- Check browser console for errors

### **Databricks job failing?**
- Check cluster is running
- Check secrets are configured correctly
- Check Cosmos DB connection string
- Check Storage Account access key
- Review job logs for specific errors

---

## 💰 Cost Estimate (Free Tier)

| Service | Free Tier | Cost if Exceeded |
|---------|-----------|------------------|
| IoT Hub | 8,000 msg/day | $0.50/100K msg |
| Storage | 5 GB | $0.02/GB |
| Cosmos DB | 1000 RU/s | $0.008/RU/s/hour |
| Function | 1M executions | $0.20/1M |
| SignalR | 20 connections | $1.00/unit/day |
| Redis | No free tier | $16/month (Basic C0) |
| Databricks | 14-day trial | $0.15/DBU + VM cost |

**Estimated Monthly Cost:**
- **Without Redis/Databricks:** FREE (within limits)
- **With Redis:** ~$16/month
- **With Databricks:** ~$50-100/month (depends on usage)

---

## 📚 Next Steps

1. ✅ Setup semua Azure services
2. ✅ Deploy Azure Function
3. ✅ Test end-to-end pipeline
4. ⏭️ Add authentication
5. ⏭️ Add data analytics (Spark/Databricks)
6. ⏭️ Add alerting system
7. ⏭️ Production deployment

---

## 🎓 Learning Resources

- [Azure IoT Hub Docs](https://docs.microsoft.com/azure/iot-hub/)
- [Azure Functions Docs](https://docs.microsoft.com/azure/azure-functions/)
- [SignalR Service Docs](https://docs.microsoft.com/azure/azure-signalr/)
- [Cosmos DB Docs](https://docs.microsoft.com/azure/cosmos-db/)
