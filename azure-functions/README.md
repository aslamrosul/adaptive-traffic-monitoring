# Azure Functions - Traffic Monitoring

Azure Functions untuk memproses data IoT dari Blob Storage dan mengirim ke Cosmos DB + SignalR.

## 📋 Prerequisites

1. ✅ Azure Storage Account (untuk Blob Trigger)
2. ✅ Azure Cosmos DB
3. ✅ Azure SignalR Service
4. ✅ Azure Redis Cache (optional)
5. ✅ Node.js 18+ installed
6. ✅ Azure Functions Core Tools v4

## 🚀 Setup

### 1. Install Dependencies

```bash
cd azure-functions
npm install
```

### 2. Configure Environment Variables

Update `local.settings.json` dengan credentials Anda:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=https;AccountName=...",
    "COSMOS_ENDPOINT": "https://traffic-cosmos-slam1.documents.azure.com:443/",
    "COSMOS_KEY": "your-cosmos-key-here",
    "COSMOS_DATABASE": "TrafficDB",
    "SIGNALR_CONNECTION_STRING": "Endpoint=https://...;AccessKey=...;Version=1.0;",
    "REDIS_HOST": "traffic-redis-slam1.redis.cache.windows.net",
    "REDIS_PORT": "6380",
    "REDIS_PASSWORD": "your-redis-key",
    "REDIS_TLS": "true"
  }
}
```

**Cara mendapatkan credentials:**

#### Azure Storage Connection String:
```bash
Azure Portal → Storage Account → Access keys → Connection string
```

#### Cosmos DB:
```bash
Azure Portal → Cosmos DB → Keys
- URI (COSMOS_ENDPOINT)
- Primary Key (COSMOS_KEY)
```

#### SignalR:
```bash
Azure Portal → SignalR Service → Keys → Connection string
```

#### Redis:
```bash
Azure Portal → Redis Cache → Access keys → Primary key
```

### 3. Build TypeScript

```bash
npm run build
```

### 4. Run Locally

```bash
npm start
```

Expected output:
```
Azure Functions Core Tools
Core Tools Version:       4.x
Function Runtime Version: 4.x

Functions:
  ProcessIoTData: blobTrigger

For detailed output, run func with --verbose flag.
[2024-05-10T10:00:00.000Z] Worker process started and initialized.
[2024-05-10T10:00:00.000Z] Host started
```

## 🧪 Testing

### Test 1: Upload Test Blob

Create test file `test-data.json`:

```json
{
  "deviceId": "esp32-traffic-monitor",
  "timestamp": 1715270400000,
  "north": {
    "light": "green",
    "vehicleCount": 8,
    "irState": "clear",
    "queueLength": 25
  },
  "south": {
    "light": "red",
    "vehicleCount": 12,
    "irState": "detected",
    "queueLength": 15
  },
  "east": {
    "light": "yellow",
    "vehicleCount": 5,
    "irState": "clear",
    "queueLength": 30
  },
  "west": {
    "light": "red",
    "vehicleCount": 10,
    "irState": "detected",
    "queueLength": 8
  }
}
```

Upload to Blob Storage:

```bash
# Using Azure CLI
az storage blob upload \
  --account-name trafficdatalakeslam1 \
  --container-name raw-data \
  --name test-data.json \
  --file test-data.json
```

Or using Azure Portal:
```
Storage Account → Containers → raw-data → Upload
```

### Test 2: Check Logs

Function logs should show:
```
[2024-05-10T10:00:00.000Z] Executing 'ProcessIoTData'
[2024-05-10T10:00:00.000Z] Processing blob: test-data.json
[2024-05-10T10:00:00.000Z] Parsed IoT data: {...}
[2024-05-10T10:00:00.000Z] ✅ Saved to Cosmos DB: esp32-traffic-monitor-1715270400000
[2024-05-10T10:00:00.000Z] ✅ Cached in Redis: traffic:latest:intersection-traffic-monitor
[2024-05-10T10:00:00.000Z] ✅ Sent to SignalR
[2024-05-10T10:00:00.000Z] Executed 'ProcessIoTData' (Succeeded)
```

### Test 3: Verify Data in Cosmos DB

```bash
# Azure Portal → Cosmos DB → Data Explorer
# Container: traffic-data
# Query: SELECT * FROM c ORDER BY c.timestamp DESC
```

Should see processed data with:
- ✅ `id` field
- ✅ `processedAt` timestamp
- ✅ `intersectionId` field
- ✅ `queueLevel` calculated (0, 1, or 2)

## 📊 Function Flow

```
IoT Hub → Blob Storage (raw-data)
    ↓
Blob Trigger (ProcessIoTData)
    ↓
├─→ Calculate queue level (0, 1, 2)
├─→ Save to Cosmos DB
├─→ Cache in Redis (5 min TTL)
└─→ Broadcast to SignalR (real-time)
```

## 🔧 Queue Level Calculation

```typescript
function calculateQueueLevel(queueLength: number): number {
  if (queueLength < 10) return 2;  // Padat (< 10cm)
  if (queueLength < 20) return 1;  // Sedang (10-20cm)
  return 0;                        // Lancar (> 20cm)
}
```

## 📦 Deploy to Azure

### 1. Build for Production

```bash
npm run build
```

### 2. Deploy

```bash
# Login to Azure
az login

# Deploy function
func azure functionapp publish traffic-function-slam1
```

### 3. Configure App Settings in Azure

```bash
# Azure Portal → Function App → Configuration → Application settings

Add all settings from local.settings.json:
- COSMOS_ENDPOINT
- COSMOS_KEY
- COSMOS_DATABASE
- SIGNALR_CONNECTION_STRING
- REDIS_HOST
- REDIS_PORT
- REDIS_PASSWORD
- REDIS_TLS
```

### 4. Verify Deployment

```bash
# Check function status
func azure functionapp list-functions traffic-function-slam1

# View logs
func azure functionapp logstream traffic-function-slam1
```

## 🐛 Troubleshooting

### Error: "Cannot find module '@azure/cosmos'"

```bash
cd azure-functions
npm install
npm run build
```

### Error: "Storage connection string is invalid"

Update `AzureWebJobsStorage` in `local.settings.json`:
```json
"AzureWebJobsStorage": "DefaultEndpointsProtocol=https;AccountName=trafficdatalakeslam1;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net"
```

### Error: "Cosmos DB authentication failed"

Verify `COSMOS_KEY` is correct:
```bash
Azure Portal → Cosmos DB → Keys → Copy Primary Key
```

### Function not triggering

1. Check blob container name: `raw-data`
2. Verify storage connection string
3. Check function logs for errors

## 📚 Files Structure

```
azure-functions/
├── src/
│   └── functions/
│       └── ProcessIoTData.ts    # Main function
├── host.json                     # Function host config
├── local.settings.json           # Local environment variables
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

## 🎯 Next Steps

1. ✅ Test locally with sample data
2. ✅ Verify Cosmos DB writes
3. ✅ Test SignalR real-time updates
4. ✅ Deploy to Azure
5. ✅ Connect ESP32 to send real data
6. ✅ Monitor function metrics in Azure Portal

## 📊 Monitoring

### Azure Portal Metrics

```
Function App → Monitor → Metrics

Track:
- Execution count
- Execution duration
- Success rate
- Error rate
```

### Application Insights (Recommended)

```bash
# Enable Application Insights
Azure Portal → Function App → Application Insights → Enable
```

View:
- Live metrics
- Failures
- Performance
- Dependencies (Cosmos DB, SignalR, Redis)
