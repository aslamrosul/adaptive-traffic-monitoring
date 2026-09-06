# HARDWARE_TEST_CHECKLIST.md — wajib oleh user (perangkat fisik di tangan user)

Prinsip: server sudah teruji; yang di bawah ini HANYA bisa diverifikasi dengan hardware.
Jangan klaim lolos sebelum log/hardware terlihat. (PROMPT U.1158)

## R2. Controller v2 (1x ESP32)

Flash `iot/astraea-controller`, monitor 115200, WiFi via `set wifi`, MQTT default benar.

- [ ] Boot: semua merah (STARTUP_ALL_RED), jeda clearance, lalu North Green.
- [ ] Urutan: N hijau -> N kuning -> ALL RED -> S hijau -> S kuning -> ALL RED -> E -> kembali.
- [ ] Manual->Auto: dari MANUAL (semua merah) kirim `set_auto:true` -> clearance -> hijau (TANPA lompat).
- [ ] MQTT mati 60 dtk (matikan broker/`mosquitto` stop): fase lokal TETAP jalan, tidak macet hijau.
- [ ] WiFi mati (matikan AP): fase lokal TETAP jalan; log `reconnect` non-blocking tiap ~5 dtk.
- [ ] Reboot: kembali ALL RED dulu.

## R3. Sensor

- [ ] IR disentuh sekilas (<1 dtk): level TETAP 0 (cek telemetri `sensor_level`).
- [ ] IR ditutup terus >3 dtk: Level 1.
- [ ] IR + tangan <5 cm di HC-SR04 >3 dtk: Level 2.
- [ ] Hanya HC-SR04: level TETAP (cek `ultrasonic_only_diagnostic=true`).
- [ ] Lepas semua >2 dtk: kembali 0 (clear debounce).

## R4. Satu kamera dulu (NORTH)

1. [ ] Flash `iot/astraea-cam` (GPIO0-GND saat upload, lepas sesudahnya).
2. [ ] SoftAP `ASTRAEA-CAM-xxxx` muncul -> isi form (ID NORTH + TOKEN BARU dari owner, host default benar).
3. [ ] Colok adaptor 5V 2A (cabut USB).
4. [ ] Dashboard Kamera: ONLINE + FPS 2-5 + `last_seen` update.
5. [ ] `https://vision.astraea.my.id/v1/cameras/CAM_TALUN_NORTH_01/snapshot.jpg` terlihat (login web dulu bila viewer token diset).
6. [ ] Telemetri `vision_fresh:true`, count berubah saat ada kendaraan.

## R5. WiFi outage (>60 dtk, WAJIB)

1. [ ] Kamera ONLINE -> matikan router >60 dtk (boleh muncul SoftAP, JANGAN sentuh kamera).
2. [ ] Nyalakan router -> kamera reconnect WiFi SENDIRI (cek log serial: tanpa RST).
3. [ ] SoftAP tertutup, WSS reconnect, frame lanjut, dashboard ONLINE lagi.

## R6. Tiga kamera

- [ ] Ulangi R4 untuk SOUTH + EAST (token masing-masing, JANGAN tukar).
- [ ] Ketiganya ONLINE bersamaan, stream tidak tertukar pendekatan.
- [ ] Restart 1 kamera: 2 lainnya tidak terganggu (cek `last_seen` ketiganya).
- [ ] Fuzzy: bedakan jumlah kendaraan per pendekatan -> `recommended_green_s` berbeda
      (cek topik `.../control/recommendation` via dashboard/MQTT).

## R10. Reboot Server 1 (oleh owner; sesi AI tidak bisa verifikasi sendiri)

1. [ ] `sudo systemctl reboot` (pastikan punya akses AWS console cadangan).
2. [ ] Tunggu 3 menit -> `https://astraea.my.id/login` 200.
3. [ ] `systemctl is-active mosquitto traffic-aws-subscriber adaptive-traffic nginx` semua active.
4. [ ] Kamera + controller reconnect sendiri (cek dashboard 5 menit kemudian).

## Tanda uji selesai

Catat tanggal + hasil tiap kotak + simpan log serial penting. Laporkan yang GAGAL apa adanya.
