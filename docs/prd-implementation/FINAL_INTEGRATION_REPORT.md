# FINAL INTEGRATION REPORT (PROMPT T)

## 1. Audit Summary

Sebelum perubahan: broker+web+subscriber jalan, vision terfragmentasi
(3 service), firmware v1 hardcode WiFi/MQTT, secret produksi ikut ter-commit ke repo,
token kamera lama sudah muncul di chat. Sesi lain paralel memperbaiki Vision Lab
(:8080), panduan, dan firmware v2.1/v2 cam (sustained level, anti-downgrade, CA, AP_STA).
Audit lengkap: `docs/prd-implementation/INTEGRATION_AUDIT.md`.

## 2. Architecture Changes

Tidak ada perubahan topologi. Perubahan perilaku: (a) subscriber paham topik kanonis
`astraea/v1/...` + dedup anti double-store + vision sampled; (b) vision publish flag
`online` per pendekatan; (c) legacy vision 5 dtk; (d) secret keluar dari git;
(e) token kamera dirotasi; (f) MQTT_PASS systemd via EnvironmentFile 600.

## 3. Files Changed

- Firmware controller: `iot/astraea-controller/src/main.cpp` (milik sesi lain; saya hanya verifikasi + tidak merusak).
- Firmware camera: `iot/astraea-cam/src/main.cpp` (fix 1 karakter `&quot;` + milik sesi lain).
- Server 1: `~/workspace/astraea-subscriber-mqtt/subscriber_aws.py` (dedup E3).
- Server 2: `~/workspace/yolov8-server/astraea-vision/app/main.py` (flag online),
  `scripts/rotate_camera_token.py` (baru).
- Web: `.env.local.example` (daftar variabel), `docs/prd-implementation/` (3 file baru).
- Config/service: `/etc/astraea-vision.env` (baru, 600, Server 2); unit astraea-vision
  tanpa password.

## 4. Legacy Files

Tetap arsip: `iot/esp32/*`, `iot/esp32cam/*`. Tetap hidup: `yolov8-ws` :8080 + `server.py`
(Vision Lab), topik `traffic/*`. DISABLED: `yolov8-http`, `yolov8-bridge`.
Belum dipakai: `vision_fuzzy_server.py`, `adaptive_traffic_engine.py`.

## 5. MQTT Contracts (terimplementasi & teruji)

- `astraea/v1/intersections/{iid}/controllers/{cid}/telemetry` (§27 + `camera_valid`,
  `vehicle_count_valid`, `vehicle_count_source`, null saat basi).
- `.../command` (`set_phase|set_auto|set_adaptive|set_config` + anti-downgrade), `.../ack`.
- `.../vision/metrics` (per-approach `online`, 1 Hz, persist sampled), `.../control/recommendation`
  (valid 10 dtk, clamp min/max).
- Legacy `traffic/{device}/data|config/set|light/{lane}/set` dua arah; dedup 6 dtk di subscriber.

## 6. Camera Contracts

WSS `wss://vision.astraea.my.id:443/v1/camera/ingest`, hello JSON
(camera_id/intersection_id/approach_id/token/firmware[/fps/jpeg_quality]),
balas `{"ok":true}`; tolak 4400/4401/4403/4404. Binary sesudah auth = JPEG.
Viewer: `/v1/cameras/{id}/status|snapshot.jpg|stream.mjpeg` (teruji 200).

## 7. Services

S1: mosquitto, traffic-aws-subscriber, adaptive-traffic, nginx — active+enabled.
S2: astraea-vision, yolov8-ws, nginx — active+enabled; yolov8-http/bridge disabled.
Tidak ada foreground-SSH process. PM2 tidak dipakai (sesuai N).

## 8. Tests (PASS/FAIL + bukti)

- R1 PIO controller: PASS (SUCCESS, RAM 14.3%, Flash 62.1%).
- R1 PIO cam: PASS setelah fix 1 karakter (SUCCESS, RAM 15.8%, Flash 34.1%).
- Fuzzy unit 7/7: PASS (S1 + S2). py_compile subscriber: PASS.
- rotation: PASS (token lama -> 4401 invalid-token; token baru auth ok + snapshot 200).
- online flag: PASS (`false`->`true` di pesan vision).
- dedup: PASS (canonical ditulis, legacy 6 dtk dibuang — 1 record).
- R9 isolasi: PASS (TEST_INTERSECTION_02 = 0 telemetri; fuzzy/registry per-iid).
- R10 reboot S2: PASS (online ~95 dtk, service aktif, health 200).
- R2-R6 fisik, R10 S1: BELUM (hardware di user) -> HARDWARE_TEST_CHECKLIST.md.
- H model: BUKAN nano — 11.14M param = YOLOv8s, 6 kelas IndoTraffic (jujur, tanpa retrain).

## 9. Security

Dikeraskan: token kamera dirotasi (hash saja di DB), secret keluar dari index git
(web/sub/backup-all), NEXTAUTH_SECRET dirotasi, MQTT_PASS unit via file 600,
SG2:22 hanya dari S1, SG2:1883 publik ditutup, CA-verify cam aktif, SoftAP tanpa secret di log.
Belum (risiko diterima, butuh fisik): password MQTT/SMTP lama (di firmware v1 lapangan +
history backup awal); history backup awal tidak di-rewrite.

## 10. Remaining Risks

Firmware v2.1/v2-cam belum pernah boot di hardware nyata (sesi lain menulis, saya compile).
Model s-scale dipertahankan (keputusan sadar). Vision Lab masih di :8080 legacy.
Reboot S1 belum diuji. Kuota gratis Gemini dipantau di AI Studio.

## 11. Rollback

Tiap branch terpisah; rollback = checkout main lama + restart service terkait
(detail: `docs/prd-implementation/ROLLBACK_PLAN.md`). Token lama SUDAH MATI
(rollback tidak menghidupkannya lagi — provision ulang bila perlu).
Backup config: `/opt/astraea-ops/backups/20260906-224906/` (root 600).

## 12. Git

Branch `opencode/integrasi-prd` di web/yolo/sub/backup-all; merge ke main + push
(lihat log di bawah). Tidak ada force-push; tidak ada secret baru di commit.
