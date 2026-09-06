/*
 * ============================================================
 * ASTRAEA CONTROLLER v2 — PRD multi-intersection / camera-first
 * ESP32 traffic controller: safe phase engine + sustained
 * occupancy + fuzzy consumer + canonical MQTT.
 *
 * File lama (prototype): esp32-main-sensor-YOLO.cpp (tetap ada).
 *
 * Perubahan vs v1:
 * - NVS config (tidak ada WiFi/MQTT hardcode) + provisioning serial
 * - Level IR/HC-SR04 memakai jendela 2 detik / rasio 70% (§14),
 *   IR = gerbang Level 1, IR+US = Level 2, US-only = diagnostik
 * - State machine: STARTUP_ALL_RED -> ACTIVE_GREEN -> ACTIVE_YELLOW
 *   -> ALL_RED_CLEARANCE -> ... + MANUAL_SAFE + FAILSAFE (§23)
 * - Phase plan berbasis data + conflict matrix (§19-21),
 *   perintah manual tidak boleh bikin hijau konflik (§45)
 * - Konsumen rekomendasi fuzzy tervalidasi (§24/§17.4)
 * - Telemetri kanonis astraea/v1 + legacy traffic/ tetap dikirim (§25-27)
 * - Count otoritatif dari vision per-pendekatan + freshness 15 dtk,
 *   fallback sensor bila vision basi (§16)
 * - Config versioning + ACK (§53)
 *
 * Build: Arduino-ESP32 (board "ESP32 Dev Module"), lib:
 *   WiFi (bawaan), PubSubClient, ArduinoJson v6, Preferences (bawaan)
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// ============================================================
// DEFAULT CONFIG (ditimpa NVS "astraea")
// ============================================================

#define DEF_INTERSECTION_ID "SIMPANG_TALUN_01"
#define DEF_CONTROLLER_ID "ESP32_TRAFFIC_01"
#define DEF_WIFI_SSID ""
#define DEF_WIFI_PASS ""
#define DEF_MQTT_HOST "astraea.my.id"
#define DEF_MQTT_PORT 1883
#define DEF_MQTT_USER "jti"
#define DEF_MQTT_PASS ""
#define DEF_FW_VERSION "2.0.0"

// Jendela hunian (§14)
#define SENSOR_SAMPLE_MS 100
#define OCCUPANCY_WINDOW_MS 2000
#define OCCUPANCY_SAMPLES (OCCUPANCY_WINDOW_MS / SENSOR_SAMPLE_MS) // 20
#define OCCUPANCY_RATIO_THRESHOLD 0.70
#define CLEAR_CONFIRM_MS 1000

#define VISION_FRESH_TIMEOUT_MS 15000

// ============================================================
// PIN (sama seperti v1 — wiring maket tidak berubah)
// ============================================================

#define SOUTH_RED_PIN 15
#define SOUTH_YELLOW_PIN 22
#define SOUTH_GREEN_PIN 23

#define NORTH_RED_PIN 18
#define NORTH_YELLOW_PIN 19
#define NORTH_GREEN_PIN 21

#define EAST_RED_PIN 16
#define EAST_YELLOW_PIN 17
#define EAST_GREEN_PIN 5

#define SOUTH_IR_PIN 34
#define NORTH_IR_PIN 39
#define EAST_IR_PIN 36

#define SOUTH_TRIG_PIN 25
#define SOUTH_ECHO_PIN 26
#define NORTH_TRIG_PIN 12
#define NORTH_ECHO_PIN 13
#define EAST_TRIG_PIN 27
#define EAST_ECHO_PIN 14

const bool IR_ACTIVE_LOW = true;

#define ULTRASONIC_PROXIMITY_MAX_CM 5

// ============================================================
// RUNTIME CONFIG (dari NVS)
// ============================================================

String cfgIntersection = DEF_INTERSECTION_ID;
String cfgController = DEF_CONTROLLER_ID;
String cfgWifiSsid = DEF_WIFI_SSID;
String cfgWifiPass = DEF_WIFI_PASS;
String cfgMqttHost = DEF_MQTT_HOST;
int cfgMqttPort = DEF_MQTT_PORT;
String cfgMqttUser = DEF_MQTT_USER;
String cfgMqttPass = DEF_MQTT_PASS;

unsigned long greenTimeMs = 10000;
unsigned long yellowTimeMs = 3000;
unsigned long allRedTimeMs = 2000;
unsigned long minGreenMs = 10000;
unsigned long maxGreenMs = 60000;
unsigned long startupClearanceMs = 3000;
int configVersion = 1;

bool autoMode = true;
bool adaptiveMode = true;
bool fallbackMode = false;

// ============================================================
// PHASE PLAN BERBASIS DATA (§19-21)
// Prototype: 3 fase sekuensial.ditambah conflict matrix agar
// perintah manual antar-pendekatan konflik selalu ditolak.
// ============================================================

struct PhaseDef {
  const char *lane; // "north" | "south" | "east"
};

static const PhaseDef PHASE_PLAN[] = {
  {"north"},
  {"south"},
  {"east"},
};
static const int PHASE_COUNT = sizeof(PHASE_PLAN) / sizeof(PHASE_PLAN[0]);

// Conflict matrix: true = TIDAK boleh hijau bersamaan.
static bool conflicts(const String &a, const String &b) {
  if (a == b) return false;
  // Prototype 3 pendekatan sekuensial: semua pasangan konflik.
  return true;
}

// ============================================================
// STATE
// ============================================================

enum SigState {
  STARTUP_ALL_RED,
  ACTIVE_GREEN,
  ACTIVE_YELLOW,
  ALL_RED_CLEARANCE,
  MANUAL_SAFE,
  FAILSAFE
};

SigState sigState = STARTUP_ALL_RED;
int phaseIndex = 0;
unsigned long stateStartedAt = 0;
unsigned long currentGreenMs = 10000;
String activeLane = "north";

String northLight = "red";
String southLight = "red";
String eastLight = "red";

// --- hunian sustained per jalur ---
struct LaneOccupancy {
  bool irSamples[OCCUPANCY_SAMPLES];
  bool usSamples[OCCUPANCY_SAMPLES];
  int samplePos = 0;
  int filled = 0;
  int level = 0; // 0/1/2
  bool ultrasonicOnly = false;
  unsigned long clearStartedAt = 0;
  int distanceCm = 0;
  bool irNow = false;
  bool usNow = false;
};

LaneOccupancy occNorth, occSouth, occEast;

// --- count otoritatif kamera per pendekatan (§16) ---
struct VisionLane {
  int vehicleCount = 0;
  int queueCount = 0;
  unsigned long updatedAt = 0;
  bool online = false;
};

VisionLane visNorth, visSouth, visEast;

// --- rekomendasi fuzzy per pendekatan (§24) ---
struct FuzzyRec {
  float greenS = 0;
  unsigned long receivedAt = 0;
  unsigned long validMs = 10000;
  bool fresh() const {
    return receivedAt != 0 && (millis() - receivedAt) <= validMs;
  }
};

FuzzyRec fuzzyNorth, fuzzySouth, fuzzyEast;

// --- legacy counter diagnostik (bukan otoritas volume §63) ---
int legacyCountNorth = 0, legacyCountSouth = 0, legacyCountEast = 0;

unsigned long lastTelemetryAt = 0;
bool telemetryDirty = true;
const unsigned long TELEMETRY_EVENT_MIN_MS = 250;
const unsigned long TELEMETRY_HEARTBEAT_MS = 5000;
unsigned long lastSampleAt = 0;
unsigned long lastVisionCheckAt = 0;
int ultrasonicRoundRobin = 0;

Preferences prefs;
WiFiClient espClient;
PubSubClient client(espClient);

// Forward declarations (file .cpp butuh ini; .ino digenerate otomatis)
void publishAck(const String &action, bool accepted, const String &reason);
void sendTelemetry();

// ============================================================
// NVS CONFIG
// ============================================================

void loadConfig() {
  prefs.begin("astraea", true);
  cfgIntersection = prefs.getString("intersection", DEF_INTERSECTION_ID);
  cfgController = prefs.getString("controller", DEF_CONTROLLER_ID);
  cfgWifiSsid = prefs.getString("wifi_ssid", DEF_WIFI_SSID);
  cfgWifiPass = prefs.getString("wifi_pass", DEF_WIFI_PASS);
  cfgMqttHost = prefs.getString("mqtt_host", DEF_MQTT_HOST);
  cfgMqttPort = prefs.getInt("mqtt_port", DEF_MQTT_PORT);
  cfgMqttUser = prefs.getString("mqtt_user", DEF_MQTT_USER);
  cfgMqttPass = prefs.getString("mqtt_pass", DEF_MQTT_PASS);
  greenTimeMs = prefs.getULong("green_ms", 10000);
  yellowTimeMs = prefs.getULong("yellow_ms", 3000);
  allRedTimeMs = prefs.getULong("allred_ms", 2000);
  minGreenMs = prefs.getULong("mingreen_ms", 10000);
  maxGreenMs = prefs.getULong("maxgreen_ms", 60000);
  configVersion = prefs.getInt("cfg_version", 1);
  autoMode = prefs.getBool("auto_mode", true);
  adaptiveMode = prefs.getBool("adaptive_mode", true);
  prefs.end();
}

void saveConfig() {
  prefs.begin("astraea", false);
  prefs.putString("intersection", cfgIntersection);
  prefs.putString("controller", cfgController);
  prefs.putString("wifi_ssid", cfgWifiSsid);
  prefs.putString("wifi_pass", cfgWifiPass);
  prefs.putString("mqtt_host", cfgMqttHost);
  prefs.putInt("mqtt_port", cfgMqttPort);
  prefs.putString("mqtt_user", cfgMqttUser);
  prefs.putString("mqtt_pass", cfgMqttPass);
  prefs.putULong("green_ms", greenTimeMs);
  prefs.putULong("yellow_ms", yellowTimeMs);
  prefs.putULong("allred_ms", allRedTimeMs);
  prefs.putULong("mingreen_ms", minGreenMs);
  prefs.putULong("maxgreen_ms", maxGreenMs);
  prefs.putInt("cfg_version", configVersion);
  prefs.putBool("auto_mode", autoMode);
  prefs.putBool("adaptive_mode", adaptiveMode);
  prefs.end();
}

// Provisioning via serial: "set wifi <ssid> <pass>", "set mqtt <host> <user> <pass>",
// "set id <intersection> <controller>", "show", "save".
void handleSerialProvisioning() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line.startsWith("set wifi ")) {
    int sp = line.indexOf(' ', 9);
    if (sp > 0) {
      cfgWifiSsid = line.substring(9, sp);
      cfgWifiPass = line.substring(sp + 1);
      saveConfig();
      Serial.println("WiFi saved. Reboot to apply.");
    }
  } else if (line.startsWith("set mqtt ")) {
    // set mqtt <host> <user> <pass>
    int p1 = line.indexOf(' ', 9);
    int p2 = line.indexOf(' ', p1 + 1);
    if (p1 > 0 && p2 > 0) {
      cfgMqttHost = line.substring(9, p1);
      cfgMqttUser = line.substring(p1 + 1, p2);
      cfgMqttPass = line.substring(p2 + 1);
      saveConfig();
      Serial.println("MQTT saved. Reboot to apply.");
    }
  } else if (line.startsWith("set id ")) {
    int p1 = line.indexOf(' ', 7);
    if (p1 > 0) {
      cfgIntersection = line.substring(7, p1);
      cfgController = line.substring(p1 + 1);
      saveConfig();
      Serial.println("Identity saved. Reboot to apply.");
    }
  } else if (line == "show") {
    Serial.print("intersection="); Serial.println(cfgIntersection);
    Serial.print("controller="); Serial.println(cfgController);
    Serial.print("mqtt="); Serial.print(cfgMqttHost);
    Serial.print(":"); Serial.println(cfgMqttPort);
    Serial.print("fw=2.0.0 cfg_version="); Serial.println(configVersion);
  }
}

// ============================================================
// TOPIK
// ============================================================

String baseV1() { return "astraea/v1/intersections/" + cfgIntersection; }
String topicTelemetry() { return baseV1() + "/controllers/" + cfgController + "/telemetry"; }
String topicStatus() { return baseV1() + "/controllers/" + cfgController + "/status"; }
String topicCommand() { return baseV1() + "/controllers/" + cfgController + "/command"; }
String topicAck() { return baseV1() + "/controllers/" + cfgController + "/ack"; }
String topicRecommendation() { return baseV1() + "/control/recommendation"; }
String topicVisionMetrics() { return baseV1() + "/vision/metrics"; }

// Legacy (kompatibilitas §26, tetap dikirim)
String topicLegacyData() { return "traffic/" + cfgController + "/data"; }
String topicLegacyConfig() { return "traffic/" + cfgController + "/config/set"; }
String topicLegacyLight(const String &lane) { return "traffic/" + cfgController + "/light/" + lane + "/set"; }

// ============================================================
// LED & SAFETY PRIMITIF
// ============================================================

void writeLaneLed(int redPin, int yellowPin, int greenPin, const String &color) {
  digitalWrite(redPin, LOW);
  digitalWrite(yellowPin, LOW);
  digitalWrite(greenPin, LOW);
  if (color == "red") digitalWrite(redPin, HIGH);
  else if (color == "yellow") digitalWrite(yellowPin, HIGH);
  else if (color == "green") digitalWrite(greenPin, HIGH);
}

void applyLights() {
  writeLaneLed(NORTH_RED_PIN, NORTH_YELLOW_PIN, NORTH_GREEN_PIN, northLight);
  writeLaneLed(SOUTH_RED_PIN, SOUTH_YELLOW_PIN, SOUTH_GREEN_PIN, southLight);
  writeLaneLed(EAST_RED_PIN, EAST_YELLOW_PIN, EAST_GREEN_PIN, eastLight);
}

void setAllLightsRed() {
  northLight = "red"; southLight = "red"; eastLight = "red";
  applyLights();
}

String *lightOf(const String &lane) {
  if (lane == "north") return &northLight;
  if (lane == "south") return &southLight;
  if (lane == "east") return &eastLight;
  return nullptr;
}

// Satu-satunya jalur aman menyalakan hijau/kuning: pastikan konflik merah dulu.
bool requestGreen(const String &lane) {
  if (lightOf(lane) == nullptr) return false;
  for (const char *other : {"north", "south", "east"}) {
    String o(other);
    if (o != lane && conflicts(lane, o) && *lightOf(o) != "red") return false;
  }
  setAllLightsRed();
  *lightOf(lane) = "green";
  applyLights();
  return true;
}

bool requestYellow(const String &lane) {
  if (lightOf(lane) == nullptr) return false;
  *lightOf(lane) = "yellow";
  applyLights();
  return true;
}

// ============================================================
// SENSOR SUSTAINED (§13-14)
// ============================================================

bool irDetectedNow(int pin) {
  int raw = digitalRead(pin);
  return IR_ACTIVE_LOW ? (raw == LOW) : (raw == HIGH);
}

int readUltrasonicCm(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(3);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  unsigned long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) return 0;
  int cm = (int)(duration * 0.0343 / 2.0);
  if (cm < 2 || cm > 400) return 0;
  return cm;
}

float occupancyRatio(bool *samples, int filled) {
  if (filled == 0) return 0;
  int n = 0;
  for (int i = 0; i < filled; i++) if (samples[i]) n++;
  return (float)n / (float)filled;
}

void pushSample(LaneOccupancy &occ, bool ir, bool us) {
  occ.irSamples[occ.samplePos] = ir;
  occ.usSamples[occ.samplePos] = us;
  occ.samplePos = (occ.samplePos + 1) % OCCUPANCY_SAMPLES;
  if (occ.filled < OCCUPANCY_SAMPLES) occ.filled++;
  occ.irNow = ir;
  occ.usNow = us;
}

void evaluateLane(LaneOccupancy &occ) {
  float irRatio = occupancyRatio(occ.irSamples, occ.filled);
  float usRatio = occupancyRatio(occ.usSamples, occ.filled);
  bool irSustained = irRatio >= OCCUPANCY_RATIO_THRESHOLD;
  bool usSustained = usRatio >= OCCUPANCY_RATIO_THRESHOLD;
  occ.ultrasonicOnly = (!irSustained && usSustained);
  int target;
  if (irSustained && usSustained) target = 2;
  else if (irSustained) target = 1;
  else target = 0;
  unsigned long now = millis();
  if (target != occ.level) {
    if (target < occ.level) {
      // Downgrade hanya setelah jendela clear stabil.
      if (occ.clearStartedAt == 0) occ.clearStartedAt = now;
      if (now - occ.clearStartedAt >= CLEAR_CONFIRM_MS) {
        occ.level = target;
        occ.clearStartedAt = 0;
        telemetryDirty = true;
      }
    } else {
      occ.level = target;
      occ.clearStartedAt = 0;
      telemetryDirty = true;
    }
  } else {
    occ.clearStartedAt = 0;
  }
}

// Ultrasonic round-robin: satu jalur per tick 100 ms (anti cross-talk + non-blocking).
void sampleSensors() {
  static int trigPins[3] = {NORTH_TRIG_PIN, SOUTH_TRIG_PIN, EAST_TRIG_PIN};
  static int echoPins[3] = {NORTH_ECHO_PIN, SOUTH_ECHO_PIN, EAST_ECHO_PIN};
  static int irPins[3] = {NORTH_IR_PIN, SOUTH_IR_PIN, EAST_IR_PIN};
  static LaneOccupancy *lanes[3] = {&occNorth, &occSouth, &occEast};

  for (int i = 0; i < 3; i++) {
    bool ir = irDetectedNow(irPins[i]);
    bool us = false;
    if (i == ultrasonicRoundRobin) {
      int cm = readUltrasonicCm(trigPins[i], echoPins[i]);
      lanes[i]->distanceCm = cm;
      us = (cm > 0 && cm <= ULTRASONIC_PROXIMITY_MAX_CM);
      // Legacy counter diagnostik (bukan otoritas volume).
      static bool prevUs[3] = {false, false, false};
      if (us && !prevUs[i]) {
        if (i == 0) legacyCountNorth++;
        else if (i == 1) legacyCountSouth++;
        else legacyCountEast++;
      }
      prevUs[i] = us;
    } else {
      us = lanes[i]->usNow;
    }
    pushSample(*lanes[i], ir, us);
    evaluateLane(*lanes[i]);
  }
  ultrasonicRoundRobin = (ultrasonicRoundRobin + 1) % 3;
}

// ============================================================
// VISION CONSUMER (§16): count otoritatif per pendekatan
// ============================================================

VisionLane *visionOf(const String &lane) {
  if (lane == "north") return &visNorth;
  if (lane == "south") return &visSouth;
  if (lane == "east") return &visEast;
  return nullptr;
}

LaneOccupancy *occOf(const String &lane) {
  if (lane == "north") return &occNorth;
  if (lane == "south") return &occSouth;
  if (lane == "east") return &occEast;
  return nullptr;
}

FuzzyRec *fuzzyOf(const String &lane) {
  if (lane == "north") return &fuzzyNorth;
  if (lane == "south") return &fuzzySouth;
  if (lane == "east") return &fuzzyEast;
  return nullptr;
}

bool visionFresh(const String &lane) {
  VisionLane *v = visionOf(lane);
  if (!v || !v->online) return false;
  return (millis() - v->updatedAt) <= VISION_FRESH_TIMEOUT_MS;
}

int authoritativeCount(const String &lane) {
  if (visionFresh(lane)) return visionOf(lane)->vehicleCount;
  return -1; // pemanggil: fallback ke level sensor
}

// Durasi hijau: fuzzy fresh > adaptif level > fixed (§17.4 bounds).
unsigned long greenForLane(const String &lane) {
  if (!adaptiveMode) return constrain(greenTimeMs, minGreenMs, maxGreenMs);
  FuzzyRec *f = fuzzyOf(lane);
  if (f && f->fresh()) {
    return constrain((unsigned long)(f->greenS * 1000UL), minGreenMs, maxGreenMs);
  }
  LaneOccupancy *o = occOf(lane);
  int lvl = o ? o->level : 0;
  unsigned long d = (lvl == 2) ? maxGreenMs : (lvl == 1) ? (minGreenMs + maxGreenMs) / 2 : minGreenMs;
  return constrain(d, minGreenMs, maxGreenMs);
}

// ============================================================
// PHASE ENGINE (§23): GREEN -> YELLOW -> ALL_RED -> next
// ============================================================

void enterState(SigState s) {
  sigState = s;
  stateStartedAt = millis();
  telemetryDirty = true;
}

void runPhaseEngine() {
  unsigned long now = millis();
  switch (sigState) {
    case STARTUP_ALL_RED:
      setAllLightsRed();
      if (now - stateStartedAt >= startupClearanceMs) {
        phaseIndex = 0;
        activeLane = PHASE_PLAN[0].lane;
        enterState(ACTIVE_GREEN);
        currentGreenMs = greenForLane(activeLane);
        requestGreen(activeLane);
      }
      break;
    case ACTIVE_GREEN:
      if (now - stateStartedAt >= currentGreenMs) {
        requestYellow(activeLane);
        enterState(ACTIVE_YELLOW);
      }
      break;
    case ACTIVE_YELLOW:
      if (now - stateStartedAt >= yellowTimeMs) {
        setAllLightsRed();
        enterState(ALL_RED_CLEARANCE);
      }
      break;
    case ALL_RED_CLEARANCE:
      if (now - stateStartedAt >= allRedTimeMs) {
        phaseIndex = (phaseIndex + 1) % PHASE_COUNT;
        activeLane = PHASE_PLAN[phaseIndex].lane;
        enterState(ACTIVE_GREEN);
        currentGreenMs = greenForLane(activeLane);
        if (!requestGreen(activeLane)) {
          enterState(FAILSAFE);
          setAllLightsRed();
        }
      }
      break;
    case MANUAL_SAFE:
    case FAILSAFE:
      setAllLightsRed();
      break;
  }
}

// ============================================================
// WIFI / MQTT
// ============================================================

bool connectWiFi() {
  if (cfgWifiSsid.length() == 0) {
    Serial.println("WiFi SSID kosong. Provisioning via serial: set wifi <ssid> <pass>");
    return false;
  }
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(cfgWifiSsid.c_str(), cfgWifiPass.c_str());
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 40) {
    delay(500);
    Serial.print(".");
    retry++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\nWiFi OK, RSSI ");
    Serial.println(WiFi.RSSI());
    return true;
  }
  Serial.println("\nWiFi gagal.");
  return false;
}

void subscribeAll() {
  client.subscribe(topicCommand().c_str());
  client.subscribe(topicRecommendation().c_str());
  client.subscribe(topicVisionMetrics().c_str());
  // Legacy
  client.subscribe(topicLegacyConfig().c_str());
  client.subscribe(topicLegacyLight("north").c_str());
  client.subscribe(topicLegacyLight("south").c_str());
  client.subscribe(topicLegacyLight("east").c_str());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("MQTT connect... ");
    String cid = cfgController + "_" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (client.connect(cid.c_str(), cfgMqttUser.c_str(), cfgMqttPass.c_str())) {
      Serial.println("OK");
      subscribeAll();
      publishAck("reconnected", true, "");
      sendTelemetry();
    } else {
      Serial.print("gagal state=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void publishAck(const String &action, bool accepted, const String &reason) {
  StaticJsonDocument<512> doc;
  doc["schema_version"] = 1;
  doc["intersection_id"] = cfgIntersection;
  doc["controller_id"] = cfgController;
  doc["action"] = action;
  doc["accepted"] = accepted;
  if (reason.length()) doc["reason"] = reason;
  doc["config_version"] = configVersion;
  doc["sig_state"] = (int)sigState;
  char buf[512];
  size_t n = serializeJson(doc, buf);
  client.publish(topicAck().c_str(), (uint8_t *)buf, n, false);
}

// ============================================================
// TELEMETRI KANONIS (§27) + LEGACY
// ============================================================

void laneJson(JsonObject &ap, const String &lane) {
  LaneOccupancy *o = occOf(lane);
  VisionLane *v = visionOf(lane);
  bool vf = visionFresh(lane);
  ap["light"] = *lightOf(lane);
  ap["camera_vehicle_count"] = vf ? v->vehicleCount : -1;
  ap["camera_queue_count"] = vf ? v->queueCount : -1;
  ap["sensor_level"] = o->level;
  ap["ir_occupied"] = o->irNow;
  ap["ultrasonic_occupied"] = o->usNow;
  ap["ultrasonic_only_diagnostic"] = o->ultrasonicOnly;
  FuzzyRec *f = fuzzyOf(lane);
  ap["green_duration_s"] = (f && f->fresh()) ? f->greenS : greenForLane(lane) / 1000;
  ap["vision_fresh"] = vf;
}

void sendTelemetry() {
  if (!client.connected()) return;
  StaticJsonDocument<2048> doc;
  doc["schema_version"] = 1;
  doc["intersection_id"] = cfgIntersection;
  doc["controller_id"] = cfgController;
  char ts[32];
  snprintf(ts, sizeof(ts), "%lu", millis() / 1000);
  doc["timestamp"] = ts;
  JsonObject mode = doc.createNestedObject("mode");
  mode["auto"] = autoMode;
  mode["adaptive"] = adaptiveMode;
  mode["fallback"] = fallbackMode;
  JsonObject vision = doc.createNestedObject("vision");
  vision["fresh"] = visionFresh(activeLane);
  JsonObject ap = doc.createNestedObject("approaches");
  JsonObject n = ap.createNestedObject("north");
  JsonObject s = ap.createNestedObject("south");
  JsonObject e = ap.createNestedObject("east");
  laneJson(n, "north");
  laneJson(s, "south");
  laneJson(e, "east");
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["uptime_s"] = millis() / 1000;
  doc["config_version"] = configVersion;
  doc["sig_state"] = (int)sigState;
  char buf[2048];
  size_t nbytes = serializeJson(doc, buf);
  client.publish(topicTelemetry().c_str(), (uint8_t *)buf, nbytes, false);

  // Legacy payload (format lama, agar subscriber/dashboard lama tetap jalan).
  StaticJsonDocument<2048> leg;
  leg["intersection_id"] = cfgIntersection;
  leg["device_id"] = cfgController;
  leg["device"] = cfgController;
  const char *lanes[3] = {"north", "south", "east"};
  for (int i = 0; i < 3; i++) {
    String L(lanes[i]);
    LaneOccupancy *o = occOf(L);
    VisionLane *v = visionOf(L);
    String p = L + "_";
    leg[p + "vehicle_count"] = visionFresh(L) ? v->vehicleCount : 0;
    leg[p + "vehicle_detected"] = o->irNow;
    leg[p + "distance_cm"] = o->distanceCm;
    leg[p + "density_level"] = o->level;
    leg[p + "queue_detected"] = o->level == 2;
    leg[p + "queue_estimate_cm"] = o->level * 20;
    leg[p + "light"] = *lightOf(L);
    leg[p + "green_duration_s"] = (int)(greenForLane(L) / 1000);
    leg[p + "ultrasonic_detected"] = o->usNow;
  }
  leg["legacy_ultrasonic_count_north"] = legacyCountNorth;
  leg["legacy_ultrasonic_count_south"] = legacyCountSouth;
  leg["legacy_ultrasonic_count_east"] = legacyCountEast;
  leg["vehicle_count_source"] = "camera";
  leg["wifi_rssi"] = WiFi.RSSI();
  leg["uptime_s"] = millis() / 1000;
  leg["auto_mode"] = autoMode;
  leg["adaptive_mode"] = adaptiveMode;
  leg["sensor_mode"] = true;
  leg["dummy_mode"] = false;
  char lbuf[2048];
  size_t ln = serializeJson(leg, lbuf);
  client.publish(topicLegacyData().c_str(), (uint8_t *)lbuf, ln, false);
  telemetryDirty = false;
  lastTelemetryAt = millis();
}

// ============================================================
// KONSUMEN REKOMENDASI FUZZY (§24) + VISION METRICS
// ============================================================

void handleRecommendation(const String &raw) {
  StaticJsonDocument<2048> doc;
  if (deserializeJson(doc, raw)) return;
  if ((int)doc["schema_version"] != 1) return;
  if (String((const char *)doc["intersection_id"]) != cfgIntersection) return;
  if (String((const char *)doc["controller_id"]) != cfgController) return;
  // Expiry: generated_at ISO vs millis tidak sebanding langsung;
  // pakai valid_for_ms relatif terhadap penerimaan + toleransi latensi.
  unsigned long validMs = doc["valid_for_ms"] | 10000UL;
  JsonObject ap = doc["approaches"];
  if (ap.isNull()) return;
  const char *lanes[3] = {"north", "south", "east"};
  for (int i = 0; i < 3; i++) {
    JsonObject a = ap[lanes[i]];
    if (a.isNull()) continue;
    FuzzyRec *f = fuzzyOf(String(lanes[i]));
    float g = a["recommended_green_s"] | 0.0f;
    if (g < 1 || g > 120) continue; // di luar batas wajar -> tolak
    f->greenS = g;
    f->receivedAt = millis();
    f->validMs = validMs;
  }
  telemetryDirty = true;
}

void handleVisionMetrics(const String &raw) {
  StaticJsonDocument<2048> doc;
  if (deserializeJson(doc, raw)) return;
  if (String((const char *)doc["intersection_id"]) != cfgIntersection) return;
  JsonObject ap = doc["approaches"];
  if (ap.isNull()) return;
  const char *lanes[3] = {"north", "south", "east"};
  for (int i = 0; i < 3; i++) {
    JsonObject a = ap[lanes[i]];
    if (a.isNull()) continue;
    VisionLane *v = visionOf(String(lanes[i]));
    v->vehicleCount = a["active_vehicle_count"] | 0;
    v->queueCount = a["queue_vehicle_count"] | 0;
    v->online = true;
    v->updatedAt = millis();
  }
  fallbackMode = false;
}

// ============================================================
// COMMAND (kanonis + legacy) — manual selalu lewat safety (§45)
// ============================================================

void handleCommand(const String &raw) {
  StaticJsonDocument<1024> doc;
  if (deserializeJson(doc, raw)) {
    publishAck("command", false, "bad-json");
    return;
  }
  String type = String((const char *)(doc["type"] | ""));
  if (type == "set_phase") {
    String lane = String((const char *)(doc["lane"] | ""));
    if (!autoMode) {
      if (requestGreen(lane)) {
        enterState(MANUAL_SAFE);
        publishAck("set_phase", true, "");
      } else {
        publishAck("set_phase", false, "conflict-or-invalid");
      }
    } else {
      publishAck("set_phase", false, "auto-on");
    }
    return;
  }
  if (type == "set_auto") {
    autoMode = doc["value"] | autoMode;
    if (autoMode) {
      phaseIndex = 0;
      activeLane = PHASE_PLAN[0].lane;
      enterState(ACTIVE_GREEN);
      currentGreenMs = greenForLane(activeLane);
      requestGreen(activeLane);
    } else {
      enterState(MANUAL_SAFE);
      setAllLightsRed();
    }
    saveConfig();
    publishAck("set_auto", true, "");
    return;
  }
  if (type == "set_config") {
    JsonObject c = doc["config"];
    if (!c.isNull()) {
      unsigned long g = c["green_time_s"] | 0;
      unsigned long y = c["yellow_time_s"] | 0;
      unsigned long ar = c["all_red_s"] | 0;
      unsigned long mn = c["min_green_s"] | 0;
      unsigned long mx = c["max_green_s"] | 0;
      if (g >= 1 && g <= 120) greenTimeMs = g * 1000UL;
      if (y >= 1 && y <= 30) yellowTimeMs = y * 1000UL;
      if (ar >= 0 && ar <= 10) allRedTimeMs = ar * 1000UL;
      if (mn >= 1 && mn <= 120) minGreenMs = mn * 1000UL;
      if (mx >= 1 && mx <= 120 && mx * 1000UL >= minGreenMs) maxGreenMs = mx * 1000UL;
      if (doc.containsKey("config_version")) configVersion = doc["config_version"] | configVersion;
      saveConfig();
    }
    publishAck("set_config", true, "");
    return;
  }
  publishAck("command", false, "unknown-type");
}

void messageReceived(char *topic, byte *payload, unsigned int length) {
  String t(topic);
  String raw;
  raw.reserve(length + 1);
  for (unsigned int i = 0; i < length; i++) raw += (char)payload[i];
  if (t == topicRecommendation()) handleRecommendation(raw);
  else if (t == topicVisionMetrics()) handleVisionMetrics(raw);
  else if (t == topicCommand()) handleCommand(raw);
  else if (t == topicLegacyConfig()) {
    // Legacy config JSON: petakan ke command kanonis.
    StaticJsonDocument<512> d;
    if (!deserializeJson(d, raw)) {
      StaticJsonDocument<1024> cmd;
      cmd["type"] = "set_config";
      JsonObject c = cmd.createNestedObject("config");
      if (d.containsKey("green_time_s")) c["green_time_s"] = d["green_time_s"];
      if (d.containsKey("yellow_time_s")) c["yellow_time_s"] = d["yellow_time_s"];
      if (d.containsKey("auto_mode")) {
        handleCommand("{\"type\":\"set_auto\",\"value\":" + String(d["auto_mode"].as<bool>() ? "true" : "false") + "}");
      }
      String s;
      serializeJson(cmd, s);
      handleCommand(s);
    }
  } else if (t == topicLegacyLight("north") || t == topicLegacyLight("south") || t == topicLegacyLight("east")) {
    String lane = t.endsWith("north/set") ? "north" : t.endsWith("south/set") ? "south" : "east";
    String color = raw;
    color.trim();
    color.toLowerCase();
    // Manual legacy = minta fase aman (§45): hanya saat auto OFF + validasi konflik.
    if (!autoMode && (color == "green" || color == "yellow" || color == "red")) {
      if (color == "red") {
        *lightOf(lane) = "red";
        applyLights();
        enterState(MANUAL_SAFE);
        publishAck("legacy_light", true, "");
      } else if (requestGreen(lane)) {
        if (color == "yellow") requestYellow(lane);
        enterState(MANUAL_SAFE);
        publishAck("legacy_light", true, "");
      } else {
        publishAck("legacy_light", false, "conflict-or-invalid");
      }
    } else {
      publishAck("legacy_light", false, "auto-on-or-bad-color");
    }
  }
  telemetryDirty = true;
}

// ============================================================
// SETUP / LOOP
// ============================================================

void setupPins() {
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
  pinMode(SOUTH_TRIG_PIN, OUTPUT);
  pinMode(EAST_TRIG_PIN, OUTPUT);
  pinMode(NORTH_ECHO_PIN, INPUT);
  pinMode(SOUTH_ECHO_PIN, INPUT);
  pinMode(EAST_ECHO_PIN, INPUT);
  digitalWrite(NORTH_TRIG_PIN, LOW);
  digitalWrite(SOUTH_TRIG_PIN, LOW);
  digitalWrite(EAST_TRIG_PIN, LOW);
  setAllLightsRed();
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\nASTRAEA CONTROLLER v2.0.0 — boot ALL_RED");
  loadConfig();
  Serial.print("intersection="); Serial.println(cfgIntersection);
  Serial.print("controller="); Serial.println(cfgController);
  setupPins();
  setAllLightsRed(); // §FS-07: tidak pernah boot ke output tak dikenal
  enterState(STARTUP_ALL_RED);
  while (!connectWiFi()) {
    handleSerialProvisioning();
    Serial.println("WiFi retry 5s (atau provisioning via serial)...");
    delay(5000);
  }
  client.setServer(cfgMqttHost.c_str(), cfgMqttPort);
  client.setCallback(messageReceived);
  client.setBufferSize(4096);
  reconnectMQTT();
  sendTelemetry();
  Serial.println("Controller v2 ready.");
}

void loop() {
  handleSerialProvisioning();
  if (WiFi.status() != WL_CONNECTED) {
    while (!connectWiFi()) delay(5000);
  }
  if (!client.connected()) reconnectMQTT();
  client.loop();
  unsigned long now = millis();
  if (now - lastSampleAt >= SENSOR_SAMPLE_MS) {
    sampleSensors();
    lastSampleAt = now;
  }
  // Vision freshness check 1 Hz -> fallback flag.
  if (now - lastVisionCheckAt >= 1000) {
    lastVisionCheckAt = now;
    bool anyFresh = visionFresh("north") || visionFresh("south") || visionFresh("east");
    if (!anyFresh && !fallbackMode) {
      fallbackMode = true;
      telemetryDirty = true;
      Serial.println("Vision basi semua pendekatan -> FALLBACK sensor.");
    } else if (anyFresh && fallbackMode) {
      fallbackMode = false;
      telemetryDirty = true;
      Serial.println("Vision pulih -> mode normal.");
    }
  }
  if (autoMode) {
    if (sigState == MANUAL_SAFE || sigState == FAILSAFE) {
      // Tetap merah aman sampai operator mengembalikan auto eksplisit.
      setAllLightsRed();
    } else {
      runPhaseEngine();
    }
  }
  if (client.connected() && telemetryDirty && now - lastTelemetryAt >= TELEMETRY_EVENT_MIN_MS) {
    sendTelemetry();
  } else if (client.connected() && now - lastTelemetryAt >= TELEMETRY_HEARTBEAT_MS) {
    sendTelemetry();
  }
  delay(5);
}
