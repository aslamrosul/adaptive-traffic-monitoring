/*
 * ESP32 Traffic Monitoring Sensor
 * Sends data to Firebase via HTTPS
 * 
 * Hardware:
 * - ESP32 DevKit
 * - HC-SR04 Ultrasonic Sensor (or IR sensor)
 * - Optional: ESP32-CAM for image capture
 * 
 * Connections:
 * - Sensor VCC -> 5V
 * - Sensor GND -> GND
 * - Sensor TRIG -> GPIO 5
 * - Sensor ECHO -> GPIO 18
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// WiFi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Firebase Configuration
const char* firebaseHost = "https://YOUR_PROJECT_ID.firebaseio.com";
const char* firebaseFunctionUrl = "https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/addTrafficData";
const char* apiKey = "YOUR_FIREBASE_API_KEY";

// Device Configuration
const char* deviceId = "ESP32_001";
const char* intersectionId = "YOUR_INTERSECTION_ID"; // Get from Firestore

// Sensor Pins
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

// Timing
const unsigned long SEND_INTERVAL = 60000; // Send data every 1 minute
unsigned long lastSendTime = 0;

// Traffic counting
int vehicleCount = 0;
bool objectDetected = false;
unsigned long lastDetectionTime = 0;
const unsigned long DETECTION_COOLDOWN = 2000; // 2 seconds between detections

// NTP Server for time sync
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 25200; // GMT+7 (Indonesia)
const int daylightOffset_sec = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize sensor pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Connect to WiFi
  connectWiFi();
  
  // Initialize time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  
  Serial.println("ESP32 Traffic Sensor Ready!");
  Serial.println("Device ID: " + String(deviceId));
  Serial.println("Intersection ID: " + String(intersectionId));
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectWiFi();
  }
  
  // Detect vehicles
  detectVehicle();
  
  // Send data to Firebase every interval
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    sendDataToFirebase();
    lastSendTime = millis();
    vehicleCount = 0; // Reset counter
  }
  
  delay(100); // Small delay to prevent sensor noise
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Connection Failed!");
  }
}

void detectVehicle() {
  // Send ultrasonic pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  float distance = duration * 0.034 / 2; // Convert to cm
  
  // Detect vehicle if distance is between 10cm and 400cm
  if (distance > 10 && distance < 400) {
    if (!objectDetected && (millis() - lastDetectionTime > DETECTION_COOLDOWN)) {
      vehicleCount++;
      objectDetected = true;
      lastDetectionTime = millis();
      
      Serial.println("Vehicle detected! Count: " + String(vehicleCount));
      Serial.println("Distance: " + String(distance) + " cm");
    }
  } else {
    objectDetected = false;
  }
}

void sendDataToFirebase() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send data: WiFi not connected");
    return;
  }
  
  HTTPClient http;
  
  // Calculate congestion level
  String congestionLevel = calculateCongestionLevel(vehicleCount);
  
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["intersectionId"] = intersectionId;
  doc["deviceId"] = deviceId;
  doc["vehicleCount"] = vehicleCount;
  doc["congestionLevel"] = congestionLevel;
  doc["timestamp"] = getTimestamp();
  
  // Optional metadata
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["rssi"] = WiFi.RSSI();
  metadata["freeHeap"] = ESP.getFreeHeap();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send HTTP POST request
  http.begin(firebaseFunctionUrl);
  http.addHeader("Content-Type", "application/json");
  
  Serial.println("\n--- Sending Data to Firebase ---");
  Serial.println("Payload: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response Code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    
    if (httpResponseCode == 200) {
      Serial.println("✓ Data sent successfully!");
    }
  } else {
    Serial.println("✗ Error sending data");
    Serial.println("Error: " + String(httpResponseCode));
  }
  
  http.end();
  Serial.println("--------------------------------\n");
}

String calculateCongestionLevel(int count) {
  // Adjust thresholds based on your road conditions
  if (count < 5) return "low";
  else if (count < 15) return "medium";
  else if (count < 30) return "high";
  else return "critical";
}

String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return "";
  }
  
  char timestamp[30];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  return String(timestamp);
}

// Helper function to print memory usage
void printMemoryUsage() {
  Serial.println("Free Heap: " + String(ESP.getFreeHeap()) + " bytes");
}
