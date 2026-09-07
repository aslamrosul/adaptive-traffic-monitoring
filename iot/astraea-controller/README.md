# Flash Controller (1x ESP32 DevKit)

Kode: `src/main.cpp` (kanonis; file lama di `iot/esp32/` hanya arsip).

1. VSCode → Open Folder → `iot/astraea-controller`.
2. Colok ESP32 via USB → di status bar PlatformIO pilih env `astraea-controller`.
3. Upload: ikon panah kanan (→) atau `pio run -t upload`.
4. Buka Serial Monitor (115200). Bila WiFi belum ada, kirim perintah
   (format HARUS sama persis dengan parser firmware):
   ```
   set wifi <SSID> <PASSWORD_WIFI>
   set mqtt astraea.my.id 1883 jti <PASSWORD_MQTT>
   set id SIMPANG_TALUN_01 ESP32_TRAFFIC_01
   show
   ```
   Keterangan: `set mqtt` butuh 4 argumen `<host> <port> <user> <pass>`.
   (`<PASSWORD_*>`: jangan tulis nilai asli di repo/chat.)
   Lalu tekan RST (atau kirim `reboot`) agar config tersimpan diterapkan.
5. Verifikasi: log menampilkan `Controller v2 ready`, dashboard device ONLINE.

Wiring LED/IR/HC-SR04: sama seperti v1 (lihat tabel di `app/panduan` → ESP32).
