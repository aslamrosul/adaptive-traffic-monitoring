#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ============================================================
// DEVICE IDENTITY
// ============================================================

#define INTERSECTION_ID "SIMPANG_TALUN_01"
#define DEVICE_ID       "ESP32_TRAFFIC_01"

// ============================================================
// WIFI CONFIG
// ============================================================

const char *ssid = "Gozzy";
const char *password = "88888888";

// ============================================================
// MQTT AZURE VM BROKER CONFIG
// ============================================================

#define MQTT_SERVER "20.2.91.208"
#define MQTT_PORT   1883

#define MQTT_USER   "jti"
#define MQTT_PASS   "Azure-password123"

// ============================================================
// MQTT TOPICS
// ============================================================

#define TOPIC_TRAFFIC_DATA "traffic/data"

#define TOPIC_NORTH_LIGHT_SET "traffic/light/north/set"
#define TOPIC_SOUTH_LIGHT_SET "traffic/light/south/set"
#define TOPIC_EAST_LIGHT_SET  "traffic/light/east/set"

#define TOPIC_GREEN_TIME_SET    "traffic/config/green_time/set"
#define TOPIC_YELLOW_TIME_SET   "traffic/config/yellow_time/set"
#define TOPIC_AUTO_MODE_SET     "traffic/config/auto_mode/set"
#define TOPIC_ADAPTIVE_MODE_SET "traffic/config/adaptive_mode/set"

#define TOPIC_LEVEL0_GREEN_SET "traffic/config/level0_green/set"
#define TOPIC_LEVEL1_GREEN_SET "traffic/config/level1_green/set"
#define TOPIC_LEVEL2_GREEN_SET "traffic/config/level2_green/set"

// ============================================================
// PIN DEFINITIONS
// ============================================================

// North Lane LEDs
#define NORTH_RED_PIN     15
#define NORTH_YELLOW_PIN  22
#define NORTH_GREEN_PIN   23

// South Lane LEDs
#define SOUTH_RED_PIN     16
#define SOUTH_YELLOW_PIN  17
#define SOUTH_GREEN_PIN   5

// East Lane LEDs
#define EAST_RED_PIN      18
#define EAST_YELLOW_PIN   19
#define EAST_GREEN_PIN    21

// IR Sensors
#define NORTH_IR_PIN 34
#define SOUTH_IR_PIN 36
#define EAST_IR_PIN  39

// Ultrasonic Sensors
#define NORTH_TRIG_PIN 25
#define NORTH_ECHO_PIN 26

#define SOUTH_TRIG_PIN 27
#define SOUTH_ECHO_PIN 14

#define EAST_TRIG_PIN 12
#define EAST_ECHO_PIN 13

// ============================================================
// MQTT CLIENT
// ============================================================

WiFiClient espClient;
PubSubClient client(espClient);

// ============================================================
// TRAFFIC LIGHT STATE
// ============================================================

String northLight = "green";
String southLight = "red";
String eastLight  = "red";

// ============================================================
// REAL SENSOR STATE
// ============================================================

int northCount = 0;
int southCount = 0;
int eastCount  = 0;

int northDensityLevel = 0;
int southDensityLevel = 0;
int eastDensityLevel  = 0;

bool northVehicleDetected = false;
bool southVehicleDetected = false;
bool eastVehicleDetected  = false;

bool northQueueDetected = false;
bool southQueueDetected = false;
bool eastQueueDetected  = false;

int northQueueCm = 0;
int southQueueCm = 0;
int eastQueueCm  = 0;

// IR previous state untuk hitung kendaraan
int lastNorthIR = HIGH;
int lastSouthIR = HIGH;
int lastEastIR  = HIGH;

// ============================================================
// CONFIG
// ============================================================

// Semakin kecil jarak HC-SR04, berarti objek/kendaraan makin dekat.
// Silakan ubah threshold ini sesuai posisi sensor di maket.
#define DISTANCE_LEVEL_0_CM 80   // kosong / sepi
#define DISTANCE_LEVEL_1_CM 40   // sedang
#define DISTANCE_LEVEL_2_CM 20   // padat

unsigned long greenTimeMs = 10000;
unsigned long yellowTimeMs = 3000;

unsigned long densityLevel0GreenMs = 10000;
unsigned long densityLevel1GreenMs = 20000;
unsigned long densityLevel2GreenMs = 30000;

bool autoMode = true;
bool adaptiveMode = true;

// ============================================================
// FUNCTION PROTOTYPES
// ============================================================

bool connectWiFi();
void reconnectMQTT();
void messageReceived(char *topic, byte *payload, unsigned int length);

void setupPins();
void readRealSensorData();
void sendTelemetry();

void cycleTrafficLights();
void setTrafficLight(String lane, String color);

int readUltrasonicCm(int trigPin, int echoPin);
int getDensityLevelFromDistance(int distanceCm);
int getDensityForLane(String lane);
unsigned long getGreenDurationForLane(String lane);

// ============================================================
// SETUP
// ============================================================

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("=======================================");
  Serial.println("ESP32 SMART TRAFFIC MONITORING SYSTEM");
  Serial.println("REAL SENSOR MODE - MQTT AZURE MOSQUITTO");
  Serial.println("IR + HC-SR04 + LED Traffic Light");
  Serial.println("=======================================");
  Serial.print("Intersection ID: ");
  Serial.println(INTERSECTION_ID);
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);

  setupPins();

  setTrafficLight("north", "green");
  setTrafficLight("south", "red");
  setTrafficLight("east", "red");

  while (!connectWiFi())
  {
    Serial.println("WiFi gagal. Coba ulang 5 detik lagi...");
    delay(5000);
  }

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(messageReceived);
  client.setBufferSize(1536);

  reconnectMQTT();

  Serial.println("Real Sensor System Ready!");
}

// ============================================================
// LOOP
// ============================================================

void loop()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("WiFi terputus. Reconnect...");

    while (!connectWiFi())
    {
      delay(5000);
    }
  }

  if (!client.connected())
  {
    reconnectMQTT();
  }

  client.loop();

  static unsigned long lastSensorRead = 0;

  if (millis() - lastSensorRead > 1000)
  {
    readRealSensorData();
    lastSensorRead = millis();
  }

  static unsigned long lastSend = 0;

  if (millis() - lastSend > 5000)
  {
    sendTelemetry();
    lastSend = millis();
  }

  if (autoMode)
  {
    cycleTrafficLights();
  }

  delay(10);
}

// ============================================================
// PIN SETUP
// ============================================================

void setupPins()
{
  pinMode(NORTH_RED_PIN, OUTPUT);
  pinMode(NORTH_YELLOW_PIN, OUTPUT);
  pinMode(NORTH_GREEN_PIN, OUTPUT);

  pinMode(SOUTH_RED_PIN, OUTPUT);
  pinMode(SOUTH_YELLOW_PIN, OUTPUT);
  pinMode(SOUTH_GREEN_PIN, OUTPUT);

  pinMode(EAST_RED_PIN, OUTPUT);
  pinMode(EAST_YELLOW_PIN, OUTPUT);
  pinMode(EAST_GREEN_PIN, OUTPUT);

  pinMode(NORTH_IR_PIN, INPUT);
  pinMode(SOUTH_IR_PIN, INPUT);
  pinMode(EAST_IR_PIN, INPUT);

  pinMode(NORTH_TRIG_PIN, OUTPUT);
  pinMode(NORTH_ECHO_PIN, INPUT);

  pinMode(SOUTH_TRIG_PIN, OUTPUT);
  pinMode(SOUTH_ECHO_PIN, INPUT);

  pinMode(EAST_TRIG_PIN, OUTPUT);
  pinMode(EAST_ECHO_PIN, INPUT);

  digitalWrite(NORTH_RED_PIN, LOW);
  digitalWrite(NORTH_YELLOW_PIN, LOW);
  digitalWrite(NORTH_GREEN_PIN, LOW);

  digitalWrite(SOUTH_RED_PIN, LOW);
  digitalWrite(SOUTH_YELLOW_PIN, LOW);
  digitalWrite(SOUTH_GREEN_PIN, LOW);

  digitalWrite(EAST_RED_PIN, LOW);
  digitalWrite(EAST_YELLOW_PIN, LOW);
  digitalWrite(EAST_GREEN_PIN, LOW);
}

// ============================================================
// WIFI CONNECTION
// ============================================================

bool connectWiFi()
{
  Serial.println();
  Serial.print("Connecting WiFi to: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);

  WiFi.disconnect(true, true);
  delay(1500);

  WiFi.begin(ssid, password);

  int retry = 0;

  while (WiFi.status() != WL_CONNECTED && retry < 40)
  {
    delay(500);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println();
    Serial.println("WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("RSSI: ");
    Serial.println(WiFi.RSSI());

    return true;
  }

  Serial.println();
  Serial.println("WiFi Failed!");
  Serial.print("WiFi Status Code: ");
  Serial.println(WiFi.status());

  return false;
}

// ============================================================
// MQTT RECONNECT
// ============================================================

void reconnectMQTT()
{
  while (!client.connected())
  {
    Serial.print("Connecting to Azure MQTT Broker... ");

    String clientId =
      String(DEVICE_ID) + "_" + String((uint32_t)ESP.getEfuseMac(), HEX);

    if (client.connect(clientId.c_str(), MQTT_USER, MQTT_PASS))
    {
      Serial.println("Connected!");

      client.subscribe(TOPIC_NORTH_LIGHT_SET);
      client.subscribe(TOPIC_SOUTH_LIGHT_SET);
      client.subscribe(TOPIC_EAST_LIGHT_SET);

      client.subscribe(TOPIC_GREEN_TIME_SET);
      client.subscribe(TOPIC_YELLOW_TIME_SET);
      client.subscribe(TOPIC_AUTO_MODE_SET);
      client.subscribe(TOPIC_ADAPTIVE_MODE_SET);

      client.subscribe(TOPIC_LEVEL0_GREEN_SET);
      client.subscribe(TOPIC_LEVEL1_GREEN_SET);
      client.subscribe(TOPIC_LEVEL2_GREEN_SET);

      Serial.println("Subscribed all topics");
    }
    else
    {
      Serial.print("Failed. rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

// ============================================================
// READ REAL SENSOR DATA
// ============================================================

void readRealSensorData()
{
  int northIR = digitalRead(NORTH_IR_PIN);
  int southIR = digitalRead(SOUTH_IR_PIN);
  int eastIR  = digitalRead(EAST_IR_PIN);

  // Umumnya sensor IR obstacle: LOW = terdeteksi, HIGH = clear.
  northVehicleDetected = (northIR == LOW);
  southVehicleDetected = (southIR == LOW);
  eastVehicleDetected  = (eastIR == LOW);

  // Hitung kendaraan hanya saat transisi HIGH -> LOW
  if (northIR == LOW && lastNorthIR == HIGH)
  {
    northCount++;
  }

  if (southIR == LOW && lastSouthIR == HIGH)
  {
    southCount++;
  }

  if (eastIR == LOW && lastEastIR == HIGH)
  {
    eastCount++;
  }

  lastNorthIR = northIR;
  lastSouthIR = southIR;
  lastEastIR  = eastIR;

  northQueueCm = readUltrasonicCm(NORTH_TRIG_PIN, NORTH_ECHO_PIN);
  southQueueCm = readUltrasonicCm(SOUTH_TRIG_PIN, SOUTH_ECHO_PIN);
  eastQueueCm  = readUltrasonicCm(EAST_TRIG_PIN, EAST_ECHO_PIN);

  northDensityLevel = getDensityLevelFromDistance(northQueueCm);
  southDensityLevel = getDensityLevelFromDistance(southQueueCm);
  eastDensityLevel  = getDensityLevelFromDistance(eastQueueCm);

  northQueueDetected = northDensityLevel == 2;
  southQueueDetected = southDensityLevel == 2;
  eastQueueDetected  = eastDensityLevel == 2;

  Serial.println();
  Serial.println("Real sensor data updated:");

  Serial.print("North | IR: ");
  Serial.print(northVehicleDetected ? "DETECTED" : "CLEAR");
  Serial.print(" | Distance: ");
  Serial.print(northQueueCm);
  Serial.print(" cm | Level: ");
  Serial.print(northDensityLevel);
  Serial.print(" | Count: ");
  Serial.println(northCount);

  Serial.print("South | IR: ");
  Serial.print(southVehicleDetected ? "DETECTED" : "CLEAR");
  Serial.print(" | Distance: ");
  Serial.print(southQueueCm);
  Serial.print(" cm | Level: ");
  Serial.print(southDensityLevel);
  Serial.print(" | Count: ");
  Serial.println(southCount);

  Serial.print("East  | IR: ");
  Serial.print(eastVehicleDetected ? "DETECTED" : "CLEAR");
  Serial.print(" | Distance: ");
  Serial.print(eastQueueCm);
  Serial.print(" cm | Level: ");
  Serial.print(eastDensityLevel);
  Serial.print(" | Count: ");
  Serial.println(eastCount);
}

// ============================================================
// ULTRASONIC
// ============================================================

int readUltrasonicCm(int trigPin, int echoPin)
{
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);

  if (duration == 0)
  {
    return 0;
  }

  int distance = duration * 0.034 / 2;

  if (distance < 2 || distance > 400)
  {
    return 0;
  }

  return distance;
}

// ============================================================
// DISTANCE TO DENSITY LEVEL
// ============================================================

int getDensityLevelFromDistance(int distanceCm)
{
  // 0 artinya tidak terbaca / tidak ada objek
  if (distanceCm == 0)
  {
    return 0;
  }

  // Dekat sekali = padat
  if (distanceCm <= DISTANCE_LEVEL_2_CM)
  {
    return 2;
  }

  // Cukup dekat = sedang
  if (distanceCm <= DISTANCE_LEVEL_1_CM)
  {
    return 1;
  }

  // Jauh = sepi
  return 0;
}

// ============================================================
// SEND TELEMETRY
// ============================================================

void sendTelemetry()
{
  Serial.println();
  Serial.println("Sending real telemetry to Azure MQTT...");

  StaticJsonDocument<1536> doc;

  doc["intersection_id"] = INTERSECTION_ID;
  doc["device_id"] = DEVICE_ID;
  doc["device"] = DEVICE_ID;

  doc["north_vehicle_count"]     = northCount;
  doc["north_vehicle_detected"]  = northVehicleDetected;
  doc["north_density_level"]     = northDensityLevel;
  doc["north_queue_detected"]    = northQueueDetected;
  doc["north_queue_estimate_cm"] = northQueueCm;
  doc["north_light"]             = northLight;
  doc["north_green_duration_s"]  = getGreenDurationForLane("north") / 1000;

  doc["south_vehicle_count"]     = southCount;
  doc["south_vehicle_detected"]  = southVehicleDetected;
  doc["south_density_level"]     = southDensityLevel;
  doc["south_queue_detected"]    = southQueueDetected;
  doc["south_queue_estimate_cm"] = southQueueCm;
  doc["south_light"]             = southLight;
  doc["south_green_duration_s"]  = getGreenDurationForLane("south") / 1000;

  doc["east_vehicle_count"]      = eastCount;
  doc["east_vehicle_detected"]   = eastVehicleDetected;
  doc["east_density_level"]      = eastDensityLevel;
  doc["east_queue_detected"]     = eastQueueDetected;
  doc["east_queue_estimate_cm"]  = eastQueueCm;
  doc["east_light"]              = eastLight;
  doc["east_green_duration_s"]   = getGreenDurationForLane("east") / 1000;

  doc["dummy_mode"] = false;
  doc["sensor_mode"] = true;
  doc["wifi_rssi"]  = WiFi.RSSI();
  doc["uptime_s"]   = millis() / 1000;

  doc["green_time_s"]  = greenTimeMs / 1000;
  doc["yellow_time_s"] = yellowTimeMs / 1000;

  doc["density_level_0_green_s"] = densityLevel0GreenMs / 1000;
  doc["density_level_1_green_s"] = densityLevel1GreenMs / 1000;
  doc["density_level_2_green_s"] = densityLevel2GreenMs / 1000;

  doc["auto_mode"]     = autoMode;
  doc["adaptive_mode"] = adaptiveMode;

  char payload[1536];
  serializeJson(doc, payload);

  if (client.publish(TOPIC_TRAFFIC_DATA, payload))
  {
    Serial.println("Telemetry Sent!");
    Serial.println(payload);
  }
  else
  {
    Serial.println("Failed Sending Telemetry!");
  }
}

// ============================================================
// DENSITY TO GREEN TIME
// ============================================================

int getDensityForLane(String lane)
{
  if (lane == "north")
  {
    return northDensityLevel;
  }

  if (lane == "south")
  {
    return southDensityLevel;
  }

  if (lane == "east")
  {
    return eastDensityLevel;
  }

  return 0;
}

unsigned long getGreenDurationForLane(String lane)
{
  if (!adaptiveMode)
  {
    return greenTimeMs;
  }

  int density = getDensityForLane(lane);

  if (density == 0)
  {
    return densityLevel0GreenMs;
  }

  if (density == 1)
  {
    return densityLevel1GreenMs;
  }

  if (density == 2)
  {
    return densityLevel2GreenMs;
  }

  return greenTimeMs;
}

// ============================================================
// SET TRAFFIC LIGHT + PHYSICAL LED
// ============================================================

void setTrafficLight(String lane, String color)
{
  color.toLowerCase();

  if (color != "red" && color != "yellow" && color != "green")
  {
    Serial.println("Invalid light color!");
    return;
  }

  int redPin;
  int yellowPin;
  int greenPin;

  if (lane == "north")
  {
    redPin = NORTH_RED_PIN;
    yellowPin = NORTH_YELLOW_PIN;
    greenPin = NORTH_GREEN_PIN;
    northLight = color;
  }
  else if (lane == "south")
  {
    redPin = SOUTH_RED_PIN;
    yellowPin = SOUTH_YELLOW_PIN;
    greenPin = SOUTH_GREEN_PIN;
    southLight = color;
  }
  else if (lane == "east")
  {
    redPin = EAST_RED_PIN;
    yellowPin = EAST_YELLOW_PIN;
    greenPin = EAST_GREEN_PIN;
    eastLight = color;
  }
  else
  {
    Serial.println("Invalid lane!");
    return;
  }

  digitalWrite(redPin, LOW);
  digitalWrite(yellowPin, LOW);
  digitalWrite(greenPin, LOW);

  if (color == "red")
  {
    digitalWrite(redPin, HIGH);
  }
  else if (color == "yellow")
  {
    digitalWrite(yellowPin, HIGH);
  }
  else if (color == "green")
  {
    digitalWrite(greenPin, HIGH);
  }

  Serial.print("Traffic Light ");
  Serial.print(lane);
  Serial.print(" -> ");
  Serial.println(color);
}

// ============================================================
// TRAFFIC LIGHT CYCLE
// ============================================================

void cycleTrafficLights()
{
  static unsigned long phaseStart = 0;
  static int phase = 0;
  static int lastPhase = -1;
  static unsigned long currentGreenDuration = 10000;

  unsigned long now = millis();

  if (phase != lastPhase)
  {
    if (phase == 0)
    {
      currentGreenDuration = getGreenDurationForLane("north");

      setTrafficLight("north", "green");
      setTrafficLight("south", "red");
      setTrafficLight("east", "red");

      Serial.print("North green duration: ");
      Serial.print(currentGreenDuration / 1000);
      Serial.println(" seconds");
    }
    else if (phase == 1)
    {
      setTrafficLight("north", "yellow");
      setTrafficLight("south", "red");
      setTrafficLight("east", "red");
    }
    else if (phase == 2)
    {
      currentGreenDuration = getGreenDurationForLane("south");

      setTrafficLight("north", "red");
      setTrafficLight("south", "green");
      setTrafficLight("east", "red");

      Serial.print("South green duration: ");
      Serial.print(currentGreenDuration / 1000);
      Serial.println(" seconds");
    }
    else if (phase == 3)
    {
      setTrafficLight("north", "red");
      setTrafficLight("south", "yellow");
      setTrafficLight("east", "red");
    }
    else if (phase == 4)
    {
      currentGreenDuration = getGreenDurationForLane("east");

      setTrafficLight("north", "red");
      setTrafficLight("south", "red");
      setTrafficLight("east", "green");

      Serial.print("East green duration: ");
      Serial.print(currentGreenDuration / 1000);
      Serial.println(" seconds");
    }
    else if (phase == 5)
    {
      setTrafficLight("north", "red");
      setTrafficLight("south", "red");
      setTrafficLight("east", "yellow");
    }

    lastPhase = phase;
    phaseStart = now;
  }

  if (phase == 0 || phase == 2 || phase == 4)
  {
    if (now - phaseStart >= currentGreenDuration)
    {
      phase++;
    }
  }
  else
  {
    if (now - phaseStart >= yellowTimeMs)
    {
      phase++;

      if (phase > 5)
      {
        phase = 0;
      }
    }
  }
}

// ============================================================
// MQTT CALLBACK
// ============================================================

void messageReceived(char *topic, byte *payload, unsigned int length)
{
  String message = "";

  for (unsigned int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }

  message.trim();
  message.toLowerCase();

  Serial.println();
  Serial.print("MQTT Message Topic: ");
  Serial.println(topic);
  Serial.print("Payload: ");
  Serial.println(message);

  String topicStr = String(topic);

  if (topicStr == TOPIC_GREEN_TIME_SET)
  {
    int seconds = message.toInt();

    if (seconds >= 1 && seconds <= 120)
    {
      greenTimeMs = seconds * 1000UL;

      Serial.print("Manual green time updated: ");
      Serial.print(seconds);
      Serial.println(" seconds");
    }
  }
  else if (topicStr == TOPIC_YELLOW_TIME_SET)
  {
    int seconds = message.toInt();

    if (seconds >= 1 && seconds <= 30)
    {
      yellowTimeMs = seconds * 1000UL;

      Serial.print("Yellow time updated: ");
      Serial.print(seconds);
      Serial.println(" seconds");
    }
  }
  else if (topicStr == TOPIC_AUTO_MODE_SET)
  {
    if (message == "on")
    {
      autoMode = true;
      Serial.println("Auto mode ON");
    }
    else if (message == "off")
    {
      autoMode = false;
      Serial.println("Auto mode OFF");
    }
  }
  else if (topicStr == TOPIC_ADAPTIVE_MODE_SET)
  {
    if (message == "on")
    {
      adaptiveMode = true;
      Serial.println("Adaptive mode ON");
    }
    else if (message == "off")
    {
      adaptiveMode = false;
      Serial.println("Adaptive mode OFF");
    }
  }
  else if (topicStr == TOPIC_LEVEL0_GREEN_SET)
  {
    int seconds = message.toInt();

    if (seconds >= 1 && seconds <= 120)
    {
      densityLevel0GreenMs = seconds * 1000UL;

      Serial.print("Density level 0 green time updated: ");
      Serial.print(seconds);
      Serial.println(" seconds");
    }
  }
  else if (topicStr == TOPIC_LEVEL1_GREEN_SET)
  {
    int seconds = message.toInt();

    if (seconds >= 1 && seconds <= 120)
    {
      densityLevel1GreenMs = seconds * 1000UL;

      Serial.print("Density level 1 green time updated: ");
      Serial.print(seconds);
      Serial.println(" seconds");
    }
  }
  else if (topicStr == TOPIC_LEVEL2_GREEN_SET)
  {
    int seconds = message.toInt();

    if (seconds >= 1 && seconds <= 120)
    {
      densityLevel2GreenMs = seconds * 1000UL;

      Serial.print("Density level 2 green time updated: ");
      Serial.print(seconds);
      Serial.println(" seconds");
    }
  }
  else if (topicStr == TOPIC_NORTH_LIGHT_SET)
  {
    setTrafficLight("north", message);
  }
  else if (topicStr == TOPIC_SOUTH_LIGHT_SET)
  {
    setTrafficLight("south", message);
  }
  else if (topicStr == TOPIC_EAST_LIGHT_SET)
  {
    setTrafficLight("east", message);
  }

  sendTelemetry();
}