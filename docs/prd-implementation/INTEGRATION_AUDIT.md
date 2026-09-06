# INTEGRATION_AUDIT.md — PROMPT_OPENCODE_INTEGRASI.md Phase 0 (C)

Tanggal: 2026-09-06. Metode: eksekusi langsung di Server 1 + `ssh astraea-yolo`.

## 1. Repository (branch `opencode/integrasi-prd`)

| Repo | HEAD | Status kerja |
|---|---|---|
| adaptive-traffic-monitoring | 8043871 | firmware v2.1 + cam CA/AP_STA (sesi lain), fix quot saya |
| yolov8-server | 4a65460 | astraea-vision + nginx 443 + drop-in DETECT_CLASSES |
| astraea-subscriber-mqtt | 1c986cf | kanonis + sampled + dedup (sesi ini) |
| backup-all | 563b78a0 | snapshot + token lama (akan dibersihkan) |

`iot/astraea-controller/src/main.cpp` (3672 baris, v2.1) dan
`iot/astraea-cam/src/main.cpp` (1927 baris) = kanonis.
`iot/esp32/*`, `iot/esp32cam/*` = ARSIP (jangan jadi acuan).
`.env.local.example` = template Azure lawas + daftar variabel produksi (nama saja).

Topik dipakai: web (`traffic/+/data` via wss dashboard, config/light set),
subscriber (`traffic/+/data`, `astraea/v1/.../telemetry`, `.../vision/metrics`),
vision (`astraea/v1/...` + legacy `traffic/CAM_YOLO_{iid}/data` 5 dtk).
Vision Lab: `wss://vision.astraea.my.id/yolo-ws/ws` (-> Server2 :8080).

## 2. Server 1 (ip-172-31-5-20, Ubuntu 24.04, c7i-flex.large)

Service systemd (semua active+enabled): mosquitto (1883 + wss 8089, ACL `traffic/#`+`astraea/#`),
`traffic-aws-subscriber`, `adaptive-traffic` (:3000, build terbaru), nginx (80->443, LE).
PM2: tidak terpasang (sesuai kebijakan N: systemd dipertahankan).
Env `.env.local`: 8 tabel + Cameras, S3 baru, NEXTAUTH https, Google OAuth, Gemini 3.6-flash
(base URL tanpa trailing slash), MQTT (hanya nama variabel dicatat di sini).
DynamoDB: 8 tabel (Cameras baru). S3: bucket akun baru, layout lama dipertahankan.
Port publik: 22/80/443/1883/3000/8089. Health: web/API/MQTT/Dynamo OK.

## 3. Server 2 (ip-172-31-2-242, Ubuntu 24.04, 2 vCPU, 7.6 GB, tanpa GPU)

venv `~/yolo-env` (ultralytics 8.4.142, torch 2.14 CPU, boto3). Model
`yolov8s_indotraffic_best.pt` 22 MB, **11.14M parameter = skala YOLOv8s, BUKAN nano**
(temuan H; tidak dilatih ulang di sini), 6 kelas IndoTraffic.
Service: `astraea-vision` (8082 ingest + 8081 API, active+enabled),
`yolov8-ws` :8080 (LEGACY-AKTIF untuk Vision Lab), `yolov8-http`/`yolov8-bridge` DISABLED.
nginx 443 `vision.astraea.my.id` (LE): `/v1/camera/ingest`->8082, sisanya->8081.
Ingest WSS terautentikasi (token baru, lama ditolak 4401 — teruji).
Port publik: 80/443/8080/8081 (+22 hanya dari SG Server 1). IAM role minimal DynamoDB.
R10: reboot teruji — online ~95 dtk, semua service aktif, health 200.

## 4. Klasifikasi legacy

- CURRENT: astraea-vision, subscriber kanonis+dedup, controller v2.1, cam CA/AP_STA,
  nginx 443, Cameras, /api/cameras, pedestrian panel, panduan baru.
- LEGACY-AKTIF (jangan dimatikan): `yolov8-ws` :8080 + `server.py` (Vision Lab),
  topik `traffic/*`, firmware v1 di `iot/esp32|esp32cam/`, `.env.local.example` Azure.
- DUPLICATE (tercatat, tidak dihapus): `server_detect_http.py` vs `/detect` astraea-vision;
  `mqtt_bridge.py` vs legacy-compat internal (bridge DISABLED).
- SAFE TO DEPRECATE (nanti, bukan sekarang): `yolov8-ws` setelah Vision Lab migrasi;
  `vision_fuzzy_server.py`, `adaptive_traffic_engine.py` (tak terpakai);
  port publik 8080/8081 Server 2 setelah migrasi.

## 5. Temuan secret (P.10, nama file saja, tanpa nilai)

- History web: `.env.local` (komit ops sesi ini, 2 revisi) — dicabut via `git rm --cached` di branch.
- History sub: `.env` (idem).
- History backup-all: snapshot awal berisi `.env`/passwd/TLS privkey + tambahan sesi ini
  (`.env.local`, `camera-tokens/`) — tambahan dicabut di branch; snapshot awal DIBIARKAN
  (rewrite repo besar berisiko; repo private; dilaporkan sebagai risiko diterima).
- Tidak ada secret di history yolo-server.
- Rotasi dilakukan: 3 token kamera (lama invalid, teruji 4401), NEXTAUTH_SECRET (login ulang).
- TIDAK dirotasi (batas lapangan): password MQTT/SMTP (tertulis di firmware v1 lapangan
  + backup awal; rotasi butuh kunjungan fisik) — dilaporkan, dijadwalkan saat visit.
