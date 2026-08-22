/*
 * ASTRAEA ESP32-CAM MJPEG Streamer  (JALUR A - Live View)
 * Board  : AI Thinker ESP32-CAM (OV2640)
 * Partisi: Huge APP (3MB No OTA)  <- WAJIB dipilih di Arduino IDE
 *
 * Endpoints:
 *   GET http://<ip>/            -> halaman info sederhana
 *   GET http://<ip>/status      -> JSON status (uptime, frames, resolusi)
 *   GET http://<ip>/capture.jpg -> snapshot satu frame JPEG
 *   GET http://<ip>:81/stream   -> MJPEG stream (kompatibel ffmpeg & VLC)
 *   GET http://<ip>/flash?on=1  -> flash LED putih ON/OFF
 *
 * Kalau WiFi gagal tersambung 20 detik -> mode AP fallback:
 *   SSID: ASTRAEA-CAM  Pass: 12345678  -> buka http://192.168.4.1
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>

// ================== KONFIGURASI ==================
const char* WIFI_SSID     = "NAMA_WIFI_KAMU";
const char* WIFI_PASSWORD = "PASSWORD_WIFI";

// Resolusi stream. Urutan kecil->besar:
// QVGA(320x240) CIF VGA(640x480) SVGA(800x600) XGA(1024x768) HD(1280x720) SXGA UXGA(1600x1200)
// Untuk deteksi kendaraan via YOLOv8: SVGA adalah keseimbangan bagus.
framesize_t FRAME_SIZE     = FRAMESIZE_SVGA;
uint8_t      JPEG_QUALITY  = 12;   // 0-63, makin kecil makin berkualitas (file besar)
#define XCLK_MHZ 20            // 20MHz aman utk semua resolusi; 10MHz kalau frame GREY/corrupt

#define FLASH_LED_PIN 4        // LED putih onboard
#define STATUS_LED_PIN 33      // LED merah onboard (aktif LOW)

// ================== GLOBAL ==================
WebServer server(80);
WebServer streamServer(81);
volatile uint32_t frameCount = 0;
unsigned long bootMs = 0;
bool flashOn = false;

static const char* STREAM_CONTENT_TYPE =
  "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* STREAM_PART =
  "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

// ============ PIN DEFINITION AI-THINKER ============
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

// ================== KAMERA ==================
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = XCLK_MHZ * 1000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAME_SIZE;
  config.jpeg_quality = JPEG_QUALITY;
  config.fb_count = 2;                 // double buffer = FPS lebih tinggi
  config.grab_mode = CAMERA_GRAB_LATEST; // selalu frame terbaru (latensi rendah)
  config.fb_location = CAMERA_FB_IN_PSRAM;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[CAM] init GAGAL: 0x%x\n", err);
    return false;
  }

  sensor_t* s = esp_camera_sensor_get();
  // Penyetelan untuk scene lalu lintas outdoor:
  s->set_vflip(s, 0);            // 1 jika cam terpasang terbalik
  s->set_hmirror(s, 0);
  s->set_brightness(s, 0);       // -2..2
  s->set_contrast(s, 1);         // sedikit lebih tajam
  s->set_saturation(s, 0);
  s->set_whitebal(s, 1);
  s->set_awb_gain(s, 1);
  s->set_wb_mode(s, 0);
  s->set_exposure_ctrl(s, 1);
  s->set_aec2(s, 1);             // night mode bantu saat gelap
  s->set_gain_ctrl(s, 1);
  s->set_agc_gain(s, 0);
  s->set_special_effect(s, 0);   // 0=no effect
  return true;
}

// ================== HANDLERS (port 80) ==================
void handleRoot() {
  String html = "<html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
                "<title>ASTRAEA CAM</title></head>"
                "<body style='font-family:sans-serif;text-align:center;padding-top:40px'>"
                "<h2>ASTRAEA ESP32-CAM</h2>"
                "<p><a href='/stream' style='font-size:1.2em'>Buka Stream</a></p>"
                "<p><img src='/capture.jpg' width='320'></p>"
                "<p><small>snapshot di-refresh manual</small></p>"
                "</body></html>";
  server.send(200, "text/html", html);
}

void handleStatus() {
  String json = "{";
  json += "\"uptime_ms\":" + String(millis() - bootMs);
  json += ",\"frames\":" + String(frameCount);
  json += ",\"rssi_dbm\":" + String(WiFi.RSSI());
  json += ",\"ip\":\"" + WiFi.localIP().toString() + "\"";
  json += ",\"flash_on\":" + String(flashOn ? "true" : "false");
  json += "}";
  server.send(200, "application/json", json);
}

void handleCapture() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) { server.send(503, "text/plain", "capture gagal"); return; }
  server.sendHeader("Content-Disposition", "inline; filename=capture.jpg");
  WiFiClient client = server.client();
  server.setContentLength(fb->len);
  server.send_P(200, "image/jpeg", (const char*)fb->buf, fb->len);
  esp_camera_fb_return(fb);
  frameCount++;
}

void handleFlash() {
  if (server.hasArg("on")) {
    flashOn = server.arg("on") == "1";
    digitalWrite(FLASH_LED_PIN, flashOn ? HIGH : LOW);
  }
  server.send(200, "application/json", String("{\"flash\":") + (flashOn ? "true" : "false") + "}");
}

// ================== MJPEG STREAM (port 81) ==================
void mjpegStreamHandler() {
  WiFiClient client = streamServer.client();
  if (!client) return;

  client.print("HTTP/1.1 200 OK\r\n");
  client.print("Content-Type: ");
  client.print(STREAM_CONTENT_TYPE);
  client.print("\r\n");
  client.print("Access-Control-Allow-Origin: *\r\n");  // penting agar ffmpeg/browser lintas origin bisa ambil
  client.print("Connection: close\r\n\r\n");

  unsigned long lastFrame = 0;

  while (client.connected()) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) { delay(50); continue; }
    frameCount++;

    size_t blen = fb->len;
    uint8_t* buf = fb->buf;

    client.print(STREAM_BOUNDARY);
    char header[64];
    snprintf(header, sizeof(header), STREAM_PART, blen);
    client.print(header);

    // kirim buffer dalam potongan agar tidak membebani stack
    size_t sent = 0;
    while (sent < blen && client.connected()) {
      size_t chunk = min((size_t)2048, blen - sent);
      size_t w = client.write(buf + sent, chunk);
      if (w == 0) break;
      sent += w;
    }
    esp_camera_fb_return(fb);

    // target ~15 FPS max (66ms). Naikkan/turunkan sesuai kebutuhan.
    unsigned long now = millis();
    if (now - lastFrame < 66) delay(66 - (now - lastFrame));
    lastFrame = millis();
  }
}

void setupStreamServer() {
  streamServer.on("/", HTTP_GET, []() { streamServer.send(200, "text/plain", "MJPEG: /stream"); });
  streamServer.onNotFound([]() {
    if (streamServer.uri().startsWith("/stream")) mjpegStreamHandler();
    else streamServer.send(404, "text/plain", "not found");
  });
  streamServer.begin();
}

// ================== WIFI ==================
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);           // penting: sleep=true bikin stream patah-patah
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] menghubungkan");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(400);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.printf("[WiFi] OK IP=%s RSSI=%d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
    if (MDNS.begin("astraea-cam")) MDNS.addService("http", "tcp", 80);
    return;
  }

  // Fallback AP
  Serial.println("\n[WiFi] GAGAL 20s -> mode AP ASTRAEA-CAM / 12345678");
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("ASTRAEA-CAM", "12345678");
  Serial.printf("[AP] buka http://%s\n", WiFi.softAPIP().toString().c_str());
}

// ================== SETUP / LOOP ==================
void setup() {
  Serial.begin(115200);
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, HIGH); // matikan LED merah (aktif low)

  bootMs = millis();

  if (!initCamera()) {
    // pola kedip cepat = kamera error (cek ribbon kabel!)
    for (;;) { digitalWrite(STATUS_LED_PIN, LOW); delay(80); digitalWrite(STATUS_LED_PIN, HIGH); delay(180); }
  }
  Serial.println("[CAM] OV2640 siap");

  connectWiFi();

  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/capture.jpg", HTTP_GET, handleCapture);
  server.on("/flash", HTTP_GET, handleFlash);
  server.begin();

  setupStreamServer();
  Serial.printf("[HTTP] UI :80 | [STREAM] :81/stream\n");
}

void loop() {
  server.handleClient();
  streamServer.handleClient();
}
