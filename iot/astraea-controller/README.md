# Flash Controller (1x ESP32 DevKit)

Kode: `src/main.cpp` (kanonis; file lama di `iot/esp32/` hanya arsip).

1. VSCode → Open Folder → `iot/astraea-controller`.
2. Colok ESP32 via USB → di status bar PlatformIO pilih env `astraea-controller`.
3. Upload: ikon panah kanan (→) atau `pio run -t upload`.
4. Buka Serial Monitor (115200). Bila WiFi belum ada, kirim perintah:
   ```
   set wifi <SSID> <PASSWORD>
   set mqtt astraea.my.id jti Azure-password123
   set id SIMPANG_TALUN_01 ESP32_TRAFFIC_01
   show
   ```
   Lalu tekan RST. Ganti `Azure-password123` dengan password MQTT produksi.
5. Verifikasi: log menampilkan `Controller v2 ready`, dashboarddevice ONLINE.

Wiring LED/IR/HC-SR04: sama seperti v1 (lihat tabel di `app/panduan` → ESP32).
