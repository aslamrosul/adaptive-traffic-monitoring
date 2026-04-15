# ESP32 Traffic Sensor Setup

## Hardware Requirements

### Basic Setup

- ESP32 DevKit (any variant)
- HC-SR04 Ultrasonic Sensor
- Jumper wires
- Breadboard
- USB cable for programming

### Advanced Setup (Optional)

- ESP32-CAM for image capture
- IR Sensor array for better accuracy
- Solar panel + battery for outdoor deployment

## Wiring Diagram

```
ESP32          HC-SR04
-----          -------
5V      --->   VCC
GND     --->   GND
GPIO 5  --->   TRIG
GPIO 18 --->   ECHO
```

## Software Requirements

1. **Arduino IDE** (1.8.19 or later)
2. **ESP32 Board Support**
   - Open Arduino IDE
   - Go to File → Preferences
   - Add to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools → Board → Boards Manager
   - Search "ESP32" and install

3. **Required Libraries**
   - ArduinoJson (by Benoit Blanchon)
   - HTTPClient (included with ESP32)
   - WiFi (included with ESP32)

   Install via: Sketch → Include Library → Manage Libraries

## Configuration

### Step 1: Update WiFi Credentials

Edit `traffic_sensor.ino`:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### Step 2: Update Firebase Configuration

Get these values from Firebase Console:

```cpp
const char* firebaseFunctionUrl = "https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/addTrafficData";
const char* apiKey = "YOUR_FIREBASE_API_KEY";
```

### Step 3: Set Device & Intersection ID

```cpp
const char* deviceId = "ESP32_001"; // Unique for each device
const char* intersectionId = "YOUR_INTERSECTION_ID"; // From Firestore
```

Get `intersectionId` from Firestore Console → intersections collection

## Upload to ESP32

1. Connect ESP32 to computer via USB
2. Open `traffic_sensor.ino` in Arduino IDE
3. Select board: Tools → Board → ESP32 Dev Module
4. Select port: Tools → Port → (your ESP32 port)
5. Click Upload button (→)
6. Wait for "Done uploading" message

## Testing

### Step 1: Open Serial Monitor

- Tools → Serial Monitor
- Set baud rate to 115200
- You should see:
  ```
  Connecting to WiFi...
  WiFi Connected!
  IP Address: 192.168.x.x
  ESP32 Traffic Sensor Ready!
  ```

### Step 2: Test Vehicle Detection

- Wave your hand in front of the sensor (10-400cm range)
- Serial monitor should show:
  ```
  Vehicle detected! Count: 1
  Distance: 25.5 cm
  ```

### Step 3: Test Firebase Connection

- Wait 1 minute (default send interval)
- Serial monitor should show:
  ```
  --- Sending Data to Firebase ---
  Payload: {"intersectionId":"...","vehicleCount":5,...}
  Response Code: 200
  ✓ Data sent successfully!
  ```

## Troubleshooting

### WiFi Connection Failed

- Check SSID and password
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Move closer to router

### Sensor Not Detecting

- Check wiring connections
- Verify sensor power (5V)
- Test sensor with multimeter
- Adjust detection thresholds in code

### Firebase Error 401 (Unauthorized)

- Check API key
- Verify Cloud Function URL
- Check Firestore security rules

### Firebase Error 404 (Not Found)

- Verify Cloud Function is deployed
- Check function URL is correct
- Ensure function name matches

### Data Not Appearing in Dashboard

- Check intersectionId matches Firestore
- Verify deviceId is unique
- Check Firestore security rules allow writes

## Calibration

### Adjust Detection Distance

Edit in `detectVehicle()`:

```cpp
// Current: 10cm to 400cm
if (distance > 10 && distance < 400) {

// For closer detection (e.g., narrow road):
if (distance > 5 && distance < 200) {
```

### Adjust Congestion Thresholds

Edit in `calculateCongestionLevel()`:

```cpp
// Current thresholds (per minute)
if (count < 5) return "low";        // < 5 vehicles
else if (count < 15) return "medium"; // 5-14 vehicles
else if (count < 30) return "high";   // 15-29 vehicles
else return "critical";               // 30+ vehicles

// Adjust based on your road capacity
```

### Change Send Interval

Edit at top of file:

```cpp
const unsigned long SEND_INTERVAL = 60000; // 60 seconds

// For more frequent updates:
const unsigned long SEND_INTERVAL = 30000; // 30 seconds

// For less frequent (save bandwidth):
const unsigned long SEND_INTERVAL = 300000; // 5 minutes
```

## Power Consumption

### USB Powered

- Voltage: 5V
- Current: ~200mA (WiFi active)
- Power: ~1W

### Battery Powered (Optional)

- Use 3.7V LiPo battery (2000mAh+)
- Add deep sleep mode for longer battery life
- Solar panel recommended for outdoor deployment

## Deployment Tips

1. **Weatherproofing**
   - Use IP65 enclosure
   - Seal cable entries
   - Add desiccant packets

2. **Mounting**
   - Mount 2-3 meters above road
   - Angle sensor downward 30-45°
   - Secure against vibration

3. **Multiple Lanes**
   - Use one sensor per lane
   - Or use wider beam sensor
   - Adjust detection logic accordingly

4. **Maintenance**
   - Check sensor cleanliness monthly
   - Monitor battery voltage
   - Update firmware remotely (OTA)

## Next Steps

- [ ] Deploy Cloud Function (see `FIREBASE_FUNCTIONS.md`)
- [ ] Test end-to-end data flow
- [ ] Add multiple sensors for accuracy
- [ ] Implement OTA updates
- [ ] Add camera module for verification

## Support

Check Firebase Console logs if data not appearing:

- Functions → Logs
- Firestore → Data

Need help? Check the main README or documentation!
