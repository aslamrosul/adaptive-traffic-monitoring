# Flash 3x ESP32-CAM (1 firmware, 3 identitas)

Kode: `src/main.cpp` (kanonis; file lama di `iot/esp32cam/` hanya arsip).

## Wiring flash (tiap board, bergantian)

| FTDI / USB-TTL | ESP32-CAM |
|---|---|
| 5V | 5V |
| GND | GND (+ **GPIO0 ke GND saat flash**) |
| TX | U0R |
| RX | U0T |

Lepas jumper GPIO0–GND setelah upload, tekan RST.

## Langkah per kamera (ulangi 3x)

1. VSCode → Open Folder → `iot/astraea-cam` → Upload (env `astraea-cam`).
2. Cabut jumper GPIO0, RST. Buka Serial Monitor (115200).
3. Bila WiFi belum dikonfigurasi, kamera membuka SoftAP **`ASTRAEA-CAM-xxxx`**:
   hubungkan HP/laptop → buka `192.168.4.1` → isi:
   - SSID + password WiFi lokasi
   - Host `vision.astraea.my.id`, Port `443`, TLS `1` (sudah default)
   - Camera ID: `CAM_TALUN_NORTH_01` (atau SOUTH/EAST sesuai posisi)
   - Intersection `SIMPANG_TALUN_01`, Approach `north`/`south`/`east`
   - Token dari `/root/astraea-cameras.env` (server) sesuai ID-nya
   → Save → kamera reboot.
4. Cabut USB → colok adaptor 5V 2A. Cek `ONLINE` di halaman **Kamera** dashboard.

Token tampil sekali di dashboard saat provisioning (halaman Kamera, admin).
Jangan pernah tulis password/token ke file kode — semua via NVS/portal.
