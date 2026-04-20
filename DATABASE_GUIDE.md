# 📊 Database Guide - Azure Cosmos DB

## 🎯 Overview

Database menggunakan **Azure Cosmos DB** dengan **SQL API** untuk menyimpan semua data aplikasi.

**Database Name:** `TrafficDB`  
**Total Collections:** 8

---

## 📋 Collections Structure

### 1. **users** 👤
**Partition Key:** `/email`  
**Purpose:** Data pengguna sistem (admin, operator)

```typescript
interface User {
  id: string;                    // user-{timestamp}-{random}
  name: string;                  // Full name
  email: string;                 // Email (unique, partition key)
  password: string;              // Hashed password (empty for OAuth)
  role: "admin" | "operator" | "viewer";
  avatar: string;                // Avatar URL
  status: "active" | "inactive";
  provider?: "credentials" | "google";  // Auth provider
  phone?: string;                // Phone number (optional)
  location?: string;             // Location (optional)
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

**Example:**
```json
{
  "id": "user-1713244800000-abc123",
  "name": "Administrator",
  "email": "admin@traffic.com",
  "password": "$2a$10$...",
  "role": "admin",
  "avatar": "https://ui-avatars.com/api/?name=Administrator",
  "status": "active",
  "provider": "credentials",
  "createdAt": "2024-01-25T10:00:00Z",
  "updatedAt": "2024-01-25T10:00:00Z"
}
```

---

### 2. **intersections** 🚦
**Partition Key:** `/deviceId`  
**Purpose:** Data persimpangan lalu lintas

```typescript
interface Intersection {
  id: string;                    // int-{number}
  name: string;                  // Intersection name
  address: string;               // Full address
  location: {
    lat: number;                 // Latitude
    lng: number;                 // Longitude
  };
  deviceId: string;              // IoT device ID (partition key)
  status: "active" | "maintenance" | "offline";
  lanes: {
    count: number;               // Number of lanes
    directions: string[];        // ["north", "east", "south", "west"]
  };
  config: {
    mode: "auto" | "manual";
    threshold: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    alertEnabled: boolean;
    cycleTime: {
      min: number;
      max: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}
```

---

### 3. **traffic_data** 🚗
**Partition Key:** `/intersectionId`  
**Purpose:** Real-time traffic data dari sensor IoT

```typescript
interface TrafficData {
  id: string;                    // traffic-{deviceId}-{timestamp}
  intersectionId: string;        // Reference to intersection (partition key)
  deviceId: string;              // IoT device ID
  lane: "north" | "south" | "east" | "west";
  timestamp: string;             // ISO timestamp
  vehicleCount: number;          // Number of vehicles
  speed: number;                 // Average speed (km/h)
  density: number;               // Traffic density (0-100)
  congestionIndex: number;       // Congestion level (0-100)
  queueLength?: number;          // Queue length (meters)
  waitTime?: number;             // Average wait time (seconds)
}
```

---

### 4. **events** 📝
**Partition Key:** `/intersectionId`  
**Purpose:** System events dan alerts

```typescript
interface Event {
  id: string;                    // event-{timestamp}-{random}
  intersectionId: string;        // Reference to intersection (partition key)
  type: "manual_override" | "alert" | "system" | "maintenance";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  title: string;                 // Event title
  description: string;           // Event description
  userId?: string;               // User who triggered (optional)
  userName?: string;             // User name (optional)
  timestamp: string;             // ISO timestamp
  resolvedAt?: string;           // Resolution timestamp (optional)
  metadata?: Record<string, any>; // Additional data
}
```

---

### 5. **reports** 📋
**Partition Key:** `/intersectionId`  
**Purpose:** Laporan dari operator

```typescript
interface Report {
  id: string;                    // rpt-{timestamp}-{random}
  intersectionId: string;        // Reference to intersection (partition key)
  type: "congestion" | "accident" | "maintenance" | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "submitted" | "in_progress" | "resolved" | "closed";
  title: string;                 // Report title
  description: string;           // Report description
  reportedBy: {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
  };
  attachments?: string[];        // File URLs (optional)
  comments?: Array<{
    userId: string;
    userName: string;
    comment: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}
```

---

### 6. **notifications** 🔔
**Partition Key:** `/userId`  
**Purpose:** Notifikasi untuk user

```typescript
interface Notification {
  id: string;                    // notif-{timestamp}-{random}
  userId: string;                // Target user (partition key)
  type: "alert" | "report" | "system" | "info";
  title: string;                 // Notification title
  message: string;               // Notification message
  read: boolean;                 // Read status
  priority: "low" | "medium" | "high" | "critical";
  relatedId?: string;            // Related entity ID (optional)
  relatedType?: "intersection" | "report" | "event";
  actionUrl?: string;            // Action URL (optional)
  createdAt: string;
}
```

---

### 7. **device_status** 🔌
**Partition Key:** `/deviceId`  
**Purpose:** Status perangkat IoT

```typescript
interface DeviceStatus {
  id: string;                    // device-{deviceId}
  deviceId: string;              // Device ID (partition key)
  intersectionId: string;        // Reference to intersection
  status: "online" | "offline" | "error";
  lastHeartbeat: string;         // Last ping timestamp
  firmware: string;              // Firmware version
  battery?: number;              // Battery level (0-100)
  signalStrength?: number;       // Signal strength (dBm)
  sensors?: {
    ultrasonic: "ok" | "error";
    camera: "ok" | "error";
    temperature: number;
  };
  errors?: string[];             // Error messages
  uptime?: number;               // Uptime in seconds
}
```

---

### 8. **analytics_daily** 📊
**Partition Key:** `/intersectionId`  
**Purpose:** Daily analytics agregat

```typescript
interface AnalyticsDaily {
  id: string;                    // analytics-{intersectionId}-{date}
  intersectionId: string;        // Reference to intersection (partition key)
  date: string;                  // Date (YYYY-MM-DD)
  summary: {
    totalVehicles: number;
    averageDensity: number;
    averageSpeed: number;
    averageCongestionIndex: number;
    averageWaitTime: number;
  };
  hourlyData: Array<{
    hour: number;                // 0-23
    vehicles: number;
    density: number;
    speed: number;
    congestionIndex: number;
  }>;
  peakHours: Array<{
    hour: number;
    vehicles: number;
    density: number;
  }>;
  incidents: number;             // Total incidents
  manualOverrides: number;       // Manual overrides count
  alerts: number;                // Total alerts
  uptime: number;                // Uptime percentage
}
```

---

## 🔄 Data Consistency Rules

### 1. **ID Format**
- Users: `user-{timestamp}-{random}`
- Intersections: `int-{number}` (e.g., `int-001`)
- Traffic Data: `traffic-{deviceId}-{timestamp}`
- Events: `event-{timestamp}-{random}`
- Reports: `rpt-{timestamp}-{random}`
- Notifications: `notif-{timestamp}-{random}`
- Device Status: `device-{deviceId}`
- Analytics: `analytics-{intersectionId}-{date}`

### 2. **Timestamps**
- Always use ISO 8601 format: `2024-01-25T10:00:00Z`
- Include timezone (UTC)
- Use `new Date().toISOString()`

### 3. **Status Values**
- User status: `active`, `inactive`
- Intersection status: `active`, `maintenance`, `offline`
- Device status: `online`, `offline`, `error`
- Report/Event status: `submitted`, `in_progress`, `resolved`, `closed`

### 4. **Role Values**
- `admin`: Full access
- `operator`: Can create reports, view data
- `viewer`: Read-only access

### 5. **Priority Values**
- `low`: Minor issues
- `medium`: Normal priority
- `high`: Important
- `critical`: Urgent, requires immediate attention

---

## 🛠️ Common Queries

### Get User by Email
```typescript
const { resources } = await container.items
  .query({
    query: "SELECT * FROM c WHERE c.email = @email",
    parameters: [{ name: "@email", value: email }],
  })
  .fetchAll();
```

### Get Active Intersections
```typescript
const { resources } = await container.items
  .query({
    query: "SELECT * FROM c WHERE c.status = 'active'",
  })
  .fetchAll();
```

### Get Recent Traffic Data
```typescript
const { resources } = await container.items
  .query({
    query: "SELECT * FROM c WHERE c.intersectionId = @id ORDER BY c.timestamp DESC",
    parameters: [{ name: "@id", value: intersectionId }],
  })
  .fetchAll();
```

### Get Unread Notifications
```typescript
const { resources } = await container.items
  .query({
    query: "SELECT * FROM c WHERE c.userId = @userId AND c.read = false ORDER BY c.createdAt DESC",
    parameters: [{ name: "@userId", value: userId }],
  })
  .fetchAll();
```

---

## 📦 Scripts

```bash
# Setup database (create collections)
npm run db:setup

# Seed initial data
npm run db:seed

# Seed admin user
npm run db:seed:admin

# Check database structure
npm run db:check

# Export data
npm run db:export

# Import data
npm run db:import
```

---

## 🔐 Security

1. **Partition Keys**: Always query with partition key for better performance
2. **Indexing**: Cosmos DB auto-indexes all properties
3. **Access Control**: Use Azure RBAC for production
4. **Encryption**: Data encrypted at rest and in transit
5. **Backup**: Enable automatic backups in Azure Portal

---

## 📈 Performance Tips

1. Use partition key in queries whenever possible
2. Limit result size with TOP clause
3. Use continuation tokens for pagination
4. Cache frequently accessed data
5. Use bulk operations for multiple inserts

---

## 🚀 Migration Guide

When adding new fields:
1. Update TypeScript interface
2. Update sample structure in this guide
3. Run migration script to update existing documents
4. Update API routes
5. Update frontend components

Example migration:
```typescript
// Add new field to existing documents
const { resources } = await container.items.readAll().fetchAll();
for (const doc of resources) {
  await container.item(doc.id, doc.email).patch([
    { op: "add", path: "/newField", value: "defaultValue" }
  ]);
}
```
