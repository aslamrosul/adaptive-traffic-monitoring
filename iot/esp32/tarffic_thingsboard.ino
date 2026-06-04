/*
 * ============================================================
 * ESP32 Smart Traffic Monitoring System + ThingsBoard MQTT
 * ============================================================
 *
 * FITUR:
 * - Monitoring kendaraan 3 jalur (North, South, East)
 * - Infrared sensor untuk vehicle counting
 * - Ultrasonic sensor untuk density level
 * - Queue detection otomatis
 * - Traffic light automation
 * - MQTT telemetry ke ThingsBoard
 * - RPC control dari ThingsBoard
 *
 * PLATFORM:
 * - ESP32
 * - ThingsBoard Cloud
 * - MQTT Protocol
 *
 * ============================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ============================================================
// FUNCTION PROTOTYPES
// ============================================================

void setupPins();
void connectWiFi();
void reconnectMQTT();
void readAndSendData();
void cycleTrafficLights();
void setTrafficLight(String lane, String color);
int readUltrasonic(int trigPin, int echoPin);
void messageReceived(char *topic, byte *payload, unsigned int length);
void countVehicle(String lane, bool irDetected);
int calculateDensityLevel(bool irDetected, int distance);
void detectQueue(String lane, bool irDetected, int ultrasonicDistance);
int calculateQueueLength(int densityLevel, bool queueDetected);

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
// PIN DEFINITIONS
// ============================================================

// NORTH TRAFFIC LIGHT
#define NORTH_RED_PIN       15
#define NORTH_YELLOW_PIN    22
#define NORTH_GREEN_PIN     23

// SOUTH TRAFFIC LIGHT
#define SOUTH_RED_PIN       16
#define SOUTH_YELLOW_PIN    17
#define SOUTH_GREEN_PIN     5

// EAST TRAFFIC LIGHT
#define EAST_RED_PIN        18
#define EAST_YELLOW_PIN     19
#define EAST_GREEN_PIN      21

// INFRARED SENSORS
#define NORTH_IR_PIN        32
#define SOUTH_IR_PIN        36
#define EAST_IR_PIN         39

// ULTRASONIC NORTH
#define NORTH_TRIG_PIN      25
#define NORTH_ECHO_PIN      26

// ULTRASONIC SOUTH
#define SOUTH_TRIG_PIN      27
#define SOUTH_ECHO_PIN      14

// ULTRASONIC EAST
#define EAST_TRIG_PIN       12
#define EAST_ECHO_PIN       13

// ============================================================
// SYSTEM THRESHOLD
// ============================================================

#define VEHICLE_DEBOUNCE_MS   1000
#define QUEUE_THRESHOLD_MS    5000
#define ULTRASONIC_THRESHOLD  5

// ============================================================
// MQTT CLIENT
// ============================================================

WiFiClient espClient;
PubSubClient client(espClient);

// ============================================================
// TRAFFIC LIGHT STATE
// ============================================================

String northLight = "red";
String southLight = "red";
String eastLight  = "green";

String currentGreen = "east";

// ============================================================
// VEHICLE COUNTS
// ============================================================

int northCount = 0;
int southCount = 0;
int eastCount  = 0;

// ============================================================
// DENSITY LEVELS
// ============================================================

int northDensityLevel = 0;
int southDensityLevel = 0;
int eastDensityLevel  = 0;

// ============================================================
// DEBOUNCE VARIABLES
// ============================================================

unsigned long lastNorthVehicleTime = 0;
unsigned long lastSouthVehicleTime = 0;
unsigned long lastEastVehicleTime  = 0;

bool lastNorthIR = false;
bool lastSouthIR = false;
bool lastEastIR  = false;

// ============================================================
// QUEUE DETECTION
// ============================================================

unsigned long northQueueStartTime = 0;
unsigned long southQueueStartTime = 0;
unsigned long eastQueueStartTime  = 0;

bool northQueueDetected = false;
bool southQueueDetected = false;
bool eastQueueDetected  = false;

// ============================================================
// SETUP
// ============================================================

void setup()
{
  Serial.begin(115200);

  Serial.println();
  Serial.println("=======================================");
  Serial.println("ESP32 SMART TRAFFIC MONITORING SYSTEM");
  Serial.println("ThingsBoard MQTT Integration");
  Serial.println("=======================================");

  setupPins();

  connectWiFi();

  client.setServer(TB_SERVER, TB_PORT);
  client.setCallback(messageReceived);
  client.setBufferSize(1024);

  reconnectMQTT();

  // Initial traffic light
  setTrafficLight("north", "red");
  setTrafficLight("south", "red");
  setTrafficLight("east", "green");

  Serial.println("System Ready!");
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

  static unsigned long lastRead = 0;

  if (millis() - lastRead > 100)
  {
    // Read Infrared Sensors
    bool northIR = digitalRead(NORTH_IR_PIN) == LOW;
    bool southIR = digitalRead(SOUTH_IR_PIN) == LOW;
    bool eastIR  = digitalRead(EAST_IR_PIN) == LOW;

    // Count vehicles
    countVehicle("north", northIR);
    countVehicle("south", southIR);
    countVehicle("east", eastIR);

    // Read ultrasonic
    int northDistance = readUltrasonic(NORTH_TRIG_PIN, NORTH_ECHO_PIN);
    int southDistance = readUltrasonic(SOUTH_TRIG_PIN, SOUTH_ECHO_PIN);
    int eastDistance  = readUltrasonic(EAST_TRIG_PIN, EAST_ECHO_PIN);

    // Calculate density
    northDensityLevel = calculateDensityLevel(northIR, northDistance);
    southDensityLevel = calculateDensityLevel(southIR, southDistance);
    eastDensityLevel  = calculateDensityLevel(eastIR, eastDistance);

    // Queue detection
    detectQueue("north", northIR, northDistance);
    detectQueue("south", southIR, southDistance);
    detectQueue("east", eastIR, eastDistance);

    lastRead = millis();
  }

  // Send telemetry every 15 seconds
  static unsigned long lastSend = 0;

  if (millis() - lastSend > 15000)
  {
    readAndSendData();
    lastSend = millis();
  }

  // Traffic light cycle
  static unsigned long lastCycle = 0;

  if (millis() - lastCycle > 100)
  {
    cycleTrafficLights();
    lastCycle = millis();
  }

  delay(10);
}

// ============================================================
// WIFI CONNECTION
// ============================================================

void connectWiFi()
{
  Serial.print("Connecting WiFi");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
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
      "ESP32_TRAFFIC_" + String((uint32_t)ESP.getEfuseMac(), HEX);

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
// READ & SEND TELEMETRY
// ============================================================

void readAndSendData()
{
  Serial.println();
  Serial.println("Sending telemetry...");

  int northQueue =
    calculateQueueLength(northDensityLevel, northQueueDetected);

  int southQueue =
    calculateQueueLength(southDensityLevel, southQueueDetected);

  int eastQueue =
    calculateQueueLength(eastDensityLevel, eastQueueDetected);

  StaticJsonDocument<1024> doc;

  // NORTH
  doc["north_vehicle_count"]  = northCount;
  doc["north_density_level"]  = northDensityLevel;
  doc["north_queue_detected"] = northQueueDetected;
  doc["north_queue_length"]   = northQueue;
  doc["north_light"]          = northLight;

  // SOUTH
  doc["south_vehicle_count"]  = southCount;
  doc["south_density_level"]  = southDensityLevel;
  doc["south_queue_detected"] = southQueueDetected;
  doc["south_queue_length"]   = southQueue;
  doc["south_light"]          = southLight;

  // EAST
  doc["east_vehicle_count"]  = eastCount;
  doc["east_density_level"]  = eastDensityLevel;
  doc["east_queue_detected"] = eastQueueDetected;
  doc["east_queue_length"]   = eastQueue;
  doc["east_light"]          = eastLight;

  // SYSTEM INFO
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
// VEHICLE COUNTING
// ============================================================

void countVehicle(String lane, bool irDetected)
{
  unsigned long currentTime = millis();

  unsigned long *lastTime;
  bool *lastState;
  int *count;

  if (lane == "north")
  {
    lastTime = &lastNorthVehicleTime;
    lastState = &lastNorthIR;
    count = &northCount;
  }
  else if (lane == "south")
  {
    lastTime = &lastSouthVehicleTime;
    lastState = &lastSouthIR;
    count = &southCount;
  }
  else
  {
    lastTime = &lastEastVehicleTime;
    lastState = &lastEastIR;
    count = &eastCount;
  }

  if (irDetected && !(*lastState))
  {
    if (currentTime - (*lastTime) > VEHICLE_DEBOUNCE_MS)
    {
      (*count)++;
      *lastTime = currentTime;

      Serial.print(lane);
      Serial.print(" vehicle count: ");
      Serial.println(*count);
    }
  }

  *lastState = irDetected;
}

// ============================================================
// DENSITY CALCULATION
// ============================================================

int calculateDensityLevel(bool irDetected, int distance)
{
  if (!irDetected)
  {
    return 0;
  }

  if (distance > 0 && distance <= ULTRASONIC_THRESHOLD)
  {
    return 2;
  }

  return 1;
}

// ============================================================
// QUEUE LENGTH
// ============================================================

int calculateQueueLength(int densityLevel, bool queueDetected)
{
  if (densityLevel == 0)
  {
    return 0;
  }

  if (densityLevel == 1)
  {
    return queueDetected ? 20 : 15;
  }

  if (densityLevel == 2)
  {
    return queueDetected ? 40 : 30;
  }

  return 0;
}

// ============================================================
// QUEUE DETECTION
// ============================================================

void detectQueue(
  String lane,
  bool irDetected,
  int ultrasonicDistance)
{
  unsigned long *queueStartTime;
  bool *queueDetected;

  if (lane == "north")
  {
    queueStartTime = &northQueueStartTime;
    queueDetected = &northQueueDetected;
  }
  else if (lane == "south")
  {
    queueStartTime = &southQueueStartTime;
    queueDetected = &southQueueDetected;
  }
  else
  {
    queueStartTime = &eastQueueStartTime;
    queueDetected = &eastQueueDetected;
  }

  bool vehicleNearby =
    irDetected ||
    (ultrasonicDistance > 0 &&
     ultrasonicDistance <= ULTRASONIC_THRESHOLD);

  if (vehicleNearby)
  {
    if (*queueStartTime == 0)
    {
      *queueStartTime = millis();
    }
    else if (millis() - (*queueStartTime) > QUEUE_THRESHOLD_MS)
    {
      *queueDetected = true;
    }
  }
  else
  {
    *queueStartTime = 0;
    *queueDetected = false;
  }
}

// ============================================================
// ULTRASONIC SENSOR
// ============================================================

int readUltrasonic(int trigPin, int echoPin)
{
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);

  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);

  int distance = duration * 0.034 / 2;

  if (distance <= 0 || distance > 400)
  {
    return 0;
  }

  return distance;
}

// ============================================================
// SET TRAFFIC LIGHT
// ============================================================

void setTrafficLight(String lane, String color)
{
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
  else
  {
    redPin = EAST_RED_PIN;
    yellowPin = EAST_YELLOW_PIN;
    greenPin = EAST_GREEN_PIN;

    eastLight = color;
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
  static unsigned long greenStart = 0;
  static unsigned long yellowStart = 0;
  static bool yellowPhase = false;

  if (!yellowPhase)
  {
    if (millis() - greenStart >= 30000)
    {
      yellowPhase = true;
      yellowStart = millis();

      setTrafficLight(currentGreen, "yellow");
    }

    return;
  }

  if (millis() - yellowStart >= 3000)
  {
    yellowPhase = false;

    if (currentGreen == "north")
    {
      setTrafficLight("north", "red");
      setTrafficLight("south", "green");

      currentGreen = "south";
    }
    else if (currentGreen == "south")
    {
      setTrafficLight("south", "red");
      setTrafficLight("east", "green");

      currentGreen = "east";
    }
    else
    {
      setTrafficLight("east", "red");
      setTrafficLight("north", "green");

      currentGreen = "north";
    }

    greenStart = millis();
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

// ============================================================
// SETUP PINS
// ============================================================

void setupPins()
{
  // NORTH
  pinMode(NORTH_RED_PIN, OUTPUT);
  pinMode(NORTH_YELLOW_PIN, OUTPUT);
  pinMode(NORTH_GREEN_PIN, OUTPUT);

  // SOUTH
  pinMode(SOUTH_RED_PIN, OUTPUT);
  pinMode(SOUTH_YELLOW_PIN, OUTPUT);
  pinMode(SOUTH_GREEN_PIN, OUTPUT);

  // EAST
  pinMode(EAST_RED_PIN, OUTPUT);
  pinMode(EAST_YELLOW_PIN, OUTPUT);
  pinMode(EAST_GREEN_PIN, OUTPUT);

  // INFRARED
  pinMode(NORTH_IR_PIN, INPUT);
  pinMode(SOUTH_IR_PIN, INPUT);
  pinMode(EAST_IR_PIN, INPUT);

  // ULTRASONIC
  pinMode(NORTH_TRIG_PIN, OUTPUT);
  pinMode(NORTH_ECHO_PIN, INPUT);

  pinMode(SOUTH_TRIG_PIN, OUTPUT);
  pinMode(SOUTH_ECHO_PIN, INPUT);

  pinMode(EAST_TRIG_PIN, OUTPUT);
  pinMode(EAST_ECHO_PIN, INPUT);
}