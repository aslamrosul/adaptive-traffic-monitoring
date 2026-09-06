/*
 * ============================================================
 * ASTRAEA-CAM v1 — ESP32-CAM (AI-Thinker) cloud WSS ingest
 * Kamera -> outbound WS/WSS -> Server 2 (plug-and-run §G3).
 *
 * - NVS provisioning (wifi/host/id/token/fps/kualitas)
 * - SoftAP "ASTRAEA-CAM-<suffix>" bila WiFi gagal (config via
 *   halaman web di 192.168.4.1, simpan -> reboot)
 * - Frame JPEG latest-only 2-5 FPS, drop bila lambat (§CAM-FW-04)
 * - Reconnect eksponensial + task watchdog (§CAM-FW-05/06)
 * - Log serial status TANPA secret (§CAM-FW-07/08)
 *
 * Server path: /v1/camera/ingest
 *   pakai TLS (port 443) bila VISION_USE_TLS=1 (produksi),
 *   WS biasa bila 0 (bring-up lokal, mis. port 8082).
 *
 * Build: Arduino-ESP32, board "AI Thinker ESP32-CAM", lib:
 *   ArduinoWebsockets (gilmaimon), ArduinoJson v6
 *   (WiFi, Preferences, esp_camera, esp_task_wdt bawaan)
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <ArduinoWebsockets.h>
#include <esp_camera.h>
#include <esp_task_wdt.h>

using namespace websockets;

// ---------- NVS keys ----------
#define NVS_NS "astcam"
#define DEF_HOST "vision.astraea.my.id" // WSS produksi (PRD CAM-FW-03)
#define DEF_PORT 443
#define DEF_TLS 1

// ---------- AI-Thinker pins ----------
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

Preferences prefs;
String cfgWifiSsid = "";
String cfgWifiPass = "";
String cfgHost = DEF_HOST;
int cfgPort = DEF_PORT;
int cfgTls = DEF_TLS;
String cfgCameraId = "CAM_TALUN_NORTH_01";
String cfgIntersection = "SIMPANG_TALUN_01";
String cfgApproach = "north";
String cfgToken = "";
int cfgFps = 3;
int cfgQuality = 14;

WebsocketsClient wsClient;
WebServer portal(80);
DNSServer dnsServer;

volatile unsigned long frameNo = 0;
volatile unsigned long droppedFrames = 0;
volatile unsigned long sendOk = 0;
volatile unsigned long sendFail = 0;
volatile unsigned long reconnects = 0;
volatile unsigned long lastFrameAt = 0;
volatile bool authed = false;

void loadCamConfig() {
  prefs.begin(NVS_NS, true);
  cfgWifiSsid = prefs.getString("wifi_ssid", "");
  cfgWifiPass = prefs.getString("wifi_pass", "");
  cfgHost = prefs.getString("host", DEF_HOST);
  cfgPort = prefs.getInt("port", DEF_PORT);
  cfgTls = prefs.getInt("use_tls", DEF_TLS);
  cfgCameraId = prefs.getString("camera_id", cfgCameraId);
  cfgIntersection = prefs.getString("inter", cfgIntersection);
  cfgApproach = prefs.getString("approach", cfgApproach);
  cfgToken = prefs.getString("token", "");
  cfgFps = prefs.getInt("fps", 3);
  cfgQuality = prefs.getInt("quality", 14);
  prefs.end();
  if (cfgFps < 1) cfgFps = 1;
  if (cfgFps > 5) cfgFps = 5;
}

void saveCamConfig() {
  prefs.begin(NVS_NS, false);
  prefs.putString("wifi_ssid", cfgWifiSsid);
  prefs.putString("wifi_pass", cfgWifiPass);
  prefs.putString("host", cfgHost);
  prefs.putInt("port", cfgPort);
  prefs.putInt("use_tls", cfgTls);
  prefs.putString("camera_id", cfgCameraId);
  prefs.putString("inter", cfgIntersection);
  prefs.putString("approach", cfgApproach);
  prefs.putString("token", cfgToken);
  prefs.putInt("fps", cfgFps);
  prefs.putInt("quality", cfgQuality);
  prefs.end();
}

bool initCamera() {
  camera_config_t c;
  c.ledc_channel = LEDC_CHANNEL_0;
  c.ledc_timer = LEDC_TIMER_0;
  c.pin_d0 = Y2_GPIO_NUM;
  c.pin_d1 = Y3_GPIO_NUM;
  c.pin_d2 = Y4_GPIO_NUM;
  c.pin_d3 = Y5_GPIO_NUM;
  c.pin_d4 = Y6_GPIO_NUM;
  c.pin_d5 = Y7_GPIO_NUM;
  c.pin_d6 = Y8_GPIO_NUM;
  c.pin_d7 = Y9_GPIO_NUM;
  c.pin_xclk = XCLK_GPIO_NUM;
  c.pin_pclk = PCLK_GPIO_NUM;
  c.pin_vsync = VSYNC_GPIO_NUM;
  c.pin_href = HREF_GPIO_NUM;
  c.pin_sscb_sda = SIOD_GPIO_NUM;
  c.pin_sscb_scl = SIOC_GPIO_NUM;
  c.pin_pwdn = PWDN_GPIO_NUM;
  c.pin_reset = RESET_GPIO_NUM;
  c.xclk_freq_hz = 20000000;
  c.pixel_format = PIXFORMAT_JPEG;
  c.frame_size = FRAMESIZE_VGA; // 640x480 (§CAM-FW-04)
  c.jpeg_quality = cfgQuality;
  c.fb_count = 1; // latest-only, tanpa antrean
  c.fb_location = CAMERA_FB_IN_PSRAM;
  c.grab_mode = CAMERA_GRAB_LATEST;
  if (psramFound()) {
    c.jpeg_quality = cfgQuality;
    c.fb_count = 1;
  } else {
    c.frame_size = FRAMESIZE_SVGA;
    c.fb_location = CAMERA_FB_IN_DRAM;
  }
  return esp_camera_init(&c) == ESP_OK;
}

// ---------- SoftAP provisioning ----------
String apName() {
  uint64_t mac = ESP.getEfuseMac();
  char suffix[7];
  snprintf(suffix, sizeof(suffix), "%04X", (uint16_t)(mac & 0xFFFF));
  return "ASTRAEA-CAM-" + String(suffix);
}

const char *PORTAL_HTML =
    "<html><body><h3>ASTRAEA-CAM Provisioning</h3>"
    "<form method=POST action=/save>"
    "WiFi SSID:<br><input name=ssid><br>"
    "WiFi Pass:<br><input name=wpass type=password><br>"
    "Host:<br><input name=host><br>"
    "Port:<br><input name=port><br>"
    "TLS (0/1):<br><input name=tls><br>"
    "Camera ID:<br><input name=cam><br>"
    "Intersection:<br><input name=inter><br>"
    "Approach:<br><input name=approach><br>"
    "Token:<br><input name=token type=password><br>"
    "FPS (1-5):<br><input name=fps><br>"
    "Quality:<br><input name=quality><br><br>"
    "<input type=submit value=Save-Reboot></form></body></html>";

void startSoftAP() {
  String name = apName();
  WiFi.mode(WIFI_AP);
  WiFi.softAP(name.c_str());
  dnsServer.start(53, "*", WiFi.softAPIP());
  portal.on("/", []() { portal.send(200, "text/html", PORTAL_HTML); });
  portal.on("/save", []() {
    cfgWifiSsid = portal.arg("ssid");
    cfgWifiPass = portal.arg("wpass");
    if (portal.arg("host").length()) cfgHost = portal.arg("host");
    if (portal.arg("port").length()) cfgPort = portal.arg("port").toInt();
    if (portal.arg("tls").length()) cfgTls = portal.arg("tls").toInt();
    if (portal.arg("cam").length()) cfgCameraId = portal.arg("cam");
    if (portal.arg("inter").length()) cfgIntersection = portal.arg("inter");
    if (portal.arg("approach").length()) cfgApproach = portal.arg("approach");
    if (portal.arg("token").length()) cfgToken = portal.arg("token");
    if (portal.arg("fps").length()) cfgFps = portal.arg("fps").toInt();
    if (portal.arg("quality").length()) cfgQuality = portal.arg("quality").toInt();
    saveCamConfig();
    portal.send(200, "text/plain", "Saved. Rebooting...");
    delay(500);
    ESP.restart();
  });
  portal.onNotFound([]() { portal.send(200, "text/html", PORTAL_HTML); });
  portal.begin();
  Serial.print("SoftAP provisioning: ");
  Serial.println(name);
  while (true) {
    dnsServer.processNextRequest();
    portal.handleClient();
    delay(10);
  }
}

bool connectWifiBlocking(unsigned long timeoutMs) {
  if (cfgWifiSsid.length() == 0) return false;
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(cfgWifiSsid.c_str(), cfgWifiPass.c_str());
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < timeoutMs) {
    delay(400);
    Serial.print(".");
  }
  return WiFi.status() == WL_CONNECTED;
}

String wsUrl() {
  String scheme = cfgTls ? "wss" : "ws";
  return scheme + "://" + cfgHost + ":" + String(cfgPort) + "/v1/camera/ingest";
}

bool cloudConnect() {
  StaticJsonDocument<512> hello;
  hello["camera_id"] = cfgCameraId;
  hello["intersection_id"] = cfgIntersection;
  hello["approach_id"] = cfgApproach;
  hello["token"] = cfgToken;
  hello["firmware"] = "astrea-cam-1.0";
  String payload;
  serializeJson(hello, payload);
  if (!wsClient.connect(wsUrl())) return false;
  wsClient.send(payload);
  // Tunggu balasan ok (timeout 5 dtk).
  unsigned long t0 = millis();
  while (millis() - t0 < 5000) {
    wsClient.poll();
    if (wsClient.available()) {
      WebsocketsMessage m = wsClient.readBlocking();
      String d = m.data();
      if (d.indexOf("\"ok\":true") >= 0 || d.indexOf("\"ok\": true") >= 0) {
        authed = true;
        return true;
      }
      return false; // server menolak (token salah dsb) -> jangan retry buta
    }
    delay(50);
  }
  return false;
}

void logStatus() {
  Serial.println();
  Serial.print("cam="); Serial.print(cfgCameraId);
  Serial.print(" inter="); Serial.print(cfgIntersection);
  Serial.print(" approach="); Serial.print(cfgApproach);
  Serial.print(" wifi_rssi="); Serial.print(WiFi.RSSI());
  Serial.print(" ip="); Serial.print(WiFi.localIP());
  Serial.print(" cloud="); Serial.print(authed ? "UP" : "DOWN");
  Serial.print(" frame="); Serial.print(frameNo);
  Serial.print(" ok="); Serial.print(sendOk);
  Serial.print(" drop="); Serial.print(droppedFrames);
  Serial.print(" recon="); Serial.println(reconnects);
}

void setup() {
  Serial.begin(115200);
  delay(400);
  Serial.println("\nASTRAEA-CAM v1 boot");
  loadCamConfig();
  esp_task_wdt_init(30, true);
  esp_task_wdt_add(NULL);
  if (!psramFound()) Serial.println("WARN: PSRAM tidak ada");
  if (!initCamera()) {
    Serial.println("FATAL: kamera init gagal");
    delay(2000);
    ESP.restart();
  }
  if (!connectWifiBlocking(25000)) {
    Serial.println("WiFi gagal -> SoftAP provisioning");
    startSoftAP(); // tidak kembali
  }
  // Sinkron waktu (best effort; tidak fatal bila gagal).
  configTime(7 * 3600, 0, "pool.ntp.org", "time.google.com");
  Serial.print("identity: ");
  Serial.print(cfgCameraId);
  Serial.print("/");
  Serial.print(cfgIntersection);
  Serial.print("/");
  Serial.println(cfgApproach);
}

void loop() {
  esp_task_wdt_reset();
  if (WiFi.status() != WL_CONNECTED) {
    authed = false;
    if (!connectWifiBlocking(20000)) {
      Serial.println("WiFi putus -> SoftAP");
      startSoftAP();
    }
  }
  if (!authed) {
    static unsigned long backoff = 1000;
    static unsigned long lastTry = 0;
    if (millis() - lastTry >= backoff) {
      lastTry = millis();
      if (cloudConnect()) {
        backoff = 1000;
        Serial.println("cloud UP");
      } else {
        reconnects++;
        backoff = min(backoff * 2, 30000UL); // eksponensial maks 30 dtk
        Serial.print("cloud retry dalam ");
        Serial.println(backoff);
      }
    }
    delay(100);
    return;
  }
  wsClient.poll();
  if (!wsClient.available()) {
    authed = false;
    Serial.println("cloud DOWN -> reconnect");
    delay(200);
    return;
  }
  static unsigned long lastSend = 0;
  unsigned long interval = 1000UL / (unsigned long)cfgFps;
  if (millis() - lastSend < interval) {
    delay(20);
    return;
  }
  lastSend = millis();
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    droppedFrames++;
    return;
  }
  // Latest-only: kirim langsung; bila gagal, frame ini dibuang (tanpa antrean).
  if (fb->format == PIXFORMAT_JPEG && wsClient.sendBinary((const char *)fb->buf, fb->len)) {
    frameNo++;
    sendOk++;
    lastFrameAt = millis();
  } else {
    sendFail++;
    droppedFrames++;
  }
  esp_camera_fb_return(fb);
  if (frameNo % 20 == 0) logStatus();
  if (millis() - lastFrameAt > 60000 && frameNo > 0) {
    Serial.println("stream macet >60 dtk -> restart");
    delay(500);
    ESP.restart();
  }
}
