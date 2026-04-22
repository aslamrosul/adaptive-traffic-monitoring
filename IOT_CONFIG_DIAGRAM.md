# 🚦 IoT Remote Configuration - System Diagram

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WEB DASHBOARD (Next.js)                         │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    /iot-config Page                              │  │
│  │                                                                  │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │  │
│  │  │ Device Selector│  │ IoTConfigPanel │  │  Sync Status   │   │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    │ POST /api/iot/config               │
│                                    ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Backend API Routes                            │  │
│  │                                                                  │  │
│  │  /api/iot/config/route.ts                                       │  │
│  │  - GET: Fetch configs                                           │  │
│  │  - POST: Create/Update config                                   │  │
│  │  - PUT: Update specific config                                  │  │
│  │  - DELETE: Delete config                                        │  │
│  │                                                                  │  │
│  │  /api/iot/config/[deviceId]/route.ts                            │  │
│  │  - GET: Fetch device-specific config                            │  │
│  │  - PATCH: Update device config                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                          │                    │                         │
└──────────────────────────┼────────────────────┼─────────────────────────┘
                           │                    │
                           │                    │
        ┌──────────────────┘                    └──────────────────┐
        │                                                           │
        │ 1. Save to DB                              2. Send MQTT  │
        ▼                                                           ▼
┌───────────────────┐                                  ┌────────────────────┐
│  Azure Cosmos DB  │                                  │  Azure IoT Hub     │
│    (TrafficDB)    │                                  │      (MQTT)        │
│                   │                                  │                    │
│  Container:       │                                  │  Device Twin:      │
│  - intersections  │                                  │  - Desired Props   │
│                   │                                  │  - Reported Props  │
│  Document Type:   │                                  │                    │
│  - iot_config     │                                  │  Devices:          │
│                   │                                  │  - lane-north      │
│  Fields:          │                                  │  - lane-south      │
│  - deviceId       │                                  │  - lane-east       │
│  - trafficLight   │                                  │  - lane-west       │
│    Config         │                                  │                    │
│  - sensorConfig   │                                  └────────────────────┘
│  - lastSyncedAt   │                                             │
│  - status         │                                             │
└───────────────────┘                                             │
                                                                  │
                                                    MQTT Subscribe│
                                                                  │
                                                                  ▼
                                              ┌────────────────────────────┐
                                              │       ESP32 Device         │
                                              │   (Traffic Light)          │
                                              │                            │
                                              │  Components:               │
                                              │  ┌──────────────────────┐  │
                                              │  │  WiFi Connection     │  │
                                              │  └──────────────────────┘  │
                                              │  ┌──────────────────────┐  │
                                              │  │  Azure IoT Client    │  │
                                              │  │  (MQTT Protocol)     │  │
                                              │  └──────────────────────┘  │
                                              │  ┌──────────────────────┐  │
                                              │  │  Device Twin         │  │
                                              │  │  Callback Handler    │  │
                                              │  └──────────────────────┘  │
                                              │  ┌──────────────────────┐  │
                                              │  │  Traffic Light       │  │
                                              │  │  Controller          │  │
                                              │  │  - RED LED (Pin 25)  │  │
                                              │  │  - YEL LED (Pin 26)  │  │
                                              │  │  - GRN LED (Pin 27)  │  │
                                              │  └──────────────────────┘  │
                                              │  ┌──────────────────────┐  │
                                              │  │  Vehicle Sensor      │  │
                                              │  │  (HC-SR04)           │  │
                                              │  │  - TRIG (Pin 5)      │  │
                                              │  │  - ECHO (Pin 18)     │  │
                                              │  └──────────────────────┘  │
                                              └────────────────────────────┘
```

## 🔄 Data Flow Sequence

### 1. Configuration Update Flow

```
User                Web UI              Backend API         Cosmos DB       IoT Hub         ESP32
 │                    │                     │                  │              │              │
 │  Edit Config       │                     │                  │              │              │
 ├───────────────────>│                     │                  │              │              │
 │                    │                     │                  │              │              │
 │  Click Save        │                     │                  │              │              │
 ├───────────────────>│                     │                  │              │              │
 │                    │  POST /api/iot/     │                  │              │              │
 │                    │  config             │                  │              │              │
 │                    ├────────────────────>│                  │              │              │
 │                    │                     │  Save Config     │              │              │
 │                    │                     ├─────────────────>│              │              │
 │                    │                     │                  │              │              │
 │                    │                     │  Success         │              │              │
 │                    │                     │<─────────────────┤              │              │
 │                    │                     │                  │              │              │
 │                    │                     │  Send MQTT       │              │              │
 │                    │                     │  (Device Twin)   │              │              │
 │                    │                     ├─────────────────────────────────>│              │
 │                    │                     │                  │              │              │
 │                    │                     │                  │              │  Receive     │
 │                    │                     │                  │              │  Config      │
 │                    │                     │                  │              ├─────────────>│
 │                    │                     │                  │              │              │
 │                    │                     │                  │              │  Apply       │
 │                    │                     │                  │              │  Config      │
 │                    │                     │                  │              │<─────────────┤
 │                    │                     │                  │              │              │
 │                    │                     │  Update          │              │              │
 │                    │                     │  lastSyncedAt    │              │              │
 │                    │                     ├─────────────────>│              │              │
 │                    │                     │                  │              │              │
 │                    │  Response           │                  │              │              │
 │                    │  (success + mqtt)   │                  │              │              │
 │                    │<────────────────────┤                  │              │              │
 │                    │                     │                  │              │              │
 │  Show Success      │                     │                  │              │              │
 │  Toast             │                     │                  │              │              │
 │<───────────────────┤                     │                  │              │              │
 │                    │                     │                  │              │              │
```

### 2. Traffic Light Operation Flow

```
ESP32 Sensor        ESP32 Controller       Traffic Light       Azure IoT Hub
     │                     │                      │                   │
     │  Read Vehicle       │                      │                   │
     │  Count              │                      │                   │
     ├────────────────────>│                      │                   │
     │                     │                      │                   │
     │  Count = 25         │                      │                   │
     │<────────────────────┤                      │                   │
     │                     │                      │                   │
     │                     │  Find Matching Rule  │                   │
     │                     │  (vehicles > 20)     │                   │
     │                     │  → Green = 45s       │                   │
     │                     │                      │                   │
     │                     │  Turn GREEN ON       │                   │
     │                     ├─────────────────────>│                   │
     │                     │                      │                   │
     │                     │  Wait 45 seconds     │                   │
     │                     │  (greenDuration)     │                   │
     │                     │                      │                   │
     │                     │  Turn YELLOW ON      │                   │
     │                     ├─────────────────────>│                   │
     │                     │                      │                   │
     │                     │  Wait 5 seconds      │                   │
     │                     │  (yellowDuration)    │                   │
     │                     │                      │                   │
     │                     │  Turn RED ON         │                   │
     │                     ├─────────────────────>│                   │
     │                     │                      │                   │
     │                     │  Send Telemetry      │                   │
     │                     ├──────────────────────────────────────────>│
     │                     │  {vehicleCount: 25}  │                   │
     │                     │                      │                   │
     │                     │  Wait 20 seconds     │                   │
     │                     │  (redDuration)       │                   │
     │                     │                      │                   │
     │                     │  Repeat Cycle        │                   │
     │                     │                      │                   │
```

## 🗂️ File Structure

```
adaptive-traffic-monitoring/
│
├── app/
│   ├── api/
│   │   └── iot/
│   │       └── config/
│   │           ├── route.ts                    # Main API endpoint
│   │           └── [deviceId]/
│   │               └── route.ts                # Device-specific API
│   │
│   └── iot-config/
│       └── page.tsx                            # Configuration page
│
├── components/
│   ├── IoTConfigPanel.tsx                      # Config UI component
│   └── Sidebar.tsx                             # Navigation (with IoT menu)
│
├── lib/
│   ├── azure-cosmos.ts                         # Cosmos DB connection
│   └── azure-iot-hub.ts                        # IoT Hub MQTT integration
│
├── ESP32_TRAFFIC_LIGHT_CODE.ino                # ESP32 firmware
│
├── IOT_REMOTE_CONFIG_GUIDE.md                  # Complete documentation
└── IOT_CONFIG_DIAGRAM.md                       # This file
```

## 🔑 Key Components

### 1. **Web Dashboard**

- **Technology:** Next.js 16, React 19, TypeScript
- **UI Library:** Tailwind CSS, Framer Motion
- **State Management:** React Hooks, SWR
- **Features:**
  - Device selector
  - Rule configuration (threshold, durations)
  - Advanced settings (defaults, cycle time, sensor)
  - Real-time sync status

### 2. **Backend API**

- **Technology:** Next.js API Routes
- **Database:** Azure Cosmos DB (NoSQL)
- **IoT Integration:** Azure IoT Hub (MQTT)
- **Features:**
  - CRUD operations for IoT config
  - Device Twin management
  - MQTT message publishing
  - Sync status tracking

### 3. **Azure Cosmos DB**

- **Database:** TrafficDB
- **Container:** intersections
- **Document Type:** iot_config
- **Partition Key:** deviceId
- **Features:**
  - Scalable NoSQL storage
  - Global distribution
  - Low latency reads/writes

### 4. **Azure IoT Hub**

- **Protocol:** MQTT
- **Feature:** Device Twin (Desired/Reported Properties)
- **Devices:** lane-north, lane-south, lane-east, lane-west
- **Features:**
  - Bidirectional communication
  - Reliable message delivery
  - Device management
  - Telemetry ingestion

### 5. **ESP32 Device**

- **Microcontroller:** ESP32 (WiFi + Bluetooth)
- **Protocol:** MQTT over WiFi
- **Sensors:** HC-SR04 Ultrasonic (vehicle detection)
- **Actuators:** 3x LED (Red, Yellow, Green)
- **Features:**
  - Real-time config updates
  - Dynamic traffic light control
  - Vehicle counting
  - Telemetry reporting

## 📦 Data Models

### IoT Config Document (Cosmos DB)

```typescript
interface IoTConfig {
  id: string; // Unique ID
  type: "iot_config"; // Document type
  deviceId: string; // Device identifier
  intersectionId?: string; // Associated intersection
  trafficLightConfig: {
    rules: TrafficRule[]; // Array of rules
    defaultGreenDuration: number; // Default green (seconds)
    defaultYellowDuration: number; // Default yellow (seconds)
    defaultRedDuration: number; // Default red (seconds)
    minCycleTime: number; // Min cycle time (seconds)
    maxCycleTime: number; // Max cycle time (seconds)
  };
  sensorConfig: {
    enabled: boolean; // Sensor on/off
    updateInterval: number; // Read interval (ms)
    vehicleCountReset: number; // Reset interval (ms)
  };
  mqttConfig: {
    topic: string; // MQTT topic
    qos: number; // Quality of Service
  };
  status: "active" | "inactive"; // Config status
  lastSyncedAt: string | null; // Last MQTT sync timestamp
  createdAt: string; // Creation timestamp
  updatedAt: string; // Update timestamp
  createdBy: string; // User who created
}

interface TrafficRule {
  vehicleThreshold: number; // Min vehicles to trigger
  greenDuration: number; // Green light duration (s)
  yellowDuration: number; // Yellow light duration (s)
  redDuration: number; // Red light duration (s)
  description: string; // Rule description
}
```

### Device Twin (Azure IoT Hub)

```json
{
  "properties": {
    "desired": {
      "trafficConfig": {
        "rules": [...],
        "defaults": {...},
        "cycleTime": {...},
        "sensor": {...}
      },
      "lastUpdated": "2026-04-22T10:30:00.000Z"
    },
    "reported": {
      "currentRule": "Lalu lintas sedang",
      "vehicleCount": 25,
      "lightStatus": "green",
      "lastApplied": "2026-04-22T10:30:05.000Z"
    }
  }
}
```

## 🎯 Use Cases

### Use Case 1: Update Traffic Light Duration

1. User opens `/iot-config` page
2. Selects device "lane-north"
3. Edits rule: "If vehicles > 20, green = 50 seconds"
4. Clicks "Save & Send to ESP32"
5. Backend saves to Cosmos DB
6. Backend sends to IoT Hub via Device Twin
7. ESP32 receives and applies new config
8. Traffic light now uses 50s green when vehicles > 20

### Use Case 2: Disable Vehicle Sensor

1. User opens advanced settings
2. Unchecks "Enable Vehicle Sensor"
3. Saves configuration
4. ESP32 receives update
5. ESP32 stops reading sensor
6. Uses default durations for all cycles

### Use Case 3: Emergency Override

1. Admin needs to extend green light during rush hour
2. Opens IoT config page
3. Adds new rule: "If vehicles > 50, green = 90 seconds"
4. Saves immediately
5. ESP32 receives within seconds
6. Traffic flow improves instantly

## 🔐 Security Considerations

1. **Authentication:** NextAuth.js for user authentication
2. **Authorization:** Role-based access control (admin only)
3. **Connection Strings:** Stored in environment variables
4. **MQTT Security:** TLS encryption, device authentication
5. **API Security:** HTTPS only, CORS configured
6. **Data Validation:** Input validation on both frontend and backend

## 📈 Performance Metrics

- **Config Update Latency:** < 2 seconds (web → ESP32)
- **MQTT Message Size:** ~500 bytes (compressed JSON)
- **Database Write Time:** < 100ms (Cosmos DB)
- **ESP32 Response Time:** < 1 second (receive → apply)
- **Sensor Read Frequency:** 5 seconds (configurable)
- **Telemetry Upload:** Every cycle completion

---

**Last Updated:** April 22, 2026
**Version:** 1.0.0
