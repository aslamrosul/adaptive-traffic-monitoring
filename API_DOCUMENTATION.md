# 🚀 API Documentation - Traffic Monitoring System

## Base URL

```
http://localhost:3000/api
```

---

## 📊 Traffic Data API

### GET /api/traffic/realtime

Fetch real-time traffic data from all lanes

**Query Parameters:**

- `limit` (optional) - Number of records to fetch (default: 100)
- `deviceId` (optional) - Filter by specific device

**Response:**

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "lane-north-1234567890",
      "deviceId": "lane-north",
      "lane": "north",
      "vehicleCount": 25,
      "speed": 45.5,
      "density": 0.7,
      "status": "normal",
      "timestamp": "2026-04-15T10:30:00Z"
    }
  ]
}
```

### POST /api/traffic/realtime

Submit traffic data from ESP32 or external source

**Request Body:**

```json
{
  "deviceId": "lane-north",
  "lane": "north",
  "vehicleCount": 25,
  "speed": 45.5,
  "density": 0.7,
  "status": "normal"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Data saved successfully",
  "id": "lane-north-1234567890"
}
```

---

## 🚦 Intersections API

### GET /api/intersections

Fetch all intersections

**Response:**

```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": "int_001",
      "name": "Simpang Empat Diponegoro",
      "address": "Jl. Diponegoro No. 123, Jakarta Pusat",
      "location": {
        "lat": -6.2088,
        "lng": 106.8456
      },
      "deviceId": "ESP32_001",
      "status": "active",
      "lanes": {
        "count": 4,
        "directions": ["north", "east", "south", "west"]
      },
      "config": {
        "mode": "auto",
        "threshold": {
          "low": 50,
          "medium": 100,
          "high": 200,
          "critical": 300
        }
      }
    }
  ]
}
```

### POST /api/intersections

Create new intersection

**Request Body:**

```json
{
  "name": "Simpang Empat Sudirman",
  "address": "Jl. Sudirman No. 456",
  "latitude": -6.2215,
  "longitude": 106.8145,
  "deviceId": "ESP32_005",
  "lanesCount": 4,
  "configMode": "auto"
}
```

### GET /api/intersections/[id]

Fetch single intersection by ID

### PATCH /api/intersections/[id]

Update intersection

**Request Body:**

```json
{
  "status": "maintenance",
  "config": {
    "mode": "manual"
  }
}
```

### DELETE /api/intersections/[id]

Delete intersection

---

## 📋 Events API

### GET /api/events

Fetch events/incidents

**Query Parameters:**

- `intersectionId` (optional) - Filter by intersection
- `status` (optional) - Filter by status (open, in_progress, resolved, closed)
- `priority` (optional) - Filter by priority (low, medium, high, critical)
- `limit` (optional) - Number of records (default: 50)

**Response:**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "evt_001",
      "intersectionId": "int_001",
      "type": "congestion",
      "priority": "high",
      "status": "open",
      "title": "Kemacetan Parah Jalur Utara",
      "description": "Antrian kendaraan mencapai 100 meter",
      "timestamp": "2026-04-15T10:25:00Z"
    }
  ]
}
```

### POST /api/events

Create new event

**Request Body:**

```json
{
  "intersectionId": "int_001",
  "type": "congestion",
  "priority": "high",
  "title": "Kemacetan Parah",
  "description": "Antrian panjang di jalur utara",
  "reportedBy": {
    "userId": "user_001",
    "userName": "Operator 1"
  }
}
```

---

## 📝 Reports API

### GET /api/reports

Fetch user reports

**Query Parameters:**

- `intersectionId` (optional) - Filter by intersection
- `status` (optional) - Filter by status
- `limit` (optional) - Number of records (default: 50)

**Response:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "rpt_001",
      "intersectionId": "int_001",
      "type": "congestion",
      "priority": "high",
      "status": "submitted",
      "title": "Kemacetan Pagi Hari",
      "description": "Kemacetan terjadi setiap pagi",
      "reportedBy": {
        "userId": "user_002",
        "userName": "Operator Lapangan 1",
        "userEmail": "operator1@traffic.com"
      }
    }
  ]
}
```

### POST /api/reports

Create new report

**Request Body:**

```json
{
  "intersectionId": "int_001",
  "type": "congestion",
  "priority": "high",
  "title": "Kemacetan Pagi Hari",
  "description": "Kemacetan rutin setiap pagi",
  "userId": "user_002",
  "userName": "Operator 1",
  "userEmail": "operator1@traffic.com"
}
```

---

## 🔔 Notifications API

### GET /api/notifications

Fetch notifications for a user

**Query Parameters:**

- `userId` (required) - User ID
- `unreadOnly` (optional) - true/false (default: false)
- `limit` (optional) - Number of records (default: 50)

**Response:**

```json
{
  "success": true,
  "count": 4,
  "unreadCount": 2,
  "data": [
    {
      "id": "notif_001",
      "userId": "user_001",
      "type": "alert",
      "category": "traffic",
      "title": "Kemacetan Parah",
      "message": "Kemacetan parah terdeteksi di Simpang Empat Diponegoro",
      "read": false,
      "createdAt": "2026-04-15T10:30:00Z"
    }
  ]
}
```

### POST /api/notifications

Create new notification

**Request Body:**

```json
{
  "userId": "user_001",
  "type": "alert",
  "category": "traffic",
  "title": "Kemacetan Parah",
  "message": "Kemacetan terdeteksi di persimpangan",
  "actionUrl": "/persimpangan/int_001"
}
```

---

## 👥 Users API

### GET /api/users

Fetch all users

**Query Parameters:**

- `role` (optional) - Filter by role (admin_pusat, operator_lapangan)
- `status` (optional) - Filter by status (active, inactive, offline)

**Response:**

```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": "user_001",
      "email": "admin@traffic.com",
      "name": "Admin Pusat",
      "role": "admin_pusat",
      "phone": "081234567890",
      "status": "active",
      "reportsCreated": 5,
      "reportsCompleted": 3
    }
  ]
}
```

### POST /api/users

Create new user

**Request Body:**

```json
{
  "email": "newuser@traffic.com",
  "name": "New User",
  "role": "operator_lapangan",
  "phone": "081234567890",
  "location": "Jakarta Pusat"
}
```

---

## 📊 Analytics API

### GET /api/analytics/daily

Fetch daily analytics

**Query Parameters:**

- `intersectionId` (optional) - Filter by intersection
- `date` (optional) - Filter by date (YYYY-MM-DD)
- `limit` (optional) - Number of records (default: 30)

**Response:**

```json
{
  "success": true,
  "count": 7,
  "data": [
    {
      "id": "int_001_2026-04-15",
      "intersectionId": "int_001",
      "date": "2026-04-15",
      "summary": {
        "totalVehicles": 12500,
        "averageSpeed": 32.5,
        "averageCongestionIndex": 58.3,
        "peakHour": "08:00",
        "peakVehicleCount": 850
      },
      "efficiency": {
        "autoModeTime": 1380,
        "manualModeTime": 60,
        "autoModeEfficiency": 92.5
      }
    }
  ]
}
```

---

## 🔐 Authentication

Currently, the API does not require authentication. For production, implement:

1. **NextAuth.js** for user authentication
2. **API Key** for ESP32 devices
3. **JWT tokens** for secure API access

---

## 🧪 Testing

### Using PowerShell:

```powershell
.\test-api.ps1
```

### Using Bash:

```bash
bash test-api.sh
```

### Using CMD:

```cmd
.\test-api.bat
```

### Using curl:

```bash
# GET request
curl http://localhost:3000/api/traffic/realtime

# POST request
curl -X POST http://localhost:3000/api/traffic/realtime \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"lane-north","lane":"north","vehicleCount":25,"speed":45.5,"density":0.7}'
```

---

## 📝 Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**HTTP Status Codes:**

- `200` - Success
- `400` - Bad Request (missing required fields)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🚀 Next Steps

1. ✅ Setup Azure Cosmos DB containers
2. ✅ Configure environment variables
3. ✅ Test API endpoints
4. 🔄 Implement authentication
5. 🔄 Add rate limiting
6. 🔄 Setup monitoring & logging

---

**Last Updated**: April 15, 2026
**Version**: 1.0.0
