# FINAL_INTEGRATION_REPORT_V3.md (PROMPT_FINISHING Y)

Nilai secret tidak ada di laporan ini (hanya nama variable).

## 1. Current HEAD sebelum pekerjaan

- web `c318a78`, sub `b62aed8`, yolo `f6ac09d` (sesuai ekspektasi prompt; semua clean, tanpa uncommitted work).
- Catatan jujur: sebagian item F1/F2 (README mqtt 4-arg, arsip root pio, perintah `reboot`)
  ternyata sudah masuk di commit saya sebelumnya `ddca154` — diverifikasi ulang round ini,
  bukan dikerjakan dua kali. Sesi paralel lain juga aktif (commit cam README, dsb);
  koordinasi via pull/merge tanpa force.

## 2. Residual bugs yang ditemukan

| # | Status | Bukti |
|---|---|---|
| E legacy MQTT nested-vs-flat | BUG BENAR, FIX | `mqtt.py` baca `camera{}/sensor{}` padahal main kirim flat → legacy selalu 0 |
| touch_seen float DynamoDB | BUG BENAR, FIX | log `Float types are not supported` |
| fps absurd (200-300) | BUG BENAR, FIX | monotonic vs init 0 + baris ganda; kini 2.7 |
| cam `&quot;` syntax | BUG BENAR, FIX | pio FAILED → SUCCESS |
| unit S2 vs repo | MISMATCH, FIX | inline MQTT_PASS vs EnvironmentFile; redeploy |
| F1 README, F2 arsip | SUDAH BENAR (ddca154) | verifikasi + compile ulang |
| F9/F10/F11/F13 | SUDAH BENAR | verifikasi kode + uji live |

## 3. Bug F5 legacy MQTT apakah benar ada

YA. `publish_legacy_compat` membaca nested yang tidak pernah dikirim.
Fix: baca flat (`active_vehicle_count`, `sensor_level`, `queue_vehicles` baru,
`queue_estimate_cm=0`, `vision_online`). Teruji live: field benar muncul di broker.

## 4. Exact fix

`astraea-vision/app/mqtt.py` (rewrite fungsi), `+tests/test_mqtt.py` (3 tests),
`camera_registry.py` (Decimal), `camera_ingest.py` (fps), cam 1 karakter,
`systemd unit` (env file), `main.py` (online flag round lalu + waiting murni round ini),
`subscriber_aws.py` (top-level source + mapping), web (badge + example).

## 5. Waiting time before/after

Before: `queue_n * 3.0` bila tracker 0 (palsu: 6 antrean = 18 dtk).
After: murni `max_waiting_s` tracker (0 bila belum ada stopped). Fuzzy tak berubah
(terima waiting_s + clamp). Test monotonik diperbaiki (100/101/104/105/106).

## 6. Subscriber top-level source before/after

Before: hardcode `"camera"`. After: 3 fresh=`camera`, sebagian=`mixed`, 0=`vision_stale`
(+3 regression tests). Per-lane tidak disentuh.

## 7. YOLOv8s benchmark 960 vs 640 (Server 2, CPU, model produksi, 3 frame sintetis x10)

| imgsz | avg | p50 | p95 |
|---|---|---|---|
| 960 predict | 0.69-0.70s | 0.69-0.70s | 0.72-0.74s |
| 640 predict | 0.28-0.29s | 0.30-0.31s | 0.31-0.32s |
| 960 track | 1.05s | 0.73s | — |
| 640 track | 0.29s | 0.31s | — |

## 8. 1-camera benchmark

Lihat tabel §7 (sama; 1 engine per kamera, sequential).

## 9. 3-camera benchmark

Sim 3 kamera: auth OK semua, 10 frame/kamera. Siklus 3x track: ~2.3 dtk @960,
~0.9 dtk @640. Rekomendasi/fuzzy tetap 1 Hz (data diulang antar inference;
deadband cegah flicker). Frame latest-only, tanpa backlog tumbuh.
CPU saat sim: ~28% (1 proses vision), RAM sistem 1.6/7.6 GB.
Model load: 576 MB (1 instance) → 897 MB (3 instance). Arsitektur per-camera
engine DIPERTAHANKAN (isolasi terbukti, RAM cukup).

## 10. CPU/RAM

Di atas. Model train-imgsz dari metadata = **640** → default inferensi diubah
960→640 (berbukti: tanpa upscale VGA, 2.4x lebih cepat, sesuai distribusi latih).
Unit + config ter-deploy; health `imgsz:640`; snapshot/stream OK.

## 11. Recommendation interval aktual

Fuzzy loop 1 Hz; pesan rekomendasi+metrik ~1/detik/pendekatan di broker (terukur 22/22/22
per ~22 dtk). Legacy compat tiap 5 dtk.

## 12. Tests

Vision 14/14 (fuzzy 7, tracking 4, mqtt 3), subscriber 10/10, py_compile OK,
PIO controller SUCCESS (RAM 14.3%/Flash 62.1%), PIO cam SUCCESS (15.8%/34.1%),
tsc + Next build OK. Toolchain: espressif32 7.1.1, arduino 3.20017.

## 13. Deployed services

astraea-vision (restart, active, model loaded, MQTT ok), traffic-aws-subscriber
(restart, active), web (restart, active, 200; insiden .env terhapus rsync → restore,
prosedur aman di AGENTS.md). Mosquitto/nginx tidak direstart (tak berubah).

## 14. Commit SHA

Branch `opencode/final-astraea-integration-v3` → merge --no-ff → main, push OK:
web / yolo / sub (SHA di pesan commit; tanpa force-push).

## 15. Hardware tests tetap PENDING

R checklist fase 1-6 + R10 S1 di `docs/prd-implementation/HARDWARE_TEST_CHECKLIST.md`.
Server simulation sukses; ESP32/ESP32-CAM fisik belum tersentuh.
