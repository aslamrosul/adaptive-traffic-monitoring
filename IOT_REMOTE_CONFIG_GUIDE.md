# 🚦 IoT Remote Configuration - Complete Guide

## 📋 Overview

Fitur **Remote Configuration** memungkinkan Anda mengontrol Smart Traffic Light (ESP32) secara real-time dari web dashboard. Konfigurasi disimpan ke Azure Cosmos DB dan dikirim ke ESP32 melalui Azure IoT Hub (MQTT).

---

## 🎯 Fitur Utama

### 1. **Dynamic Traffic Light Duration**

- Atur durasi lampu (hijau, kuning, merah) berdasarkan jumlah kendaraan
- Buat multiple rules dengan threshold berbeda
- Contoh: "Jika kendaraan > 20, maka lampu hijau = 45 detik"

### 2. **Real-time Sync via Azure IoT Hub**

- Konfigurasi dikirim langsung ke ESP32 via MQTT
- Menggunakan Device Twin untuk reliable configuration management
- Status sync ditampilkan di dashboard

### 3. **Sensor Configuration**

- Enable/disable sensor kendaraan
- Atur interval pembacaan sensor
- Atur interval reset counter kendaraan

### 4. **Default Durations**

- Durasi default ketika tidak ada kendaraan terdeteksi
- Cycle time minimum dan maximum

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Web Dashboard │ ──────> │  Azure Cosmos DB │         │   ESP32     │
│   (Next.js)     │         │   (TrafficDB)    │         │ Traffic     │
└─────────────────┘         └──────────────────┘         │ Light       │
         │                            │                   └─────────────┘
         │                            │                          ▲
         │                            ▼                          │
         │                   ┌──────────────────┐               │
         └──────────────────>│  Azure IoT Hub   │───────────────┘
                             │     (MQTT)       │
                             └──────────────────┘
```

### Flow:

1. **User** mengatur konfigurasi di web dashboard
2. **Backend API** menyimpan ke **Azure Cosmos DB**
3. **Backend API** mengirim konfigurasi ke **Azure IoT Hub** via Device Twin
4. **ESP32** menerima konfigurasi secara real-time via MQTT
5. **ESP32** menerapkan aturan baru untuk mengatur durasi lampu

---

## 📁 File Structure

### Backend (Next.js API)

```
app/api/iot/config/
├── route.ts                    # Main API endpoint (GET, POST, PUT, DELETE)
└── [deviceId]/
    └── route.ts                # Device-specific endpoint (GET, PATCH)

lib/
├── azure-cosmos.ts             # Cosmos DB connection
└── azure-iot-hub.ts            # Azure IoT Hub MQTT integration
```

### Frontend (React Components)

```
components/
└── IoTConfigPanel.tsx          # Configuration UI component

app/
└── iot-config/
    └── page.tsx                # Configuration page
```

### ESP32 (Arduino)

```
ESP32_TRAFFIC_LIGHT_CODE.ino   # ESP32 firmware with Azure IoT Hub
```

---

## 🔧 Setup Instructions

### 1. **Azure IoT Hub Setup**

Sudah dikonfigurasi di `.env.local`:

```env
AZURE_IOT_HUB_NAME=traffic-iot-slam

# Device Connection Strings
ESP32_LANE_NORTH=HostName=traffic-iot-slam.azure-devices.net;DeviceId=lane-north;SharedAccessKey=...
ESP32_LANE_SOUTH=HostName=traffic-iot-slam.azure-devices.net;DeviceId=lane-south;SharedAccessKey=...
ESP32_LANE_EAST=HostName=traffic-iot-slam.azure-devices.net;DeviceId=lane-east;SharedAccessKey=...
ESP32_LANE_WEST=HostName=traffic-iot-slam.azure-devices.net;DeviceId=lane-west;SharedAccessKey=...
```

### 2. **Install Dependencies**

Backend sudah terinstall:

```bash
npm install azure-iot-device azure-iot-device-mqtt
```

### 3. **ESP32 Setup**

#### Hardware Requirements:

- ESP32 Development Board
- 3x LED (Red, Yellow, Green) + Resistors
- HC-SR04 Ultrasonic Sensor (untuk deteksi kendaraan)
- Breadboard & Jumper Wires

#### Pin Configuration:

```cpp
// Traffic Light LEDs
const int RED_LED = 25;
const int YELLOW_LED = 26;
const int GREEN_LED = 27;

// Vehicle Sensor
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;
```

#### Arduino Libraries:

Install via Arduino Library Manager:

1. **AzureIoTHub** by Microsoft
2. **AzureIoTProtocol_MQTT** by Microsoft
3. **ArduinoJson** by Benoit Blanchon

#### Upload Code:

1. Buka `ESP32_TRAFFIC_LIGHT_CODE.ino` di Arduino IDE
2. Edit WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. Edit connection string (sesuaikan dengan device ID):
   ```cpp
   static const char* connectionString = "HostName=traffic-iot-slam.azure-devices.net;DeviceId=lane-north;SharedAccessKey=...";
   ```
4. Upload ke ESP32

---

## 🚀 Usage Guide

### 1. **Akses Remote Configuration Page**

Buka menu **Remote IoT** di sidebar, atau akses langsung:

```
http://localhost:3000/iot-config
```

### 2. **Pilih Device**

Pilih perangkat IoT yang ingin dikonfigurasi (lane-north, lane-south, dll.)

### 3. **Atur Traffic Rules**

Tambah atau edit aturan durasi lampu:

**Contoh Rule:**

- **Batas Kendaraan:** 20 unit
- **Durasi Hijau:** 45 detik
- **Durasi Kuning:** 5 detik
- **Durasi Merah:** 20 detik
- **Deskripsi:** Lalu lintas sedang

**Artinya:** Jika sensor mendeteksi > 20 kendaraan, maka lampu hijau akan menyala selama 45 detik.

### 4. **Pengaturan Lanjutan (Optional)**

- **Default Durations:** Durasi ketika tidak ada kendaraan
- **Cycle Time:** Waktu minimum dan maximum untuk satu siklus
- **Sensor Config:** Enable/disable sensor, interval update

### 5. **Simpan & Kirim ke ESP32**

Klik tombol **"Simpan & Kirim ke ESP32"**

Sistem akan:

1. ✅ Menyimpan konfigurasi ke Azure Cosmos DB
2. ✅ Mengirim konfigurasi ke ESP32 via Azure IoT Hub (MQTT)
3. ✅ Menampilkan status sync

---

## 📊 Data Structure

### Cosmos DB Document (type: "iot_config")

```json
{
  "id": "config_lane-north_1234567890",
  "type": "iot_config",
  "deviceId": "lane-north",
  "intersectionId": "intersection_001",
  "trafficLightConfig": {
    "rules": [
      {
        "vehicleThreshold": 10,
        "greenDuration": 30,
        "yellowDuration": 5,
        "redDuration": 25,
        "description": "Lalu lintas rendah"
      },
      {
        "vehicleThreshold": 20,
        "greenDuration": 45,
        "yellowDuration": 5,
        "redDuration": 20,
        "description": "Lalu lintas sedang"
      }
    ],
    "defaultGreenDuration": 30,
    "defaultYellowDuration": 5,
    "defaultRedDuration": 25,
    "minCycleTime": 60,
    "maxCycleTime": 120
  },
  "sensorConfig": {
    "enabled": true,
    "updateInterval": 5000,
    "vehicleCountReset": 60000
  },
  "mqttConfig": {
    "topic": "traffic/lane-north/config",
    "qos": 1
  },
  "status": "active",
  "lastSyncedAt": "2026-04-22T10:30:00.000Z",
  "createdAt": "2026-04-20T08:00:00.000Z",
  "updatedAt": "2026-04-22T10:30:00.000Z",
  "createdBy": "admin@example.com"
}
```

### Azure IoT Hub Device Twin (Desired Properties)

```json
{
  "trafficConfig": {
    "rules": [...],
    "defaults": {
      "green": 30,
      "yellow": 5,
      "red": 25
    },
    "cycleTime": {
      "min": 60,
      "max": 120
    },
    "sensor": {
      "enabled": true,
      "updateInterval": 5000,
      "vehicleCountReset": 60000
    }
  },
  "lastUpdated": "2026-04-22T10:30:00.000Z"
}
```

---

## 🔌 API Endpoints

### 1. **GET /api/iot/config**

Fetch all IoT configurations or filter by deviceId

**Query Parameters:**

- `deviceId` (optional): Filter by device ID

**Response:**

```json
{
  "success": true,
  "count": 1,
  "data": [...]
}
```

### 2. **POST /api/iot/config**

Create or update IoT configuration

**Request Body:**

```json
{
  "deviceId": "lane-north",
  "intersectionId": "intersection_001",
  "rules": [...],
  "defaultGreenDuration": 30,
  "sensorEnabled": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Configuration created successfully",
  "data": {...},
  "mqttSent": true,
  "mqttMessage": "Configuration sent to ESP32 via Azure IoT Hub"
}
```

### 3. **GET /api/iot/config/[deviceId]**

Get configuration for specific device

**Response:**

```json
{
  "success": true,
  "data": {...}
}
```

### 4. **PATCH /api/iot/config/[deviceId]**

Update configuration for specific device

**Request Body:**

```json
{
  "trafficLightConfig": {
    "rules": [...]
  },
  "sensorConfig": {
    "enabled": true
  }
}
```

---

## 🧪 Testing

### 1. **Test Backend API**

```bash
# Get all configs
curl http://localhost:3000/api/iot/config

# Get config for specific device
curl http://localhost:3000/api/iot/config/lane-north

# Create/Update config
curl -X POST http://localhost:3000/api/iot/config \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "lane-north",
    "rules": [
      {
        "vehicleThreshold": 15,
        "greenDuration": 40,
        "yellowDuration": 5,
        "redDuration": 20,
        "description": "Test rule"
      }
    ]
  }'
```

### 2. **Test ESP32**

1. Upload code ke ESP32
2. Buka Serial Monitor (115200 baud)
3. Pastikan ESP32 terhubung ke WiFi dan Azure IoT Hub
4. Update konfigurasi dari web dashboard
5. Lihat log di Serial Monitor:
   ```
   === Configuration Update Received ===
   Updating traffic rules:
     Rule 1: >15 vehicles -> Green=40s, Yellow=5s, Red=20s
   Configuration updated successfully!
   ```

### 3. **Test End-to-End**

1. Buka web dashboard → Remote IoT
2. Pilih device (lane-north)
3. Edit konfigurasi (ubah durasi lampu)
4. Klik "Simpan & Kirim ke ESP32"
5. Cek status sync (harus muncul "Terakhir sync ke ESP32")
6. Cek Serial Monitor ESP32 (harus menerima konfigurasi baru)
7. Lihat lampu traffic light berubah sesuai konfigurasi baru

---

## 🐛 Troubleshooting

### Problem: ESP32 tidak menerima konfigurasi

**Solution:**

1. Cek koneksi WiFi ESP32
2. Cek connection string di ESP32 code
3. Cek Azure IoT Hub status di Azure Portal
4. Pastikan device ID sesuai antara web dan ESP32

### Problem: MQTT tidak terkirim dari backend

**Solution:**

1. Cek environment variables di `.env.local`
2. Cek log backend API (console)
3. Pastikan library `azure-iot-device` terinstall
4. Cek Azure IoT Hub credentials

### Problem: Sensor tidak mendeteksi kendaraan

**Solution:**

1. Cek wiring HC-SR04 sensor
2. Cek pin configuration di ESP32 code
3. Test sensor dengan code sederhana
4. Pastikan sensor enabled di konfigurasi

---

## 📈 Future Enhancements

- [ ] Real-time telemetry dashboard (vehicle count, light status)
- [ ] Historical data analytics
- [ ] Multiple intersection coordination
- [ ] AI-based traffic prediction
- [ ] Mobile app for remote monitoring
- [ ] Alert notifications (device offline, sensor error)
- [ ] Bulk configuration update for multiple devices
- [ ] Configuration versioning and rollback

---

## 📚 References

- [Azure IoT Hub Documentation](https://docs.microsoft.com/azure/iot-hub/)
- [ESP32 Arduino Core](https://github.com/espressif/arduino-esp32)
- [Azure IoT Device SDK for C](https://github.com/Azure/azure-iot-sdk-c)
- [ArduinoJson Documentation](https://arduinojson.org/)

---

## 👥 Support

Jika ada pertanyaan atau masalah, silakan hubungi tim development atau buat issue di repository.

**Happy Coding! 🚀**
