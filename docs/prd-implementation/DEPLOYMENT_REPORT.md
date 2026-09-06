# DEPLOYMENT_REPORT.md — PRD implementasi 2026-09-06

## Kommits (main, semua ter-push)

- web `ce56677` — kamera registry+UI, pedestrian, panduan, firmware v2, docs
- subscriber `1c986cf` — topik kanonis + vision sampled
- yolo `deb9246` — astraea-vision-service + legacy 5 dtk
- backup-all `563b78a0` — token kamera (private)

## Versi berjalan

- Server 1: node 20.20.2, mosquitto 2.0.18, nginx 1.24.0, Next.js build `ce56677`
- Server 2: ultralytics 8.4.142, torch 2.14 CPU, model indotraffic 6 kelas, warmup ok
- Firmware: controller v2 + cam v1 lolos `pio run` (esp32dev/esp32cam)

## Bukti uji

- health-all.sh: 7/7 OK. Fuzzy unit: 7/7. Kanonis MQTT 1 Hz + rekomendasi tervalidasi.
- Simulasi ingest CAM_TALUN_NORTH_01: auth ok, snapshot 200, fuzzy 20.0 hijau.
- Isolasi: TEST_INTERSECTION_02 = 0 telemetri vs TALUN_01 = 13763.
- Dashboard selector memfilter semua query per intersection.

## Tunggu aksi owner

1. DNS `vision.astraea.my.id` → 54.253.237.179 (untuk WSS 443 kamera).
2. Flash controller v2 + cam v1 (token di `/root/astraea-cameras.env`).
3. Revoke PAT `astraea-push` (deploy key SSH sudah gantikan).
4. Tes AI Chat Gemini ulang (bug slash diperbaiki).
