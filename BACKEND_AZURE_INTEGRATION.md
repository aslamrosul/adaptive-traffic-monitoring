# Backend Azure Integration Guide

## Overview
Aplikasi Adaptive Traffic Monitoring menggunakan Azure Cosmos DB sebagai database utama untuk menyimpan data real-time dari sensor IoT dan analytics.

## Arsitektur Backend

```
ESP32 Sensors → Azure IoT Hub → Azure Functions → Cosmos DB → Next.js API Routes → Frontend
```

### Komponen:
1. **Azure Cosmos DB**: NoSQL database untuk data traffic, events, analytics
2. **Azure IoT Hub**: Menerima data dari ESP32 sensors
3. **Azure Functions**: Processing data dari IoT Hub ke Cosmos DB
4. **Next.js API Routes**: REST API untuk frontend
5. **Azure Storage**: Menyimpan avatar dan file uploads

## Setup Azure Cosmos DB

### 1. Buat Cosmos DB Account
```bash
# Via Azure CLI
az cosmosdb create \
  --name traffic-cosmos-slam \
  --resource-group traffic-monitoring-rg \
  --default-consistency-level Session \
  --locations regionName=southeastasia failoverPriority=0 isZoneRedundant=False
```

### 2. Buat Database dan Containers

```bash
# Buat database
az cosmosdb sql database create \
  --account-name traffic-cosmos-slam \
  --resource-group traffic-monitoring-rg \
  --name TrafficDB \
  --throughput 400

# Buat containers
az cosmosdb sql container create \
  --account-name traffic-cosmos-slam \
  --resource-group traffic-monitoring-rg \
  --database-name TrafficDB \
  --name traffic_data \
  --partition-key-path "/intersectionId" \
  --throughput 400

az cosmosdb sql container create \
  --account-name traffic-cosmos-slam \
  --resource-group traffic-monitoring-rg \
  --database-name TrafficDB \
  --name intersections \
  --partition-key-path "/id" \
  --throughput 400

az cosmosdb sql container create \
  --account-name traffic-cosmos-slam \
  --resource-group traffic-monitoring-rg \
  --database-name TrafficDB \
  --name events \
  --partition-key-path "/intersectionId" \
  --throughput 400

az cosmosdb sql container create \
  --account-name traffic-cosmos-slam \
  --resource-group traffic-monitoring-rg \
  --database-name TrafficDB \
  --name reports \
  --partition-key-path "/id" \
  --throughput 400

az cosmosdb sql container create \
  --account-name traffic-cosmos-slam \
  --resource-group traffic-monitoring-rg \
  --database-name TrafficDB \
  --name notifications \
  --partition-key-path "/userId" \
  --throughput 400

az cosmosdb sql container create \
  --account-name traffic-cosmos-slam \
  --resource-group traffic-monitoring-rg \
  --database-name TrafficDB \
  --name users \
  --partition-key-path "/id" \
  --throughput 400

az cosmosdb sql container create \
  --account-name traffic-cosmos-slam \
  --resource-group traffic-monitoring-rg \
  --database-name TrafficDB \
  --name device_status \
  --partition-key-path "/deviceId" \
  --throughput 400

az cosmosdb sql container create \
  --account-name traffic-cosmos-slam \
  --resource-group traffic-monitoring-rg \
  --database-name TrafficDB \
  --name analytics_daily \
  --partition-key-path "/date" \
  --throughput 400
```

### 3. Dapatkan Connection String

```bash
# Get primary key
az cosmosdb keys list \
  --name traffic-cosmos-slam \
  --resource-group traffic-monitoring-rg \
  --type keys

# Get connection string
az cosmosdb keys list \
  --name traffic-cosmos-slam \
  --resource-group traffic-monitoring-rg \
  --type connection-strings
```

## Data Schema

### traffic_data
```json
{
  "id": "uuid",
  "intersectionId": "string",
  "deviceId": "string",
  "timestamp": "ISO8601",
  "vehicleCount": "number",
  "speed": "number",
  "density": "number",
  "congestionIndex": "number",
  "direction": "north|south|east|west",
  "laneId": "string"
}
```

### intersections
```json
{
  "id": "uuid",
  "name": "string",
  "location": {
    "lat": "number",
    "lng": "number"
  },
  "address": "string",
  "status": "active|inactive|maintenance",
  "devices": ["deviceId1", "deviceId2"],
  "lanes": [
    {
      "id": "string",
      "direction": "north|south|east|west",
      "deviceId": "string"
    }
  ],
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### events
```json
{
  "id": "uuid",
  "intersectionId": "string",
  "title": "string",
  "description": "string",
  "type": "congestion|accident|maintenance|alert",
  "priority": "low|medium|high|critical",
  "status": "open|in_progress|resolved",
  "timestamp": "ISO8601",
  "resolvedAt": "ISO8601",
  "createdBy": "string"
}
```

### analytics_daily
```json
{
  "id": "uuid",
  "date": "YYYY-MM-DD",
  "intersectionId": "string",
  "hourly": [
    {
      "hour": "number (0-23)",
      "vehicleCount": "number",
      "avgSpeed": "number",
      "avgDensity": "number",
      "congestionIndex": "number"
    }
  ],
  "summary": {
    "totalVehicles": "number",
    "peakHour": "number",
    "averageCongestionIndex": "number",
    "incidents": "number"
  }
}
```

## API Routes

### GET /api/traffic/realtime
Query real-time traffic data
```typescript
// Query params:
// - deviceId?: string
// - intersectionId?: string
// - limit?: number (default: 100)

// Response:
{
  "success": true,
  "data": TrafficData[],
  "count": number
}
```

### GET /api/analytics/daily
Get daily analytics
```typescript
// Query params:
// - intersectionId?: string
// - date?: string (YYYY-MM-DD)
// - limit?: number (default: 7)

// Response:
{
  "success": true,
  "data": AnalyticsDaily[],
  "count": number
}
```

### GET /api/intersections
Get all intersections
```typescript
// Response:
{
  "success": true,
  "data": Intersection[],
  "count": number
}
```

### GET /api/events
Get events/alerts
```typescript
// Query params:
// - intersectionId?: string
// - status?: string
// - priority?: string
// - limit?: number (default: 50)

// Response:
{
  "success": true,
  "data": Event[],
  "count": number
}
```

## Environment Variables

```env
# Azure Cosmos DB
AZURE_COSMOS_ENDPOINT=https://traffic-cosmos-slam.documents.azure.com:443/
AZURE_COSMOS_KEY=your-primary-key-here
AZURE_COSMOS_DATABASE=TrafficDB

# Azure Storage (untuk avatar uploads)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_ACCOUNT_NAME=trafficstoragesla
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key
AZURE_STORAGE_CONTAINER_NAME=avatars

# Azure IoT Hub (untuk ESP32)
AZURE_IOT_HUB_NAME=traffic-iot-slam
AZURE_IOT_HUB_CONNECTION_STRING=HostName=traffic-iot-slam.azure-devices.net;...
```

## Testing Backend Connection

### 1. Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-04-20T05:11:30.000Z"
}
```

### 2. Test Intersections API
```bash
curl http://localhost:3000/api/intersections
```

### 3. Test Traffic Data API
```bash
curl http://localhost:3000/api/traffic/realtime?limit=10
```

### 4. Test Analytics API
```bash
curl http://localhost:3000/api/analytics/daily?limit=7
```

## Seeding Sample Data

Gunakan script untuk populate database dengan sample data:

```bash
node scripts/seed-database.js
```

Script ini akan membuat:
- 5 intersections
- 100 traffic data points
- 10 events
- 7 days of analytics data

## Monitoring & Debugging

### Enable Cosmos DB Logging
```typescript
// lib/azure-cosmos.ts
const client = new CosmosClient({ 
  endpoint, 
  key,
  connectionPolicy: {
    requestTimeout: 10000
  },
  diagnosticLevel: 'debug' // Enable debug logging
});
```

### Check Cosmos DB Metrics
1. Azure Portal → Cosmos DB Account
2. Klik "Metrics"
3. Monitor:
   - Request Units (RU/s)
   - Total Requests
   - Throttled Requests
   - Latency

### Common Issues

#### 401 Unauthorized
- **Cause**: Wrong key or expired key
- **Fix**: Regenerate key di Azure Portal dan update .env.local

#### 404 Not Found
- **Cause**: Database atau container tidak ada
- **Fix**: Jalankan script setup database

#### 429 Too Many Requests
- **Cause**: Exceeded RU/s limit
- **Fix**: Increase throughput di Azure Portal atau optimize queries

#### Connection Timeout
- **Cause**: Network issue atau firewall
- **Fix**: Check firewall settings di Azure Portal

## Production Deployment

### 1. Deploy ke Azure App Service
```bash
# Build aplikasi
npm run build

# Deploy via Azure CLI
az webapp up \
  --name traffic-monitoring-app \
  --resource-group traffic-monitoring-rg \
  --runtime "NODE:18-lts"
```

### 2. Set Environment Variables
```bash
az webapp config appsettings set \
  --name traffic-monitoring-app \
  --resource-group traffic-monitoring-rg \
  --settings \
    AZURE_COSMOS_ENDPOINT="https://traffic-cosmos-slam.documents.azure.com:443/" \
    AZURE_COSMOS_KEY="your-key" \
    AZURE_COSMOS_DATABASE="TrafficDB"
```

### 3. Enable HTTPS Only
```bash
az webapp update \
  --name traffic-monitoring-app \
  --resource-group traffic-monitoring-rg \
  --https-only true
```

## Security Best Practices

1. **Use Managed Identity** (Production)
   - Avoid storing keys in environment variables
   - Use Azure Managed Identity untuk akses Cosmos DB

2. **Enable Firewall**
   - Restrict access to specific IP addresses
   - Use Virtual Network integration

3. **Rotate Keys Regularly**
   - Rotate primary/secondary keys setiap 3-6 bulan

4. **Use Read-Only Keys**
   - Untuk operasi read-only, gunakan read-only key

5. **Monitor Access**
   - Enable diagnostic logging
   - Monitor suspicious activities

## Cost Optimization

1. **Use Shared Throughput**
   - Set throughput di database level, bukan per container
   - Hemat biaya untuk multiple containers

2. **Use Autoscale**
   - Enable autoscale untuk handle traffic spikes
   - Pay only for what you use

3. **Optimize Queries**
   - Use partition key dalam queries
   - Avoid cross-partition queries
   - Use pagination (OFFSET/LIMIT)

4. **Archive Old Data**
   - Move old data ke Azure Storage (cheaper)
   - Keep only recent data di Cosmos DB

## Next Steps

1. ✅ Setup Azure Cosmos DB account
2. ✅ Create database dan containers
3. ✅ Update .env.local dengan credentials
4. ✅ Test API endpoints
5. ⏳ Setup Azure IoT Hub untuk ESP32
6. ⏳ Deploy Azure Functions untuk data processing
7. ⏳ Deploy aplikasi ke Azure App Service
