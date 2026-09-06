/*
 * ============================================================
 * ASTRAEA CONTROLLER v2.1 — SAFE PROTOTYPE / SENSOR-PRESERVING
 * ============================================================
 *
 * Tujuan:
 * - Mempertahankan wiring sensor/LED dari firmware lama yang sudah
 *   terbukti aman pada maket.
 * - Camera/YOLO menjadi sumber count kendaraan utama.
 * - IR + HC-SR04 tetap dipakai sebagai occupancy / density level:
 *      Level 0 = IR tidak sustained
 *      Level 1 = IR sustained
 *      Level 2 = IR sustained + HC-SR04 sustained
 * - Deteksi sensor harus bertahan pada rolling window, bukan 1 sample.
 * - State machine aman:
 *      STARTUP_ALL_RED
 *      GREEN -> YELLOW -> ALL_RED -> GREEN berikutnya
 * - Manual -> Auto juga harus melalui transisi aman.
 * - WiFi/MQTT reconnect tidak memakai while-loop tak berujung,
 *   sehingga phase engine tetap dapat berjalan lokal ketika cloud mati.
 * - Vision freshness dihitung per-lane.
 * - Config diterapkan atomik + config_version anti-downgrade.
 * - MQTT canonical astraea/v1 + legacy traffic/* dipertahankan sementara.
 *
 * CATATAN:
 * - Ini firmware PROTOTIPE/maket, bukan controller APILL tersertifikasi.
 * - MQTT masih kompatibel dengan broker plaintext 1883 saat ini.
 *   Untuk deployment Internet final, migrasikan ke MQTTS/TLS.
 * - Jangan commit password WiFi / MQTT ke source.
 *
 * Board:
 *   ESP32 Dev Module
 *
 * Libraries:
 *   WiFi (built-in)
 *   PubSubClient
 *   ArduinoJson v6
 *   Preferences (built-in)
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <time.h>

// ============================================================
// DEFAULT CONFIG — ditimpa NVS namespace "astraea"
// ============================================================

#define DEF_INTERSECTION_ID "SIMPANG_TALUN_01"
#define DEF_CONTROLLER_ID   "ESP32_TRAFFIC_01"

#define DEF_WIFI_SSID ""
#define DEF_WIFI_PASS ""

#define DEF_MQTT_HOST "astraea.my.id"
#define DEF_MQTT_PORT 1883
#define DEF_MQTT_USER "jti"
#define DEF_MQTT_PASS "Azure-password123"

#define FW_VERSION "2.1.0"

// ============================================================
// SENSOR / VISION / NETWORK TIMING
// ============================================================

// Mengikuti pola firmware lama yang sudah terbukti:
// ketiga HC-SR04 dibaca bergantian dengan jeda untuk mengurangi cross-talk.
#define SENSOR_SAMPLE_MS 200UL

// Rolling window 2 detik.
#define OCCUPANCY_WINDOW_MS 2000UL
#define OCCUPANCY_SAMPLES (OCCUPANCY_WINDOW_MS / SENSOR_SAMPLE_MS) // 10

#define OCCUPANCY_RATIO_THRESHOLD 0.70f
#define CLEAR_CONFIRM_MS 1000UL

#define VISION_FRESH_TIMEOUT_MS 15000UL

#define TELEMETRY_EVENT_MIN_MS 250UL
#define TELEMETRY_HEARTBEAT_MS 5000UL

#define WIFI_RETRY_MS 5000UL
#define MQTT_RETRY_MS 5000UL

// ============================================================
// PIN DEFINITIONS
// PERSIS mengikuti firmware sensor lama yang user nyatakan aman.
// ============================================================

// South lane LEDs
#define SOUTH_RED_PIN    15
#define SOUTH_YELLOW_PIN 22
#define SOUTH_GREEN_PIN  23

// North lane LEDs
#define NORTH_RED_PIN    18
#define NORTH_YELLOW_PIN 19
#define NORTH_GREEN_PIN  21

// East lane LEDs
#define EAST_RED_PIN    16
#define EAST_YELLOW_PIN 17
#define EAST_GREEN_PIN  5

// IR sensors
#define SOUTH_IR_PIN 34
#define NORTH_IR_PIN 39
#define EAST_IR_PIN  36

// HC-SR04
#define SOUTH_TRIG_PIN 25
#define SOUTH_ECHO_PIN 26

#define NORTH_TRIG_PIN 12
#define NORTH_ECHO_PIN 13

#define EAST_TRIG_PIN 27
#define EAST_ECHO_PIN 14

const bool IR_ACTIVE_LOW = true;

// Threshold sesuai maket lama.
#define ULTRASONIC_DETECT_MAX_CM 5

// Queue estimate legacy hanya untuk kompatibilitas dashboard lama.
#define QUEUE_LEVEL_0_CM 0
#define QUEUE_LEVEL_1_CM 20
#define QUEUE_LEVEL_2_CM 40

// HC-SR04 diagnostic counter lama.
#define VEHICLE_COUNT_DEBOUNCE_MS 200UL
#define ULTRASONIC_CLEAR_HOLD_MS 1000UL

// ============================================================
// RUNTIME CONFIG
// ============================================================

String cfgIntersection = DEF_INTERSECTION_ID;
String cfgController   = DEF_CONTROLLER_ID;

String cfgWifiSsid = DEF_WIFI_SSID;
String cfgWifiPass = DEF_WIFI_PASS;

String cfgMqttHost = DEF_MQTT_HOST;
int    cfgMqttPort = DEF_MQTT_PORT;
String cfgMqttUser = DEF_MQTT_USER;
String cfgMqttPass = DEF_MQTT_PASS;

unsigned long greenTimeMs         = 10000UL;
unsigned long yellowTimeMs        = 3000UL;
unsigned long allRedTimeMs        = 2000UL;
unsigned long minGreenMs          = 10000UL;
unsigned long maxGreenMs          = 60000UL;
unsigned long startupClearanceMs  = 3000UL;

int configVersion = 1;

bool autoMode     = true;
bool adaptiveMode = true;

// Global health flags.
// fallbackMode = tidak ada vision lane yang fresh.
// degradedMode = hanya sebagian lane vision fresh.
bool fallbackMode = true;
bool degradedMode = false;

// ============================================================
// PHASE PLAN PROTOTYPE
//
// Multi-intersection identity sudah dinamis,
// tetapi topology prototype masih 3 lane.
// Phase plan/conflict matrix dynamic dari cloud adalah tahap berikutnya.
// ============================================================

struct PhaseDef {
  const char *lane;
};

static const PhaseDef PHASE_PLAN[] = {
  {"north"},
  {"south"},
  {"east"}
};

static const int PHASE_COUNT =
    sizeof(PHASE_PLAN) / sizeof(PHASE_PLAN[0]);

static const char *LANES[] = {
  "north",
  "south",
  "east"
};

static bool conflicts(
    const String &a,
    const String &b)
{
  if (a == b) return false;

  // Prototype: semua pendekatan saling konflik.
  return true;
}

// ============================================================
// SIGNAL STATE
// ============================================================

enum SigState {
  STARTUP_ALL_RED,
  ACTIVE_GREEN,
  ACTIVE_YELLOW,
  ALL_RED_CLEARANCE,

  MANUAL_HOLD,
  MANUAL_YELLOW,
  MANUAL_ALL_RED,

  RETURN_AUTO_YELLOW,

  FAILSAFE
};

SigState sigState = STARTUP_ALL_RED;

int phaseIndex = 0;

unsigned long stateStartedAt   = 0;
unsigned long currentGreenMs   = 10000UL;

String activeLane       = "";
String pendingManualLane = "";

String northLight = "red";
String southLight = "red";
String eastLight  = "red";

// ============================================================
// SENSOR STATE
// ============================================================

struct LaneOccupancy {
  bool irSamples[OCCUPANCY_SAMPLES];
  bool usSamples[OCCUPANCY_SAMPLES];

  int samplePos = 0;
  int filled    = 0;

  int level = 0;

  bool ultrasonicOnly = false;

  unsigned long clearStartedAt = 0;

  int distanceCm = 0;

  bool irNow = false;
  bool usNow = false;
};

LaneOccupancy occNorth;
LaneOccupancy occSouth;
LaneOccupancy occEast;

// Legacy HC-SR04 counters = diagnostic only.
int legacyCountNorth = 0;
int legacyCountSouth = 0;
int legacyCountEast  = 0;

bool legacyOccupiedNorth = false;
bool legacyOccupiedSouth = false;
bool legacyOccupiedEast  = false;

unsigned long legacyClearNorthAt = 0;
unsigned long legacyClearSouthAt = 0;
unsigned long legacyClearEastAt  = 0;

unsigned long legacyLastNorthCountAt = 0;
unsigned long legacyLastSouthCountAt = 0;
unsigned long legacyLastEastCountAt  = 0;

// ============================================================
// VISION STATE
// ============================================================

struct VisionLane {
  int vehicleCount = 0;
  int queueCount   = 0;

  unsigned long updatedAt = 0;

  bool online = false;
};

VisionLane visNorth;
VisionLane visSouth;
VisionLane visEast;

// ============================================================
// FUZZY RECOMMENDATION
// ============================================================

struct FuzzyRec {
  float greenS = 0.0f;

  unsigned long receivedAt = 0;
  unsigned long validMs    = 10000UL;

  bool fresh() const {
    if (receivedAt == 0) return false;
    return (millis() - receivedAt) <= validMs;
  }
};

FuzzyRec fuzzyNorth;
FuzzyRec fuzzySouth;
FuzzyRec fuzzyEast;

// ============================================================
// LOOP / NETWORK STATE
// ============================================================

unsigned long lastSensorAt       = 0;
unsigned long lastTelemetryAt    = 0;
unsigned long lastVisionHealthAt = 0;

unsigned long lastWiFiAttemptAt  = 0;
unsigned long lastMqttAttemptAt  = 0;

bool telemetryDirty = true;
bool ntpStarted     = false;

Preferences prefs;

WiFiClient espClient;
PubSubClient client(espClient);

// ============================================================
// FORWARD DECLARATIONS
// ============================================================

void sendTelemetry();
void publishAck(
    const String &action,
    bool accepted,
    const String &reason);

void runSignalEngine();

void startAutoSafely();
void enterManualModeSafely();

bool beginManualGreen(
    const String &lane);

bool beginManualYellow(
    const String &lane);

void updateVisionHealth();

// ============================================================
// NVS CONFIG
// ============================================================

void loadConfig()
{
  prefs.begin("astraea", true);

  cfgIntersection =
      prefs.getString(
          "intersection",
          DEF_INTERSECTION_ID);

  cfgController =
      prefs.getString(
          "controller",
          DEF_CONTROLLER_ID);

  cfgWifiSsid =
      prefs.getString(
          "wifi_ssid",
          DEF_WIFI_SSID);

  cfgWifiPass =
      prefs.getString(
          "wifi_pass",
          DEF_WIFI_PASS);

  cfgMqttHost =
      prefs.getString(
          "mqtt_host",
          DEF_MQTT_HOST);

  cfgMqttPort =
      prefs.getInt(
          "mqtt_port",
          DEF_MQTT_PORT);

  cfgMqttUser =
      prefs.getString(
          "mqtt_user",
          DEF_MQTT_USER);

  cfgMqttPass =
      prefs.getString(
          "mqtt_pass",
          DEF_MQTT_PASS);

  greenTimeMs =
      prefs.getULong(
          "green_ms",
          10000UL);

  yellowTimeMs =
      prefs.getULong(
          "yellow_ms",
          3000UL);

  allRedTimeMs =
      prefs.getULong(
          "allred_ms",
          2000UL);

  minGreenMs =
      prefs.getULong(
          "mingreen_ms",
          10000UL);

  maxGreenMs =
      prefs.getULong(
          "maxgreen_ms",
          60000UL);

  configVersion =
      prefs.getInt(
          "cfg_version",
          1);

  autoMode =
      prefs.getBool(
          "auto_mode",
          true);

  adaptiveMode =
      prefs.getBool(
          "adaptive_mode",
          true);

  prefs.end();

  // Safety clamp pada config lama/NVS rusak.
  if (yellowTimeMs < 1000UL || yellowTimeMs > 30000UL)
    yellowTimeMs = 3000UL;

  if (allRedTimeMs < 1000UL || allRedTimeMs > 10000UL)
    allRedTimeMs = 2000UL;

  if (minGreenMs < 1000UL || minGreenMs > 120000UL)
    minGreenMs = 10000UL;

  if (maxGreenMs < minGreenMs || maxGreenMs > 120000UL)
    maxGreenMs = 60000UL;

  greenTimeMs =
      constrain(
          greenTimeMs,
          minGreenMs,
          maxGreenMs);
}

void saveConfig()
{
  prefs.begin("astraea", false);

  prefs.putString(
      "intersection",
      cfgIntersection);

  prefs.putString(
      "controller",
      cfgController);

  prefs.putString(
      "wifi_ssid",
      cfgWifiSsid);

  prefs.putString(
      "wifi_pass",
      cfgWifiPass);

  prefs.putString(
      "mqtt_host",
      cfgMqttHost);

  prefs.putInt(
      "mqtt_port",
      cfgMqttPort);

  prefs.putString(
      "mqtt_user",
      cfgMqttUser);

  prefs.putString(
      "mqtt_pass",
      cfgMqttPass);

  prefs.putULong(
      "green_ms",
      greenTimeMs);

  prefs.putULong(
      "yellow_ms",
      yellowTimeMs);

  prefs.putULong(
      "allred_ms",
      allRedTimeMs);

  prefs.putULong(
      "mingreen_ms",
      minGreenMs);

  prefs.putULong(
      "maxgreen_ms",
      maxGreenMs);

  prefs.putInt(
      "cfg_version",
      configVersion);

  prefs.putBool(
      "auto_mode",
      autoMode);

  prefs.putBool(
      "adaptive_mode",
      adaptiveMode);

  prefs.end();
}

// ============================================================
// TOPICS
// ============================================================

String baseV1()
{
  return
      "astraea/v1/intersections/" +
      cfgIntersection;
}

String topicTelemetry()
{
  return
      baseV1() +
      "/controllers/" +
      cfgController +
      "/telemetry";
}

String topicStatus()
{
  return
      baseV1() +
      "/controllers/" +
      cfgController +
      "/status";
}

String topicCommand()
{
  return
      baseV1() +
      "/controllers/" +
      cfgController +
      "/command";
}

String topicAck()
{
  return
      baseV1() +
      "/controllers/" +
      cfgController +
      "/ack";
}

String topicRecommendation()
{
  return
      baseV1() +
      "/control/recommendation";
}

String topicVisionMetrics()
{
  return
      baseV1() +
      "/vision/metrics";
}

// Legacy compatibility.
String topicLegacyData()
{
  return
      "traffic/" +
      cfgController +
      "/data";
}

String topicLegacyConfig()
{
  return
      "traffic/" +
      cfgController +
      "/config/set";
}

String topicLegacyLight(
    const String &lane)
{
  return
      "traffic/" +
      cfgController +
      "/light/" +
      lane +
      "/set";
}

// ============================================================
// HELPERS
// ============================================================

String sigStateName()
{
  switch (sigState) {
    case STARTUP_ALL_RED:   return "STARTUP_ALL_RED";
    case ACTIVE_GREEN:      return "ACTIVE_GREEN";
    case ACTIVE_YELLOW:     return "ACTIVE_YELLOW";
    case ALL_RED_CLEARANCE: return "ALL_RED_CLEARANCE";
    case MANUAL_HOLD:       return "MANUAL_HOLD";
    case MANUAL_YELLOW:     return "MANUAL_YELLOW";
    case MANUAL_ALL_RED:    return "MANUAL_ALL_RED";
    case RETURN_AUTO_YELLOW:return "RETURN_AUTO_YELLOW";
    case FAILSAFE:          return "FAILSAFE";
  }

  return "UNKNOWN";
}

String isoUtcNow()
{
  time_t now = time(nullptr);

  // Angka di bawah hanya sanity check agar uptime awal 1970
  // tidak dikira UTC valid.
  if (now < 1700000000) {
    return "";
  }

  struct tm tmUtc;
  gmtime_r(
      &now,
      &tmUtc);

  char buf[32];

  strftime(
      buf,
      sizeof(buf),
      "%Y-%m-%dT%H:%M:%SZ",
      &tmUtc);

  return String(buf);
}

void enterState(
    SigState s)
{
  sigState      = s;
  stateStartedAt = millis();

  telemetryDirty = true;

  Serial.print(
      "[SIGNAL] State -> ");

  Serial.println(
      sigStateName());
}

// ============================================================
// LED / SAFETY PRIMITIVES
// ============================================================

void writeLaneLed(
    int redPin,
    int yellowPin,
    int greenPin,
    const String &color)
{
  digitalWrite(
      redPin,
      LOW);

  digitalWrite(
      yellowPin,
      LOW);

  digitalWrite(
      greenPin,
      LOW);

  if (color == "red")
    digitalWrite(redPin, HIGH);

  else if (color == "yellow")
    digitalWrite(yellowPin, HIGH);

  else if (color == "green")
    digitalWrite(greenPin, HIGH);
}

void applyLights()
{
  writeLaneLed(
      NORTH_RED_PIN,
      NORTH_YELLOW_PIN,
      NORTH_GREEN_PIN,
      northLight);

  writeLaneLed(
      SOUTH_RED_PIN,
      SOUTH_YELLOW_PIN,
      SOUTH_GREEN_PIN,
      southLight);

  writeLaneLed(
      EAST_RED_PIN,
      EAST_YELLOW_PIN,
      EAST_GREEN_PIN,
      eastLight);
}

void setAllLightsRed()
{
  northLight = "red";
  southLight = "red";
  eastLight  = "red";

  applyLights();
}

String *lightOf(
    const String &lane)
{
  if (lane == "north")
    return &northLight;

  if (lane == "south")
    return &southLight;

  if (lane == "east")
    return &eastLight;

  return nullptr;
}

String currentNonRedLane()
{
  for (int i = 0; i < 3; i++) {
    String lane(LANES[i]);

    String *light =
        lightOf(lane);

    if (light != nullptr &&
        *light != "red")
    {
      return lane;
    }
  }

  return "";
}

bool requestGreen(
    const String &lane)
{
  String *target =
      lightOf(lane);

  if (target == nullptr)
    return false;

  for (int i = 0; i < 3; i++) {
    String other(LANES[i]);

    if (other == lane)
      continue;

    String *otherLight =
        lightOf(other);

    if (otherLight == nullptr)
      return false;

    if (conflicts(lane, other) &&
        *otherLight != "red")
    {
      return false;
    }
  }

  // Green hanya boleh dimulai setelah state machine
  // sebelumnya sudah membuat semua lane merah.
  setAllLightsRed();

  *target = "green";

  applyLights();

  return true;
}

bool requestYellowSafe(
    const String &lane)
{
  String *target =
      lightOf(lane);

  if (target == nullptr)
    return false;

  setAllLightsRed();

  *target = "yellow";

  applyLights();

  return true;
}

void enterFailsafe(
    const String &reason)
{
  Serial.print(
      "[FAILSAFE] ");

  Serial.println(
      reason);

  setAllLightsRed();

  enterState(
      FAILSAFE);
}

// ============================================================
// SENSOR HELPERS
// ============================================================

bool irDetectedNow(
    int pin)
{
  int raw =
      digitalRead(pin);

  if (IR_ACTIVE_LOW)
    return raw == LOW;

  return raw == HIGH;
}

int readUltrasonicCm(
    int trigPin,
    int echoPin)
{
  digitalWrite(
      trigPin,
      LOW);

  delayMicroseconds(3);

  digitalWrite(
      trigPin,
      HIGH);

  delayMicroseconds(10);

  digitalWrite(
      trigPin,
      LOW);

  unsigned long duration =
      pulseIn(
          echoPin,
          HIGH,
          30000UL);

  if (duration == 0)
    return 0;

  int distanceCm =
      static_cast<int>(
          duration *
          0.0343f /
          2.0f);

  if (distanceCm < 2 ||
      distanceCm > 400)
  {
    return 0;
  }

  return distanceCm;
}

bool ultrasonicDetectedNow(
    int distanceCm)
{
  return
      distanceCm > 0 &&
      distanceCm <=
          ULTRASONIC_DETECT_MAX_CM;
}

float occupancyRatio(
    bool *samples,
    int filled)
{
  if (filled <= 0)
    return 0.0f;

  int detected = 0;

  for (int i = 0; i < filled; i++) {
    if (samples[i])
      detected++;
  }

  return
      static_cast<float>(detected) /
      static_cast<float>(filled);
}

void pushSample(
    LaneOccupancy &occ,
    bool ir,
    bool us)
{
  occ.irSamples[occ.samplePos] = ir;
  occ.usSamples[occ.samplePos] = us;

  occ.samplePos =
      (occ.samplePos + 1) %
      OCCUPANCY_SAMPLES;

  if (occ.filled <
      OCCUPANCY_SAMPLES)
  {
    occ.filled++;
  }

  occ.irNow = ir;
  occ.usNow = us;
}

void evaluateLane(
    LaneOccupancy &occ)
{
  // Wajib menunggu satu rolling window penuh.
  // Jadi satu pulse singkat saat boot tidak langsung menjadi Level 1/2.
  if (occ.filled < OCCUPANCY_SAMPLES) {
    return;
  }

  float irRatio =
      occupancyRatio(
          occ.irSamples,
          occ.filled);

  float usRatio =
      occupancyRatio(
          occ.usSamples,
          occ.filled);

  bool irSustained =
      irRatio >=
      OCCUPANCY_RATIO_THRESHOLD;

  bool usSustained =
      usRatio >=
      OCCUPANCY_RATIO_THRESHOLD;

  occ.ultrasonicOnly =
      !irSustained &&
      usSustained;

  int target = 0;

  if (irSustained &&
      usSustained)
  {
    target = 2;
  }
  else if (irSustained)
  {
    target = 1;
  }
  else
  {
    target = 0;
  }

  unsigned long now =
      millis();

  if (target == occ.level) {
    occ.clearStartedAt = 0;
    return;
  }

  // Naik level langsung setelah rolling window memenuhi syarat.
  if (target > occ.level) {
    occ.level = target;
    occ.clearStartedAt = 0;
    telemetryDirty = true;
    return;
  }

  // Turun level perlu clear confirm tambahan.
  if (occ.clearStartedAt == 0) {
    occ.clearStartedAt = now;
    return;
  }

  if (now - occ.clearStartedAt >=
      CLEAR_CONFIRM_MS)
  {
    occ.level = target;
    occ.clearStartedAt = 0;
    telemetryDirty = true;
  }
}

bool updateLegacyLaneCount(
    int distanceCm,
    bool &occupied,
    unsigned long &clearStartedAt,
    unsigned long &lastCountAt,
    int &counter)
{
  bool detected =
      ultrasonicDetectedNow(
          distanceCm);

  unsigned long now =
      millis();

  bool changed = false;

  if (detected) {
    clearStartedAt = 0;

    if (!occupied &&
        now - lastCountAt >=
            VEHICLE_COUNT_DEBOUNCE_MS)
    {
      counter++;
      lastCountAt = now;
      changed = true;
    }

    occupied = true;
  }
  else if (occupied) {
    if (clearStartedAt == 0)
      clearStartedAt = now;

    if (now - clearStartedAt >=
        ULTRASONIC_CLEAR_HOLD_MS)
    {
      occupied = false;
      clearStartedAt = 0;
    }
  }

  return changed;
}

LaneOccupancy *occOf(
    const String &lane)
{
  if (lane == "north")
    return &occNorth;

  if (lane == "south")
    return &occSouth;

  if (lane == "east")
    return &occEast;

  return nullptr;
}

// ============================================================
// SENSOR SAMPLING
//
// Pola dibaca seperti firmware lama:
// N -> delay 35 ms -> S -> delay 35 ms -> E.
// ============================================================

void sampleSensors()
{
  bool prevNorthIr = occNorth.irNow;
  bool prevSouthIr = occSouth.irNow;
  bool prevEastIr  = occEast.irNow;

  bool prevNorthUs = occNorth.usNow;
  bool prevSouthUs = occSouth.usNow;
  bool prevEastUs  = occEast.usNow;

  bool northIr =
      irDetectedNow(
          NORTH_IR_PIN);

  bool southIr =
      irDetectedNow(
          SOUTH_IR_PIN);

  bool eastIr =
      irDetectedNow(
          EAST_IR_PIN);

  int northCm =
      readUltrasonicCm(
          NORTH_TRIG_PIN,
          NORTH_ECHO_PIN);

  delay(35);

  int southCm =
      readUltrasonicCm(
          SOUTH_TRIG_PIN,
          SOUTH_ECHO_PIN);

  delay(35);

  int eastCm =
      readUltrasonicCm(
          EAST_TRIG_PIN,
          EAST_ECHO_PIN);

  bool northUs =
      ultrasonicDetectedNow(
          northCm);

  bool southUs =
      ultrasonicDetectedNow(
          southCm);

  bool eastUs =
      ultrasonicDetectedNow(
          eastCm);

  occNorth.distanceCm = northCm;
  occSouth.distanceCm = southCm;
  occEast.distanceCm  = eastCm;

  pushSample(
      occNorth,
      northIr,
      northUs);

  pushSample(
      occSouth,
      southIr,
      southUs);

  pushSample(
      occEast,
      eastIr,
      eastUs);

  evaluateLane(
      occNorth);

  evaluateLane(
      occSouth);

  evaluateLane(
      occEast);

  bool legacyChanged = false;

  legacyChanged |=
      updateLegacyLaneCount(
          northCm,
          legacyOccupiedNorth,
          legacyClearNorthAt,
          legacyLastNorthCountAt,
          legacyCountNorth);

  legacyChanged |=
      updateLegacyLaneCount(
          southCm,
          legacyOccupiedSouth,
          legacyClearSouthAt,
          legacyLastSouthCountAt,
          legacyCountSouth);

  legacyChanged |=
      updateLegacyLaneCount(
          eastCm,
          legacyOccupiedEast,
          legacyClearEastAt,
          legacyLastEastCountAt,
          legacyCountEast);

  if (legacyChanged ||
      prevNorthIr != occNorth.irNow ||
      prevSouthIr != occSouth.irNow ||
      prevEastIr  != occEast.irNow ||
      prevNorthUs != occNorth.usNow ||
      prevSouthUs != occSouth.usNow ||
      prevEastUs  != occEast.usNow)
  {
    telemetryDirty = true;
  }
}

// ============================================================
// VISION / FUZZY HELPERS
// ============================================================

VisionLane *visionOf(
    const String &lane)
{
  if (lane == "north")
    return &visNorth;

  if (lane == "south")
    return &visSouth;

  if (lane == "east")
    return &visEast;

  return nullptr;
}

FuzzyRec *fuzzyOf(
    const String &lane)
{
  if (lane == "north")
    return &fuzzyNorth;

  if (lane == "south")
    return &fuzzySouth;

  if (lane == "east")
    return &fuzzyEast;

  return nullptr;
}

bool visionFresh(
    const String &lane)
{
  VisionLane *v =
      visionOf(lane);

  if (v == nullptr ||
      !v->online ||
      v->updatedAt == 0)
  {
    return false;
  }

  return
      (millis() - v->updatedAt) <=
      VISION_FRESH_TIMEOUT_MS;
}

int freshVisionLaneCount()
{
  int fresh = 0;

  if (visionFresh("north"))
    fresh++;

  if (visionFresh("south"))
    fresh++;

  if (visionFresh("east"))
    fresh++;

  return fresh;
}

String visionStateName()
{
  int fresh =
      freshVisionLaneCount();

  if (fresh == 3)
    return "NORMAL";

  if (fresh > 0)
    return "DEGRADED";

  return "FALLBACK";
}

void updateVisionHealth()
{
  int fresh =
      freshVisionLaneCount();

  bool nextFallback =
      fresh == 0;

  bool nextDegraded =
      fresh > 0 &&
      fresh < 3;

  if (nextFallback != fallbackMode ||
      nextDegraded != degradedMode)
  {
    fallbackMode = nextFallback;
    degradedMode = nextDegraded;

    telemetryDirty = true;

    Serial.print(
        "[VISION] State -> ");

    Serial.println(
        visionStateName());
  }
}

unsigned long greenForLane(
    const String &lane)
{
  if (!adaptiveMode) {
    return
        constrain(
            greenTimeMs,
            minGreenMs,
            maxGreenMs);
  }

  FuzzyRec *f =
      fuzzyOf(lane);

  if (f != nullptr &&
      f->fresh())
  {
    unsigned long candidate =
        static_cast<unsigned long>(
            f->greenS *
            1000.0f);

    return
        constrain(
            candidate,
            minGreenMs,
            maxGreenMs);
  }

  // Fallback lokal:
  // level sensor tetap berfungsi walaupun vision/cloud mati.
  LaneOccupancy *o =
      occOf(lane);

  int level =
      o != nullptr
          ? o->level
          : 0;

  unsigned long localGreen =
      minGreenMs;

  if (level == 2)
    localGreen = maxGreenMs;

  else if (level == 1)
    localGreen =
        minGreenMs +
        (maxGreenMs - minGreenMs) / 2UL;

  return
      constrain(
          localGreen,
          minGreenMs,
          maxGreenMs);
}

// ============================================================
// SIGNAL ENGINE
// ============================================================

bool startAutomaticPhase(
    int index)
{
  if (index < 0 ||
      index >= PHASE_COUNT)
  {
    return false;
  }

  phaseIndex = index;

  activeLane =
      PHASE_PLAN[phaseIndex].lane;

  currentGreenMs =
      greenForLane(
          activeLane);

  if (!requestGreen(
          activeLane))
  {
    return false;
  }

  enterState(
      ACTIVE_GREEN);

  return true;
}

void startAutoSafely()
{
  pendingManualLane = "";

  autoMode = true;

  String current =
      currentNonRedLane();

  if (current.length() > 0) {
    String *light =
        lightOf(current);

    if (light != nullptr &&
        *light == "green")
    {
      activeLane = current;

      requestYellowSafe(
          current);

      enterState(
          RETURN_AUTO_YELLOW);

      return;
    }
  }

  // Bila sudah merah / yellow / unknown,
  // paksa ALL_RED lalu clearance.
  setAllLightsRed();

  phaseIndex =
      PHASE_COUNT - 1;

  activeLane = "";

  enterState(
      ALL_RED_CLEARANCE);
}

void enterManualModeSafely()
{
  autoMode = false;

  pendingManualLane = "";

  String current =
      currentNonRedLane();

  if (current.length() > 0) {
    String *light =
        lightOf(current);

    if (light != nullptr &&
        *light == "green")
    {
      activeLane = current;

      requestYellowSafe(
          current);

      enterState(
          MANUAL_YELLOW);

      return;
    }
  }

  setAllLightsRed();

  enterState(
      MANUAL_ALL_RED);
}

bool beginManualGreen(
    const String &lane)
{
  if (autoMode)
    return false;

  if (lightOf(lane) == nullptr)
    return false;

  String current =
      currentNonRedLane();

  // Sudah hijau lane yang sama.
  if (current == lane &&
      *lightOf(lane) == "green")
  {
    pendingManualLane = "";
    enterState(MANUAL_HOLD);
    return true;
  }

  pendingManualLane = lane;

  if (current.length() > 0) {
    String *light =
        lightOf(current);

    if (light != nullptr &&
        *light == "green")
    {
      activeLane = current;

      requestYellowSafe(
          current);

      enterState(
          MANUAL_YELLOW);

      return true;
    }
  }

  setAllLightsRed();

  enterState(
      MANUAL_ALL_RED);

  return true;
}

bool beginManualYellow(
    const String &lane)
{
  if (autoMode)
    return false;

  String *light =
      lightOf(lane);

  if (light == nullptr ||
      *light != "green")
  {
    return false;
  }

  pendingManualLane = "";

  activeLane = lane;

  requestYellowSafe(
      lane);

  enterState(
      MANUAL_YELLOW);

  return true;
}

void runSignalEngine()
{
  unsigned long now =
      millis();

  switch (sigState) {

    case STARTUP_ALL_RED:
    {
      setAllLightsRed();

      if (now - stateStartedAt >=
          startupClearanceMs)
      {
        if (autoMode) {
          if (!startAutomaticPhase(0))
            enterFailsafe(
                "startup phase gagal");
        }
        else {
          enterState(
              MANUAL_HOLD);
        }
      }

      break;
    }

    case ACTIVE_GREEN:
    {
      if (!autoMode) {
        enterManualModeSafely();
        break;
      }

      if (now - stateStartedAt >=
          currentGreenMs)
      {
        if (!requestYellowSafe(
                activeLane))
        {
          enterFailsafe(
              "yellow transition gagal");

          break;
        }

        enterState(
            ACTIVE_YELLOW);
      }

      break;
    }

    case ACTIVE_YELLOW:
    {
      if (now - stateStartedAt >=
          yellowTimeMs)
      {
        setAllLightsRed();

        enterState(
            ALL_RED_CLEARANCE);
      }

      break;
    }

    case ALL_RED_CLEARANCE:
    {
      if (!autoMode) {
        enterState(
            MANUAL_HOLD);

        break;
      }

      if (now - stateStartedAt >=
          allRedTimeMs)
      {
        int next =
            (phaseIndex + 1) %
            PHASE_COUNT;

        if (!startAutomaticPhase(
                next))
        {
          enterFailsafe(
              "next phase conflict");
        }
      }

      break;
    }

    case MANUAL_YELLOW:
    {
      if (now - stateStartedAt >=
          yellowTimeMs)
      {
        setAllLightsRed();

        enterState(
            MANUAL_ALL_RED);
      }

      break;
    }

    case MANUAL_ALL_RED:
    {
      if (now - stateStartedAt <
          allRedTimeMs)
      {
        break;
      }

      if (pendingManualLane.length() == 0) {
        enterState(
            MANUAL_HOLD);

        break;
      }

      String target =
          pendingManualLane;

      pendingManualLane = "";

      if (!requestGreen(
              target))
      {
        enterFailsafe(
            "manual target conflict");

        break;
      }

      activeLane = target;

      enterState(
          MANUAL_HOLD);

      break;
    }

    case MANUAL_HOLD:
    {
      // Operator memegang state.
      // Tidak ada perubahan otomatis.
      break;
    }

    case RETURN_AUTO_YELLOW:
    {
      if (now - stateStartedAt >=
          yellowTimeMs)
      {
        setAllLightsRed();

        phaseIndex =
            PHASE_COUNT - 1;

        activeLane = "";

        enterState(
            ALL_RED_CLEARANCE);
      }

      break;
    }

    case FAILSAFE:
    {
      setAllLightsRed();
      break;
    }
  }
}

// ============================================================
// WIFI / NTP — APPLICATION-LEVEL NON-BLOCKING
// ============================================================

void beginWiFiAttempt()
{
  if (cfgWifiSsid.length() == 0) {
    return;
  }

  lastWiFiAttemptAt =
      millis();

  Serial.print(
      "[WIFI] mencoba SSID ");

  Serial.println(
      cfgWifiSsid);

  WiFi.mode(
      WIFI_STA);

  WiFi.setSleep(
      false);

  WiFi.disconnect();

  WiFi.begin(
      cfgWifiSsid.c_str(),
      cfgWifiPass.c_str());
}

void maintainWiFi()
{
  if (WiFi.status() ==
      WL_CONNECTED)
  {
    if (!ntpStarted) {
      configTime(
          0,
          0,
          "pool.ntp.org",
          "time.google.com");

      ntpStarted = true;

      Serial.println(
          "[NTP] sync dimulai");
    }

    return;
  }

  unsigned long now =
      millis();

  if (cfgWifiSsid.length() == 0)
    return;

  if (lastWiFiAttemptAt == 0 ||
      now - lastWiFiAttemptAt >=
          WIFI_RETRY_MS)
  {
    beginWiFiAttempt();
  }
}

// ============================================================
// MQTT
// ============================================================

void publishStatus(
    const char *status)
{
  if (!client.connected())
    return;

  client.publish(
      topicStatus().c_str(),
      status,
      true);
}

void subscribeAll()
{
  client.subscribe(
      topicCommand().c_str());

  client.subscribe(
      topicRecommendation().c_str());

  client.subscribe(
      topicVisionMetrics().c_str());

  // Legacy
  client.subscribe(
      topicLegacyConfig().c_str());

  client.subscribe(
      topicLegacyLight("north").c_str());

  client.subscribe(
      topicLegacyLight("south").c_str());

  client.subscribe(
      topicLegacyLight("east").c_str());
}

bool tryMqttConnect()
{
  if (client.connected())
    return true;

  if (WiFi.status() !=
      WL_CONNECTED)
  {
    return false;
  }

  unsigned long now =
      millis();

  if (lastMqttAttemptAt != 0 &&
      now - lastMqttAttemptAt <
          MQTT_RETRY_MS)
  {
    return false;
  }

  lastMqttAttemptAt = now;

  Serial.print(
      "[MQTT] connect ");

  Serial.print(
      cfgMqttHost);

  Serial.print(":");

  Serial.println(
      cfgMqttPort);

  String clientId =
      cfgController +
      "_" +
      String(
          static_cast<uint32_t>(
              ESP.getEfuseMac() &
              0xFFFFFFFFULL),
          HEX);

  String willTopic =
      topicStatus();

  bool ok =
      client.connect(
          clientId.c_str(),
          cfgMqttUser.c_str(),
          cfgMqttPass.c_str(),
          willTopic.c_str(),
          0,
          true,
          "offline");

  if (!ok) {
    Serial.print(
        "[MQTT] gagal state=");

    Serial.println(
        client.state());

    return false;
  }

  Serial.println(
      "[MQTT] connected");

  subscribeAll();

  publishStatus(
      "online");

  publishAck(
      "reconnected",
      true,
      "");

  telemetryDirty = true;

  return true;
}

void maintainMQTT()
{
  if (WiFi.status() !=
      WL_CONNECTED)
  {
    return;
  }

  if (!client.connected()) {
    tryMqttConnect();
    return;
  }

  client.loop();
}

// ============================================================
// SERIAL PROVISIONING
//
// Commands:
//   set wifi <ssid> <pass>
//   set mqtt <host> <port> <user> <pass>
//   set id <intersection> <controller>
//   show
// ============================================================

void handleSerialProvisioning()
{
  if (!Serial.available())
    return;

  String line =
      Serial.readStringUntil(
          '\n');

  line.trim();

  if (line.startsWith(
          "set wifi "))
  {
    int split =
        line.indexOf(
            ' ',
            9);

    if (split > 0) {
      cfgWifiSsid =
          line.substring(
              9,
              split);

      cfgWifiPass =
          line.substring(
              split + 1);

      saveConfig();

      ntpStarted = false;
      lastWiFiAttemptAt = 0;

      WiFi.disconnect();

      Serial.println(
          "WiFi disimpan dan akan dicoba ulang.");

      return;
    }
  }

  if (line.startsWith(
          "set mqtt "))
  {
    // set mqtt <host> <port> <user> <pass>
    int p1 =
        line.indexOf(
            ' ',
            9);

    int p2 =
        line.indexOf(
            ' ',
            p1 + 1);

    int p3 =
        line.indexOf(
            ' ',
            p2 + 1);

    if (p1 > 0 &&
        p2 > 0 &&
        p3 > 0)
    {
      String host =
          line.substring(
              9,
              p1);

      int port =
          line.substring(
              p1 + 1,
              p2).toInt();

      String user =
          line.substring(
              p2 + 1,
              p3);

      String pass =
          line.substring(
              p3 + 1);

      if (port >= 1 &&
          port <= 65535)
      {
        cfgMqttHost = host;
        cfgMqttPort = port;
        cfgMqttUser = user;
        cfgMqttPass = pass;

        saveConfig();

        if (client.connected()) {
          publishStatus(
              "offline");

          client.disconnect();
        }

        client.setServer(
            cfgMqttHost.c_str(),
            cfgMqttPort);

        lastMqttAttemptAt = 0;

        Serial.println(
            "MQTT config disimpan.");

        return;
      }
    }
  }

  if (line.startsWith(
          "set id "))
  {
    int split =
        line.indexOf(
            ' ',
            7);

    if (split > 0) {
      cfgIntersection =
          line.substring(
              7,
              split);

      cfgController =
          line.substring(
              split + 1);

      saveConfig();

      if (client.connected()) {
        publishStatus(
            "offline");

        client.disconnect();
      }

      lastMqttAttemptAt = 0;

      Serial.println(
          "Identity disimpan.");

      return;
    }
  }

  if (line == "show") {
    Serial.print(
        "intersection=");

    Serial.println(
        cfgIntersection);

    Serial.print(
        "controller=");

    Serial.println(
        cfgController);

    Serial.print(
        "mqtt=");

    Serial.print(
        cfgMqttHost);

    Serial.print(":");

    Serial.println(
        cfgMqttPort);

    Serial.print(
        "fw=");

    Serial.println(
        FW_VERSION);

    Serial.print(
        "cfg_version=");

    Serial.println(
        configVersion);

    Serial.print(
        "wifi_status=");

    Serial.println(
        WiFi.status() ==
                WL_CONNECTED
            ? "connected"
            : "offline");

    return;
  }

  Serial.println(
      "Command tidak dikenal.");
}

// ============================================================
// ACK
// ============================================================

void publishAck(
    const String &action,
    bool accepted,
    const String &reason)
{
  if (!client.connected())
    return;

  StaticJsonDocument<768> doc;

  doc["schema_version"] = 1;
  doc["intersection_id"] = cfgIntersection;
  doc["controller_id"]   = cfgController;
  doc["action"]          = action;
  doc["accepted"]        = accepted;

  if (reason.length() > 0)
    doc["reason"] = reason;

  doc["config_version"] = configVersion;
  doc["sig_state"]      = sigStateName();

  String ts =
      isoUtcNow();

  if (ts.length() > 0)
    doc["timestamp"] = ts;

  else
    doc["timestamp"] = nullptr;

  char buf[768];

  size_t n =
      serializeJson(
          doc,
          buf);

  client.publish(
      topicAck().c_str(),
      reinterpret_cast<uint8_t *>(buf),
      n,
      false);
}

// ============================================================
// TELEMETRY
// ============================================================

void laneJson(
    JsonObject &obj,
    const String &lane)
{
  LaneOccupancy *o =
      occOf(lane);

  VisionLane *v =
      visionOf(lane);

  bool vf =
      visionFresh(lane);

  String *light =
      lightOf(lane);

  obj["light"] =
      light != nullptr
          ? *light
          : "red";

  if (vf && v != nullptr) {
    obj["camera_vehicle_count"] =
        v->vehicleCount;

    obj["camera_queue_count"] =
        v->queueCount;

    obj["vehicle_count_valid"] =
        true;

    obj["vehicle_count_source"] =
        "camera";
  }
  else {
    obj["camera_vehicle_count"] =
        nullptr;

    obj["camera_queue_count"] =
        nullptr;

    obj["vehicle_count_valid"] =
        false;

    obj["vehicle_count_source"] =
        "vision_stale";
  }

  if (o != nullptr) {
    obj["sensor_level"] =
        o->level;

    obj["ir_occupied"] =
        o->irNow;

    obj["ultrasonic_occupied"] =
        o->usNow;

    obj["ultrasonic_only_diagnostic"] =
        o->ultrasonicOnly;

    obj["distance_cm"] =
        o->distanceCm;
  }

  FuzzyRec *f =
      fuzzyOf(lane);

  if (f != nullptr && f->fresh()) {
    obj["recommended_green_s"] =
        f->greenS;
  }
  else {
    obj["recommended_green_s"] =
        nullptr;
  }

  obj["effective_green_s"] =
      greenForLane(lane) /
      1000UL;

  obj["vision_fresh"] =
      vf;
}

void sendTelemetry()
{
  if (!client.connected())
    return;

  StaticJsonDocument<3072> doc;

  doc["schema_version"] = 1;
  doc["intersection_id"] = cfgIntersection;
  doc["controller_id"]   = cfgController;

  String ts =
      isoUtcNow();

  if (ts.length() > 0)
    doc["timestamp"] = ts;

  else
    doc["timestamp"] = nullptr;

  doc["uptime_s"] =
      millis() /
      1000UL;

  JsonObject mode =
      doc.createNestedObject(
          "mode");

  mode["auto"] =
      autoMode;

  mode["adaptive"] =
      adaptiveMode;

  mode["fallback"] =
      fallbackMode;

  mode["degraded"] =
      degradedMode;

  JsonObject vision =
      doc.createNestedObject(
          "vision");

  vision["state"] =
      visionStateName();

  vision["fresh_lane_count"] =
      freshVisionLaneCount();

  vision["north_fresh"] =
      visionFresh("north");

  vision["south_fresh"] =
      visionFresh("south");

  vision["east_fresh"] =
      visionFresh("east");

  JsonObject approaches =
      doc.createNestedObject(
          "approaches");

  JsonObject n =
      approaches.createNestedObject(
          "north");

  JsonObject s =
      approaches.createNestedObject(
          "south");

  JsonObject e =
      approaches.createNestedObject(
          "east");

  laneJson(
      n,
      "north");

  laneJson(
      s,
      "south");

  laneJson(
      e,
      "east");

  doc["wifi_rssi"] =
      WiFi.status() ==
              WL_CONNECTED
          ? WiFi.RSSI()
          : 0;

  doc["config_version"] =
      configVersion;

  doc["firmware_version"] =
      FW_VERSION;

  doc["sig_state"] =
      sigStateName();

  doc["active_lane"] =
      activeLane;

  char payload[3072];

  size_t payloadSize =
      serializeJson(
          doc,
          payload);

  client.publish(
      topicTelemetry().c_str(),
      reinterpret_cast<uint8_t *>(
          payload),
      payloadSize,
      false);

  // ----------------------------------------------------------
  // LEGACY payload untuk dashboard/subscriber lama.
  // ----------------------------------------------------------

  StaticJsonDocument<3072> legacy;

  legacy["intersection_id"] =
      cfgIntersection;

  legacy["device_id"] =
      cfgController;

  legacy["device"] =
      cfgController;

  if (ts.length() > 0)
    legacy["timestamp"] = ts;

  for (int i = 0; i < 3; i++) {
    String lane(LANES[i]);

    LaneOccupancy *o =
        occOf(lane);

    VisionLane *v =
        visionOf(lane);

    bool vf =
        visionFresh(lane);

    String prefix =
        lane + "_";

    // Legacy consumer biasanya mengharapkan angka.
    // 0 tetap dikirim bila stale, tetapi valid=false dan source
    // menjelaskan bahwa 0 itu bukan hasil count kamera yang valid.
    legacy[prefix + "vehicle_count"] =
        vf && v != nullptr
            ? v->vehicleCount
            : 0;

    legacy[prefix + "vehicle_count_valid"] =
        vf;

    legacy[prefix + "vehicle_count_source"] =
        vf
            ? "camera"
            : "vision_stale";

    legacy[prefix + "vehicle_detected"] =
        o != nullptr
            ? o->irNow
            : false;

    legacy[prefix + "distance_cm"] =
        o != nullptr
            ? o->distanceCm
            : 0;

    legacy[prefix + "density_level"] =
        o != nullptr
            ? o->level
            : 0;

    legacy[prefix + "queue_detected"] =
        o != nullptr
            ? (o->level == 2)
            : false;

    legacy[prefix + "queue_estimate_cm"] =
        o != nullptr
            ? (o->level == 2
                ? QUEUE_LEVEL_2_CM
                : o->level == 1
                    ? QUEUE_LEVEL_1_CM
                    : QUEUE_LEVEL_0_CM)
            : 0;

    legacy[prefix + "ultrasonic_detected"] =
        o != nullptr
            ? o->usNow
            : false;

    String *light =
        lightOf(lane);

    legacy[prefix + "light"] =
        light != nullptr
            ? *light
            : "red";

    legacy[prefix + "green_duration_s"] =
        greenForLane(lane) /
        1000UL;
  }

  legacy["legacy_ultrasonic_count_north"] =
      legacyCountNorth;

  legacy["legacy_ultrasonic_count_south"] =
      legacyCountSouth;

  legacy["legacy_ultrasonic_count_east"] =
      legacyCountEast;

  int fresh =
      freshVisionLaneCount();

  legacy["vehicle_count_source"] =
      fresh == 3
          ? "camera"
          : fresh > 0
              ? "mixed"
              : "vision_stale";

  legacy["vision_state"] =
      visionStateName();

  legacy["wifi_rssi"] =
      WiFi.status() ==
              WL_CONNECTED
          ? WiFi.RSSI()
          : 0;

  legacy["uptime_s"] =
      millis() /
      1000UL;

  legacy["green_time_s"] =
      greenTimeMs /
      1000UL;

  legacy["yellow_time_s"] =
      yellowTimeMs /
      1000UL;

  legacy["all_red_s"] =
      allRedTimeMs /
      1000UL;

  legacy["auto_mode"] =
      autoMode;

  legacy["adaptive_mode"] =
      adaptiveMode;

  legacy["sensor_mode"] =
      true;

  legacy["dummy_mode"] =
      false;

  char legacyPayload[3072];

  size_t legacySize =
      serializeJson(
          legacy,
          legacyPayload);

  client.publish(
      topicLegacyData().c_str(),
      reinterpret_cast<uint8_t *>(
          legacyPayload),
      legacySize,
      false);

  telemetryDirty  = false;
  lastTelemetryAt = millis();
}

// ============================================================
// VISION METRICS
// ============================================================

void handleVisionMetrics(
    const String &raw)
{
  StaticJsonDocument<3072> doc;

  DeserializationError err =
      deserializeJson(
          doc,
          raw);

  if (err) {
    Serial.print(
        "[VISION] JSON invalid: ");

    Serial.println(
        err.c_str());

    return;
  }

  if (String(
          doc["intersection_id"] |
          "") !=
      cfgIntersection)
  {
    return;
  }

  JsonObject approaches =
      doc["approaches"]
          .as<JsonObject>();

  if (approaches.isNull())
    return;

  for (int i = 0; i < 3; i++) {
    String lane(LANES[i]);

    JsonObject item =
        approaches[lane]
            .as<JsonObject>();

    if (item.isNull())
      continue;

    VisionLane *v =
        visionOf(lane);

    if (v == nullptr)
      continue;

    bool online =
        item["online"] |
        true;

    if (!online) {
      v->online = false;
      telemetryDirty = true;
      continue;
    }

    int vehicleCount =
        item["active_vehicle_count"] |
        0;

    int queueCount =
        item["queue_vehicle_count"] |
        0;

    if (vehicleCount < 0)
      vehicleCount = 0;

    if (queueCount < 0)
      queueCount = 0;

    v->vehicleCount =
        vehicleCount;

    v->queueCount =
        queueCount;

    v->online =
        true;

    v->updatedAt =
        millis();
  }

  updateVisionHealth();

  telemetryDirty = true;
}

// ============================================================
// FUZZY RECOMMENDATION
// ============================================================

void handleRecommendation(
    const String &raw)
{
  StaticJsonDocument<3072> doc;

  DeserializationError err =
      deserializeJson(
          doc,
          raw);

  if (err) {
    publishAck(
        "recommendation",
        false,
        "bad-json");

    return;
  }

  int schema =
      doc["schema_version"] |
      0;

  if (schema != 1) {
    publishAck(
        "recommendation",
        false,
        "bad-schema");

    return;
  }

  if (String(
          doc["intersection_id"] |
          "") !=
      cfgIntersection)
  {
    return;
  }

  if (String(
          doc["controller_id"] |
          "") !=
      cfgController)
  {
    return;
  }

  unsigned long validMs =
      doc["valid_for_ms"] |
      10000UL;

  if (validMs < 1000UL)
    validMs = 1000UL;

  if (validMs > 60000UL)
    validMs = 60000UL;

  JsonObject approaches =
      doc["approaches"]
          .as<JsonObject>();

  if (approaches.isNull()) {
    publishAck(
        "recommendation",
        false,
        "no-approaches");

    return;
  }

  int accepted = 0;

  for (int i = 0; i < 3; i++) {
    String lane(LANES[i]);

    JsonObject item =
        approaches[lane]
            .as<JsonObject>();

    if (item.isNull())
      continue;

    float greenS =
        item["recommended_green_s"] |
        0.0f;

    if (greenS < 1.0f ||
        greenS > 120.0f)
    {
      continue;
    }

    FuzzyRec *f =
        fuzzyOf(lane);

    if (f == nullptr)
      continue;

    f->greenS =
        greenS;

    f->receivedAt =
        millis();

    f->validMs =
        validMs;

    accepted++;
  }

  telemetryDirty = true;

  publishAck(
      "recommendation",
      accepted > 0,
      accepted > 0
          ? ""
          : "no-valid-lane");
}

// ============================================================
// CONFIG — ATOMIC VALIDATION
// ============================================================

bool applyConfigCommand(
    JsonObject c,
    int incomingVersion,
    bool hasVersion,
    String &reason)
{
  if (hasVersion &&
      incomingVersion <=
          configVersion)
  {
    reason =
        "stale-config-version";

    return false;
  }

  unsigned long candidateGreen =
      greenTimeMs;

  unsigned long candidateYellow =
      yellowTimeMs;

  unsigned long candidateAllRed =
      allRedTimeMs;

  unsigned long candidateMin =
      minGreenMs;

  unsigned long candidateMax =
      maxGreenMs;

  if (c.containsKey(
          "green_time_s"))
  {
    int value =
        c["green_time_s"]
            .as<int>();

    if (value < 1 ||
        value > 120)
    {
      reason =
          "green-out-of-range";

      return false;
    }

    candidateGreen =
        static_cast<unsigned long>(
            value) *
        1000UL;
  }

  if (c.containsKey(
          "yellow_time_s"))
  {
    int value =
        c["yellow_time_s"]
            .as<int>();

    if (value < 1 ||
        value > 30)
    {
      reason =
          "yellow-out-of-range";

      return false;
    }

    candidateYellow =
        static_cast<unsigned long>(
            value) *
        1000UL;
  }

  if (c.containsKey(
          "all_red_s"))
  {
    int value =
        c["all_red_s"]
            .as<int>();

    // Tidak menerima 0 pada safe prototype.
    if (value < 1 ||
        value > 10)
    {
      reason =
          "all-red-out-of-range";

      return false;
    }

    candidateAllRed =
        static_cast<unsigned long>(
            value) *
        1000UL;
  }

  if (c.containsKey(
          "min_green_s"))
  {
    int value =
        c["min_green_s"]
            .as<int>();

    if (value < 1 ||
        value > 120)
    {
      reason =
          "min-green-out-of-range";

      return false;
    }

    candidateMin =
        static_cast<unsigned long>(
            value) *
        1000UL;
  }

  if (c.containsKey(
          "max_green_s"))
  {
    int value =
        c["max_green_s"]
            .as<int>();

    if (value < 1 ||
        value > 120)
    {
      reason =
          "max-green-out-of-range";

      return false;
    }

    candidateMax =
        static_cast<unsigned long>(
            value) *
        1000UL;
  }

  if (candidateMin >
      candidateMax)
  {
    reason =
        "min-greater-than-max";

    return false;
  }

  candidateGreen =
      constrain(
          candidateGreen,
          candidateMin,
          candidateMax);

  // APPLY HANYA SETELAH SEMUA VALID.
  greenTimeMs  = candidateGreen;
  yellowTimeMs = candidateYellow;
  allRedTimeMs = candidateAllRed;
  minGreenMs   = candidateMin;
  maxGreenMs   = candidateMax;

  if (hasVersion)
    configVersion =
        incomingVersion;

  saveConfig();

  return true;
}

// ============================================================
// CANONICAL COMMANDS
// ============================================================

void handleCommand(
    const String &raw)
{
  StaticJsonDocument<2048> doc;

  DeserializationError err =
      deserializeJson(
          doc,
          raw);

  if (err) {
    publishAck(
        "command",
        false,
        "bad-json");

    return;
  }

  String type =
      String(
          doc["type"] |
          "");

  if (type ==
      "set_phase")
  {
    if (autoMode) {
      publishAck(
          "set_phase",
          false,
          "auto-on");

      return;
    }

    String lane =
        String(
            doc["lane"] |
            "");

    bool ok =
        beginManualGreen(
            lane);

    publishAck(
        "set_phase",
        ok,
        ok
            ? ""
            : "invalid-lane");

    return;
  }

  if (type ==
      "set_auto")
  {
    bool requested =
        doc["value"] |
        autoMode;

    if (requested ==
        autoMode)
    {
      publishAck(
          "set_auto",
          true,
          "already-set");

      return;
    }

    if (requested) {
      startAutoSafely();
    }
    else {
      enterManualModeSafely();
    }

    saveConfig();

    publishAck(
        "set_auto",
        true,
        "");

    return;
  }

  if (type ==
      "set_adaptive")
  {
    adaptiveMode =
        doc["value"] |
        adaptiveMode;

    saveConfig();

    publishAck(
        "set_adaptive",
        true,
        "");

    telemetryDirty = true;

    return;
  }

  if (type ==
      "set_config")
  {
    JsonObject c =
        doc["config"]
            .as<JsonObject>();

    if (c.isNull()) {
      publishAck(
          "set_config",
          false,
          "no-config");

      return;
    }

    bool hasVersion =
        doc.containsKey(
            "config_version");

    int incomingVersion =
        hasVersion
            ? doc["config_version"]
                  .as<int>()
            : configVersion;

    String reason;

    bool ok =
        applyConfigCommand(
            c,
            incomingVersion,
            hasVersion,
            reason);

    publishAck(
        "set_config",
        ok,
        reason);

    telemetryDirty = true;

    return;
  }

  publishAck(
      "command",
      false,
      "unknown-type");
}

// ============================================================
// LEGACY CONFIG ADAPTER
// ============================================================

void handleLegacyConfig(
    const String &raw)
{
  StaticJsonDocument<1024> oldDoc;

  if (deserializeJson(
          oldDoc,
          raw))
  {
    return;
  }

  if (oldDoc.containsKey(
          "auto_mode"))
  {
    bool requested =
        oldDoc["auto_mode"]
            .as<bool>();

    if (requested != autoMode) {
      if (requested)
        startAutoSafely();

      else
        enterManualModeSafely();

      saveConfig();
    }
  }

  if (oldDoc.containsKey(
          "adaptive_mode"))
  {
    adaptiveMode =
        oldDoc["adaptive_mode"]
            .as<bool>();

    saveConfig();
  }

  StaticJsonDocument<1024> cmd;

  cmd["type"] =
      "set_config";

  JsonObject c =
      cmd.createNestedObject(
          "config");

  if (oldDoc.containsKey(
          "green_time_s"))
  {
    c["green_time_s"] =
        oldDoc["green_time_s"];
  }

  if (oldDoc.containsKey(
          "yellow_time_s"))
  {
    c["yellow_time_s"] =
        oldDoc["yellow_time_s"];
  }

  // Legacy belum punya all_red/min/max.
  // Tidak diubah jika field tidak ada.

  String converted;

  serializeJson(
      cmd,
      converted);

  handleCommand(
      converted);
}

// ============================================================
// LEGACY LIGHT ADAPTER
// ============================================================

void handleLegacyLight(
    const String &lane,
    String color)
{
  color.trim();
  color.toLowerCase();

  if (autoMode) {
    publishAck(
        "legacy_light",
        false,
        "auto-on");

    return;
  }

  if (lightOf(lane) == nullptr) {
    publishAck(
        "legacy_light",
        false,
        "invalid-lane");

    return;
  }

  if (color == "green") {
    bool ok =
        beginManualGreen(
            lane);

    publishAck(
        "legacy_light",
        ok,
        ok
            ? ""
            : "manual-green-failed");

    return;
  }

  if (color == "yellow") {
    bool ok =
        beginManualYellow(
            lane);

    publishAck(
        "legacy_light",
        ok,
        ok
            ? ""
            : "yellow-requires-current-green");

    return;
  }

  if (color == "red") {
    *lightOf(lane) =
        "red";

    applyLights();

    pendingManualLane = "";

    enterState(
        MANUAL_HOLD);

    publishAck(
        "legacy_light",
        true,
        "");

    return;
  }

  publishAck(
      "legacy_light",
      false,
      "bad-color");
}

// ============================================================
// MQTT CALLBACK
// ============================================================

void messageReceived(
    char *topic,
    byte *payload,
    unsigned int length)
{
  String topicString(
      topic);

  String raw;

  raw.reserve(
      length + 1);

  for (unsigned int i = 0;
       i < length;
       i++)
  {
    raw +=
        static_cast<char>(
            payload[i]);
  }

  if (topicString ==
      topicRecommendation())
  {
    handleRecommendation(
        raw);

    return;
  }

  if (topicString ==
      topicVisionMetrics())
  {
    handleVisionMetrics(
        raw);

    return;
  }

  if (topicString ==
      topicCommand())
  {
    handleCommand(
        raw);

    return;
  }

  if (topicString ==
      topicLegacyConfig())
  {
    handleLegacyConfig(
        raw);

    return;
  }

  if (topicString ==
          topicLegacyLight(
              "north"))
  {
    handleLegacyLight(
        "north",
        raw);

    return;
  }

  if (topicString ==
          topicLegacyLight(
              "south"))
  {
    handleLegacyLight(
        "south",
        raw);

    return;
  }

  if (topicString ==
          topicLegacyLight(
              "east"))
  {
    handleLegacyLight(
        "east",
        raw);

    return;
  }
}

// ============================================================
// PIN SETUP
// ============================================================

void setupPins()
{
  pinMode(
      NORTH_RED_PIN,
      OUTPUT);

  pinMode(
      NORTH_YELLOW_PIN,
      OUTPUT);

  pinMode(
      NORTH_GREEN_PIN,
      OUTPUT);

  pinMode(
      SOUTH_RED_PIN,
      OUTPUT);

  pinMode(
      SOUTH_YELLOW_PIN,
      OUTPUT);

  pinMode(
      SOUTH_GREEN_PIN,
      OUTPUT);

  pinMode(
      EAST_RED_PIN,
      OUTPUT);

  pinMode(
      EAST_YELLOW_PIN,
      OUTPUT);

  pinMode(
      EAST_GREEN_PIN,
      OUTPUT);

  pinMode(
      NORTH_IR_PIN,
      INPUT);

  pinMode(
      SOUTH_IR_PIN,
      INPUT);

  pinMode(
      EAST_IR_PIN,
      INPUT);

  pinMode(
      NORTH_TRIG_PIN,
      OUTPUT);

  pinMode(
      NORTH_ECHO_PIN,
      INPUT);

  pinMode(
      SOUTH_TRIG_PIN,
      OUTPUT);

  pinMode(
      SOUTH_ECHO_PIN,
      INPUT);

  pinMode(
      EAST_TRIG_PIN,
      OUTPUT);

  pinMode(
      EAST_ECHO_PIN,
      INPUT);

  digitalWrite(
      NORTH_TRIG_PIN,
      LOW);

  digitalWrite(
      SOUTH_TRIG_PIN,
      LOW);

  digitalWrite(
      EAST_TRIG_PIN,
      LOW);

  setAllLightsRed();
}

// ============================================================
// SETUP
// ============================================================

void setup()
{
  Serial.begin(
      115200);

  delay(
      500);

  Serial.println();
  Serial.println(
      "============================================");

  Serial.println(
      " ASTRAEA CONTROLLER v2.1 SAFE PROTOTYPE");

  Serial.println(
      " Camera count + sustained IR/HC-SR04 level");

  Serial.println(
      "============================================");

  loadConfig();

  Serial.print(
      "intersection=");

  Serial.println(
      cfgIntersection);

  Serial.print(
      "controller=");

  Serial.println(
      cfgController);

  setupPins();

  // Safety boot:
  // output fisik sudah ALL_RED sebelum network dicoba.
  setAllLightsRed();

  enterState(
      STARTUP_ALL_RED);

  WiFi.mode(
      WIFI_STA);

  WiFi.setSleep(
      false);

  client.setServer(
      cfgMqttHost.c_str(),
      cfgMqttPort);

  client.setCallback(
      messageReceived);

  // Payload canonical + legacy cukup besar.
  client.setBufferSize(
      4096);

  // Batasi blocking socket PubSubClient.
  client.setSocketTimeout(
      1);

  // Tidak menunggu WiFi/MQTT.
  // Phase engine lokal tetap berjalan.
  beginWiFiAttempt();

  Serial.println(
      "Controller ready. Local signal engine active.");
}

// ============================================================
// LOOP
// ============================================================

void loop()
{
  unsigned long now =
      millis();

  // 1. SIGNAL ENGINE PRIORITAS.
  runSignalEngine();

  // 2. SENSOR.
  if (now - lastSensorAt >=
      SENSOR_SAMPLE_MS)
  {
    // Timestamp diambil sebelum pembacaan agar interval start-to-start
    // tetap mendekati SENSOR_SAMPLE_MS walau pulseIn/delay sensor memakan waktu.
    lastSensorAt = now;

    sampleSensors();
  }

  // 3. NETWORK MAINTENANCE.
  // Tidak ada while retry tak berujung.
  maintainWiFi();
  maintainMQTT();

  // 4. SERIAL PROVISIONING.
  handleSerialProvisioning();

  // 5. VISION HEALTH.
  now = millis();

  if (now - lastVisionHealthAt >=
      1000UL)
  {
    lastVisionHealthAt = now;

    updateVisionHealth();
  }

  // 6. TELEMETRY.
  if (client.connected()) {
    if (telemetryDirty &&
        now - lastTelemetryAt >=
            TELEMETRY_EVENT_MIN_MS)
    {
      sendTelemetry();
    }
    else if (
        now - lastTelemetryAt >=
            TELEMETRY_HEARTBEAT_MS)
    {
      sendTelemetry();
    }
  }

  delay(5);
}
