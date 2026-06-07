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

// ========== WIFI CONFIG ==========
const char* ssid = "Gozzy";
const char* password = "88888888";

// ========== IOT HUB CONFIG ==========
const char* mqtt_server = "traffic-iot-slam1.azure-devices.net";
const int mqtt_port = 8883;

// ========== SINGLE DEVICE (1 ESP32 = 1 Device) ==========
// Buat device baru di IoT Hub dengan nama "esp32-traffic-monitor"
const char* DEVICE_ID = "esp32-traffic-monitor";
const char* SAS_TOKEN = "SharedAccessSignature sr=traffic-iot-slam1.azure-devices.net%2Fdevices%2Fesp32-traffic-monitor&sig=%2F%2FUENjKzIQ4N1JzIjkqGW%2Fchfafzd0%2B18T5rTqDuFy4%3D&se=1778258902"; // Generate dari Azure Portal
const char* MQTT_USERNAME = "traffic-iot-slam1.azure-devices.net/esp32-traffic-monitor/?api-version=2021-04-12";
const char* MQTT_TOPIC = "devices/esp32-traffic-monitor/messages/events/";

// ========== PIN DEFINITIONS (ESP32 Safe Pins) ==========
// Traffic Lights (9 LEDs - use safe GPIO pins)
// North Lane
#define NORTH_RED_PIN 15
#define NORTH_YELLOW_PIN 22
#define NORTH_GREEN_PIN 23

// South Lane  
#define SOUTH_RED_PIN 16
#define SOUTH_YELLOW_PIN 17
#define SOUTH_GREEN_PIN 5

// East Lane
#define EAST_RED_PIN 18
#define EAST_YELLOW_PIN 19
#define EAST_GREEN_PIN 21

// Infrared Sensors (3 sensors - INPUT pins)
#define NORTH_IR_PIN 34  // Input-only
#define SOUTH_IR_PIN 36  // Input-only
#define EAST_IR_PIN 39   // Input-only (SN pin)

// Ultrasonic Sensors (6 pins total)
// North Lane
#define NORTH_TRIG_PIN 25
#define NORTH_ECHO_PIN 26

// South Lane
#define SOUTH_TRIG_PIN 27
#define SOUTH_ECHO_PIN 14

// East Lane
#define EAST_TRIG_PIN 12
#define EAST_ECHO_PIN 13

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

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== ESP32 Traffic Monitoring System ===");
  Serial.println("Device: esp32-traffic-monitor");
  Serial.println("Sensors: 9 (3 lanes x 3 types)");
  
  setupPins();
  connectWiFi();
  
  // Setup MQTT with increased buffer
  espClient.setInsecure(); // ⚠️ For testing only!
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
  
  // Read sensors every 15 seconds
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 15000) {
    readAndSendData();
    lastSend = millis();
  }
  
  // Traffic light cycle every 30 seconds
  static unsigned long lastCycle = 0;
  if (millis() - lastCycle > 30000) {
    cycleTrafficLights();
    lastCycle = millis();
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
      
      // Print error details
      if (client.state() == -1) {
        Serial.println("   Error: Connection timeout or SSL handshake failed");
        Serial.println("   Check: WiFi, IoT Hub hostname, SAS token");
      } else if (client.state() == -2) {
        Serial.println("   Error: Connection refused");
      } else if (client.state() == 5) {
        Serial.println("   Error: Not authorized (check SAS token)");
      }
      
      delay(5000);
    }
  }
}

void readAndSendData() {
  Serial.println("\n📊 Reading sensors...");
  
  // Read IR sensors
  int northIR = digitalRead(NORTH_IR_PIN);
  int southIR = digitalRead(SOUTH_IR_PIN);
  int eastIR = digitalRead(EAST_IR_PIN);
  
  // Count vehicles
  static int lastNorthIR = HIGH;
  static int lastSouthIR = HIGH;
  static int lastEastIR = HIGH;
  
  if (northIR == LOW && lastNorthIR == HIGH) northCount++;
  if (southIR == LOW && lastSouthIR == HIGH) southCount++;
  if (eastIR == LOW && lastEastIR == HIGH) eastCount++;
  
  lastNorthIR = northIR;
  lastSouthIR = southIR;
  lastEastIR = eastIR;
  
  // Read ultrasonic sensors
  int northQueue = readUltrasonic(NORTH_TRIG_PIN, NORTH_ECHO_PIN);
  int southQueue = readUltrasonic(SOUTH_TRIG_PIN, SOUTH_ECHO_PIN);
  int eastQueue = readUltrasonic(EAST_TRIG_PIN, EAST_ECHO_PIN);
  
  // Create combined JSON payload with ALL sensor data
  JsonDocument doc;
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = millis();
  
  // North lane data
  JsonObject north = doc["north"].to<JsonObject>();
  north["light"] = northLight;
  north["vehicleCount"] = northCount;
  north["irState"] = (northIR == LOW) ? "detected" : "clear";
  north["queueLength"] = northQueue;
  
  // South lane data
  JsonObject south = doc["south"].to<JsonObject>();
  south["light"] = southLight;
  south["vehicleCount"] = southCount;
  south["irState"] = (southIR == LOW) ? "detected" : "clear";
  south["queueLength"] = southQueue;
  
  // East lane data
  JsonObject east = doc["east"].to<JsonObject>();
  east["light"] = eastLight;
  east["vehicleCount"] = eastCount;
  east["irState"] = (eastIR == LOW) ? "detected" : "clear";
  east["queueLength"] = eastQueue;
  
  String payload;
  serializeJson(doc, payload);
  
  if (client.publish(MQTT_TOPIC, payload.c_str())) {
    Serial.println("✅ Data sent successfully!");
    Serial.println("📤 Payload: " + payload);
  } else {
    Serial.println("❌ Failed to send data");
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
