/*
 * ============================================================
 * ESP32 Smart Traffic Monitoring System - MQTT AZURE MODE
 * ============================================================
 * Broker: Mosquitto MQTT di Azure VM
 * Mode: Dummy sensor tanpa IR dan HC-SR04
 *
 * Fitur:
 * - Publish data realtime ke traffic/data
 * - Kontrol lampu dari dashboard
 * - Auto mode ON/OFF
 * - Adaptive mode ON/OFF
 * - Atur waktu hijau manual dari web
 * - Atur waktu kuning dari web
 * - Atur waktu hijau density level 0, 1, 2 dari web
 * - Memiliki intersection_id dan device_id
 * ============================================================
 */

#include <Arduino.h>
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
// MQTT AZURE BROKER CONFIG
// ============================================================

#define MQTT_SERVER "13.239.2.166"
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
// DUMMY SENSOR STATE
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

// ============================================================
// CONFIG
// ============================================================

#define QUEUE_LEVEL_0_CM 0
#define QUEUE_LEVEL_1_CM 20
#define QUEUE_LEVEL_2_CM 40

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

void generateDummySensorData();
void sendTelemetry();

void cycleTrafficLights();
void setTrafficLight(String lane, String color);

int calculateQueueEstimateCm(int densityLevel);
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
  Serial.println("DUMMY MODE - MQTT AZURE MOSQUITTO");
  Serial.println("AUTO + MANUAL + ADAPTIVE DENSITY");
  Serial.println("=======================================");
  Serial.print("Intersection ID: ");
  Serial.println(INTERSECTION_ID);
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);

  randomSeed(analogRead(0));

  while (!connectWiFi())
  {
    Serial.println("WiFi gagal. Coba ulang 5 detik lagi...");
    delay(5000);
  }

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(messageReceived);
  client.setBufferSize(1536);

  reconnectMQTT();

  Serial.println("Dummy System Ready!");
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

  static unsigned long lastDummy = 0;

  if (millis() - lastDummy > 3000)
  {
    generateDummySensorData();
    lastDummy = millis();
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
// GENERATE DUMMY SENSOR DATA
// ============================================================

void generateDummySensorData()
{
  northDensityLevel = random(0, 3);
  southDensityLevel = random(0, 3);
  eastDensityLevel  = random(0, 3);

  northVehicleDetected = northDensityLevel > 0;
  southVehicleDetected = southDensityLevel > 0;
  eastVehicleDetected  = eastDensityLevel > 0;

  northQueueDetected = northDensityLevel == 2;
  southQueueDetected = southDensityLevel == 2;
  eastQueueDetected  = eastDensityLevel == 2;

  if (northVehicleDetected)
  {
    northCount += random(1, 4);
  }

  if (southVehicleDetected)
  {
    southCount += random(1, 4);
  }

  if (eastVehicleDetected)
  {
    eastCount += random(1, 4);
  }

  Serial.println();
  Serial.println("Dummy data updated:");

  Serial.print("North level: ");
  Serial.print(northDensityLevel);
  Serial.print(" | Count: ");
  Serial.println(northCount);

  Serial.print("South level: ");
  Serial.print(southDensityLevel);
  Serial.print(" | Count: ");
  Serial.println(southCount);

  Serial.print("East level: ");
  Serial.print(eastDensityLevel);
  Serial.print(" | Count: ");
  Serial.println(eastCount);
}

// ============================================================
// SEND TELEMETRY
// ============================================================

void sendTelemetry()
{
  Serial.println();
  Serial.println("Sending dummy telemetry to Azure MQTT...");

  int northQueueCm = calculateQueueEstimateCm(northDensityLevel);
  int southQueueCm = calculateQueueEstimateCm(southDensityLevel);
  int eastQueueCm  = calculateQueueEstimateCm(eastDensityLevel);

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

  doc["dummy_mode"] = true;
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
// QUEUE ESTIMATE
// ============================================================

int calculateQueueEstimateCm(int densityLevel)
{
  if (densityLevel == 0)
  {
    return QUEUE_LEVEL_0_CM;
  }

  if (densityLevel == 1)
  {
    return QUEUE_LEVEL_1_CM;
  }

  if (densityLevel == 2)
  {
    return QUEUE_LEVEL_2_CM;
  }

  return 0;
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
// SET TRAFFIC LIGHT
// ============================================================

void setTrafficLight(String lane, String color)
{
  color.toLowerCase();

  if (color != "red" && color != "yellow" && color != "green")
  {
    Serial.println("Invalid light color!");
    return;
  }

  if (lane == "north")
  {
    northLight = color;
  }
  else if (lane == "south")
  {
    southLight = color;
  }
  else if (lane == "east")
  {
    eastLight = color;
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