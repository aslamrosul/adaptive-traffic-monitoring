/*
 * Smart Traffic Light - ESP32 with Azure IoT Hub Integration
 * 
 * Fitur:
 * - Koneksi ke Azure IoT Hub via MQTT
 * - Menerima konfigurasi remote dari web dashboard
 * - Mengatur durasi lampu berdasarkan jumlah kendaraan
 * - Sensor kendaraan (ultrasonic/IR)
 * - LED traffic light control
 * 
 * Library yang dibutuhkan:
 * - WiFi (built-in ESP32)
 * - AzureIoTHub (install via Library Manager)
 * - AzureIoTProtocol_MQTT (install via Library Manager)
 * - ArduinoJson (install via Library Manager)
 */

#include <WiFi.h>
#include <AzureIoTHub.h>
#include <AzureIoTProtocol_MQTT.h>
#include <ArduinoJson.h>

// ===== KONFIGURASI WIFI =====
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ===== KONFIGURASI AZURE IOT HUB =====
// Ganti dengan connection string dari .env.local
// Format: HostName=xxx.azure-devices.net;DeviceId=xxx;SharedAccessKey=xxx
static const char* connectionString = "HostName=traffic-iot-slam.azure-devices.net;DeviceId=lane-north;SharedAccessKey=AV/tmspOryhQLGSufivVq275yYM/TWDGZCn+vicZ6Xo=";

// ===== PIN KONFIGURASI =====
// Traffic Light LEDs
const int RED_LED = 25;
const int YELLOW_LED = 26;
const int GREEN_LED = 27;

// Vehicle Sensor (Ultrasonic HC-SR04)
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

// ===== VARIABEL GLOBAL =====
IOTHUB_CLIENT_LL_HANDLE iotHubClientHandle;

// Traffic light configuration (akan diupdate dari web)
struct TrafficRule {
  int vehicleThreshold;
  int greenDuration;
  int yellowDuration;
  int redDuration;
  String description;
};

// Default configuration
TrafficRule rules[5];
int ruleCount = 3;
int defaultGreenDuration = 30;
int defaultYellowDuration = 5;
int defaultRedDuration = 25;
bool sensorEnabled = true;
int updateInterval = 5000;

// Runtime variables
int vehicleCount = 0;
unsigned long lastSensorRead = 0;
unsigned long lastConfigCheck = 0;
const unsigned long CONFIG_CHECK_INTERVAL = 60000; // Check config every 60 seconds

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Smart Traffic Light ESP32 ===");
  
  // Setup pins
  pinMode(RED_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Turn off all LEDs
  digitalWrite(RED_LED, LOW);
  digitalWrite(YELLOW_LED, LOW);
  digitalWrite(GREEN_LED, LOW);
  
  // Initialize default rules
  initializeDefaultRules();
  
  // Connect to WiFi
  connectWiFi();
  
  // Connect to Azure IoT Hub
  connectAzureIoTHub();
  
  Serial.println("Setup complete!");
}

// ===== MAIN LOOP =====
void loop() {
  // Process IoT Hub messages
  IoTHubClient_LL_DoWork(iotHubClientHandle);
  
  // Read vehicle sensor
  if (sensorEnabled && millis() - lastSensorRead >= updateInterval) {
    vehicleCount = readVehicleSensor();
    lastSensorRead = millis();
    
    // Send telemetry to Azure IoT Hub
    sendTelemetry(vehicleCount);
  }
  
  // Run traffic light cycle based on vehicle count
  runTrafficLightCycle(vehicleCount);
  
  delay(100);
}

// ===== WIFI CONNECTION =====
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

// ===== AZURE IOT HUB CONNECTION =====
void connectAzureIoTHub() {
  Serial.println("Connecting to Azure IoT Hub...");
  
  // Initialize IoT Hub client
  iotHubClientHandle = IoTHubClient_LL_CreateFromConnectionString(connectionString, MQTT_Protocol);
  
  if (iotHubClientHandle == NULL) {
    Serial.println("ERROR: Failed to create IoT Hub client!");
    return;
  }
  
  // Set device twin callback to receive configuration updates
  IoTHubClient_LL_SetDeviceTwinCallback(iotHubClientHandle, deviceTwinCallback, NULL);
  
  Serial.println("Connected to Azure IoT Hub!");
  Serial.println("Waiting for configuration from web dashboard...");
}

// ===== DEVICE TWIN CALLBACK (Receive Configuration) =====
static void deviceTwinCallback(DEVICE_TWIN_UPDATE_STATE updateState, const unsigned char* payLoad, size_t size, void* userContextCallback) {
  Serial.println("\n=== Configuration Update Received ===");
  
  // Parse JSON payload
  DynamicJsonDocument doc(2048);
  DeserializationError error = deserializeJson(doc, payLoad, size);
  
  if (error) {
    Serial.print("JSON parsing failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Extract traffic configuration
  if (doc.containsKey("trafficConfig")) {
    JsonObject config = doc["trafficConfig"];
    
    // Update rules
    if (config.containsKey("rules")) {
      JsonArray rulesArray = config["rules"];
      ruleCount = min((int)rulesArray.size(), 5);
      
      Serial.println("Updating traffic rules:");
      for (int i = 0; i < ruleCount; i++) {
        JsonObject rule = rulesArray[i];
        rules[i].vehicleThreshold = rule["vehicleThreshold"];
        rules[i].greenDuration = rule["greenDuration"];
        rules[i].yellowDuration = rule["yellowDuration"];
        rules[i].redDuration = rule["redDuration"];
        rules[i].description = rule["description"].as<String>();
        
        Serial.printf("  Rule %d: >%d vehicles -> Green=%ds, Yellow=%ds, Red=%ds\n",
          i + 1,
          rules[i].vehicleThreshold,
          rules[i].greenDuration,
          rules[i].yellowDuration,
          rules[i].redDuration
        );
      }
    }
    
    // Update defaults
    if (config.containsKey("defaults")) {
      JsonObject defaults = config["defaults"];
      defaultGreenDuration = defaults["green"];
      defaultYellowDuration = defaults["yellow"];
      defaultRedDuration = defaults["red"];
      
      Serial.printf("Default durations: Green=%ds, Yellow=%ds, Red=%ds\n",
        defaultGreenDuration, defaultYellowDuration, defaultRedDuration);
    }
    
    // Update sensor config
    if (config.containsKey("sensor")) {
      JsonObject sensor = config["sensor"];
      sensorEnabled = sensor["enabled"];
      updateInterval = sensor["updateInterval"];
      
      Serial.printf("Sensor: %s, Update interval: %dms\n",
        sensorEnabled ? "Enabled" : "Disabled", updateInterval);
    }
    
    Serial.println("Configuration updated successfully!");
    Serial.println("=====================================\n");
  }
}

// ===== INITIALIZE DEFAULT RULES =====
void initializeDefaultRules() {
  // Rule 1: Low traffic
  rules[0].vehicleThreshold = 10;
  rules[0].greenDuration = 30;
  rules[0].yellowDuration = 5;
  rules[0].redDuration = 25;
  rules[0].description = "Lalu lintas rendah";
  
  // Rule 2: Medium traffic
  rules[1].vehicleThreshold = 20;
  rules[1].greenDuration = 45;
  rules[1].yellowDuration = 5;
  rules[1].redDuration = 20;
  rules[1].description = "Lalu lintas sedang";
  
  // Rule 3: High traffic
  rules[2].vehicleThreshold = 30;
  rules[2].greenDuration = 60;
  rules[2].yellowDuration = 5;
  rules[2].redDuration = 15;
  rules[2].description = "Lalu lintas tinggi";
}

// ===== READ VEHICLE SENSOR =====
int readVehicleSensor() {
  // Trigger ultrasonic sensor
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo
  long duration = pulseIn(ECHO_PIN, HIGH);
  int distance = duration * 0.034 / 2; // Convert to cm
  
  // Count vehicle if distance < 200cm (vehicle detected)
  static int count = 0;
  if (distance > 0 && distance < 200) {
    count++;
  }
  
  // Reset count every minute
  static unsigned long lastReset = 0;
  if (millis() - lastReset >= 60000) {
    int currentCount = count;
    count = 0;
    lastReset = millis();
    return currentCount;
  }
  
  return count;
}

// ===== RUN TRAFFIC LIGHT CYCLE =====
void runTrafficLightCycle(int vehicles) {
  // Find matching rule based on vehicle count
  int greenDuration = defaultGreenDuration;
  int yellowDuration = defaultYellowDuration;
  int redDuration = defaultRedDuration;
  
  for (int i = ruleCount - 1; i >= 0; i--) {
    if (vehicles > rules[i].vehicleThreshold) {
      greenDuration = rules[i].greenDuration;
      yellowDuration = rules[i].yellowDuration;
      redDuration = rules[i].redDuration;
      
      Serial.printf("Applying rule: %s (vehicles=%d)\n", 
        rules[i].description.c_str(), vehicles);
      break;
    }
  }
  
  // GREEN LIGHT
  Serial.printf("GREEN for %d seconds\n", greenDuration);
  digitalWrite(GREEN_LED, HIGH);
  digitalWrite(YELLOW_LED, LOW);
  digitalWrite(RED_LED, LOW);
  delay(greenDuration * 1000);
  
  // YELLOW LIGHT
  Serial.printf("YELLOW for %d seconds\n", yellowDuration);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(YELLOW_LED, HIGH);
  digitalWrite(RED_LED, LOW);
  delay(yellowDuration * 1000);
  
  // RED LIGHT
  Serial.printf("RED for %d seconds\n", redDuration);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(YELLOW_LED, LOW);
  digitalWrite(RED_LED, HIGH);
  delay(redDuration * 1000);
}

// ===== SEND TELEMETRY TO AZURE IOT HUB =====
void sendTelemetry(int vehicles) {
  // Create JSON telemetry message
  DynamicJsonDocument doc(256);
  doc["deviceId"] = "lane-north"; // Sesuaikan dengan device ID
  doc["timestamp"] = millis();
  doc["vehicleCount"] = vehicles;
  doc["status"] = "active";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send message to IoT Hub
  IOTHUB_MESSAGE_HANDLE messageHandle = IoTHubMessage_CreateFromString(jsonString.c_str());
  
  if (messageHandle != NULL) {
    IoTHubClient_LL_SendEventAsync(iotHubClientHandle, messageHandle, NULL, NULL);
    IoTHubMessage_Destroy(messageHandle);
    
    Serial.printf("Telemetry sent: vehicles=%d\n", vehicles);
  }
}
