# 🚦 Traffic Monitoring API - NEW CONCEPT

## 📋 Overview

API ini mendukung **konsep baru** traffic monitoring dengan:

- ✅ Vehicle counting di **semua kondisi lampu** (merah, kuning, hijau)
- ✅ Durasi lampu hijau berdasarkan **queue level** (0, 1, 2)
- ✅ Queue detection menggunakan **ultrasonic sensor**

---

## 🔄 Perubahan dari Konsep Lama

| Fitur            | Old Concept                  | New Concept                 |
| ---------------- | ---------------------------- | --------------------------- |
| Vehicle Counting | Hanya saat lampu merah       | **Semua kondisi lampu**     |
| Green Duration   | Berdasarkan jumlah kendaraan | **Berdasarkan queue level** |
| Queue Detection  | Tidak ada                    | **3 level** (0, 1, 2)       |

---

## 📡 API Endpoints

### 1. POST /api/traffic/realtime

Menerima data dari ESP32 dengan struktur baru.

#### Request Body

```typescript
{
  "deviceId": "ESP32_001",
  "intersectionId": "int-001",      // Optional
  "lane": "north",                  // north, south, east, west
  "light": "green",                 // NEW: red, yellow, green
  "vehicleCount": 15,               // NEW: Count in all conditions
  "irState": "detected",            // NEW: detected or clear
  "queueLength": 8,                 // NEW: Distance in cm
  "queueLevel": 2,                  // NEW: 0, 1, or 2
  "greenDuration": 15,              // NEW: 7, 10, or 15 seconds
  "speed": 45,                      // Optional
  "density": 0.7,                   // Optional
  "status": "normal"                // Optional
}
```

#### Validation Rules

- `queueLevel`: Must be 0, 1, or 2
- `queueLength`: Must be >= 0
- `greenDuration`: Must be 7, 10, or 15
- `light`: Must be 'red', 'yellow', or 'green'

#### Response

```json
{
  "success": true,
  "message": "Data saved successfully (NEW CONCEPT)",
  "id": "ESP32_001-1234567890",
  "intersectionId": "int-001",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "queueLevel": 2,
  "greenDuration": 15
}
```

---

### 2. GET /api/traffic/latest

Mendapatkan data traffic terbaru per lane dengan queue level info.

#### Query Parameters

- `intersectionId` (required): ID persimpangan
- `deviceId` (optional): ID device ESP32

#### Response

```json
{
  "success": true,
  "data": {
    "deviceId": "ESP32_001",
    "intersectionId": "int-001",
    "timestamp": 1705315800000,
    "north": {
      "light": "green",
      "vehicleCount": 15,
      "irState": "detected",
      "queueLength": 8,
      "queueLevel": 2,
      "greenDuration": 15,
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "south": {
      "light": "red",
      "vehicleCount": 5,
      "irState": "clear",
      "queueLength": 25,
      "queueLevel": 0,
      "greenDuration": 7,
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "east": {
      /* ... */
    },
    "west": {
      /* ... */
    }
  },
  "message": "Latest traffic data retrieved (NEW CONCEPT)"
}
```

---

### 3. GET /api/traffic/realtime

Mendapatkan historical traffic data dengan queue level.

#### Query Parameters

- `limit` (optional): Jumlah data (default: 100)
- `deviceId` (optional): Filter by device ID

#### Response

```json
{
  "success": true,
  "count": 100,
  "data": [
    {
      "id": "ESP32_001-1705315800000",
      "intersectionId": "int-001",
      "deviceId": "ESP32_001",
      "lane": "north",
      "light": "green",
      "vehicleCount": 15,
      "irState": "detected",
      "queueLength": 8,
      "queueLevel": 2,
      "greenDuration": 15,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "_ts": 1705315800
    }
    // ... more data
  ]
}
```

---

## 📏 Queue Level System

### Level 0: Antrian Pendek 🟢

- **Jarak**: > 20cm
- **Durasi Hijau**: 7 detik
- **Kondisi**: Lalu lintas lancar

### Level 1: Antrian Sedang 🟡

- **Jarak**: 10-20cm
- **Durasi Hijau**: 10 detik
- **Kondisi**: Lalu lintas mulai padat

### Level 2: Antrian Panjang 🔴

- **Jarak**: < 10cm
- **Durasi Hijau**: 15 detik
- **Kondisi**: Lalu lintas sangat padat

---

## 🔧 Helper Functions

### TypeScript Types

```typescript
import {
  QueueLevel,
  LightStatus,
  IRState,
  LaneData,
  TrafficDataPayload,
  TrafficDataItem,
  getQueueLevelFromDistance,
  getGreenDurationFromQueueLevel,
  validateTrafficData,
} from "@/lib/types/traffic";
```

### Usage Examples

```typescript
// Get queue level from ultrasonic distance
const distance = 8; // cm
const queueLevel = getQueueLevelFromDistance(distance);
// Returns: 2

// Get green duration from queue level
const greenDuration = getGreenDurationFromQueueLevel(2);
// Returns: 15

// Validate traffic data
const validation = validateTrafficData({
  deviceId: "ESP32_001",
  lane: "north",
  queueLevel: 2,
  queueLength: 8,
  greenDuration: 15,
});
// Returns: { valid: true, errors: [] }
```

---

## 🧪 Testing

### cURL Examples

#### Send Traffic Data

```bash
curl -X POST http://localhost:3000/api/traffic/realtime \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ESP32_001",
    "lane": "north",
    "light": "green",
    "vehicleCount": 15,
    "irState": "detected",
    "queueLength": 8,
    "queueLevel": 2,
    "greenDuration": 15
  }'
```

#### Get Latest Data

```bash
curl "http://localhost:3000/api/traffic/latest?intersectionId=int-001"
```

#### Get Historical Data

```bash
curl "http://localhost:3000/api/traffic/realtime?limit=50&deviceId=ESP32_001"
```

---

## 📊 Database Schema

### Cosmos DB Container: `trafficData`

```json
{
  "id": "ESP32_001-1705315800000",
  "intersectionId": "int-001",
  "deviceId": "ESP32_001",
  "lane": "north",
  "light": "green",
  "vehicleCount": 15,
  "irState": "detected",
  "queueLength": 8,
  "queueLevel": 2,
  "greenDuration": 15,
  "speed": 45,
  "density": 0.7,
  "status": "normal",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "_ts": 1705315800
}
```

---

## ✅ Migration Checklist

- [x] Update POST /api/traffic/realtime with queue level support
- [x] Create GET /api/traffic/latest endpoint
- [x] Create TypeScript types in lib/types/traffic.ts
- [x] Add validation for queue level, queue length, green duration
- [x] Update logging to show new fields
- [ ] Update frontend to display queue level
- [ ] Update dashboard charts for queue level analytics
- [ ] Update ESP32 firmware to send new data format
- [ ] Test end-to-end data flow

---

## 📚 Related Files

- `lib/types/traffic.ts` - Type definitions
- `app/api/traffic/realtime/route.ts` - POST/GET realtime data
- `app/api/traffic/latest/route.ts` - GET latest data per lane
- `00-KONSEP-BARU.md` - Concept documentation
- `GANTT_NEW_CONCEPT_TASKS.csv` - Task breakdown

---

## 🆘 Support

Jika ada pertanyaan atau issue, silakan buka issue di repository atau hubungi tim development.
