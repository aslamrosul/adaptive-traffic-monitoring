/*
 * ============================================================
 * ASTRAEA-CAM v1.1 — ESP32-CAM cloud WSS ingest (HARDENED)
 * AI Thinker ESP32-CAM / OV2640
 * ============================================================
 *
 * TARGET:
 * - Firmware sama untuk semua kamera.
 * - Identitas per kamera disimpan di NVS lewat SoftAP provisioning.
 * - Setelah provisioning:
 *      colok adaptor -> WiFi -> NTP -> WSS -> Server 2 -> stream/YOLO
 * - Jika WiFi/router mati sementara:
 *      firmware TIDAK berhenti di SoftAP;
 *      STA tetap retry sampai jaringan kembali.
 * - Bila offline lama, maintenance SoftAP boleh muncul sambil STA
 *   tetap mencoba reconnect.
 * - WSS memverifikasi CA (ISRG Root X1), bukan setInsecure().
 * - Token tidak pernah dicetak ke serial atau ditampilkan kembali.
 *
 * Endpoint server:
 *   wss://vision.astraea.my.id:443/v1/camera/ingest
 *
 * Board:
 *   AI Thinker ESP32-CAM
 *
 * Libraries:
 *   ArduinoWebsockets (gilmaimon)
 *   ArduinoJson v6
 *   WiFi / WebServer / DNSServer / Preferences / esp_camera built-in
 *
 * CATATAN:
 * - Rotate token yang pernah terpaste ke chat/source sebelum dipakai final.
 * - Ini perangkat prototipe/lomba, bukan CCTV industrial tersertifikasi.
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
#include <esp_idf_version.h>
#include <time.h>

using namespace websockets;

// ============================================================
// VERSION / DEFAULT CLOUD
// ============================================================

#define FW_VERSION "astraea-cam-1.1.0"

#define NVS_NS "astcam"

#define DEF_HOST "vision.astraea.my.id"
#define DEF_PORT 443
#define DEF_TLS  1

#define CAMERA_INGEST_PATH "/v1/camera/ingest"

// ============================================================
// RUNTIME LIMITS
// ============================================================

#define WIFI_RETRY_MS                10000UL
#define MAINTENANCE_PORTAL_AFTER_MS  60000UL

#define CLOUD_BACKOFF_MIN_MS          1000UL
#define CLOUD_BACKOFF_MAX_MS         30000UL
#define CLOUD_AUTH_TIMEOUT_MS         5000UL

#define NTP_RETRY_MS                 10000UL
#define NTP_VALID_UNIX               1700000000L

#define STATUS_LOG_MS                10000UL
#define STREAM_STUCK_RESTART_MS      60000UL

#define WDT_TIMEOUT_SECONDS          30

#define MIN_FPS                      1
#define MAX_FPS                      5

#define MIN_JPEG_QUALITY             5
#define MAX_JPEG_QUALITY             40

// ============================================================
// AI THINKER ESP32-CAM PINOUT
// ============================================================

#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0

#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5

#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ============================================================
// LET'S ENCRYPT / ISRG ROOT X1
// Source root CA: official system trust copy of ISRG Root X1.
// ============================================================

static const char ISRG_ROOT_X1[] PROGMEM = R"PEM(-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)PEM";

// ============================================================
// CONFIG MODEL
// ============================================================

struct CamConfig {
  String wifiSsid;
  String wifiPass;

  String host;
  int port;
  int useTls;

  String cameraId;
  String intersectionId;
  String approachId;
  String token;

  int fps;
  int quality;

  String apPassword;
};

CamConfig cfg;

// ============================================================
// GLOBAL OBJECTS
// ============================================================

Preferences prefs;

WebsocketsClient wsClient;

WebServer portal(80);
DNSServer dnsServer;

// ============================================================
// CLOUD STATE
// ============================================================

enum CloudState {
  CLOUD_DOWN,
  CLOUD_CONNECTING,
  CLOUD_WAIT_AUTH,
  CLOUD_AUTHED
};

CloudState cloudState = CLOUD_DOWN;

bool authRejected = false;
bool websocketOpen = false;

// ============================================================
// RUNTIME METRICS
// ============================================================

unsigned long frameNo       = 0;
unsigned long droppedFrames = 0;
unsigned long sendOk        = 0;
unsigned long sendFail      = 0;
unsigned long reconnects    = 0;

unsigned long lastFrameAt       = 0;
unsigned long lastSendAt        = 0;
unsigned long lastStatusLogAt   = 0;

unsigned long lastWifiAttemptAt = 0;
unsigned long wifiOfflineSince  = 0;

unsigned long lastCloudTryAt    = 0;
unsigned long cloudBackoffMs    = CLOUD_BACKOFF_MIN_MS;
unsigned long cloudAuthStartedAt = 0;

unsigned long lastNtpStartAt    = 0;

bool wifiWasConnected = false;
bool portalActive     = false;
bool portalMaintenance = false;
bool portalHandlersInstalled = false;

// ============================================================
// WATCHDOG COMPATIBILITY
// ============================================================

void initWatchdog() {
#if ESP_IDF_VERSION_MAJOR >= 5
  esp_task_wdt_config_t wdtConfig = {};
  wdtConfig.timeout_ms = WDT_TIMEOUT_SECONDS * 1000UL;
  wdtConfig.idle_core_mask = (1U << portNUM_PROCESSORS) - 1U;
  wdtConfig.trigger_panic = true;

  esp_err_t err = esp_task_wdt_init(&wdtConfig);

  if (err == ESP_ERR_INVALID_STATE) {
    esp_task_wdt_reconfigure(&wdtConfig);
  }
#else
  esp_task_wdt_init(WDT_TIMEOUT_SECONDS, true);
#endif

  esp_task_wdt_add(NULL);
}

inline void feedWatchdog() {
  esp_task_wdt_reset();
}

// ============================================================
// STRING / VALIDATION HELPERS
// ============================================================

bool safeIdChar(char c) {
  return
      (c >= 'a' && c <= 'z') ||
      (c >= 'A' && c <= 'Z') ||
      (c >= '0' && c <= '9') ||
      c == '_' ||
      c == '-';
}

bool validIdentifier(
    const String &value,
    size_t minLen = 2,
    size_t maxLen = 64)
{
  if (value.length() < minLen ||
      value.length() > maxLen)
  {
    return false;
  }

  for (size_t i = 0; i < value.length(); i++) {
    if (!safeIdChar(value[i])) {
      return false;
    }
  }

  return true;
}

bool validHost(const String &host) {
  if (host.length() < 3 ||
      host.length() > 128)
  {
    return false;
  }

  if (host.indexOf("://") >= 0 ||
      host.indexOf('/') >= 0 ||
      host.indexOf(' ') >= 0)
  {
    return false;
  }

  return true;
}

bool validConfig(
    const CamConfig &candidate,
    String &error)
{
  if (candidate.wifiSsid.length() == 0 ||
      candidate.wifiSsid.length() > 32)
  {
    error = "WiFi SSID wajib diisi (maks 32 karakter).";
    return false;
  }

  if (!validHost(candidate.host)) {
    error = "Host tidak valid. Isi hostname saja tanpa http:// atau path.";
    return false;
  }

  if (candidate.port < 1 ||
      candidate.port > 65535)
  {
    error = "Port harus 1..65535.";
    return false;
  }

  if (candidate.useTls != 0 &&
      candidate.useTls != 1)
  {
    error = "TLS hanya boleh 0 atau 1.";
    return false;
  }

  if (!validIdentifier(candidate.cameraId)) {
    error = "Camera ID wajib dan hanya boleh huruf/angka/_/-.";
    return false;
  }

  if (!validIdentifier(candidate.intersectionId)) {
    error = "Intersection ID wajib dan hanya boleh huruf/angka/_/-.";
    return false;
  }

  if (!validIdentifier(candidate.approachId, 1, 32)) {
    error = "Approach ID wajib dan hanya boleh huruf/angka/_/-.";
    return false;
  }

  if (candidate.token.length() < 16 ||
      candidate.token.length() > 256)
  {
    error = "Token wajib diisi dan minimal 16 karakter.";
    return false;
  }

  if (candidate.fps < MIN_FPS ||
      candidate.fps > MAX_FPS)
  {
    error = "FPS harus 1..5.";
    return false;
  }

  if (candidate.quality < MIN_JPEG_QUALITY ||
      candidate.quality > MAX_JPEG_QUALITY)
  {
    error = "JPEG quality harus 5..40.";
    return false;
  }

  return true;
}

bool isProvisioned() {
  String error;
  return validConfig(cfg, error);
}

// ============================================================
// NVS
// ============================================================

String makeProvisioningPassword() {
  uint32_t r = esp_random();

  char buf[20];

  snprintf(
      buf,
      sizeof(buf),
      "AC%08lX",
      static_cast<unsigned long>(r));

  return String(buf);
}

void loadConfig() {
  prefs.begin(NVS_NS, true);

  cfg.wifiSsid =
      prefs.getString(
          "wifi_ssid",
          "");

  cfg.wifiPass =
      prefs.getString(
          "wifi_pass",
          "");

  cfg.host =
      prefs.getString(
          "host",
          DEF_HOST);

  cfg.port =
      prefs.getInt(
          "port",
          DEF_PORT);

  cfg.useTls =
      prefs.getInt(
          "use_tls",
          DEF_TLS);

  // Tidak ada default North supaya board South/East tidak
  // salah identitas bila lupa provisioning.
  cfg.cameraId =
      prefs.getString(
          "camera_id",
          "");

  cfg.intersectionId =
      prefs.getString(
          "inter",
          "");

  cfg.approachId =
      prefs.getString(
          "approach",
          "");

  cfg.token =
      prefs.getString(
          "token",
          "");

  cfg.fps =
      prefs.getInt(
          "fps",
          3);

  cfg.quality =
      prefs.getInt(
          "quality",
          14);

  cfg.apPassword =
      prefs.getString(
          "ap_pass",
          "");

  prefs.end();

  if (cfg.fps < MIN_FPS)
    cfg.fps = MIN_FPS;

  if (cfg.fps > MAX_FPS)
    cfg.fps = MAX_FPS;

  if (cfg.quality < MIN_JPEG_QUALITY)
    cfg.quality = 14;

  if (cfg.quality > MAX_JPEG_QUALITY)
    cfg.quality = 14;

  if (cfg.apPassword.length() < 8) {
    cfg.apPassword =
        makeProvisioningPassword();

    prefs.begin(NVS_NS, false);
    prefs.putString("ap_pass", cfg.apPassword);
    prefs.end();
  }
}

void saveConfig(
    const CamConfig &newCfg)
{
  prefs.begin(NVS_NS, false);

  prefs.putString(
      "wifi_ssid",
      newCfg.wifiSsid);

  prefs.putString(
      "wifi_pass",
      newCfg.wifiPass);

  prefs.putString(
      "host",
      newCfg.host);

  prefs.putInt(
      "port",
      newCfg.port);

  prefs.putInt(
      "use_tls",
      newCfg.useTls);

  prefs.putString(
      "camera_id",
      newCfg.cameraId);

  prefs.putString(
      "inter",
      newCfg.intersectionId);

  prefs.putString(
      "approach",
      newCfg.approachId);

  prefs.putString(
      "token",
      newCfg.token);

  prefs.putInt(
      "fps",
      newCfg.fps);

  prefs.putInt(
      "quality",
      newCfg.quality);

  prefs.putString(
      "ap_pass",
      newCfg.apPassword);

  prefs.end();
}

void eraseCameraConfig() {
  prefs.begin(NVS_NS, false);
  prefs.clear();
  prefs.end();
}

// ============================================================
// CAMERA
// ============================================================

bool initCamera() {
  camera_config_t c = {};

  c.ledc_channel = LEDC_CHANNEL_0;
  c.ledc_timer   = LEDC_TIMER_0;

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

#if ESP_IDF_VERSION_MAJOR >= 5
  c.pin_sccb_sda = SIOD_GPIO_NUM;
  c.pin_sccb_scl = SIOC_GPIO_NUM;
#else
  c.pin_sscb_sda = SIOD_GPIO_NUM;
  c.pin_sscb_scl = SIOC_GPIO_NUM;
#endif

  c.pin_pwdn = PWDN_GPIO_NUM;
  c.pin_reset = RESET_GPIO_NUM;

  c.xclk_freq_hz = 20000000;

  c.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    c.frame_size = FRAMESIZE_VGA;   // 640x480
    c.jpeg_quality = cfg.quality;
    c.fb_count = 1;
    c.fb_location = CAMERA_FB_IN_PSRAM;
    c.grab_mode = CAMERA_GRAB_LATEST;

    Serial.println(
        "[CAM] PSRAM OK -> VGA");
  }
  else {
    // Jangan menaikkan ke SVGA saat RAM lebih sempit.
    c.frame_size = FRAMESIZE_QVGA;  // 320x240
    c.jpeg_quality = max(cfg.quality, 18);
    c.fb_count = 1;
    c.fb_location = CAMERA_FB_IN_DRAM;
    c.grab_mode = CAMERA_GRAB_WHEN_EMPTY;

    Serial.println(
        "[CAM] WARN: PSRAM tidak ada -> QVGA/DRAM");
  }

  esp_err_t err =
      esp_camera_init(&c);

  if (err != ESP_OK) {
    Serial.printf(
        "[CAM] init gagal: 0x%x\n",
        err);

    return false;
  }

  camera_fb_t *fb =
      esp_camera_fb_get();

  if (!fb) {
    Serial.println(
        "[CAM] test frame gagal");

    return false;
  }

  Serial.printf(
      "[CAM] READY %ux%u | %u bytes\n",
      fb->width,
      fb->height,
      static_cast<unsigned>(fb->len));

  esp_camera_fb_return(fb);

  return true;
}

// ============================================================
// SOFTAP / PROVISIONING PORTAL
// ============================================================

String apName() {
  uint64_t mac =
      ESP.getEfuseMac();

  char suffix[8];

  snprintf(
      suffix,
      sizeof(suffix),
      "%04X",
      static_cast<uint16_t>(
          mac & 0xFFFF));

  return
      "ASTRAEA-CAM-" +
      String(suffix);
}

String htmlEscape(
    String v)
{
  v.replace("&", "&amp;");
  v.replace(""", "&quot;");
  v.replace("<", "&lt;");
  v.replace(">", "&gt;");

  return v;
}

String portalHtml() {
  String html;

  html.reserve(5000);

  html +=
      "<!doctype html><html><head>"
      "<meta charset='utf-8'>"
      "<meta name='viewport' content='width=device-width,initial-scale=1'>"
      "<title>ASTRAEA CAM Provisioning</title>"
      "<style>"
      "body{font-family:Arial,sans-serif;max-width:680px;margin:25px auto;padding:0 16px}"
      "input{width:100%;box-sizing:border-box;padding:10px;margin:4px 0 14px}"
      "button{padding:12px 18px}"
      ".note{background:#f3f3f3;padding:12px;border-radius:8px}"
      "</style></head><body>";

  html +=
      "<h2>ASTRAEA-CAM Provisioning</h2>";

  html +=
      "<div class='note'>"
      "Password WiFi dan token yang sudah tersimpan tidak pernah ditampilkan. "
      "Biarkan field password/token kosong untuk mempertahankan nilai lama."
      "</div><br>";

  html +=
      "<form method='POST' action='/save'>";

  html +=
      "WiFi SSID:"
      "<input name='ssid' value='" +
      htmlEscape(cfg.wifiSsid) +
      "'>";

  html +=
      "WiFi Password:"
      "<input name='wpass' type='password' placeholder='kosong = pertahankan password lama'>";

  html +=
      "Vision Host:"
      "<input name='host' value='" +
      htmlEscape(cfg.host) +
      "'>";

  html +=
      "Port:"
      "<input name='port' value='" +
      String(cfg.port) +
      "'>";

  html +=
      "TLS (1=ON, 0=OFF):"
      "<input name='tls' value='" +
      String(cfg.useTls) +
      "'>";

  html +=
      "Camera ID:"
      "<input name='cam' value='" +
      htmlEscape(cfg.cameraId) +
      "'>";

  html +=
      "Intersection ID:"
      "<input name='inter' value='" +
      htmlEscape(cfg.intersectionId) +
      "'>";

  html +=
      "Approach ID:"
      "<input name='approach' value='" +
      htmlEscape(cfg.approachId) +
      "'>";

  html +=
      "Device Token:"
      "<input name='token' type='password' placeholder='kosong = pertahankan token lama'>";

  html +=
      "FPS (1-5):"
      "<input name='fps' value='" +
      String(cfg.fps) +
      "'>";

  html +=
      "JPEG Quality (5-40; lebih kecil = lebih bagus/berat):"
      "<input name='quality' value='" +
      String(cfg.quality) +
      "'>";

  html +=
      "<button type='submit'>Save & Reboot</button>"
      "</form>";

  html +=
      "<p>Setelah tersimpan, kamera akan reboot dan kembali mencoba WiFi/cloud otomatis.</p>"
      "</body></html>";

  return html;
}

void installPortalHandlers() {
  if (portalHandlersInstalled)
    return;

  portal.on(
      "/",
      HTTP_GET,
      []() {
        portal.send(
            200,
            "text/html",
            portalHtml());
      });

  portal.on(
      "/save",
      HTTP_POST,
      []() {
        CamConfig candidate =
            cfg;

        String ssid =
            portal.arg("ssid");

        String wpass =
            portal.arg("wpass");

        String token =
            portal.arg("token");

        candidate.wifiSsid =
            ssid;

        // Password kosong = keep nilai lama.
        if (wpass.length() > 0) {
          candidate.wifiPass =
              wpass;
        }

        if (portal.arg("host").length() > 0)
          candidate.host = portal.arg("host");

        if (portal.arg("port").length() > 0)
          candidate.port = portal.arg("port").toInt();

        if (portal.arg("tls").length() > 0)
          candidate.useTls = portal.arg("tls").toInt();

        candidate.cameraId =
            portal.arg("cam");

        candidate.intersectionId =
            portal.arg("inter");

        candidate.approachId =
            portal.arg("approach");

        // Token kosong = keep nilai lama.
        if (token.length() > 0) {
          candidate.token =
              token;
        }

        if (portal.arg("fps").length() > 0)
          candidate.fps = portal.arg("fps").toInt();

        if (portal.arg("quality").length() > 0)
          candidate.quality = portal.arg("quality").toInt();

        candidate.cameraId.trim();
        candidate.intersectionId.trim();
        candidate.approachId.trim();
        candidate.host.trim();

        String error;

        if (!validConfig(
                candidate,
                error))
        {
          portal.send(
              400,
              "text/plain",
              "CONFIG INVALID: " +
              error);

          return;
        }

        saveConfig(candidate);

        portal.send(
            200,
            "text/plain",
            "Saved. Rebooting...");

        delay(400);

        ESP.restart();
      });

  portal.onNotFound(
      []() {
        portal.sendHeader(
            "Location",
            "/",
            true);

        portal.send(
            302,
            "text/plain",
            "");
      });

  portalHandlersInstalled =
      true;
}

void startPortal(
    bool maintenance)
{
  if (portalActive)
    return;

  installPortalHandlers();

  portalMaintenance =
      maintenance;

  // AP+STA: meskipun maintenance portal aktif,
  // ESP32 tetap boleh mencoba konek ke router.
  WiFi.mode(
      WIFI_AP_STA);

  bool apOk =
      WiFi.softAP(
          apName().c_str(),
          cfg.apPassword.c_str());

  if (!apOk) {
    Serial.println(
        "[PORTAL] gagal start SoftAP");

    return;
  }

  dnsServer.start(
      53,
      "*",
      WiFi.softAPIP());

  portal.begin();

  portalActive = true;

  Serial.println();
  Serial.println(
      "[PORTAL] provisioning aktif");

  Serial.print(
      "[PORTAL] SSID: ");

  Serial.println(
      apName());

  Serial.print(
      "[PORTAL] Password: ");

  Serial.println(
      cfg.apPassword);

  Serial.print(
      "[PORTAL] URL: http://");

  Serial.println(
      WiFi.softAPIP());

  if (maintenance) {
    Serial.println(
        "[PORTAL] mode maintenance; STA tetap retry WiFi.");
  }
}

void stopPortal() {
  if (!portalActive)
    return;

  dnsServer.stop();

  portal.stop();

  WiFi.softAPdisconnect(
      true);

  portalActive =
      false;

  portalMaintenance =
      false;

  WiFi.mode(
      WIFI_STA);

  Serial.println(
      "[PORTAL] ditutup karena WiFi sudah pulih.");
}

void servicePortal() {
  if (!portalActive)
    return;

  dnsServer.processNextRequest();

  portal.handleClient();

  feedWatchdog();
}

// ============================================================
// WIFI
// ============================================================

void beginWifiAttempt() {
  if (cfg.wifiSsid.length() == 0)
    return;

  lastWifiAttemptAt =
      millis();

  if (portalActive)
    WiFi.mode(WIFI_AP_STA);
  else
    WiFi.mode(WIFI_STA);

  WiFi.setSleep(false);

  Serial.print(
      "[WiFi] mencoba ");

  Serial.println(
      cfg.wifiSsid);

  WiFi.begin(
      cfg.wifiSsid.c_str(),
      cfg.wifiPass.c_str());
}

void closeCloud() {
  if (wsClient.available()) {
    wsClient.close();
  }

  websocketOpen = false;
  authRejected = false;
  cloudState = CLOUD_DOWN;
}

void maintainWifi() {
  unsigned long now =
      millis();

  if (WiFi.status() ==
      WL_CONNECTED)
  {
    if (!wifiWasConnected) {
      wifiWasConnected =
          true;

      wifiOfflineSince =
          0;

      Serial.println();
      Serial.println(
          "[WiFi] CONNECTED");

      Serial.print(
          "[WiFi] IP: ");

      Serial.println(
          WiFi.localIP());

      Serial.print(
          "[WiFi] RSSI: ");

      Serial.println(
          WiFi.RSSI());

      lastNtpStartAt = 0;
    }

    // Maintenance portal yang muncul karena outage ditutup
    // setelah WiFi kembali.
    if (portalActive &&
        portalMaintenance)
    {
      stopPortal();
    }

    return;
  }

  // WiFi OFFLINE.
  if (wifiWasConnected) {
    wifiWasConnected =
        false;

    wifiOfflineSince =
        now;

    Serial.println(
        "[WiFi] LOST");

    closeCloud();
  }

  if (wifiOfflineSince == 0)
    wifiOfflineSince = now;

  if (!isProvisioned()) {
    // First provisioning: portal wajib.
    startPortal(false);
    return;
  }

  // Provisioned device: retry STA tanpa henti.
  if (lastWifiAttemptAt == 0 ||
      now - lastWifiAttemptAt >=
          WIFI_RETRY_MS)
  {
    beginWifiAttempt();
  }

  // Setelah offline lama, buka maintenance portal juga,
  // tetapi TIDAK menghentikan retry STA.
  if (!portalActive &&
      now - wifiOfflineSince >=
          MAINTENANCE_PORTAL_AFTER_MS)
  {
    startPortal(true);
  }
}

// ============================================================
// NTP / TLS TIME
// ============================================================

bool timeIsValid() {
  return
      time(nullptr) >=
      NTP_VALID_UNIX;
}

void maintainNtp() {
  if (WiFi.status() !=
      WL_CONNECTED)
  {
    return;
  }

  if (timeIsValid())
    return;

  unsigned long now =
      millis();

  if (lastNtpStartAt == 0 ||
      now - lastNtpStartAt >=
          NTP_RETRY_MS)
  {
    lastNtpStartAt =
        now;

    // UTC
    configTime(
        0,
        0,
        "pool.ntp.org",
        "time.google.com",
        "time.cloudflare.com");

    Serial.println(
        "[NTP] sync request");
  }
}

// ============================================================
// WEBSOCKET / CLOUD
// ============================================================

String wsUrl() {
  String scheme =
      cfg.useTls
          ? "wss"
          : "ws";

  return
      scheme +
      "://" +
      cfg.host +
      ":" +
      String(cfg.port) +
      CAMERA_INGEST_PATH;
}

void handleWsMessage(
    WebsocketsMessage message)
{
  if (!message.isText())
    return;

  String data =
      message.data();

  StaticJsonDocument<768> doc;

  DeserializationError err =
      deserializeJson(
          doc,
          data);

  if (err) {
    Serial.println(
        "[WS] server text JSON invalid");

    return;
  }

  bool ok =
      doc["ok"] |
      false;

  if (ok) {
    cloudState =
        CLOUD_AUTHED;

    authRejected =
        false;

    cloudBackoffMs =
        CLOUD_BACKOFF_MIN_MS;

    lastFrameAt =
        millis();

    Serial.println(
        "[WS] AUTH OK / CLOUD UP");

    return;
  }

  // Jika server secara eksplisit membalas error.
  if (doc.containsKey("ok") &&
      !ok)
  {
    authRejected =
        true;

    Serial.println(
        "[WS] AUTH REJECTED");

    wsClient.close();

    websocketOpen =
        false;

    cloudState =
        CLOUD_DOWN;
  }
}

void handleWsEvent(
    WebsocketsEvent event,
    String data)
{
  (void)data;

  switch (event) {
    case WebsocketsEvent::ConnectionOpened:
      websocketOpen = true;

      Serial.println(
          "[WS] socket opened");
      break;

    case WebsocketsEvent::ConnectionClosed:
      websocketOpen = false;

      if (cloudState ==
          CLOUD_AUTHED)
      {
        Serial.println(
            "[WS] socket closed");
      }

      cloudState =
          CLOUD_DOWN;
      break;

    case WebsocketsEvent::GotPing:
      break;

    case WebsocketsEvent::GotPong:
      break;
  }
}

void sendHello() {
  StaticJsonDocument<768> hello;

  hello["camera_id"] =
      cfg.cameraId;

  hello["intersection_id"] =
      cfg.intersectionId;

  hello["approach_id"] =
      cfg.approachId;

  hello["token"] =
      cfg.token;

  hello["firmware"] =
      FW_VERSION;

  hello["fps"] =
      cfg.fps;

  hello["jpeg_quality"] =
      cfg.quality;

  String payload;

  serializeJson(
      hello,
      payload);

  wsClient.send(
      payload);
}

bool tryCloudConnect() {
  if (!isProvisioned())
    return false;

  if (WiFi.status() !=
      WL_CONNECTED)
  {
    return false;
  }

  // TLS verification idealnya baru dilakukan setelah jam valid.
  if (cfg.useTls &&
      !timeIsValid())
  {
    return false;
  }

  Serial.print(
      "[WS] connect ");

  Serial.println(
      wsUrl());

  cloudState =
      CLOUD_CONNECTING;

  authRejected =
      false;

  if (cfg.useTls) {
    // Verifikasi CA / chain server.
    wsClient.setCACert(
        ISRG_ROOT_X1);
  }

  bool connected =
      wsClient.connect(
          wsUrl());

  feedWatchdog();

  if (!connected) {
    cloudState =
        CLOUD_DOWN;

    reconnects++;

    Serial.println(
        "[WS] connect gagal");

    return false;
  }

  websocketOpen =
      true;

  wsClient.onMessage(
      handleWsMessage);

  wsClient.onEvent(
      handleWsEvent);

  sendHello();

  cloudState =
      CLOUD_WAIT_AUTH;

  cloudAuthStartedAt =
      millis();

  return true;
}

void scheduleCloudRetry() {
  reconnects++;

  lastCloudTryAt =
      millis();

  cloudBackoffMs =
      min(
          cloudBackoffMs * 2UL,
          CLOUD_BACKOFF_MAX_MS);

  Serial.print(
      "[WS] retry backoff=");

  Serial.println(
      cloudBackoffMs);
}

void maintainCloud() {
  if (WiFi.status() !=
      WL_CONNECTED)
  {
    return;
  }

  if (!isProvisioned())
    return;

  if (cfg.useTls &&
      !timeIsValid())
  {
    return;
  }

  if (wsClient.available()) {
    wsClient.poll();
  }

  unsigned long now =
      millis();

  if (cloudState ==
      CLOUD_AUTHED)
  {
    if (!wsClient.available()) {
      Serial.println(
          "[WS] connection lost");

      cloudState =
          CLOUD_DOWN;

      websocketOpen =
          false;

      scheduleCloudRetry();
    }

    return;
  }

  if (cloudState ==
      CLOUD_WAIT_AUTH)
  {
    if (authRejected) {
      cloudState =
          CLOUD_DOWN;

      // Auth error biasanya config/token salah.
      // Biarkan maintenance portal tersedia.
      if (!portalActive)
        startPortal(true);

      cloudBackoffMs =
          CLOUD_BACKOFF_MAX_MS;

      lastCloudTryAt =
          now;

      return;
    }

    if (now - cloudAuthStartedAt >=
        CLOUD_AUTH_TIMEOUT_MS)
    {
      Serial.println(
          "[WS] auth timeout");

      wsClient.close();

      websocketOpen =
          false;

      cloudState =
          CLOUD_DOWN;

      scheduleCloudRetry();
    }

    return;
  }

  if (cloudState ==
      CLOUD_CONNECTING)
  {
    return;
  }

  if (lastCloudTryAt == 0 ||
      now - lastCloudTryAt >=
          cloudBackoffMs)
  {
    lastCloudTryAt =
        now;

    if (tryCloudConnect()) {
      // Menunggu auth callback.
      return;
    }

    scheduleCloudRetry();
  }
}

// ============================================================
// FRAME SENDING
// ============================================================

void sendFrameIfDue() {
  if (cloudState !=
      CLOUD_AUTHED)
  {
    return;
  }

  if (!wsClient.available()) {
    return;
  }

  unsigned long now =
      millis();

  unsigned long interval =
      1000UL /
      static_cast<unsigned long>(
          cfg.fps);

  if (now - lastSendAt <
      interval)
  {
    return;
  }

  // Timestamp start frame.
  lastSendAt =
      now;

  camera_fb_t *fb =
      esp_camera_fb_get();

  if (!fb) {
    droppedFrames++;

    Serial.println(
        "[CAM] frame null");

    return;
  }

  bool ok = false;

  if (fb->format ==
      PIXFORMAT_JPEG)
  {
    ok =
        wsClient.sendBinary(
            reinterpret_cast<const char *>(
                fb->buf),
            fb->len);
  }

  if (ok) {
    frameNo++;
    sendOk++;

    lastFrameAt =
        millis();
  }
  else {
    sendFail++;
    droppedFrames++;

    Serial.println(
        "[STREAM] send gagal");
  }

  esp_camera_fb_return(
      fb);
}

// ============================================================
// STATUS / HEALTH
// ============================================================

String cloudStateName() {
  switch (cloudState) {
    case CLOUD_DOWN:
      return "DOWN";

    case CLOUD_CONNECTING:
      return "CONNECTING";

    case CLOUD_WAIT_AUTH:
      return "WAIT_AUTH";

    case CLOUD_AUTHED:
      return "UP";
  }

  return "UNKNOWN";
}

void logStatus() {
  Serial.println();

  Serial.print(
      "[STATUS] cam=");

  Serial.print(
      cfg.cameraId.length()
          ? cfg.cameraId
          : "(unprovisioned)");

  Serial.print(
      " inter=");

  Serial.print(
      cfg.intersectionId.length()
          ? cfg.intersectionId
          : "-");

  Serial.print(
      " approach=");

  Serial.print(
      cfg.approachId.length()
          ? cfg.approachId
          : "-");

  Serial.print(
      " wifi=");

  Serial.print(
      WiFi.status() ==
              WL_CONNECTED
          ? "UP"
          : "DOWN");

  Serial.print(
      " rssi=");

  Serial.print(
      WiFi.status() ==
              WL_CONNECTED
          ? WiFi.RSSI()
          : 0);

  Serial.print(
      " cloud=");

  Serial.print(
      cloudStateName());

  Serial.print(
      " frame=");

  Serial.print(
      frameNo);

  Serial.print(
      " ok=");

  Serial.print(
      sendOk);

  Serial.print(
      " fail=");

  Serial.print(
      sendFail);

  Serial.print(
      " drop=");

  Serial.print(
      droppedFrames);

  Serial.print(
      " reconnect=");

  Serial.println(
      reconnects);
}

void healthChecks() {
  unsigned long now =
      millis();

  if (now - lastStatusLogAt >=
      STATUS_LOG_MS)
  {
    lastStatusLogAt =
        now;

    logStatus();
  }

  // Jika sudah AUTH tetapi 60 detik tidak ada satu pun frame sukses,
  // restart untuk recovery kamera/network stack.
  if (cloudState ==
          CLOUD_AUTHED &&
      now - lastFrameAt >=
          STREAM_STUCK_RESTART_MS)
  {
    Serial.println(
        "[HEALTH] stream stuck >60s -> restart");

    delay(300);

    ESP.restart();
  }
}

// ============================================================
// SERIAL MAINTENANCE
//
// Commands:
//   show
//   portal
//   reboot
//   factory-reset CONFIRM
// ============================================================

void handleSerial() {
  if (!Serial.available())
    return;

  String line =
      Serial.readStringUntil(
          '\n');

  line.trim();

  if (line == "show") {
    logStatus();

    Serial.print(
        "[CONFIG] host=");

    Serial.print(
        cfg.host);

    Serial.print(":");

    Serial.print(
        cfg.port);

    Serial.print(
        " tls=");

    Serial.print(
        cfg.useTls);

    Serial.print(
        " fps=");

    Serial.print(
        cfg.fps);

    Serial.print(
        " quality=");

    Serial.println(
        cfg.quality);

    Serial.println(
        "[CONFIG] secrets tidak ditampilkan.");

    return;
  }

  if (line == "portal") {
    startPortal(true);
    return;
  }

  if (line == "reboot") {
    Serial.println(
        "Rebooting...");

    delay(200);

    ESP.restart();
  }

  if (line ==
      "factory-reset CONFIRM")
  {
    Serial.println(
        "NVS camera config erased.");

    eraseCameraConfig();

    delay(300);

    ESP.restart();
  }

  Serial.println(
      "Commands: show | portal | reboot | factory-reset CONFIRM");
}

// ============================================================
// SETUP
// ============================================================

void setup() {
  Serial.begin(
      115200);

  delay(
      500);

  Serial.println();
  Serial.println(
      "==============================================");

  Serial.println(
      " ASTRAEA-CAM v1.1 HARDENED");

  Serial.println(
      " WiFi -> WSS -> Vision Server");

  Serial.println(
      "==============================================");

  loadConfig();

  initWatchdog();

  wsClient.onMessage(
      handleWsMessage);

  wsClient.onEvent(
      handleWsEvent);

  if (!initCamera()) {
    Serial.println(
        "[FATAL] camera init gagal -> restart");

    delay(1500);

    ESP.restart();
  }

  WiFi.mode(
      WIFI_STA);

  WiFi.setSleep(
      false);

  if (!isProvisioned()) {
    Serial.println(
        "[BOOT] belum diprovision -> SoftAP");

    startPortal(false);
  }
  else {
    Serial.print(
        "[BOOT] identity=");

    Serial.print(
        cfg.cameraId);

    Serial.print("/");

    Serial.print(
        cfg.intersectionId);

    Serial.print("/");

    Serial.println(
        cfg.approachId);

    beginWifiAttempt();

    wifiOfflineSince =
        millis();
  }

  lastStatusLogAt =
      millis();

  feedWatchdog();
}

// ============================================================
// LOOP
// ============================================================

void loop() {
  feedWatchdog();

  // SoftAP captive portal tetap responsive bila aktif.
  servicePortal();

  // WiFi selalu dipelihara.
  maintainWifi();

  // NTP diperlukan sebelum WSS TLS production.
  maintainNtp();

  // WSS auth/reconnect.
  maintainCloud();

  // Kirim JPEG hanya setelah auth berhasil.
  sendFrameIfDue();

  // Serial maintenance.
  handleSerial();

  // Logging & stuck recovery.
  healthChecks();

  delay(5);
}
