/*
 * ============================================================
 * ESP32 SMART TRAFFIC MONITORING SYSTEM
 * REAL SENSOR MODE - MQTT AWS EC2
 * ============================================================
 *
 * Sensor:
 * - IR obstacle sensor untuk mendeteksi dan menghitung kendaraan
 * - HC-SR04 untuk membantu menentukan tingkat kepadatan
 * - LED fisik merah/kuning/hijau untuk tiap jalur
 *
 * Mode:
 * - Auto Mode ON  : lampu bergantian otomatis
 * - Auto Mode OFF : lampu dapat dikontrol manual dari dashboard
 * - Adaptive ON   : waktu hijau mengikuti density level
 * - Adaptive OFF  : waktu hijau memakai greenTimeMs
 *
 * Density:
 * - Level 0: tidak ada objek terdeteksi
 * - HC-SR04 aktif hanya pada jarak valid 2-5 cm
 * - Level 1: IR atau HC-SR04 mendeteksi
 * - Level 2: IR dan HC-SR04 sama-sama mendeteksi
 *
 * Keamanan:
 * - Hanya satu jalur yang boleh hijau/kuning dalam satu waktu
 * - Perintah manual diabaikan ketika Auto Mode masih ON
 * - Status terbaru langsung dipublish setelah menerima command
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
#define DEVICE_ID "ESP32_TRAFFIC_01"

// ============================================================
// WIFI CONFIG
// ============================================================

const char *ssid = "Gozzy";
const char *wifiPassword = "88888888";

// ============================================================
// MQTT CONFIG
// ============================================================

#define MQTT_SERVER "13.239.2.166"
#define MQTT_PORT 1883

#define MQTT_USER "jti"
#define MQTT_PASS "Azure-password123"

// ============================================================
// MQTT TOPICS
// ============================================================

#define TOPIC_TRAFFIC_DATA "traffic/data"

#define TOPIC_NORTH_LIGHT_SET "traffic/light/north/set"
#define TOPIC_SOUTH_LIGHT_SET "traffic/light/south/set"
#define TOPIC_EAST_LIGHT_SET "traffic/light/east/set"

#define TOPIC_GREEN_TIME_SET "traffic/config/green_time/set"
#define TOPIC_YELLOW_TIME_SET "traffic/config/yellow_time/set"

#define TOPIC_AUTO_MODE_SET "traffic/config/auto_mode/set"
#define TOPIC_ADAPTIVE_MODE_SET "traffic/config/adaptive_mode/set"

#define TOPIC_LEVEL0_GREEN_SET "traffic/config/level0_green/set"
#define TOPIC_LEVEL1_GREEN_SET "traffic/config/level1_green/set"
#define TOPIC_LEVEL2_GREEN_SET "traffic/config/level2_green/set"

// ============================================================
// PIN DEFINITIONS
// ============================================================

// South lane LEDs
#define SOUTH_RED_PIN 15
#define SOUTH_YELLOW_PIN 22
#define SOUTH_GREEN_PIN 23

// North lane LEDs
#define NORTH_RED_PIN 16
#define NORTH_YELLOW_PIN 17
#define NORTH_GREEN_PIN 5

// East lane LEDs
#define EAST_RED_PIN 18
#define EAST_YELLOW_PIN 19
#define EAST_GREEN_PIN 21

// IR sensors
#define SOUTH_IR_PIN 34
#define NORTH_IR_PIN 36
#define EAST_IR_PIN 39

// HC-SR04 sensors
#define SOUTH_TRIG_PIN 25
#define SOUTH_ECHO_PIN 26

#define NORTH_TRIG_PIN 27
#define NORTH_ECHO_PIN 14

#define EAST_TRIG_PIN 12
#define EAST_ECHO_PIN 13

// Mayoritas sensor IR obstacle aktif LOW.
// Ubah menjadi false jika sensor Anda aktif HIGH.
const bool IR_ACTIVE_LOW = true;

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
String eastLight = "red";

// ============================================================
// REAL SENSOR STATE
// ============================================================

int northCount = 0;
int southCount = 0;
int eastCount = 0;

int northDensityLevel = 0;
int southDensityLevel = 0;
int eastDensityLevel = 0;

bool northVehicleDetected = false;
bool southVehicleDetected = false;
bool eastVehicleDetected = false;

// HC-SR04 hanya dianggap mendeteksi jika jarak valid 2-5 cm.
bool northUltrasonicDetected = false;
bool southUltrasonicDetected = false;
bool eastUltrasonicDetected = false;

bool northQueueDetected = false;
bool southQueueDetected = false;
bool eastQueueDetected = false;

int northDistanceCm = 0;
int southDistanceCm = 0;
int eastDistanceCm = 0;

int northQueueEstimateCm = 0;
int southQueueEstimateCm = 0;
int eastQueueEstimateCm = 0;

// IR previous state untuk vehicle counting
bool lastNorthVehicleDetected = false;
bool lastSouthVehicleDetected = false;
bool lastEastVehicleDetected = false;

// Debounce agar satu kendaraan tidak terhitung berkali-kali
unsigned long lastNorthCountAt = 0;
unsigned long lastSouthCountAt = 0;
unsigned long lastEastCountAt = 0;

const unsigned long VEHICLE_COUNT_DEBOUNCE_MS = 1200;

// ============================================================
// SENSOR AND TIME CONFIGURATION
// ============================================================

// HC-SR04 hanya aktif jika objek berada pada jarak 2-5 cm.
// Nilai 0 dari readUltrasonicCm() berarti pembacaan tidak valid/tidak ada echo.
#define ULTRASONIC_DETECT_MAX_CM 5

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
// AUTOMATIC CYCLE STATE
// ============================================================

int trafficPhase = 0;
int previousTrafficPhase = -1;

unsigned long phaseStartedAt = 0;
unsigned long currentGreenDurationMs = 10000;

// ============================================================
// LOOP TIMERS
// ============================================================

unsigned long lastSensorReadAt = 0;
unsigned long lastTelemetryAt = 0;

const unsigned long SENSOR_READ_INTERVAL_MS = 500;
const unsigned long TELEMETRY_INTERVAL_MS = 5000;

// ============================================================
// FUNCTION PROTOTYPES
// ============================================================

bool connectWiFi();

void reconnectMQTT();
void subscribeAllTopics();

void messageReceived(
  char *topic,
  byte *payload,
  unsigned int length
);

void setupPins();

bool isIrDetected(int rawValue);

int readUltrasonicCm(
  int trigPin,
  int echoPin
);

bool isUltrasonicDetected(
  int distanceCm
);

int calculateDensityLevel(
  bool irDetected,
  int distanceCm
);

int calculateQueueEstimateCm(
  int densityLevel
);

void readRealSensorData();
void updateVehicleCount();

void sendTelemetry();

int getDensityForLane(
  const String &lane
);

unsigned long getGreenDurationForLane(
  const String &lane
);

void writeLaneLed(
  int redPin,
  int yellowPin,
  int greenPin,
  const String &color
);

void setAllLightsRed();

void setTrafficLight(
  const String &lane,
  String color,
  bool safeMode = true
);

void resetTrafficCycle();
void cycleTrafficLights();

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
  Serial.println("REAL SENSOR MODE - MQTT AWS EC2");
  Serial.println("IR + HC-SR04 + PHYSICAL LED");
  Serial.println("=======================================");

  Serial.print("Intersection ID: ");
  Serial.println(INTERSECTION_ID);

  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);

  setupPins();

  setAllLightsRed();
  setTrafficLight("north", "green", true);

  while (!connectWiFi())
  {
    Serial.println("WiFi gagal. Mengulang dalam 5 detik...");
    delay(5000);
  }

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(messageReceived);
  client.setBufferSize(2048);

  reconnectMQTT();

  readRealSensorData();

  resetTrafficCycle();
  cycleTrafficLights();

  sendTelemetry();

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

  unsigned long now = millis();

  if (
    now - lastSensorReadAt >=
    SENSOR_READ_INTERVAL_MS
  )
  {
    readRealSensorData();
    lastSensorReadAt = now;
  }

  if (autoMode)
  {
    cycleTrafficLights();
  }

  if (
    now - lastTelemetryAt >=
    TELEMETRY_INTERVAL_MS
  )
  {
    sendTelemetry();
    lastTelemetryAt = now;
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

  digitalWrite(NORTH_TRIG_PIN, LOW);
  digitalWrite(SOUTH_TRIG_PIN, LOW);
  digitalWrite(EAST_TRIG_PIN, LOW);

  setAllLightsRed();
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
  delay(1000);

  WiFi.begin(ssid, wifiPassword);

  int retry = 0;

  while (
    WiFi.status() != WL_CONNECTED &&
    retry < 40
  )
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

    Serial.print("WiFi RSSI: ");
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
// MQTT CONNECTION
// ============================================================

void reconnectMQTT()
{
  while (!client.connected())
  {
    Serial.print("Connecting to MQTT Broker... ");

    String clientId =
      String(DEVICE_ID) +
      "_" +
      String(
        (uint32_t)ESP.getEfuseMac(),
        HEX
      );

    bool connected = client.connect(
      clientId.c_str(),
      MQTT_USER,
      MQTT_PASS
    );

    if (connected)
    {
      Serial.println("Connected!");

      subscribeAllTopics();

      sendTelemetry();
    }
    else
    {
      Serial.print("Failed. MQTT state: ");
      Serial.println(client.state());

      delay(5000);
    }
  }
}

void subscribeAllTopics()
{
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

  Serial.println("Subscribed all MQTT topics.");
}

// ============================================================
// SENSOR HELPERS
// ============================================================

bool isIrDetected(int rawValue)
{
  if (IR_ACTIVE_LOW)
  {
    return rawValue == LOW;
  }

  return rawValue == HIGH;
}

int readUltrasonicCm(
  int trigPin,
  int echoPin
)
{
  digitalWrite(trigPin, LOW);
  delayMicroseconds(3);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);

  digitalWrite(trigPin, LOW);

  unsigned long duration =
    pulseIn(echoPin, HIGH, 30000);

  if (duration == 0)
  {
    return 0;
  }

  int distanceCm =
    static_cast<int>(
      duration * 0.0343 / 2.0
    );

  if (
    distanceCm < 2 ||
    distanceCm > 400
  )
  {
    return 0;
  }

  return distanceCm;
}

bool isUltrasonicDetected(
  int distanceCm
)
{
  return
    distanceCm >= 2 &&
    distanceCm <= ULTRASONIC_DETECT_MAX_CM;
}

int calculateDensityLevel(
  bool irDetected,
  int distanceCm
)
{
  bool ultrasonicDetected =
    isUltrasonicDetected(distanceCm);

  // Level 2: IR dan HC-SR04 sama-sama mendeteksi.
  if (irDetected && ultrasonicDetected)
  {
    return 2;
  }

  // Level 1: salah satu sensor mendeteksi.
  if (irDetected || ultrasonicDetected)
  {
    return 1;
  }

  // Level 0: tidak ada sensor yang mendeteksi.
  return 0;
}

int calculateQueueEstimateCm(
  int densityLevel
)
{
  if (densityLevel == 1)
  {
    return QUEUE_LEVEL_1_CM;
  }

  if (densityLevel == 2)
  {
    return QUEUE_LEVEL_2_CM;
  }

  return QUEUE_LEVEL_0_CM;
}

// ============================================================
// READ REAL SENSOR DATA
// ============================================================

void readRealSensorData()
{
  int northIrRaw = digitalRead(NORTH_IR_PIN);
  int southIrRaw = digitalRead(SOUTH_IR_PIN);
  int eastIrRaw = digitalRead(EAST_IR_PIN);

  northVehicleDetected =
    isIrDetected(northIrRaw);

  southVehicleDetected =
    isIrDetected(southIrRaw);

  eastVehicleDetected =
    isIrDetected(eastIrRaw);

  updateVehicleCount();

  /*
   * HC-SR04 dibaca bergantian agar gelombang antar-sensor
   * tidak terlalu mudah saling mengganggu.
   */
  northDistanceCm = readUltrasonicCm(
    NORTH_TRIG_PIN,
    NORTH_ECHO_PIN
  );

  delay(35);

  southDistanceCm = readUltrasonicCm(
    SOUTH_TRIG_PIN,
    SOUTH_ECHO_PIN
  );

  delay(35);

  eastDistanceCm = readUltrasonicCm(
    EAST_TRIG_PIN,
    EAST_ECHO_PIN
  );

  northUltrasonicDetected =
    isUltrasonicDetected(northDistanceCm);

  southUltrasonicDetected =
    isUltrasonicDetected(southDistanceCm);

  eastUltrasonicDetected =
    isUltrasonicDetected(eastDistanceCm);

  northDensityLevel = calculateDensityLevel(
    northVehicleDetected,
    northDistanceCm
  );

  southDensityLevel = calculateDensityLevel(
    southVehicleDetected,
    southDistanceCm
  );

  eastDensityLevel = calculateDensityLevel(
    eastVehicleDetected,
    eastDistanceCm
  );

  // Queue dianggap padat hanya jika IR dan HC-SR04 sama-sama aktif.
  northQueueDetected =
    northDensityLevel == 2;

  southQueueDetected =
    southDensityLevel == 2;

  eastQueueDetected =
    eastDensityLevel == 2;

  northQueueEstimateCm =
    calculateQueueEstimateCm(
      northDensityLevel
    );

  southQueueEstimateCm =
    calculateQueueEstimateCm(
      southDensityLevel
    );

  eastQueueEstimateCm =
    calculateQueueEstimateCm(
      eastDensityLevel
    );

  Serial.println();
  Serial.println("Real sensor data updated:");

  Serial.print("North | IR: ");
  Serial.print(
    northVehicleDetected
      ? "DETECTED"
      : "CLEAR"
  );
  Serial.print(" | Distance: ");
  Serial.print(northDistanceCm);
  Serial.print(" cm | HC-SR04: ");
  Serial.print(
    northUltrasonicDetected
      ? "DETECTED"
      : "CLEAR"
  );
  Serial.print(" | Density: ");
  Serial.print(northDensityLevel);
  Serial.print(" | Queue Estimate: ");
  Serial.print(northQueueEstimateCm);
  Serial.print(" cm | Count: ");
  Serial.println(northCount);

  Serial.print("South | IR: ");
  Serial.print(
    southVehicleDetected
      ? "DETECTED"
      : "CLEAR"
  );
  Serial.print(" | Distance: ");
  Serial.print(southDistanceCm);
  Serial.print(" cm | HC-SR04: ");
  Serial.print(
    southUltrasonicDetected
      ? "DETECTED"
      : "CLEAR"
  );
  Serial.print(" | Density: ");
  Serial.print(southDensityLevel);
  Serial.print(" | Queue Estimate: ");
  Serial.print(southQueueEstimateCm);
  Serial.print(" cm | Count: ");
  Serial.println(southCount);

  Serial.print("East  | IR: ");
  Serial.print(
    eastVehicleDetected
      ? "DETECTED"
      : "CLEAR"
  );
  Serial.print(" | Distance: ");
  Serial.print(eastDistanceCm);
  Serial.print(" cm | HC-SR04: ");
  Serial.print(
    eastUltrasonicDetected
      ? "DETECTED"
      : "CLEAR"
  );
  Serial.print(" | Density: ");
  Serial.print(eastDensityLevel);
  Serial.print(" | Queue Estimate: ");
  Serial.print(eastQueueEstimateCm);
  Serial.print(" cm | Count: ");
  Serial.println(eastCount);
}

void updateVehicleCount()
{
  unsigned long now = millis();

  if (
    northVehicleDetected &&
    !lastNorthVehicleDetected &&
    now - lastNorthCountAt >=
      VEHICLE_COUNT_DEBOUNCE_MS
  )
  {
    northCount++;
    lastNorthCountAt = now;
  }

  if (
    southVehicleDetected &&
    !lastSouthVehicleDetected &&
    now - lastSouthCountAt >=
      VEHICLE_COUNT_DEBOUNCE_MS
  )
  {
    southCount++;
    lastSouthCountAt = now;
  }

  if (
    eastVehicleDetected &&
    !lastEastVehicleDetected &&
    now - lastEastCountAt >=
      VEHICLE_COUNT_DEBOUNCE_MS
  )
  {
    eastCount++;
    lastEastCountAt = now;
  }

  lastNorthVehicleDetected =
    northVehicleDetected;

  lastSouthVehicleDetected =
    southVehicleDetected;

  lastEastVehicleDetected =
    eastVehicleDetected;
}

// ============================================================
// DENSITY AND GREEN DURATION
// ============================================================

int getDensityForLane(
  const String &lane
)
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

unsigned long getGreenDurationForLane(
  const String &lane
)
{
  if (!adaptiveMode)
  {
    return greenTimeMs;
  }

  int density =
    getDensityForLane(lane);

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
// PHYSICAL LED AND TRAFFIC LIGHT CONTROL
// ============================================================

void writeLaneLed(
  int redPin,
  int yellowPin,
  int greenPin,
  const String &color
)
{
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
}

void setAllLightsRed()
{
  northLight = "red";
  southLight = "red";
  eastLight = "red";

  writeLaneLed(
    NORTH_RED_PIN,
    NORTH_YELLOW_PIN,
    NORTH_GREEN_PIN,
    northLight
  );

  writeLaneLed(
    SOUTH_RED_PIN,
    SOUTH_YELLOW_PIN,
    SOUTH_GREEN_PIN,
    southLight
  );

  writeLaneLed(
    EAST_RED_PIN,
    EAST_YELLOW_PIN,
    EAST_GREEN_PIN,
    eastLight
  );
}

void setTrafficLight(
  const String &lane,
  String color,
  bool safeMode
)
{
  color.trim();
  color.toLowerCase();

  if (
    color != "red" &&
    color != "yellow" &&
    color != "green"
  )
  {
    Serial.println("Invalid light color.");
    return;
  }

  /*
   * Ketika suatu jalur menjadi hijau atau kuning,
   * jalur lainnya otomatis merah.
   */
  if (
    safeMode &&
    (color == "green" || color == "yellow")
  )
  {
    setAllLightsRed();
  }

  if (lane == "north")
  {
    northLight = color;

    writeLaneLed(
      NORTH_RED_PIN,
      NORTH_YELLOW_PIN,
      NORTH_GREEN_PIN,
      northLight
    );
  }
  else if (lane == "south")
  {
    southLight = color;

    writeLaneLed(
      SOUTH_RED_PIN,
      SOUTH_YELLOW_PIN,
      SOUTH_GREEN_PIN,
      southLight
    );
  }
  else if (lane == "east")
  {
    eastLight = color;

    writeLaneLed(
      EAST_RED_PIN,
      EAST_YELLOW_PIN,
      EAST_GREEN_PIN,
      eastLight
    );
  }
  else
  {
    Serial.println("Invalid lane.");
    return;
  }

  Serial.print("Traffic Light ");
  Serial.print(lane);
  Serial.print(" -> ");
  Serial.println(color);
}

// ============================================================
// AUTOMATIC TRAFFIC CYCLE
// ============================================================

void resetTrafficCycle()
{
  trafficPhase = 0;
  previousTrafficPhase = -1;

  phaseStartedAt = millis();

  currentGreenDurationMs =
    getGreenDurationForLane("north");

  Serial.println("Traffic cycle reset.");
}

void cycleTrafficLights()
{
  unsigned long now = millis();

  if (trafficPhase != previousTrafficPhase)
  {
    if (trafficPhase == 0)
    {
      currentGreenDurationMs =
        getGreenDurationForLane("north");

      setTrafficLight(
        "north",
        "green",
        true
      );
    }
    else if (trafficPhase == 1)
    {
      setTrafficLight(
        "north",
        "yellow",
        true
      );
    }
    else if (trafficPhase == 2)
    {
      currentGreenDurationMs =
        getGreenDurationForLane("south");

      setTrafficLight(
        "south",
        "green",
        true
      );
    }
    else if (trafficPhase == 3)
    {
      setTrafficLight(
        "south",
        "yellow",
        true
      );
    }
    else if (trafficPhase == 4)
    {
      currentGreenDurationMs =
        getGreenDurationForLane("east");

      setTrafficLight(
        "east",
        "green",
        true
      );
    }
    else if (trafficPhase == 5)
    {
      setTrafficLight(
        "east",
        "yellow",
        true
      );
    }

    previousTrafficPhase = trafficPhase;
    phaseStartedAt = now;

    sendTelemetry();
  }

  bool greenPhase =
    trafficPhase == 0 ||
    trafficPhase == 2 ||
    trafficPhase == 4;

  unsigned long phaseDuration =
    greenPhase
      ? currentGreenDurationMs
      : yellowTimeMs;

  if (now - phaseStartedAt >= phaseDuration)
  {
    trafficPhase++;

    if (trafficPhase > 5)
    {
      trafficPhase = 0;
    }
  }
}

// ============================================================
// SEND TELEMETRY
// ============================================================

void sendTelemetry()
{
  if (!client.connected())
  {
    return;
  }

  StaticJsonDocument<2048> doc;

  doc["intersection_id"] = INTERSECTION_ID;
  doc["device_id"] = DEVICE_ID;
  doc["device"] = DEVICE_ID;

  doc["north_vehicle_count"] =
    northCount;

  doc["north_vehicle_detected"] =
    northVehicleDetected;

  doc["north_distance_cm"] =
    northDistanceCm;

  doc["north_ultrasonic_detected"] =
    northUltrasonicDetected;

  doc["north_density_level"] =
    northDensityLevel;

  doc["north_queue_detected"] =
    northQueueDetected;

  doc["north_queue_estimate_cm"] =
    northQueueEstimateCm;

  doc["north_light"] =
    northLight;

  doc["north_green_duration_s"] =
    getGreenDurationForLane("north") /
    1000;

  doc["south_vehicle_count"] =
    southCount;

  doc["south_vehicle_detected"] =
    southVehicleDetected;

  doc["south_distance_cm"] =
    southDistanceCm;

  doc["south_ultrasonic_detected"] =
    southUltrasonicDetected;

  doc["south_density_level"] =
    southDensityLevel;

  doc["south_queue_detected"] =
    southQueueDetected;

  doc["south_queue_estimate_cm"] =
    southQueueEstimateCm;

  doc["south_light"] =
    southLight;

  doc["south_green_duration_s"] =
    getGreenDurationForLane("south") /
    1000;

  doc["east_vehicle_count"] =
    eastCount;

  doc["east_vehicle_detected"] =
    eastVehicleDetected;

  doc["east_distance_cm"] =
    eastDistanceCm;

  doc["east_ultrasonic_detected"] =
    eastUltrasonicDetected;

  doc["east_density_level"] =
    eastDensityLevel;

  doc["east_queue_detected"] =
    eastQueueDetected;

  doc["east_queue_estimate_cm"] =
    eastQueueEstimateCm;

  doc["east_light"] =
    eastLight;

  doc["east_green_duration_s"] =
    getGreenDurationForLane("east") /
    1000;

  doc["dummy_mode"] = false;
  doc["sensor_mode"] = true;

  doc["wifi_rssi"] = WiFi.RSSI();
  doc["uptime_s"] = millis() / 1000;

  doc["green_time_s"] =
    greenTimeMs / 1000;

  doc["yellow_time_s"] =
    yellowTimeMs / 1000;

  doc["density_level_0_green_s"] =
    densityLevel0GreenMs / 1000;

  doc["density_level_1_green_s"] =
    densityLevel1GreenMs / 1000;

  doc["density_level_2_green_s"] =
    densityLevel2GreenMs / 1000;

  doc["auto_mode"] = autoMode;
  doc["adaptive_mode"] = adaptiveMode;

  char payload[2048];

  size_t payloadSize =
    serializeJson(doc, payload);

  bool published = client.publish(
    TOPIC_TRAFFIC_DATA,
    reinterpret_cast<uint8_t *>(payload),
    payloadSize,
    false
  );

  if (published)
  {
    Serial.println();
    Serial.println("Telemetry Sent:");
    Serial.println(payload);
  }
  else
  {
    Serial.println("Failed Sending Telemetry.");
  }
}

// ============================================================
// MQTT CALLBACK
// ============================================================

void messageReceived(
  char *topic,
  byte *payload,
  unsigned int length
)
{
  String message = "";

  for (
    unsigned int index = 0;
    index < length;
    index++
  )
  {
    message += (char)payload[index];
  }

  message.trim();
  message.toLowerCase();

  String topicString = String(topic);

  Serial.println();
  Serial.print("MQTT Topic: ");
  Serial.println(topicString);

  Serial.print("MQTT Payload: ");
  Serial.println(message);

  if (topicString == TOPIC_GREEN_TIME_SET)
  {
    int seconds = message.toInt();

    if (seconds >= 1 && seconds <= 120)
    {
      greenTimeMs =
        seconds * 1000UL;

      Serial.println(
        "Manual green duration updated."
      );
    }
  }
  else if (
    topicString == TOPIC_YELLOW_TIME_SET
  )
  {
    int seconds = message.toInt();

    if (seconds >= 1 && seconds <= 30)
    {
      yellowTimeMs =
        seconds * 1000UL;

      Serial.println(
        "Yellow duration updated."
      );
    }
  }
  else if (
    topicString == TOPIC_AUTO_MODE_SET
  )
  {
    if (message == "on")
    {
      autoMode = true;

      resetTrafficCycle();
      cycleTrafficLights();

      Serial.println("Auto Mode ON.");
    }
    else if (message == "off")
    {
      autoMode = false;

      Serial.println("Auto Mode OFF.");
    }
  }
  else if (
    topicString == TOPIC_ADAPTIVE_MODE_SET
  )
  {
    if (message == "on")
    {
      adaptiveMode = true;

      Serial.println("Adaptive Mode ON.");
    }
    else if (message == "off")
    {
      adaptiveMode = false;

      Serial.println("Adaptive Mode OFF.");
    }
  }
  else if (
    topicString == TOPIC_LEVEL0_GREEN_SET
  )
  {
    int seconds = message.toInt();

    if (seconds >= 1 && seconds <= 120)
    {
      densityLevel0GreenMs =
        seconds * 1000UL;
    }
  }
  else if (
    topicString == TOPIC_LEVEL1_GREEN_SET
  )
  {
    int seconds = message.toInt();

    if (seconds >= 1 && seconds <= 120)
    {
      densityLevel1GreenMs =
        seconds * 1000UL;
    }
  }
  else if (
    topicString == TOPIC_LEVEL2_GREEN_SET
  )
  {
    int seconds = message.toInt();

    if (seconds >= 1 && seconds <= 120)
    {
      densityLevel2GreenMs =
        seconds * 1000UL;
    }
  }
  else if (
    topicString == TOPIC_NORTH_LIGHT_SET
  )
  {
    if (!autoMode)
    {
      setTrafficLight(
        "north",
        message,
        true
      );
    }
    else
    {
      Serial.println(
        "Manual command ignored: Auto Mode is ON."
      );
    }
  }
  else if (
    topicString == TOPIC_SOUTH_LIGHT_SET
  )
  {
    if (!autoMode)
    {
      setTrafficLight(
        "south",
        message,
        true
      );
    }
    else
    {
      Serial.println(
        "Manual command ignored: Auto Mode is ON."
      );
    }
  }
  else if (
    topicString == TOPIC_EAST_LIGHT_SET
  )
  {
    if (!autoMode)
    {
      setTrafficLight(
        "east",
        message,
        true
      );
    }
    else
    {
      Serial.println(
        "Manual command ignored: Auto Mode is ON."
      );
    }
  }

  /*
   * Langsung kirim status terbaru agar dashboard
   * menerima konfirmasi tanpa menunggu interval 5 detik.
   */
  sendTelemetry();

  lastTelemetryAt = millis();
}
