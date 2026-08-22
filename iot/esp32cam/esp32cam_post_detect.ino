/*
 * ASTRAEA ESP32-CAM Headless Detector  (JALUR B - tanpa browser)
 * Board  : AI Thinker ESP32-CAM (OV2640)
 * Partisi: Huge APP (3MB No OTA)
 *
 * Alur:
 *   Tiap POST_INTERVAL_MS detik:
 *     1. Ambil frame JPEG dari OV2640
 *     2. HTTP POST multipart ke server YOLOv8 (endpoint /detect)
 *     3. Terima JSON hasil deteksi -> print ke Serial
 *        (bisa diteruskan ke MQTT/Telegram sesuai kebutuhan)
 *
 * Cocok untuk penghitungan kendaraan otomatis 24 jam tanpa membuka Vision Lab.
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// ================== KONFIGURASI ==================
const char* WIFI_SSID     = "NAMA_WIFI_KAMU";
const char* WIFI_PASSWORD = "PASSWORD_WIFI";

// Server YOLOv8 di EC2 terpisah (lihat docs/YOLOV8_SETUP.md §7-varian FastAPI)
const char* DETECT_URL    = "http://<EC2-IP>:8081/detect";

unsigned long POST_INTERVAL_MS = 5000;   // kirim tiap 5 detik
framesize_t   FRAME_SIZE       = FRAMESIZE_VGA;  // 640x480 cukup utk deteksi
uint8_t       JPEG_QUALITY     = 12;

#define FLASH_LED_PIN 4
#define STATUS_LED_PIN 33

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

volatile uint32_t frameCount = 0;
unsigned long lastPostMs = 0;

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
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAME_SIZE;
  config.jpeg_quality = JPEG_QUALITY;
  config.fb_count = 1;
  config.grab_mode = CAMERA_GRAB_LATEST;
  config.fb_location = CAMERA_FB_IN_PSRAM;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[CAM] init GAGAL: 0x%x\n", err);
    return false;
  }
  return true;
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] menghubungkan");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
    if (millis() > 30000) { Serial.println("\n[WiFi] gagal, restart..."); ESP.restart(); }
  }
  Serial.printf("\n[WiFi] OK IP=%s\n", WiFi.localIP().toString().c_str());
}

/*
 * Kirim JPEG via multipart/form-data.
 * Server menerima field "frame" lalu balas JSON hasil deteksi.
 */
bool postDetect(camera_fb_t* fb, String& response) {
  HTTPClient http;
  http.begin(DETECT_URL);
  http.setTimeout(8000);

  String boundary = "----astraea" + String(millis());
  String head = "--" + boundary + "\r\n"
                "Content-Disposition: form-data; name=\"frame\"; filename=\"frame.jpg\"\r\n"
                "Content-Type: image/jpeg\r\n\r\n";
  String tail = "\r\n--" + boundary + "--\r\n";

  size_t total = head.length() + fb->len + tail.length();
  uint8_t* body = (uint8_t*)malloc(total);
  if (!body) { Serial.println("[POST] malloc gagal"); return false; }
  memcpy(body, head.c_str(), head.length());
  memcpy(body + head.length(), fb->buf, fb->len);
  memcpy(body + head.length() + fb->len, tail.c_str(), tail.length());

  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
  int code = http.POST(body, total);
  free(body);

  if (code == 200) { response = http.getString(); return true; }
  Serial.printf("[POST] HTTP %d\n", code);
  return false;
}

void setup() {
  Serial.begin(115200);
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);
  pinMode(STATUS_LED_PIN, OUTPUT);

  if (!initCamera()) {
    for (;;) { digitalWrite(STATUS_LED_PIN, LOW); delay(80); digitalWrite(STATUS_LED_PIN, HIGH); delay(180); }
  }
  connectWiFi();
  lastPostMs = millis() - POST_INTERVAL_MS; // langsung kirim frame pertama
}

void loop() {
  if (millis() - lastPostMs < POST_INTERVAL_MS) { delay(50); return; }
  lastPostMs = millis();

  digitalWrite(STATUS_LED_PIN, LOW); // LED merah nyala saat proses

  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) { Serial.println("[CAM] fb null"); digitalWrite(STATUS_LED_PIN, HIGH); return; }
  frameCount++;

  String resp;
  if (postDetect(fb, resp)) {
    // Contoh respons server:
    // {"detections":[{"label":"car","confidence":0.87,"x":12.4,...}],"stats":{"totalVehicles":3}}
    Serial.println("[DETECT] " + resp);
    // TODO: parsing ArduinoJson jika ingin aksi lanjutan (MQTT publish dsb.)
  }

  esp_camera_fb_return(fb);
  digitalWrite(STATUS_LED_PIN, HIGH);
}
