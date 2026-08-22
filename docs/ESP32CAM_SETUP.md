# ESP32-CAM — Setup Lengkap untuk ASTRAEA Vision Lab

Panduan lengkap: hardware, wiring, flashing firmware, streaming ke YOLOv8 server, dan integrasi dengan halaman `/vision-lab-7x9k-alpha`.

**Modul: AI-Thinker ESP32-CAM** (OV2640 2MP + PSRAM 4MB + flash LED + slot microSD) — model paling umum di pasaran.

**Firmware di repo ini:**

| File | Jalur | Fungsi |
|------|-------|--------|
| `iot/esp32cam/esp32cam_stream.ino` | A (live view) | MJPEG stream server `:81/stream` |
| `iot/esp32cam/esp32cam_post_detect.ino` | B (headless) | POST JPEG berkala ke server deteksi |
| `iot/esp32cam/server_detect_http.py` | B (server) | FastAPI `/detect` untuk firmware JALUR B |

---

## 1. Arsitektur Alur Data

```
                        PILIH SALAH SATU ATAU GABUNGKAN KEDUANYA

JALUR A — LIVE VIEW + DETEKSI REAL-TIME DI BROWSER (recommended)
────────────────────────────────────────────────────────────────────
[ESP32-CAM] --MJPEG HTTP--> [ffmpeg @ EC2 YOLOv8] --RTSP--> [MediaMTX]
  :81/stream                 re-encode H.264            :8554
                                                             |
                                   HLS http://<ec2>:8888/camera1/index.m3u8
                                                             |
                                    [Browser Vision Lab] <---+
                                      |            ^
                          frame JPEG  |            | bounding box JSON
                                      v            |
                              [YOLOv8 server.py  ws://<ec2>:8080]

JALUR B — HEADLESS / TANPA BROWSER (untuk hitung kendaraan 24 jam)
────────────────────────────────────────────────────────────────────
[ESP32-CAM] --POST multipart tiap 5 dtk--> [FastAPI /detect :8081]
                                                |
                                        JSON deteksi -> MQTT/DynamoDB/dst.
```

> Kenapa tidak langsung RTSP dari ESP32-CAM? Modul ini terlalu lemah untuk encode H.264; MJPEG HTTP adalah metode native yang paling stabil. Transcoding dilakukan ffmpeg di EC2.

---

## 2. Pinout AI-Thinker ESP32-CAM

### 2.1 Pin Kamera OV2640 (internal)

| Sinyal | GPIO | Sinyal | GPIO |
|--------|------|--------|------|
| PWDN   | 32   | Y8     | 34   |
| RESET  | -1 (nc) | Y7  | 39   |
| XCLK   | 0    | Y6     | 36   |
| SIOD/SDA | 26 | Y5     | 21   |
| SIOC/SCL | 27 | Y4     | 19   |
| Y9     | 35   | Y3     | 18   |
| VSYNC  | 25   | Y2     | 5    |
| HREF   | 23   | PCLK   | 22   |

### 2.2 Pin yang Bisa Dipakai (jika tanpa microSD)

| GPIO | Fungsi bawaan | Catatan |
|------|---------------|---------|
| **GPIO 4** | Flash LED putih | Aktif HIGH; output bebas selama LED dimatikan |
| **GPIO 33** | LED merah status | Aktif LOW (LOW = nyala) |
| GPIO 2, 13, 14, 15 | SD card | Bebas jika microSD tidak dipakai |
| GPIO 12 | SD card CLK | ⚠️ Wajib HIGH saat boot — jangan beri pull-down eksternal |

**❌ Jangan dipakai:** GPIO 16/17 (PSRAM), GPIO 0 (XCLK + boot strap), GPIO 1/3 (UART flashing/debug).

### 2.3 Power — Penyebab Masalah #1

- Suplai **5V** minimal **2A** ke pin `5V`. Adapter HP 1A → brownout, cam restart terus.
- Kabel USB panjang/tipis = drop tegangan. Gunakan kabel pendek dan tebal.
- Saat WiFi transmit, lonjakan arus bisa >300mA sesaat.

---

## 3. Wiring Flashing dengan FTDI/USB-TTL

```
 FTDI                  ESP32-CAM
 ────                  ─────────
 5V   ──────────────►  5V
 GND  ──────────────►  GND
 TX   ──────────────►  U0R   (GPIO 3)
 RX   ◄──────────────  U0T   (GPIO 1)
 GND  ───┬──────────►  IO0 / GPIO 0    ← HANYA SAAT UPLOAD!
         │
      jumper female-female
```

Prosedur upload:

1. Pasang jumper `GPIO 0 → GND`
2. Tekan tombol **RST** (atau cabut-pasang kabel 5V)
3. Klik Upload di Arduino IDE
4. Setelah progress 100% → **lepas jumper GPIO 0** → tekan RST → firmware jalan

> FTDI 3.3V logic aman untuk TX/RX; tetap suplai daya via pin 5V agar WiFi stabil.

### Setting Arduino IDE

1. Boards Manager URL (`File > Preferences > Additional Board URLs`):
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
2. Install board **esp32 by Espressif Systems**
3. Pilih board: **AI Thinker ESP32-CAM**
4. Partition Scheme: **Huge APP (3MB No OTA/1MB SPIFFS)** ← WAJIB
5. Upload Speed: 115200; Serial Monitor: 115200

Library tambahan: **tidak perlu** — semua pakai library bawaan (`esp_camera`, `WiFi`, `WebServer`, `HTTPClient`).

---

## 4. Firmware JALUR A — Live Stream (`esp32cam_stream.ino`)

Edit dua baris konfigurasi di atas file:

```cpp
const char* WIFI_SSID     = "NAMA_WIFI_KAMU";
const char* WIFI_PASSWORD = "PASSWORD_WIFI";
```

Upload → buka Serial Monitor 115200 → catat IP yang muncul, misal `192.168.1.50`.

Endpoint yang tersedia:

| URL | Fungsi |
|-----|--------|
| `http://192.168.1.50/` | Halaman info + snapshot preview |
| `http://192.168.1.50/status` | JSON uptime, jumlah frame, RSSI |
| `http://192.168.1.50/capture.jpg` | Snapshot satu frame |
| `http://192.168.1.50:81/stream` | **MJPEG stream utama** (untuk ffmpeg/VLC) |
| `http://192.168.1.50/flash?on=1` | Flash LED ON/OFF |

Tuning resolusi di sketch:

```cpp
framesize_t FRAME_SIZE = FRAMESIZE_SVGA;  // 800x600 — seimbang utk YOLOv8
// FRAMESIZE_VGA  = 640x480  (paling ringan, jarak dekat)
// FRAMESIZE_HD   = 1280x720 (detail tinggi, FPS turun ~8-10)
uint8_t JPEG_QUALITY = 12; // makin kecil = makin tajam = bandwidth besar
```

Cek cepat stream di laptop (pastikan satu WiFi):

```bash
ffplay http://192.168.1.50:81/stream
# atau simpan 10 detik video:
ffmpeg -f mjpeg -i http://192.168.1.50:81/stream -t 10 test.mp4
```

---

## 5. Integrasi ke EC2 YOLOv8 (JALUR A lengkap)

Di EC2 YOLOv8 (docs/YOLOV8_SETUP.md), jalankan MediaMTX lalu ffmpeg pull dari kamera:

```bash
# 1. MediaMTX (sekali saja, biarkan berjalan sebagai service)
./mediamtx &

# 2. Pull MJPEG dari ESP32-CAM -> publish RTSP (ganti <IP-CAM>)
ffmpeg -f mjpeg -i "http://<IP-CAM>:81/stream" \
  -c:v libx264 -preset veryfast -tune zerolatency -pix_fmt yuv420p \
  -an -f rtsp rtsp://localhost:8554/camera1
```

Lalu di halaman **Vision Lab**:

1. Sumber video: pilih **RTSP/HLS**
2. Masukkan: `http://<EC2-PUBLIC-IP>:8888/camera1/index.m3u8`
3. Panel YOLOv8: masukkan `ws://<EC2-PUBLIC-IP>:8080` → **Connect WS**
4. Bounding box muncul real-time di atas video ✅

Buka Security Group EC2: port `8080` (WS), `8888` (HLS), opsional `8889` (WebRTC).

> Tips: jalankan ffmpeg via `screen`/`tmux` atau buat systemd unit agar tetap hidup setelah SSH logout. Contoh unit ada di §7.

---

## 6. Firmware JALUR B — Headless (`esp32cam_post_detect.ino`)

Untuk penghitungan otomatis tanpa browser. Edit konfigurasi:

```cpp
const char* DETECT_URL = "http://<EC2-IP>:8081/detect";
unsigned long POST_INTERVAL_MS = 5000;
```

Di EC2, jalankan endpoint pendampingnya:

```bash
source venv/bin/activate
pip install fastapi uvicorn python-multipart
uvicorn server_detect_http:app --host 0.0.0.0 --port 8081

# tes manual:
curl -F "frame=@test.jpg" http://localhost:8081/detect
```

Respons JSON siap dikonsumsi pipeline ASTRAEA (MQTT publish / tulis DynamoDB / Telegram alert).

---

## 7. Menjalankan Semua sebagai Service systemd

```bash
# /etc/systemd/system/astraea-cam-pipeline.service
[Unit]
Description=ASTRAEA camera pipeline (MediaMTX + ffmpeg + detect API)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStartPre=/home/ubuntu/mediamtx
ExecStart=/bin/bash -c '\
  uvicorn server_detect_http:app --host 0.0.0.0 --port 8081 & \
  ffmpeg -f mjpeg -i "http://<IP-CAM>:81/stream" \
    -c:v libx264 -preset veryfast -tune zerolatency -pix_fmt yuv420p \
    -an -f rtsp rtsp://localhost:8554/camera1'
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now astraea-cam-pipeline
sudo systemctl status astraea-cam-pipeline
```

---

## 8. Troubleshooting

| Gejala | Penyebab & Solusi |
|--------|-------------------|
| Restart sendiri terus (`Brownout detector triggered`) | Power kurang — pakai adapter ≥2A, kabel pendek |
| Frame abu-abu/GREY semua | Turunkan `XCLK_MHZ` ke 10, atau resolusi ke VGA; cek ribbon kamera terpasang lurus |
| `Camera init failed 0x105 / 0x20004` | Ribbon OV2640 longgar/ketukar; pasang ulang tegak lurus |
| Stream patah-patah/lambat | Pastikan `WiFi.setSleep(false)` aktif; turunkan resolusi; dekatkan router |
| Upload gagal (`Failed to connect to ESP32`) | GPIO 0 belum ke GND saat reset; cek silang TX/RX FTDI |
| HLS tidak tampil di Vision Lab | ffmpeg belum re-encode H.264 (jangan `-c copy`); cek port 8888 terbuka |
| WS connect tapi tidak ada box | Cek console browser — frame harus terkirim (~10 FPS); lihat log server.py |
| Sketch terlalu besar (`Sketch too big`) | Partition Scheme belum Huge APP |
| IP berubah-ubah | Set static DHCP di router, atau gunakan mDNS `http://astraea-cam.local` |

---

## 9. Checklist Produksi

- [ ] Power supply 5V ≥ 2A terpasang permanen
- [ ] IP kamera statik (DHCP reservation di router)
- [ ] ffmpeg + MediaMTX + detect API sebagai systemd service (`systemctl enable`)
- [ ] Security Group EC2 hanya membuka port yang perlu; pertimbangkan batasi source IP
- [ ] Uji ketahanan: cabut WiFi kamera 30 detik → pastikan auto-reconnect (reboot watchdog)
- [ ] Kalibrasi posisi kamera menghadap arah antrean kendaraan; uji akurasi YOLOv8 dengan berbagai kondisi cahaya
