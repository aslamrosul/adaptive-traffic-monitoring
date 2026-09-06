# CURRENT_STATE_AUDIT.md — Phase 0 (PRD §57)

Tanggal: 2026-09-06. Auditor: OpenCode di Server 1. Semua perintah diverifikasi via eksekusi langsung.

## 1. Server 1 — `astraea-web-mqtt`

- Instance: `i-0e276d8171b7b54b7`, `c7i-flex.large`, ap-southeast-2a, VPC `vpc-0ff273e94aeda9019`
- IP: privat `172.31.5.20`, publik `13.238.154.250`. DNS: `astraea.my.id` → publik. Cloudflare: DNS-only.
- OS: Ubuntu 24.04. IAM role: `instanceRole` (akun `471116065558`).
- Tools: node v20.20.2, python 3.12.3, mosquitto 2.0.18, nginx 1.24.0, aws-cli 2.36.40, certbot 2.9.0.

### Repo & deploy (sinkron)

| Repo (branch main) | Workspace | Deploy | Commit |
|---|---|---|---|
| aslamrosul/adaptive-traffic-monitoring | `~/workspace/adaptive-traffic-monitoring` | `/var/www/adaptive-traffic-monitoring` | `438c0d8` |
| Thesambala/astraea-subscriber-mqtt | `~/workspace/astraea-subscriber-mqtt` | `/home/ubuntu/traffic-aws-subscriber` (`subscriber_aws.py`) | `96f1707` |
| aslamrosul/backup-all (PRIVATE) | `~/workspace/backup-all` | arsip | `5eedfdeb` |
| Thesambala/yolov8-server | `~/workspace/yolov8-server` | Server 2 `~` | `7c72600` |

Deploy web = clone GitHub terbaru (bukan snapshot backup). `.env.local` produksi: AWS ap-southeast-2,
7 tabel DynamoDB, S3 bucket baru, NEXTAUTH https, MQTT wss `astraea.my.id:8089`,
Google OAuth, Gemini (`gemini-3.6-flash` via OpenAI-compat base URL).

### Service (semua active, systemd)

- `mosquitto` — 1883 MQTT plain + 8089 websockets TLS (cert LE `astraea.my.id`), user `jti`, ACL per-role.
- `traffic-aws-subscriber` — `python -u subscriber_aws.py` (GitHub terbaru) → DynamoDB + S3 + Telegram/Email. Teruji publish→tulis.
- `adaptive-traffic` — `npm run start` :3000. Build bersih, ChunkLoadError 0.
- `nginx` — 80→443 redirect, 443 reverse proxy :3000, cert LE auto-renew + deploy-hook salin cert ke Mosquitto.
- Ports: 22, 80, 443, 1883, 3000, 8089 (SG `sg-0d8e2a156f4b3c94e`).

### Data

- DynamoDB (PAY_PER_REQUEST, ap-southeast-2): TrafficTelemetry 13495 (`intersection_id`+`timestamp`),
  Notifications 1980, UserActivities 420, Users 11 (`email`), DeviceStatus 3 (`device_id`),
  Intersections 2, IoTConfigs 2. Skema key = sesuai kode terbaru (terverifikasi diff kosong vs backup).
- S3: `traffic-data-lake-471116065558-ap-southeast-2`, 13735+ objek `traffic/raw/year=/month=/day=/hour=/events/*.json`.
- Users: 6 google + 5 credentials, semua `active`.

## 2. Server 2 — `yolov8-server`

- Instance: `i-05d78db07ea69f0ef`, 2 vCPU, 7.6 GB RAM, **tanpa GPU**, Ubuntu 24.04.
- IP: privat `172.31.2.242`, publik `54.253.237.179`. VPC sama dengan Server 1.
- SSH: port 22 **hanya dari SG Server 1**; akses via alias `astraea-yolo` (IP privat +
  dedicated key `~/.ssh/astraea-yolo-deploy`, PRD §37–39). EC2 Instance Connect sebagai cadangan.
- SG publik sementara: 8080, 8081, 1883 (deviasi sementara §69 — ditutup saat hardening, sisa 443).
- Python `~/yolo-env`: ultralytics 8.4.142, torch 2.14.0 (CPU), opencv 5.0 + `libgl1`, websockets 17.1,
  fastapi 0.141, uvicorn 0.52, paho-mqtt 2.1, numpy 2.5.
- Model: `/home/ubuntu/yolov8s_indotraffic_best.pt` 22 MB, task `detect`, 6 kelas IndoTraffic
  (Bus, Mobil Penumpang, Pejalan Kaki, Sepeda Motor, Truck, Unmotorized). **Deviasi PRD §31**:
  basis arsitektur small (bukan nano murni); tidak dilatih ulang — didokumentasikan, dipakai apa adanya.
- Service (semua active): `yolov8-ws` :8080 (model loaded), `yolov8-http` :8081 (via uvicorn),
  `yolov8-bridge` (publish `traffic/CAM_YOLO_01/data` ke broker Server 1, terhubung).
- Fragmentasi (§2.7) masih ada: 3 service terpisah + `latest_stats.json` global tunggal (gap MI-04).

## 3. Perangkat fisik

- ESP32 controller (±IR/HC-SR04): belum online saat audit (tidak ada data fresh selain uji).
- ESP32-CAM ×3: belum ada (firmware cloud-WSS belum dibuat; yang ada baru `iot/esp32cam` JALUR A/B lokal).
- Firmware controller sensor-level: logika level sesaat (gap §13–14: belum ada jendela 2 detik/70%).

## 4. Kesenjangan vs PRD (register resmi §81)

1. Single-intersection assumption masih di banyak tempat (fixed north→south→east, `SIMPANG_TALUN_01` default).
2. Belum ada topik kanonis `astraea/v1/...` — masih `traffic/{device}/data` (kompatibilitas wajib dijaga §26).
3. Belum ada registry kamera/token di DynamoDB; belum ada tabel Cameras/SignalConfigs/SignalEvents.
4. Vision: belum ada tracker/line-crossing (menghitung per-frame), belum ada state per-intersection (MI-04),
   belum ada fuzzy path end-to-end (file fuzzy ada tapi terpisah), belum ada `astraea-vision-service` terpadu.
5. Controller: belum ada all-red eksplisit, belum ada phase plan/conflict matrix/pedestrian di firmware.
6. UI: belum ada pemilih kamera per-approach, belum ada seksi panduan AI Chat & ESP32-CAM, belum ada CRUD fase/pedestrian.
7. S3 masih partisi `traffic/raw/...` lama (PRD §35 usul `intersection=` — migrasi bertahap, data lama dipertahankan).
8. Kebijakan secret: PRD §55/67 melarang secret di Git; **override eksplisit owner**: semua repo PRIVATE dan
   file env ikut di-commit agar tidak hilang. Larangan public tetap berlaku.
9. Port debug Server 2 masih publik sementara (butir 2 di atas).

## 5. Backup & rollback berjalan

- `/root/astraea-webenv-backup.env` (600), backup-all berisi snapshot + `.env.local` produksi.
- Rollback tiap service: `systemctl restart <nama>`; config nginx/mosquitto/systemd asli ada di backup-all;
  data DynamoDB/S3 tidak dihapus selama migrasi.
