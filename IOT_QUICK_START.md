# 🚀 IoT Remote Configuration - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Access IoT Configuration Page

Open browser and navigate to:

```
http://localhost:3000/iot-config
```

Or click **"Remote IoT"** in the sidebar menu.

### 3. Select Device

Choose an ESP32 device from the list:

- lane-north
- lane-south
- lane-east
- lane-west

### 4. Configure Traffic Rules

**Example Configuration:**

| Vehicles | Green | Yellow | Red | Description    |
| -------- | ----- | ------ | --- | -------------- |
| > 10     | 30s   | 5s     | 25s | Low traffic    |
| > 20     | 45s   | 5s     | 20s | Medium traffic |
| > 30     | 60s   | 5s     | 15s | High traffic   |

### 5. Save Configuration

Click **"Simpan & Kirim ke ESP32"**

✅ Configuration saved to database  
✅ Sent to ESP32 via MQTT  
✅ Sync status updated

---

## 🔌 ESP32 Setup (Hardware)

### Required Components

- ESP32 Development Board
- 3x LED (Red, Yellow, Green)
- 3x 220Ω Resistor
- HC-SR04 Ultrasonic Sensor
- Breadboard & Jumper Wires

### Wiring Diagram

```
ESP32          Component
─────────────────────────
Pin 25    ──>  RED LED (+ resistor)
Pin 26    ──>  YELLOW LED (+ resistor)
Pin 27    ──>  GREEN LED (+ resistor)
Pin 5     ──>  HC-SR04 TRIG
Pin 18    ──>  HC-SR04 ECHO
GND       ──>  All GND
3.3V      ──>  HC-SR04 VCC
```

### Upload Firmware

1. Open `ESP32_TRAFFIC_LIGHT_CODE.ino` in Arduino IDE
2. Install required libraries:
   - AzureIoTHub
   - AzureIoTProtocol_MQTT
   - ArduinoJson
3. Edit WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
4. Edit connection string (from `.env.local`):
   ```cpp
   static const char* connectionString = "HostName=traffic-iot-slam.azure-devices.net;DeviceId=lane-north;SharedAccessKey=...";
   ```
5. Select board: **ESP32 Dev Module**
6. Select port: **COM3** (or your port)
7. Click **Upload**

### Verify Connection

Open Serial Monitor (115200 baud):

```
=== Smart Traffic Light ESP32 ===
Connecting to WiFi: YourWiFi
WiFi connected!
IP Address: 192.168.1.100
Connecting to Azure IoT Hub...
Connected to Azure IoT Hub!
Waiting for configuration from web dashboard...
```

---

## 🧪 Quick Test

### Test 1: Send Configuration

1. Open web dashboard → Remote IoT
2. Select device: **lane-north**
3. Edit rule: Change green duration to **40 seconds**
4. Click **Save**
5. Check Serial Monitor:
   ```
   === Configuration Update Received ===
   Updating traffic rules:
     Rule 1: >10 vehicles -> Green=40s, Yellow=5s, Red=25s
   Configuration updated successfully!
   ```

### Test 2: Verify Traffic Light

Watch the ESP32 LEDs:

- 🟢 GREEN lights up for configured duration
- 🟡 YELLOW lights up for 5 seconds
- 🔴 RED lights up for configured duration
- Cycle repeats

### Test 3: Test Vehicle Sensor

1. Place hand in front of HC-SR04 sensor (< 20cm)
2. Check Serial Monitor:
   ```
   Telemetry sent: vehicles=5
   Applying rule: Lalu lintas rendah (vehicles=5)
   GREEN for 30 seconds
   ```

---

## 📱 API Quick Reference

### Get All Configs

```bash
curl http://localhost:3000/api/iot/config
```

### Get Device Config

```bash
curl http://localhost:3000/api/iot/config/lane-north
```

### Create/Update Config

```bash
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

---

## 🔍 Troubleshooting

### Problem: ESP32 not connecting to WiFi

**Solution:** Check SSID and password in ESP32 code

### Problem: ESP32 not receiving config

**Solution:**

1. Check connection string matches device ID
2. Verify Azure IoT Hub is running
3. Check Serial Monitor for errors

### Problem: LEDs not lighting up

**Solution:**

1. Check wiring (correct pins?)
2. Check resistor values (220Ω)
3. Test LEDs with simple blink code

### Problem: Sensor not detecting vehicles

**Solution:**

1. Check HC-SR04 wiring (TRIG, ECHO, VCC, GND)
2. Test sensor with simple distance code
3. Adjust detection threshold in code

### Problem: Config not saving to database

**Solution:**

1. Check `.env.local` has correct Cosmos DB credentials
2. Check browser console for API errors
3. Verify Cosmos DB is accessible

---

## 📖 Full Documentation

For complete documentation, see:

- **IOT_REMOTE_CONFIG_GUIDE.md** - Complete guide
- **IOT_CONFIG_DIAGRAM.md** - Architecture diagrams
- **IOT_REMOTE_CONFIG_COMPLETE.md** - Implementation summary

---

## 🎯 Common Use Cases

### Use Case 1: Rush Hour Configuration

```
Rule: If vehicles > 30
  Green = 60 seconds (longer for heavy traffic)
  Yellow = 5 seconds
  Red = 15 seconds (shorter wait)
```

### Use Case 2: Night Time Configuration

```
Rule: If vehicles > 5
  Green = 20 seconds (shorter for light traffic)
  Yellow = 3 seconds
  Red = 15 seconds
```

### Use Case 3: Emergency Override

```
Rule: If vehicles > 50
  Green = 90 seconds (maximum green time)
  Yellow = 5 seconds
  Red = 10 seconds (minimum red time)
```

---

## ✅ Checklist

Before going live:

- [ ] ESP32 connected to WiFi
- [ ] ESP32 connected to Azure IoT Hub
- [ ] LEDs working correctly
- [ ] Sensor detecting vehicles
- [ ] Web dashboard accessible
- [ ] Configuration saving to database
- [ ] MQTT sending to ESP32
- [ ] Sync status showing correctly
- [ ] All devices tested

---

## 🆘 Need Help?

1. Check Serial Monitor for ESP32 errors
2. Check browser console for API errors
3. Review full documentation files
4. Contact development team

---

**Ready to go! 🚦**
