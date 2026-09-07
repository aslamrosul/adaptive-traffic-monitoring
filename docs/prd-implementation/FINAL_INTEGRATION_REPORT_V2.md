# FINAL REPORT — FULL TECHNICAL AUDIT + INTEGRASI (PROMPT_OPENCODE_INTEGRASI.md)

Tanggal: 2026-09-07. Pelaksana: OpenCode di Server 1. Branch: `opencode/fix-astraea-integration-v2`
(di web/yolo/sub), merge --no-ff ke main, tanpa force-push. Nilai secret TIDAK ada di laporan ini.

## 1. EXECUTIVE SUMMARY

Audit + implementasi penuh selesai di sisi server. 9 bug/mismatch nyata ditemukan:
7 sudah FIX + teruji (F1, F2, F3, F4-dalam arti diperkuat, F5-sebagian, F9,
touch_seen float, fps absurd, cam quot-syntax), 2 dikonfirmasi milik sesi lain dan
diverifikasi (firmware v2.1 D2/D3, cam CA/AP_STA). F6 (isolasi tracker) diperbaiki
struktural (satu engine per kamera, terbukti di level predictor) + 4 regression tests.
F7/F8 diimplementasikan (hysteresis + waiting aktual) + tests. Model YOLOv8s
dipertahankan (11.14M param, 6 kelas IndoTraffic). Semua service active, health 7/7.

## 2. CURRENT ARCHITECTURE

ESP32-CAM x3 --WSS 443--> nginx S2 --> astraea-vision (ingest 8082 + API 8081):
YOLOv8s per-camera-engine + ByteTrack terisolasi -> metrik/approach -> fuzzy 1 Hz
-> MQTT `astraea/v1/...` (+ legacy 5 dtk) -> Mosquitto S1 -> subscriber
(kanonis+dedup+sampled) -> DynamoDB/S3/notif -> Next.js.
Controller v2.1 <-> command/recommendation/ACK. Vision Lab tetap via `yolov8-ws` :8080.

## 3. REPOSITORY STATUS

| Repo | Branch | Before | After (main) | Deployed |
|---|---|---|---|---|
| adaptive-traffic-monitoring | fix-...-v2 -> main | 8043871* | dc28196 | /var/www == main (kecuali .git basi + docs merge terakhir non-runtime) |
| yolov8-server | fix-...-v2 -> main | 4a65460 | f6ac09d | S2 ~/astraea-vision == main (13/13 file) |
| astraea-subscriber-mqtt | fix-...-v2 -> main | 1c986cf | b62aed8 | /home/.../subscriber_aws.py == main |
| backup-all | main (read-only, tak disentuh) | 2bb626c0 | 2bb626c0 | arsip |

\* termasuk commit sesi lain yang masuk via pull (74cb02b cam README, 8043871/bee7883).

## 4. SERVICES STATUS

S1 active+enabled: mosquitto, traffic-aws-subscriber, adaptive-traffic, nginx.
S2 active+enabled: astraea-vision, yolov8-ws, nginx. Disabled+inactive: yolov8-http,
yolov8-bridge. PM2 tidak dipakai (systemd kanonis).

## 5. BUGS FOUND

| # | File | Root cause | Impact | Sev | Fix |
|---|---|---|---|---|---|
| F1 | iot/astraea-controller/README.md | contoh `set mqtt` 3 arg, parser butuh 4 (host port user pass) | provisioning gagal | Sedang | README + perintah `reboot` ditambah ke firmware |
| F2 | platformio.ini root + src_sensor/src_camera | `pio run` di root flash firmware legacy | salah flash | Tinggi | pindah ke `iot/archive/` |
| F3 | subscriber normalize | baca `vision[fresh]` (tak ada), queue->cm, rec/eff campur | data salah | Tinggi | mapping v2.1 penuh + tests |
| F4 | subscriber dedup | sudah ada, diperkuat + testable | duplikat (minor) | Rendah | fungsi murni + test |
| F5 | vision legacy compat | dicek: sudah baca schema aktual (flat) | — | — | OK, tambah test |
| Float | camera_registry.py | float ke DynamoDB | registry tak update | Tinggi | Decimal |
| Fps | camera_ingest.py | monotonic vs init 0 + baris ganda | fps 200-300 | Sedang | init + hapus duplikat |
| Quot | cam main.cpp | `&quot;` rusak jadi `"` | compile gagal | Tinggi | 1 karakter |
| Unit | systemd unit S2 | MQTT_PASS inline vs repo EnvironmentFile | mismatch deploy | Sedang | deploy unit baru |

F6/F7/F8: lihat §8/§9. F9: kirim JSON error dulu (implementasi saya) + firmware sudah kompatibel.
F10/F11: terverifikasi (portal wajib, tanpa default-north; per-camera/per-approach).
F13/F17: vision_state + fresh_lane_count + {lane}_fresh masuk pipeline hingga badge dashboard.

## 6. FILES CHANGED

Web: README controller, archive pindah (3 path), `VisionStateBadge.tsx`, dashboard badge,
`.env.local.example`, `.env.local` (keputusan owner C), AGENTS.md (prosedur rsync aman),
docs (audit). Yolo: `main.py` (online), `tracking.py` (isolasi+hysteresis+waiting),
`fuzzy.py` (rapi), `mqtt.py` (—), `camera_ingest.py` (fps+F9), `camera_registry.py`
(Decimal), `rotate_camera_token.py`, `systemd unit` (env file), tests (11).
Sub: `subscriber_aws.py` (F3 rewrite + dedup + vision sampled), `tests/`, `.env` (keputusan C).

## 7. YOLO MODEL VERIFICATION

- Path produksi: `/home/ubuntu/yolov8s_indotraffic_best.pt` (22 MB, md5 cocok dengan backup).
- Family: DetectionModel Ultralytics, **11.14M parameter = YOLOv8s (bukan nano)**, stride 8/16/32.
- Classes (dari metadata): Bus, Mobil Penumpang, Pejalan Kaki, Sepeda Motor, Truck, Unmotorized.
- Device cpu, imgsz 960, conf 0.30. Warmup ok (~1.1 dtk).
- Inference blank frame: 0 deteksi @2.45 dtk (tanpa false positive; latensi CPU tercatat).

## 8. MULTI-CAMERA TRACKING RESULT

Satu engine (YOLO instance) per camera_id; predictor terpisah TERBUKTI
(`mA.predictor is not mB.predictor` = True di S2). Fair round-robin + latest-frame-only.
Sim 3 kamera: auth OK semua, frame terpisah per key, snapshot 200 per kamera.
Regression interleaved A/B: PASS (sisi/flow independen).

## 9. WAITING TIME IMPLEMENTATION

`still_since` per track (speed < threshold); `max_waiting_s` = diam terlama;
reset saat bergerak; cleanup saat track hilang. Fuzzy pakai nilai aktual,
fallback `queue*3` hanya bila nol. Test PASS.

## 10. FUZZY PIPELINE RESULT

7/7 tests. Rekomendasi 1 Hz per intersection, clamp min/max, deadband anti-flicker,
out offline konservatif. Pesan kanonis terverifikasi di broker (skema §24).

## 11. MQTT CONTRACT RESULT

Kanonis + legacy dua arah teruji via mosquitto_pub/sub: telemetry dinormalisasi,
vision sampled, rekomendasi valid, ACK command. ACL `astraea/#` untuk jti/server-iot.

## 12. SUBSCRIBER NORMALIZATION RESULT

Mapping F3 teruji 7/7 unit + 1 E2E produksi (DynamoDB: NORMAL/3 lane/fw/valid/source/
qv-tanpa-cm/rec-vs-eff). Legacy behavior lama dipertahankan (count_valid default True).

## 13. ESP32 CONTROLLER RESULT

R1 PASS (RAM 14.3%, Flash 62.1%, espressif32 7.1.1, arduino 3.20017,
ArduinoJson 6.21.6, PubSubClient 2.8.0). D2/D3/Q milik v2.1 terverifikasi via baca kode
+ compile. Tambahan saya: perintah `reboot`, README F1. HARDWARE: PENDING (R checklist).

## 14. ESP32-CAM RESULT

R1 PASS (RAM 15.8%, Flash 34.1%) setelah fix syntax. CA-verify + AP_STA + portal-wajib
milik sesi lain, terverifikasi via baca kode. HARDWARE: PENDING.

## 15. TEST RESULTS

| TEST | STATUS | EVIDENCE |
|---|---|---|
| PIO controller | PASS | SUCCESS log |
| PIO cam | PASS | SUCCESS log |
| py_compile sub+vision | PASS | exit 0 |
| pytest S2 (11) | PASS | 11 passed |
| fuzzy (7) + subscriber (7) + tracking (4) | PASS | runner output |
| sim 1 cam + snapshot | PASS | 200 + fps 2.7 + ONLINE |
| sim 3 cam | PASS | 3x auth OK, snapshot 200 |
| rotation | PASS | token lama 4401 |
| dedup E2E | PASS | 1 record |
| kanonis E2E | PASS | DynamoDB fields |
| WSS 443 | PASS | handshake + frame |
| reboot S2 | PASS | ~95 dtk, health 200 |
| Next build + tsc | PASS | build log |
| Hardware R2-R6, R10-S1 | PENDING | checklist tersedia |

## 16. SERVICE RESTART / DEPLOYMENT RESULT

 Astraea-vision restart berkali-kali (setiap deploy): active, model loaded, MQTT connected.
 Subscriber restart: active. Web restart: active (insiden .env terhapus rsync → restore
 dari backup 600 → 200 OK; prosedur aman ditulis di AGENTS.md).

## 17. LEGACY FILE CLASSIFICATION

CANONICAL: iot/astraea-controller, iot/astraea-cam, astraea-vision/*, subscriber_aws.py.
LEGACY-AKTIF: server.py + yolov8-ws :8080 (Vision Lab), topik traffic/*, iot/esp32*,
iot/archive/*, .env.local.example Azure. DISABLED: yolov8-http, yolov8-bridge.
OBSOLETE: vision_fuzzy_server.py, adaptive_traffic_engine.py (tak jalan).

## 18. REMAINING RISKS

Firmware belum boot di hardware nyata. Password MQTT/SMTP lama belum dirotasi
(butuh fisik). History backup awal masih berisi secret lama. Reboot S1 belum diuji.
Kuota Gemini gratis. Sesi paralel lain aktif di repo sama (koordinasi via pull).

## 19. HARDWARE TESTS STILL REQUIRED

`docs/prd-implementation/HARDWARE_TEST_CHECKLIST.md` (R checklist fase 1-6 + R10 S1).
Status: PENDING OWNER.

## 20. EXACT NEXT STEPS FOR OWNER

1. Flash controller v2 (PlatformIO `iot/astraea-controller`), provision via serial.
2. Flash 3 cam (`iot/astraea-cam`), provision via SoftAP dengan token BARU
   (ada di file server yang aman — BUKAN di laporan ini).
3. Ikuti HARDWARE_TEST_CHECKLIST.md berurutan (R2→R6), laporkan gagal apa adanya.
4. R10 S1: `sudo systemctl reboot`, verifikasi 4 service + dashboard 5 menit kemudian.
5. Revoke PAT bila belum (deploy key sudah gantikan).
6. Jadwalkan rotasi password MQTT/SMTP saat visit lapangan.

## 21. GIT COMMITS CREATED

Web: merge dc28196 (branch fix-...-v2, tanpa force). Yolo: f6ac09d. Sub: b62aed8.
Semua push OK. AGENTS.md: prosedur rsync aman ditambahkan.

## 22. FINAL VERDICT: READY FOR HARDWARE TEST

Seluruh acceptance server-side terpenuhi dan terbukti dengan log/tes.
Satu-satunya yang tersisa wajib hardware fisik (R2-R6, R10-S1).
