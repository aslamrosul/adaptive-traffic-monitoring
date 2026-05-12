/*
 * ESP32 Multi-Lane Traffic Monitoring System
 * Updated with new logic:
 * - Debounce 2 detik untuk vehicle counting
 * - Density Level 0, 1, 2 (infrared + HC-SR04)
 * - Queue detection 10 detik
 * - Hitung kendaraan di semua warna lampu
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
void detectQueue(String lane, bool irDetected);

// ========== WIFI CONFIG ==========
const char* ssid = "Gozzy";
const char* password = "88888888";

// ========== IOT HUB CONFIG ==========
const char* mqtt_server = "traffic-iot-slam1.azure-devices.net";
const int mqtt_port = 8883;

// ========== DEVICE CONFIG ==========
const char* DEVICE_ID = "esp32-traffic-monitor";
const char* SAS_TOKEN = "SharedAccessSignature sr=traffic-iot-slam1.azure-devices.net%2Fdevices%2Fesp32-traffic-monitor&sig=%2F%2FUENjKzIQ4N1JzIjkqGW%2Fchfafzd0%2B18T5rTqDuFy4%3D&se=1778258902";
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
#define HCSR04_THRESHOLD_CM 50      // Jarak HC-SR04 untuk level 2

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
  Serial.println("New Logic:");
  Serial.println("- Debounce: 2 seconds");
  Serial.println("- Queue threshold: 10 seconds");
  Serial.println("- Density levels: 0, 1, 2");
  
  setupPins();
  connectWiFi();
  
  // Setup MQTT
  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setBufferSize(512);
  client.setKeepAlive(60);
  client.setSocketTimeout(15);
  client.setCallback(messageReceived);
  
  // Set default lights
  setTrafficLight("north", "red");
  setTrafficLight("south", "red");
  setTrafficLight("east", "green");
  
  Serial.println("✅ Setup complete!");
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
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
    
    // Detect queues
    detectQueue("north", northIR);
    detectQueue("south", southIR);
    detectQueue("east", eastIR);
    
    lastRead = millis();
  }
  
  // Send data setiap 15 detik
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 15000) {
    readAndSendData();
    lastSend = millis();
  }
  
  // Traffic light cycle setiap 30 detik
  static unsigned long lastCycle = 0;
  if (millis() - lastCycle > 30000) {
    cycleTrafficLights();
    lastCycle = millis();
  }
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
// Level 0: Tidak ada kendaraan
// Level 1: Infrared saja
// Level 2: Infrared + HC-SR04
int calculateDensityLevel(bool irDetected, int distance) {
  if (!irDetected) {
    return 0;  // Tidak ada kendaraan
  }
  
  if (irDetected && distance > 0 && distance < HCSR04_THRESHOLD_CM) {
    return 2;  // Infrared + HC-SR04 (padat)
  }
  
  if (irDetected) {
    return 1;  // Hanya infrared
  }
  
  return 0;
}

// Detect queue (IR HIGH selama 10 detik)
void detectQueue(String lane, bool irDetected) {
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
  
  if (irDetected) {
    if (*queueStartTime == 0) {
      *queueStartTime = millis();
    } else if (millis() - (*queueStartTime) > QUEUE_THRESHOLD_MS) {
      if (!(*queueDetected)) {
        *queueDetected = true;
        Serial.printf("🚦 %s: Queue detected!\n", lane.c_str());
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
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n✅ WiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
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
  
  // Read current ultrasonic values
  int northQueue = readUltrasonic(NORTH_TRIG_PIN, NORTH_ECHO_PIN);
  int southQueue = readUltrasonic(SOUTH_TRIG_PIN, SOUTH_ECHO_PIN);
  int eastQueue = readUltrasonic(EAST_TRIG_PIN, EAST_ECHO_PIN);
  
  // Create JSON payload
  JsonDocument doc;
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = String(millis());
  
  // North lane
  JsonObject north = doc["north"].to<JsonObject>();
  north["light"] = northLight;
  north["vehicleCount"] = northCount;
  north["densityLevel"] = northDensityLevel;
  north["queueDetected"] = northQueueDetected;
  north["queueLength"] = northQueue;
  
  // South lane
  JsonObject south = doc["south"].to<JsonObject>();
  south["light"] = southLight;
  south["vehicleCount"] = southCount;
  south["densityLevel"] = southDensityLevel;
  south["queueDetected"] = southQueueDetected;
  south["queueLength"] = southQueue;
  
  // East lane
  JsonObject east = doc["east"].to<JsonObject>();
  east["light"] = eastLight;
  east["vehicleCount"] = eastCount;
  east["densityLevel"] = eastDensityLevel;
  east["queueDetected"] = eastQueueDetected;
  east["queueLength"] = eastQueue;
  
  // West lane (dummy)
  JsonObject west = doc["west"].to<JsonObject>();
  west["light"] = "red";
  west["vehicleCount"] = 0;
  west["densityLevel"] = 0;
  west["queueDetected"] = false;
  west["queueLength"] = 0;
  
  String payload;
  serializeJson(doc, payload);
  
  if (client.publish(MQTT_TOPIC, payload.c_str())) {
    Serial.println("✅ Data sent!");
    Serial.println("📤 " + payload);
  } else {
    Serial.println("❌ Failed to send");
  }
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
  
  digitalWrite(redPin, LOW);
  digitalWrite(yellowPin, LOW);
  digitalWrite(greenPin, LOW);
  
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
  if (northLight == "green") {
    setTrafficLight("north", "yellow");
    delay(3000);
    setTrafficLight("north", "red");
    setTrafficLight("south", "green");
  } else if (southLight == "green") {
    setTrafficLight("south", "yellow");
    delay(3000);
    setTrafficLight("south", "red");
    setTrafficLight("east", "green");
  } else if (eastLight == "green") {
    setTrafficLight("east", "yellow");
    delay(3000);
    setTrafficLight("east", "red");
    setTrafficLight("north", "green");
  }
}

void messageReceived(char* topic, byte* payload, unsigned int length) {
  Serial.print("📥 Command received: ");
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);
  
  JsonDocument doc;
  deserializeJson(doc, message);
  
  String lane = doc["lane"];
  String command = doc["command"];
  String color = doc["color"];
  
  if (command == "change_light") {
    setTrafficLight(lane, color);
  }
}
