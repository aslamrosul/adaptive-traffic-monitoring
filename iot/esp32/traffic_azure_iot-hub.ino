/*
 * ESP32 Multi-Lane Traffic Monitoring System
 * 
 * KONSEP SENSOR:
 * - Infrared: Deteksi kendaraan lewat (untuk counting)
 * - Ultrasonic (HC-SR04): Deteksi kendaraan sangat dekat (< 5cm) untuk density level
 * - Fungsi Infrared & Ultrasonic SAMA, cuma beda jenis sensor
 * 
 * DENSITY LEVEL & QUEUE LENGTH:
 * - Level 0: Tidak ada kendaraan → Queue Length = 0 meter (lancar, pakai waktu hijau default)
 * - Level 1: Infrared deteksi kendaraan → Queue Length = 15 meter (antrian sedang)
 * - Level 2: Infrared + Ultrasonic < 5cm → Queue Length = 30 meter (antrian padat)
 * 
 * QUEUE DETECTION:
 * - Kendaraan ada di depan sensor (IR atau Ultrasonic < 5cm) selama 10 detik
 * - Kalau queue detected, queue length bertambah (level 1: 20m, level 2: 40m)
 * 
 * VEHICLE COUNTING:
 * - Hitung kendaraan di semua warna lampu (merah, kuning, hijau)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// Prototype Fungsi
void setupPins();
void connectWiFi();
void reconnectMQTT();
void readAndSendData();
void cycleTrafficLights();
void setTrafficLight(String lane, String color);
int readUltrasonic(int trigPin, int echoPin);
void messageReceived(char* topic, byte* payload, unsigned int length);
void countVehicle(String lane, bool irDetected);
int calculateDensityLevel(bool irDetected, int distance);
void detectQueue(String lane, bool irDetected, int queueLength);

// ========== WIFI CONFIG ==========
const char* ssid = "Gozzy";
const char* password = "88888888";

// ========== IOT HUB CONFIG ==========
const char* mqtt_server = "traffic-iot-slam1.azure-devices.net";
const int mqtt_port = 8883;

// ========== DEVICE CONFIG ==========
const char* DEVICE_ID = "esp32-traffic-monitor";
const char* SAS_TOKEN = "SharedAccessSignature sr=traffic-iot-slam1.azure-devices.net%2Fdevices%2Fesp32-traffic-monitor&sig=NJ8p5ILc0IYuatAeBbHPpu1ZKZ68HomKwmmUYEKdE5o%3D&se=1778661880";
const char* MQTT_USERNAME = "traffic-iot-slam1.azure-devices.net/esp32-traffic-monitor/?api-version=2021-04-12";
const char* MQTT_TOPIC = "devices/esp32-traffic-monitor/messages/events/";

// ========== PIN DEFINITIONS ==========
// Traffic Lights
#define NORTH_RED_PIN 15
#define NORTH_YELLOW_PIN 22
#define NORTH_GREEN_PIN 23

#define SOUTH_RED_PIN 16
#define SOUTH_YELLOW_PIN 17
#define SOUTH_GREEN_PIN 5

#define EAST_RED_PIN 18
#define EAST_YELLOW_PIN 19
#define EAST_GREEN_PIN 21

// Infrared Sensors (untuk counting)
#define NORTH_IR_PIN 34
#define SOUTH_IR_PIN 36
#define EAST_IR_PIN 39

// Ultrasonic Sensors (untuk density level)
#define NORTH_TRIG_PIN 25
#define NORTH_ECHO_PIN 26

#define SOUTH_TRIG_PIN 27
#define SOUTH_ECHO_PIN 14

#define EAST_TRIG_PIN 12
#define EAST_ECHO_PIN 13

// ========== THRESHOLDS ==========
#define VEHICLE_DEBOUNCE_MS 2000    // 2 detik debounce untuk counting
#define QUEUE_THRESHOLD_MS 10000    // 10 detik untuk queue detection
#define ULTRASONIC_THRESHOLD_CM 5   // Jarak ultrasonic untuk density level 2 (padat)

WiFiClientSecure espClient;
PubSubClient client(espClient);

// Traffic light states
String northLight = "red";
String southLight = "red";
String eastLight = "red";

// Vehicle counts
int northCount = 0;
int southCount = 0;
int eastCount = 0;

// Debounce tracking
unsigned long lastNorthVehicleTime = 0;
unsigned long lastSouthVehicleTime = 0;
unsigned long lastEastVehicleTime = 0;
bool lastNorthIR = false;
bool lastSouthIR = false;
bool lastEastIR = false;

// Queue detection tracking
unsigned long northQueueStartTime = 0;
unsigned long southQueueStartTime = 0;
unsigned long eastQueueStartTime = 0;
bool northQueueDetected = false;
bool southQueueDetected = false;
bool eastQueueDetected = false;

// Density levels
int northDensityLevel = 0;
int southDensityLevel = 0;
int eastDensityLevel = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== ESP32 Traffic Monitoring System ===");
  Serial.println("Device: esp32-traffic-monitor");
  Serial.println("\nKONSEP:");
  Serial.println("- Infrared & Ultrasonic: fungsi sama, deteksi kendaraan");
  Serial.println("- Density Level 0: Lancar (queue = 0m)");
  Serial.println("- Density Level 1: Sedang (queue = 15m)");
  Serial.println("- Density Level 2: Padat (queue = 30m)");
  Serial.println("- Queue detected: kendaraan di sensor selama 10 detik");
  Serial.println("- Debounce: 2 detik untuk counting");
  Serial.println("");
  
  setupPins();
  connectWiFi();
  
  // Setup MQTT
  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setBufferSize(512);
  client.setKeepAlive(60);
  client.setSocketTimeout(15);
  client.setCallback(messageReceived);
  
  // Set initial lights - East starts with green
  setTrafficLight("north", "red");
  setTrafficLight("south", "red");
  setTrafficLight("east", "green");
  
  Serial.println("✅ Setup complete!");
  Serial.println("Initial state: North=RED, South=RED, East=GREEN");
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  // Feed watchdog regularly
  yield();
  
  // Read sensors setiap 100ms untuk responsiveness
  static unsigned long lastRead = 0;
  if (millis() - lastRead > 100) {
    // Read IR sensors
    bool northIR = (digitalRead(NORTH_IR_PIN) == LOW);
    bool southIR = (digitalRead(SOUTH_IR_PIN) == LOW);
    bool eastIR = (digitalRead(EAST_IR_PIN) == LOW);
    
    // Count vehicles dengan debounce
    countVehicle("north", northIR);
    countVehicle("south", southIR);
    countVehicle("east", eastIR);
    
    // Read ultrasonic untuk density level
    int northDistance = readUltrasonic(NORTH_TRIG_PIN, NORTH_ECHO_PIN);
    int southDistance = readUltrasonic(SOUTH_TRIG_PIN, SOUTH_ECHO_PIN);
    int eastDistance = readUltrasonic(EAST_TRIG_PIN, EAST_ECHO_PIN);
    
    // Calculate density levels
    northDensityLevel = calculateDensityLevel(northIR, northDistance);
    southDensityLevel = calculateDensityLevel(southIR, southDistance);
    eastDensityLevel = calculateDensityLevel(eastIR, eastDistance);
    
    // Detect queues (pass distance for better detection)
    detectQueue("north", northIR, northDistance);
    detectQueue("south", southIR, southDistance);
    detectQueue("east", eastIR, eastDistance);
    
    lastRead = millis();
    yield();  // Feed watchdog
  }
  
  // Send data setiap 15 detik
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 15000) {
    readAndSendData();
    lastSend = millis();
  }
  
  // Traffic light cycle - check every 100ms (untuk smooth transition)
  static unsigned long lastCycleCheck = 0;
  if (millis() - lastCycleCheck > 100) {
    cycleTrafficLights();
    lastCycleCheck = millis();
  }
  
  // Small delay to prevent tight loop
  delay(10);
}

// Count vehicle dengan debounce
void countVehicle(String lane, bool irDetected) {
  unsigned long currentTime = millis();
  unsigned long* lastTime;
  bool* lastState;
  int* count;
  
  if (lane == "north") {
    lastTime = &lastNorthVehicleTime;
    lastState = &lastNorthIR;
    count = &northCount;
  } else if (lane == "south") {
    lastTime = &lastSouthVehicleTime;
    lastState = &lastSouthIR;
    count = &southCount;
  } else if (lane == "east") {
    lastTime = &lastEastVehicleTime;
    lastState = &lastEastIR;
    count = &eastCount;
  } else {
    return;
  }
  
  // Deteksi perubahan dari false ke true (kendaraan baru)
  if (irDetected && !(*lastState)) {
    // Cek debounce time
    if (currentTime - (*lastTime) > VEHICLE_DEBOUNCE_MS) {
      (*count)++;
      *lastTime = currentTime;
      Serial.printf("🚗 %s: Vehicle counted! Total: %d\n", lane.c_str(), *count);
    }
  }
  
  *lastState = irDetected;
}

// Calculate density level
// Level 0: Tidak ada kendaraan (lancar) - queue length = 0m
// Level 1: Infrared saja (sedang) - queue length = 15m
// Level 2: Infrared + Ultrasonic dalam 5cm (padat) - queue length = 30m
int calculateDensityLevel(bool irDetected, int distance) {
  if (!irDetected) {
    return 0;  // Tidak ada kendaraan (lancar)
  }
  
  // Check if ultrasonic detects vehicle within 5cm (very close = padat)
  if (irDetected && distance > 0 && distance <= 5) {
    return 2;  // Infrared + Ultrasonic (padat)
  }
  
  if (irDetected) {
    return 1;  // Hanya infrared (sedang)
  }
  
  return 0;
}

// Calculate queue length based on density level (in meters)
// Queue length = panjang antrian dalam meter
int calculateQueueLength(int densityLevel, bool queueDetected) {
  if (densityLevel == 0) {
    return 0;  // Lancar, tidak ada antrian (0 meter)
  }
  
  if (densityLevel == 1) {
    // Sedang: antrian 15 meter (sekitar 3-5 kendaraan)
    return queueDetected ? 20 : 15;
  }
  
  if (densityLevel == 2) {
    // Padat: antrian 30 meter (sekitar 6-10 kendaraan)
    return queueDetected ? 40 : 30;
  }
  
  return 0;
}

// Detect queue (kendaraan di depan sensor selama 10 detik)
// Ultrasonic/Infrared mendeteksi kendaraan dalam jarak dekat (5cm) selama 10 detik
void detectQueue(String lane, bool irDetected, int ultrasonicDistance) {
  unsigned long* queueStartTime;
  bool* queueDetected;
  
  if (lane == "north") {
    queueStartTime = &northQueueStartTime;
    queueDetected = &northQueueDetected;
  } else if (lane == "south") {
    queueStartTime = &southQueueStartTime;
    queueDetected = &southQueueDetected;
  } else if (lane == "east") {
    queueStartTime = &eastQueueStartTime;
    queueDetected = &eastQueueDetected;
  } else {
    return;
  }
  
  // Queue detected if: kendaraan ada di depan sensor (IR atau Ultrasonic < 5cm) selama 10 detik
  bool vehicleNearby = irDetected || (ultrasonicDistance > 0 && ultrasonicDistance <= 5);
  
  if (vehicleNearby) {
    if (*queueStartTime == 0) {
      *queueStartTime = millis();
    } else if (millis() - (*queueStartTime) > QUEUE_THRESHOLD_MS) {
      if (!(*queueDetected)) {
        *queueDetected = true;
        Serial.printf("🚦 %s: Queue detected! (vehicle nearby for 10s)\n", lane.c_str());
      }
    }
  } else {
    *queueStartTime = 0;
    *queueDetected = false;
  }
}

void setupPins() {
  // Traffic lights
  pinMode(NORTH_RED_PIN, OUTPUT);
  pinMode(NORTH_YELLOW_PIN, OUTPUT);
  pinMode(NORTH_GREEN_PIN, OUTPUT);
  
  pinMode(SOUTH_RED_PIN, OUTPUT);
  pinMode(SOUTH_YELLOW_PIN, OUTPUT);
  pinMode(SOUTH_GREEN_PIN, OUTPUT);
  
  pinMode(EAST_RED_PIN, OUTPUT);
  pinMode(EAST_YELLOW_PIN, OUTPUT);
  pinMode(EAST_GREEN_PIN, OUTPUT);
  
  // Infrared sensors
  pinMode(NORTH_IR_PIN, INPUT);
  pinMode(SOUTH_IR_PIN, INPUT);
  pinMode(EAST_IR_PIN, INPUT);
  
  // Ultrasonic sensors
  pinMode(NORTH_TRIG_PIN, OUTPUT);
  pinMode(NORTH_ECHO_PIN, INPUT);
  pinMode(SOUTH_TRIG_PIN, OUTPUT);
  pinMode(SOUTH_ECHO_PIN, INPUT);
  pinMode(EAST_TRIG_PIN, OUTPUT);
  pinMode(EAST_ECHO_PIN, INPUT);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  int maxAttempts = 20;  // 10 seconds timeout
  
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    Serial.println("Possible issues:");
    Serial.println("- Wrong SSID/Password");
    Serial.println("- WiFi is 5GHz (ESP32 only supports 2.4GHz)");
    Serial.println("- Signal too weak");
    Serial.println("- Router not responding");
    Serial.println("\nRetrying in 5 seconds...");
    delay(5000);
    ESP.restart();  // Restart ESP32 to try again
  }
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to IoT Hub MQTT...");
    
    if (client.connect(DEVICE_ID, MQTT_USERNAME, SAS_TOKEN)) {
      Serial.println(" ✅ connected!");
      
      // Subscribe to commands
      String commandTopic = "devices/" + String(DEVICE_ID) + "/messages/devicebound/#";
      client.subscribe(commandTopic.c_str());
      Serial.println("📡 Subscribed to commands");
    } else {
      Serial.print(" ❌ failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void readAndSendData() {
  Serial.println("\n📊 Sending telemetry...");
  
  // Calculate queue lengths based on density levels (in meters)
  int northQueue = calculateQueueLength(northDensityLevel, northQueueDetected);
  int southQueue = calculateQueueLength(southDensityLevel, southQueueDetected);
  int eastQueue = calculateQueueLength(eastDensityLevel, eastQueueDetected);
  
  // Create JSON payload with fixed size (IMPORTANT!)
  StaticJsonDocument<512> doc;  // Fixed size to prevent overflow
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = String(millis());
  
  // North lane
  JsonObject north = doc.createNestedObject("north");
  north["light"] = northLight;
  north["vehicleCount"] = northCount;
  north["densityLevel"] = northDensityLevel;
  north["queueDetected"] = northQueueDetected;
  north["queueLength"] = northQueue;  // in meters
  
  // South lane
  JsonObject south = doc.createNestedObject("south");
  south["light"] = southLight;
  south["vehicleCount"] = southCount;
  south["densityLevel"] = southDensityLevel;
  south["queueDetected"] = southQueueDetected;
  south["queueLength"] = southQueue;  // in meters
  
  // East lane
  JsonObject east = doc.createNestedObject("east");
  east["light"] = eastLight;
  east["vehicleCount"] = eastCount;
  east["densityLevel"] = eastDensityLevel;
  east["queueDetected"] = eastQueueDetected;
  east["queueLength"] = eastQueue;  // in meters
  
  // West lane (dummy)
  JsonObject west = doc.createNestedObject("west");
  west["light"] = "red";
  west["vehicleCount"] = 0;
  west["densityLevel"] = 0;
  west["queueDetected"] = false;
  west["queueLength"] = 0;
  
  char payload[512];  // Fixed buffer
  serializeJson(doc, payload);
  
  if (client.publish(MQTT_TOPIC, payload)) {
    Serial.println("✅ Data sent!");
    Serial.print("📤 ");
    Serial.println(payload);
    
    // Print summary
    Serial.printf("North: Level=%d, Queue=%dm, Count=%d\n", northDensityLevel, northQueue, northCount);
    Serial.printf("South: Level=%d, Queue=%dm, Count=%d\n", southDensityLevel, southQueue, southCount);
    Serial.printf("East: Level=%d, Queue=%dm, Count=%d\n", eastDensityLevel, eastQueue, eastCount);
  } else {
    Serial.println("❌ Failed to send");
  }
  
  // Clear doc to free memory
  doc.clear();
  
  // Feed watchdog
  yield();
}

int readUltrasonic(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH, 30000);
  int distance = duration * 0.034 / 2;
  
  return (distance > 0 && distance < 400) ? distance : 0;
}

void setTrafficLight(String lane, String color) {
  int redPin, yellowPin, greenPin;
  
  if (lane == "north") {
    redPin = NORTH_RED_PIN;
    yellowPin = NORTH_YELLOW_PIN;
    greenPin = NORTH_GREEN_PIN;
    northLight = color;
  } else if (lane == "south") {
    redPin = SOUTH_RED_PIN;
    yellowPin = SOUTH_YELLOW_PIN;
    greenPin = SOUTH_GREEN_PIN;
    southLight = color;
  } else if (lane == "east") {
    redPin = EAST_RED_PIN;
    yellowPin = EAST_YELLOW_PIN;
    greenPin = EAST_GREEN_PIN;
    eastLight = color;
  } else {
    return;
  }
  
  // Turn off all lights for this lane first
  digitalWrite(redPin, LOW);
  digitalWrite(yellowPin, LOW);
  digitalWrite(greenPin, LOW);
  
  // Then turn on the requested color
  if (color == "red") {
    digitalWrite(redPin, HIGH);
  } else if (color == "yellow") {
    digitalWrite(yellowPin, HIGH);
  } else if (color == "green") {
    digitalWrite(greenPin, HIGH);
  }
  
  Serial.println("🚦 " + lane + " light: " + color);
}

void cycleTrafficLights() {
  // Non-blocking traffic light cycle
  static unsigned long yellowStartTime = 0;
  static unsigned long greenStartTime = 0;
  static bool inYellowPhase = false;
  static bool cycleInitialized = false;
  
  // Initialize green phase timer on first run
  if (!cycleInitialized) {
    greenStartTime = millis();
    cycleInitialized = true;
    Serial.println("🚦 Traffic light cycle initialized");
    return;  // Skip first cycle to let green timer start
  }
  
  if (inYellowPhase) {
    // Check if yellow phase is done (3 seconds)
    if (millis() - yellowStartTime > 3000) {
      inYellowPhase = false;
      
      // Complete the transition - SET RED FIRST, then GREEN
      // This ensures only 1 green at a time!
      if (northLight == "yellow") {
        setTrafficLight("north", "red");    // Set red FIRST
        delay(100);                          // Small delay to ensure red is set
        setTrafficLight("south", "green");  // Then set green
        greenStartTime = millis();
      } else if (southLight == "yellow") {
        setTrafficLight("south", "red");    // Set red FIRST
        delay(100);                          // Small delay
        setTrafficLight("east", "green");   // Then set green
        greenStartTime = millis();
      } else if (eastLight == "yellow") {
        setTrafficLight("east", "red");     // Set red FIRST
        delay(100);                          // Small delay
        setTrafficLight("north", "green");  // Then set green
        greenStartTime = millis();
      }
    }
    return;  // Still in yellow phase
  }
  
  // Check if green phase is done (30 seconds)
  if (millis() - greenStartTime < 30000) {
    return;  // Still in green phase
  }
  
  // Start yellow phase after 30 seconds of green
  if (northLight == "green") {
    setTrafficLight("north", "yellow");
    yellowStartTime = millis();
    inYellowPhase = true;
  } else if (southLight == "green") {
    setTrafficLight("south", "yellow");
    yellowStartTime = millis();
    inYellowPhase = true;
  } else if (eastLight == "green") {
    setTrafficLight("east", "yellow");
    yellowStartTime = millis();
    inYellowPhase = true;
  }
}

void messageReceived(char* topic, byte* payload, unsigned int length) {
  Serial.print("📥 Command received: ");
  
  // Use fixed buffer instead of String
  char message[256];
  if (length > 255) length = 255;  // Prevent overflow
  memcpy(message, payload, length);
  message[length] = '\0';
  
  Serial.println(message);
  
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.print("❌ JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }
  
  const char* lane = doc["lane"];
  const char* command = doc["command"];
  const char* color = doc["color"];
  
  if (strcmp(command, "change_light") == 0) {
    setTrafficLight(String(lane), String(color));
  }
  
  // Feed watchdog
  yield();
}
