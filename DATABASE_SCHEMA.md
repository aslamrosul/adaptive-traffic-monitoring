# 🗄️ Database Schema - Adaptive Traffic Light Monitoring System

## 📋 Overview

Skema database ini dirancang untuk sistem monitoring lampu lalu lintas adaptif dengan Firebase Firestore sebagai database utama. Struktur ini mendukung real-time updates, IoT integration, dan big data analytics.

---

## 🏗️ Database Architecture

### Technology Stack

- **Primary Database**: Firebase Firestore (NoSQL)
- **Real-time**: Firestore Real-time Listeners
- **Storage**: Firebase Storage (untuk CCTV footage & images)
- **Authentication**: Firebase Auth
- **Analytics**: BigQuery (untuk historical data)

---

## 📊 Collections & Schema

### 1. **users** Collection

Menyimpan data pengguna sistem (admin, operator).

```typescript
interface User {
  id: string; // Auto-generated UID dari Firebase Auth
  email: string; // Email pengguna (unique)
  name: string; // Nama lengkap
  role: "admin_pusat" | "operator_lapangan";
  phone?: string; // Nomor telepon (optional)
  photoURL?: string; // URL foto profil dari Firebase Storage
  location?: string; // Lokasi kerja
  status: "active" | "inactive" | "offline";
  createdAt: Timestamp; // Waktu pembuatan akun
  updatedAt: Timestamp; // Waktu update terakhir
  lastLogin?: Timestamp; // Login terakhir
  metadata?: {
    reportsCreated: number; // Jumlah laporan dibuat
    reportsCompleted: number; // Jumlah laporan selesai
    activeHours: number; // Total jam aktif
  };
}
```

**Indexes:**

- `email` (unique)
- `role`
- `status`

---

### 2. **intersections** Collection

Menyimpan data persimpangan/simpangan.

```typescript
interface Intersection {
  id: string; // Auto-generated document ID
  name: string; // Nama persimpangan (e.g., "Simpang Empat Diponegoro")
  address: string; // Alamat lengkap
  location: {
    lat: number; // Latitude (-90 to 90)
    lng: number; // Longitude (-180 to 180)
  };
  deviceId: string; // ID perangkat ESP32 (unique)
  status: "active" | "inactive" | "maintenance";
  lanes: {
    count: number; // Jumlah jalur (3, 4, 5, 6)
    directions: string[]; // ['north', 'east', 'south', 'west']
  };
  config: {
    mode: "auto" | "manual"; // Mode operasi
    threshold: {
      low: number; // Threshold volume rendah (< 50)
      medium: number; // Threshold volume sedang (50-100)
      high: number; // Threshold volume tinggi (100-200)
      critical: number; // Threshold volume kritis (> 200)
    };
    alertEnabled: boolean; // Notifikasi aktif/tidak
    cycleTime: {
      min: number; // Waktu siklus minimum (detik)
      max: number; // Waktu siklus maksimum (detik)
    };
  };
  cctv?: {
    enabled: boolean;
    streamUrl?: string; // URL CCTV stream
    recordingEnabled: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUpdate: Timestamp; // Update terakhir dari IoT device
}
```

**Indexes:**

- `deviceId` (unique)
- `status`
- `location` (geohash untuk query geografis)

**Sample Data:**

```json
{
  "id": "int_001",
  "name": "Simpang Empat Diponegoro",
  "address": "Jl. Diponegoro No. 123, Jakarta Pusat",
  "location": { "lat": -6.2088, "lng": 106.8456 },
  "deviceId": "ESP32_001",
  "status": "active",
  "lanes": {
    "count": 4,
    "directions": ["north", "east", "south", "west"]
  },
  "config": {
    "mode": "auto",
    "threshold": { "low": 50, "medium": 100, "high": 200, "critical": 300 },
    "alertEnabled": true,
    "cycleTime": { "min": 30, "max": 120 }
  }
}
```

---

### 3. **traffic_data** Collection

Menyimpan data lalu lintas real-time dari sensor IoT.

```typescript
interface TrafficData {
  id: string; // Auto-generated document ID
  intersectionId: string; // Reference ke intersections collection
  deviceId: string; // ID perangkat ESP32
  timestamp: Timestamp; // Waktu pengambilan data

  // Data per jalur
  lanes: {
    north?: LaneData;
    east?: LaneData;
    south?: LaneData;
    west?: LaneData;
  };

  // Agregat data
  totalVehicles: number; // Total kendaraan semua jalur
  averageSpeed: number; // Kecepatan rata-rata (km/jam)
  congestionLevel: "low" | "medium" | "high" | "critical";
  congestionIndex: number; // 0-100 (0 = lancar, 100 = macet parah)
  density: number; // Kepadatan (vehicles/km)
  vcRatio: number; // Volume/Capacity ratio (0-1+)

  // Traffic light status
  currentLight: {
    north: "red" | "yellow" | "green";
    east: "red" | "yellow" | "green";
    south: "red" | "yellow" | "green";
    west: "red" | "yellow" | "green";
  };

  cycleTime: number; // Waktu siklus aktif (detik)
  waitTime: number; // Waktu tunggu rata-rata (detik)

  // Metadata
  metadata?: {
    temperature?: number; // Suhu (Celsius)
    humidity?: number; // Kelembaban (%)
    weather?: string; // Kondisi cuaca
    visibility?: number; // Jarak pandang (meter)
  };

  // AI Analysis
  aiAnalysis?: {
    prediction: "increasing" | "stable" | "decreasing";
    confidence: number; // 0-1
    recommendation?: string;
  };
}

interface LaneData {
  vehicleCount: number; // Jumlah kendaraan
  speed: number; // Kecepatan rata-rata (km/jam)
  density: number; // Kepadatan jalur
  queueLength: number; // Panjang antrian (meter)
  lightStatus: "red" | "yellow" | "green";
  greenTime: number; // Durasi lampu hijau (detik)
}
```

**Indexes:**

- `intersectionId`
- `timestamp` (descending)
- `congestionLevel`
- Composite: `intersectionId + timestamp`

**Sample Data:**

```json
{
  "id": "td_001",
  "intersectionId": "int_001",
  "deviceId": "ESP32_001",
  "timestamp": "2026-04-15T10:30:00Z",
  "lanes": {
    "north": {
      "vehicleCount": 45,
      "speed": 35,
      "density": 25,
      "queueLength": 50,
      "lightStatus": "green",
      "greenTime": 45
    }
  },
  "totalVehicles": 180,
  "averageSpeed": 32,
  "congestionLevel": "medium",
  "congestionIndex": 55,
  "density": 28,
  "vcRatio": 0.65,
  "cycleTime": 90,
  "waitTime": 35
}
```

---

### 4. **events** Collection

Menyimpan kejadian & anomali di persimpangan.

```typescript
interface Event {
  id: string; // Auto-generated document ID
  intersectionId: string; // Reference ke intersections
  type:
    | "congestion"
    | "accident"
    | "sensor_error"
    | "manual_override"
    | "system_alert"
    | "maintenance";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";

  title: string; // Judul kejadian
  description: string; // Deskripsi detail

  timestamp: Timestamp; // Waktu kejadian
  resolvedAt?: Timestamp; // Waktu penyelesaian

  reportedBy?: {
    userId: string; // User yang melaporkan
    userName: string;
    userRole: string;
  };

  assignedTo?: {
    userId: string; // User yang ditugaskan
    userName: string;
  };

  location?: {
    lane?: string; // Jalur spesifik (north, east, south, west)
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  metadata?: {
    vehicleCount?: number;
    congestionLevel?: string;
    duration?: number; // Durasi kejadian (menit)
    affectedLanes?: string[];
    images?: string[]; // URLs dari Firebase Storage
  };

  actions?: {
    timestamp: Timestamp;
    userId: string;
    action: string;
    notes?: string;
  }[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**

- `intersectionId`
- `type`
- `priority`
- `status`
- `timestamp` (descending)
- Composite: `intersectionId + status`

---

### 5. **reports** Collection

Menyimpan laporan yang dibuat oleh pengguna.

```typescript
interface Report {
  id: string; // Auto-generated document ID
  intersectionId: string; // Reference ke intersections
  type: "congestion" | "accident" | "sensor_malfunction" | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "submitted" | "reviewed" | "in_progress" | "completed" | "rejected";

  title: string;
  description: string;

  reportedBy: {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
  };

  attachments?: {
    type: "image" | "video" | "document";
    url: string; // Firebase Storage URL
    filename: string;
  }[];

  location?: {
    lat: number;
    lng: number;
  };

  reviewedBy?: {
    userId: string;
    userName: string;
    reviewedAt: Timestamp;
    notes?: string;
  };

  resolution?: {
    resolvedBy: string;
    resolvedAt: Timestamp;
    solution: string;
    notes?: string;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**

- `intersectionId`
- `type`
- `priority`
- `status`
- `reportedBy.userId`
- `createdAt` (descending)

---

### 6. **notifications** Collection

Menyimpan notifikasi untuk pengguna.

```typescript
interface Notification {
  id: string; // Auto-generated document ID
  userId: string; // Target user
  type: "alert" | "info" | "warning" | "success";
  category: "traffic" | "system" | "report" | "maintenance";

  title: string;
  message: string;

  read: boolean; // Status baca
  readAt?: Timestamp;

  actionUrl?: string; // URL untuk action (optional)

  relatedTo?: {
    type: "intersection" | "event" | "report";
    id: string;
  };

  metadata?: {
    intersectionName?: string;
    priority?: string;
    [key: string]: any;
  };

  createdAt: Timestamp;
  expiresAt?: Timestamp; // Auto-delete setelah expired
}
```

**Indexes:**

- `userId`
- `read`
- `createdAt` (descending)
- Composite: `userId + read`

---

### 7. **analytics_daily** Collection

Agregasi data harian untuk analytics.

```typescript
interface AnalyticsDaily {
  id: string; // Format: "int_001_2026-04-15"
  intersectionId: string;
  date: string; // Format: "YYYY-MM-DD"

  summary: {
    totalVehicles: number;
    averageSpeed: number;
    averageCongestionIndex: number;
    averageWaitTime: number;
    peakHour: string; // Format: "HH:00"
    peakVehicleCount: number;
  };

  hourly: {
    hour: number; // 0-23
    vehicleCount: number;
    averageSpeed: number;
    congestionLevel: string;
    congestionIndex: number;
  }[];

  efficiency: {
    autoModeTime: number; // Menit dalam mode auto
    manualModeTime: number; // Menit dalam mode manual
    autoModeEfficiency: number; // Persentase efisiensi
    manualModeEfficiency: number;
  };

  events: {
    total: number;
    bySeverity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    byType: {
      congestion: number;
      accident: number;
      sensor_error: number;
      other: number;
    };
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**

- `intersectionId`
- `date` (descending)
- Composite: `intersectionId + date`

---

### 8. **system_config** Collection

Konfigurasi sistem global.

```typescript
interface SystemConfig {
  id: string; // "global_config"

  settings: {
    autoMode: boolean;
    notificationsEnabled: boolean;
    darkMode: boolean;
  };

  iot: {
    mqttBrokerUrl: string;
    apiKey: string; // Encrypted
    connectionTimeout: number; // Detik
    heartbeatInterval: number; // Detik
  };

  alerts: {
    congestionThreshold: number;
    responseTime: number; // Menit
    escalationTime: number; // Menit
    emailEnabled: boolean;
    smsEnabled: boolean;
  };

  maintenance: {
    scheduledDowntime?: {
      start: Timestamp;
      end: Timestamp;
      reason: string;
    };
    lastMaintenance?: Timestamp;
    nextMaintenance?: Timestamp;
  };

  updatedAt: Timestamp;
  updatedBy: string; // User ID
}
```

---

### 9. **device_status** Collection

Status perangkat IoT (ESP32).

```typescript
interface DeviceStatus {
  id: string; // Device ID (e.g., "ESP32_001")
  intersectionId: string;

  status: "online" | "offline" | "error";
  lastHeartbeat: Timestamp;

  hardware: {
    model: string; // "ESP32-WROOM-32"
    firmwareVersion: string;
    uptime: number; // Detik
    freeMemory: number; // Bytes
    cpuUsage: number; // Persentase
  };

  network: {
    signalStrength: number; // dBm
    ipAddress: string;
    latency: number; // ms
    packetLoss: number; // Persentase
  };

  sensors: {
    type: string; // "ultrasonic", "infrared", "camera"
    status: "ok" | "warning" | "error";
    lastCalibration?: Timestamp;
  }[];

  errors?: {
    timestamp: Timestamp;
    code: string;
    message: string;
    severity: "low" | "medium" | "high";
  }[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**

- `intersectionId`
- `status`
- `lastHeartbeat` (descending)

---

### 10. **audit_logs** Collection

Log aktivitas sistem untuk audit trail.

```typescript
interface AuditLog {
  id: string; // Auto-generated document ID

  userId: string;
  userName: string;
  userRole: string;

  action: string; // "create", "update", "delete", "login", "logout"
  resource: string; // "user", "intersection", "report", "config"
  resourceId?: string;

  details: {
    before?: any; // State sebelum perubahan
    after?: any; // State setelah perubahan
    changes?: string[]; // Daftar field yang berubah
  };

  ipAddress?: string;
  userAgent?: string;

  timestamp: Timestamp;
}
```

**Indexes:**

- `userId`
- `action`
- `resource`
- `timestamp` (descending)

---

## 🔐 Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin_pusat';
    }

    function isOperator() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'operator_lapangan';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin() || request.auth.uid == userId;
      allow delete: if isAdmin();
    }

    // Intersections collection
    match /intersections/{intersectionId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Traffic data collection
    match /traffic_data/{dataId} {
      allow read: if isAuthenticated();
      allow create: if true; // Allow IoT devices to write
      allow update, delete: if isAdmin();
    }

    // Events collection
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAdmin() || isOperator();
      allow delete: if isAdmin();
    }

    // Reports collection
    match /reports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAdmin() || resource.data.reportedBy.userId == request.auth.uid;
      allow delete: if isAdmin();
    }

    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAdmin();
      allow update: if resource.data.userId == request.auth.uid;
      allow delete: if isAdmin() || resource.data.userId == request.auth.uid;
    }

    // Analytics collection (read-only for users)
    match /analytics_daily/{analyticsId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only backend can write
    }

    // System config (admin only)
    match /system_config/{configId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Device status (read-only for users)
    match /device_status/{deviceId} {
      allow read: if isAuthenticated();
      allow create, update: if true; // Allow IoT devices
      allow delete: if isAdmin();
    }

    // Audit logs (read-only)
    match /audit_logs/{logId} {
      allow read: if isAdmin();
      allow write: if false; // Only backend can write
    }
  }
}
```

---

## 📈 Data Flow

### 1. IoT Device → Firestore

```
ESP32 Sensor → MQTT Broker → Cloud Function → Firestore (traffic_data)
                                            → Firestore (device_status)
```

### 2. Real-time Updates

```
Firestore → onSnapshot Listener → React Component → UI Update
```

### 3. Analytics Pipeline

```
Firestore (traffic_data) → Cloud Function (Scheduled) → BigQuery → Analytics Dashboard
```

---

## 🔄 Data Retention Policy

| Collection        | Retention | Archive Strategy                |
| ----------------- | --------- | ------------------------------- |
| `traffic_data`    | 30 days   | Move to BigQuery after 7 days   |
| `events`          | 1 year    | Archive to Cloud Storage        |
| `reports`         | 2 years   | Archive to Cloud Storage        |
| `notifications`   | 30 days   | Auto-delete after read + 7 days |
| `analytics_daily` | 2 years   | Keep in Firestore               |
| `audit_logs`      | 5 years   | Archive to Cloud Storage        |
| `device_status`   | 90 days   | Keep latest only                |

---

## 🚀 Migration & Seeding

### Initial Data Seeding

```typescript
// seed-data.ts
const seedIntersections = [
  {
    name: "Simpang Empat Diponegoro",
    address: "Jl. Diponegoro No. 123, Jakarta Pusat",
    location: { lat: -6.2088, lng: 106.8456 },
    deviceId: "ESP32_001",
    status: "active",
    lanes: { count: 4, directions: ["north", "east", "south", "west"] },
  },
  {
    name: "Simpang Tiga Sudirman",
    address: "Jl. Sudirman No. 456, Jakarta Selatan",
    location: { lat: -6.2215, lng: 106.8145 },
    deviceId: "ESP32_002",
    status: "active",
    lanes: { count: 3, directions: ["north", "east", "south"] },
  },
  // ... 2 more intersections
];

// Run: npm run seed
```

---

## 📊 Query Examples

### Get Real-time Traffic Data

```typescript
const q = query(
  collection(db, "traffic_data"),
  where("intersectionId", "==", "int_001"),
  orderBy("timestamp", "desc"),
  limit(100),
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  const data = snapshot.docs.map((doc) => doc.data());
  console.log("Latest traffic data:", data);
});
```

### Get Daily Analytics

```typescript
const analyticsRef = doc(db, "analytics_daily", "int_001_2026-04-15");
const analyticsSnap = await getDoc(analyticsRef);
console.log("Daily analytics:", analyticsSnap.data());
```

### Get Unread Notifications

```typescript
const q = query(
  collection(db, "notifications"),
  where("userId", "==", currentUserId),
  where("read", "==", false),
  orderBy("createdAt", "desc"),
);
```

---

## 🎯 Performance Optimization

### Composite Indexes

```
intersections: location (geohash)
traffic_data: intersectionId + timestamp (DESC)
events: intersectionId + status
notifications: userId + read
analytics_daily: intersectionId + date (DESC)
```

### Caching Strategy

- Cache intersection data (rarely changes)
- Real-time traffic data (no cache, use listeners)
- Analytics data (cache for 5 minutes)

---

## 📝 Notes

1. **Firestore Limits:**
   - Max document size: 1 MB
   - Max write rate: 1 write/second per document
   - Max listeners: 100 per client

2. **Cost Optimization:**
   - Use BigQuery for historical data (cheaper storage)
   - Implement data retention policies
   - Use Cloud Functions for aggregations

3. **Scalability:**
   - Shard high-traffic collections
   - Use subcollections for nested data
   - Implement pagination for large queries

---

**Last Updated**: April 15, 2026
**Version**: 1.0.0
**Status**: ✅ Ready for Implementation
