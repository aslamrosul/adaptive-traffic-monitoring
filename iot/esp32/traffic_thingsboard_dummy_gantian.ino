/*
 * ============================================================
 * ESP32 Smart Traffic Monitoring System - DUMMY MODE
 * ============================================================
 * Untuk testing ThingsBoard tanpa sensor IR dan HC-SR04.
 * Data kendaraan, density, queue, dan traffic light dibuat simulasi.
 *
 * Pola traffic light:
 * North hijau  -> North kuning
 * South hijau  -> South kuning
 * East hijau   -> East kuning
 * Ulang lagi ke North
 * ============================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ============================================================
// WIFI CONFIG
// ============================================================

const char *ssid = "Gozzy";
const char *password = "88888888";

// ============================================================
// THINGSBOARD CONFIG
// ============================================================

#define TB_SERVER       "mqtt.thingsboard.cloud"
#define TB_PORT         1883
#define TB_ACCESS_TOKEN "Wscg9gcYdpg2scfvOhBp"

#define TOPIC_TELEMETRY "v1/devices/me/telemetry"
#define TOPIC_RPC       "v1/devices/me/rpc/request/+"

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
// QUEUE ESTIMATE CONFIG
// Ubah sendiri sesuai skala prototype kamu
// ============================================================

#define QUEUE_LEVEL_0_CM 0
#define QUEUE_LEVEL_1_CM 20
#define QUEUE_LEVEL_2_CM 40

// ============================================================
// TRAFFIC LIGHT TIME CONFIG
// ============================================================

#define GREEN_TIME_MS  10000
#define YELLOW_TIME_MS 3000

// ============================================================
// FUNCTION PROTOTYPES
// ============================================================

void connectWiFi();
void reconnectMQTT();
void messageReceived(char *topic, byte *payload, unsigned int length);

void generateDummySensorData();
void sendTelemetry();

void cycleTrafficLights();
void setTrafficLight(String lane, String color);

int calculateQueueEstimateCm(int densityLevel);

// ============================================================
// SETUP
// ============================================================

void setup()
{
  Serial.begin(115200);

  Serial.println();
  Serial.println("=======================================");
  Serial.println("ESP32 SMART TRAFFIC MONITORING SYSTEM");
  Serial.println("DUMMY MODE - NO SENSOR");
  Serial.println("ThingsBoard MQTT Integration");
  Serial.println("=======================================");

  connectWiFi();

  client.setServer(TB_SERVER, TB_PORT);
  client.setCallback(messageReceived);
  client.setBufferSize(1024);

  reconnectMQTT();

  Serial.println("Dummy System Ready!");
}

// ============================================================
// LOOP
// ============================================================

void loop()
{
  if (!client.connected())
  {
    reconnectMQTT();
  }

  client.loop();

  // Generate dummy data setiap 3 detik
  static unsigned long lastDummy = 0;

  if (millis() - lastDummy > 3000)
  {
    generateDummySensorData();
    lastDummy = millis();
  }

  // Kirim telemetry setiap 5 detik
  static unsigned long lastSend = 0;

  if (millis() - lastSend > 5000)
  {
    sendTelemetry();
    lastSend = millis();
  }

  // Simulasi traffic light bergantian
  cycleTrafficLights();

  delay(10);
}

// ============================================================
// WIFI CONNECTION
// ============================================================

void connectWiFi()
{
  Serial.println();
  Serial.print("Connecting WiFi to: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(1000);

  WiFi.begin(ssid, password);

  int retry = 0;

  while (WiFi.status() != WL_CONNECTED && retry < 30)
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
  }
  else
  {
    Serial.println();
    Serial.println("WiFi Failed!");
    Serial.print("WiFi Status Code: ");
    Serial.println(WiFi.status());
    Serial.println("Cek SSID/password, jarak WiFi, atau hotspot.");
  }
}

// ============================================================
// MQTT RECONNECT
// ============================================================

void reconnectMQTT()
{
  while (!client.connected())
  {
    Serial.print("Connecting to ThingsBoard... ");

    String clientId =
      "ESP32_TRAFFIC_DUMMY_" + String((uint32_t)ESP.getEfuseMac(), HEX);

    if (client.connect(clientId.c_str(), TB_ACCESS_TOKEN, ""))
    {
      Serial.println("Connected!");
      client.subscribe(TOPIC_RPC);
      Serial.println("RPC Subscribed");
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
  /*
   * Simulasi density_level:
   * 0 = kosong
   * 1 = sedang
   * 2 = padat
   */

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
  Serial.println("Sending dummy telemetry...");

  int northQueueCm = calculateQueueEstimateCm(northDensityLevel);
  int southQueueCm = calculateQueueEstimateCm(southDensityLevel);
  int eastQueueCm  = calculateQueueEstimateCm(eastDensityLevel);

  StaticJsonDocument<1024> doc;

  // NORTH
  doc["north_vehicle_count"]       = northCount;
  doc["north_vehicle_detected"]    = northVehicleDetected;
  doc["north_density_level"]       = northDensityLevel;
  doc["north_queue_detected"]      = northQueueDetected;
  doc["north_queue_estimate_cm"]   = northQueueCm;
  doc["north_light"]               = northLight;

  // SOUTH
  doc["south_vehicle_count"]       = southCount;
  doc["south_vehicle_detected"]    = southVehicleDetected;
  doc["south_density_level"]       = southDensityLevel;
  doc["south_queue_detected"]      = southQueueDetected;
  doc["south_queue_estimate_cm"]   = southQueueCm;
  doc["south_light"]               = southLight;

  // EAST
  doc["east_vehicle_count"]        = eastCount;
  doc["east_vehicle_detected"]     = eastVehicleDetected;
  doc["east_density_level"]        = eastDensityLevel;
  doc["east_queue_detected"]       = eastQueueDetected;
  doc["east_queue_estimate_cm"]    = eastQueueCm;
  doc["east_light"]                = eastLight;

  // SYSTEM INFO
  doc["dummy_mode"] = true;
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["uptime_s"]  = millis() / 1000;

  char payload[1024];

  serializeJson(doc, payload);

  if (client.publish(TOPIC_TELEMETRY, payload))
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
// SET TRAFFIC LIGHT
// ============================================================

void setTrafficLight(String lane, String color)
{
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
// TRAFFIC LIGHT CYCLE - BERGANTIAN
// ============================================================

void cycleTrafficLights()
{
  static unsigned long phaseStart = 0;
  static int phase = 0;
  static int lastPhase = -1;

  /*
   * Pola bergantian:
   * phase 0 = North hijau
   * phase 1 = North kuning
   * phase 2 = South hijau
   * phase 3 = South kuning
   * phase 4 = East hijau
   * phase 5 = East kuning
   */

  unsigned long now = millis();

  // Supaya setTrafficLight tidak dipanggil terus-menerus setiap loop
  if (phase != lastPhase)
  {
    if (phase == 0)
    {
      setTrafficLight("north", "green");
      setTrafficLight("south", "red");
      setTrafficLight("east", "red");
    }
    else if (phase == 1)
    {
      setTrafficLight("north", "yellow");
      setTrafficLight("south", "red");
      setTrafficLight("east", "red");
    }
    else if (phase == 2)
    {
      setTrafficLight("north", "red");
      setTrafficLight("south", "green");
      setTrafficLight("east", "red");
    }
    else if (phase == 3)
    {
      setTrafficLight("north", "red");
      setTrafficLight("south", "yellow");
      setTrafficLight("east", "red");
    }
    else if (phase == 4)
    {
      setTrafficLight("north", "red");
      setTrafficLight("south", "red");
      setTrafficLight("east", "green");
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

  // Durasi phase
  if (phase == 0 || phase == 2 || phase == 4)
  {
    // Green phase
    if (now - phaseStart >= GREEN_TIME_MS)
    {
      phase++;
    }
  }
  else
  {
    // Yellow phase
    if (now - phaseStart >= YELLOW_TIME_MS)
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
// MQTT RPC CALLBACK
// ============================================================

void messageReceived(
  char *topic,
  byte *payload,
  unsigned int length)
{
  String message;

  for (unsigned int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }

  Serial.println();
  Serial.println("RPC Message:");
  Serial.println(message);

  StaticJsonDocument<256> doc;

  DeserializationError error =
    deserializeJson(doc, message);

  if (error)
  {
    Serial.println("JSON Parse Failed!");
    return;
  }

  String method = doc["method"];

  if (method == "change_light")
  {
    String lane = doc["params"]["lane"];
    String color = doc["params"]["color"];

    setTrafficLight(lane, color);

    Serial.println("Traffic light updated from RPC");
  }
}