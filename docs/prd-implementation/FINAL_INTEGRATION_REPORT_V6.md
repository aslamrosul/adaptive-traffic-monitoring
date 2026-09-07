# FINAL_INTEGRATION_REPORT_V6.md (PROMPT V6)

Nilai secret tidak ada di laporan ini.

## 1. Executive Summary

V6 membuat dashboard primer kanonis + observatif tanpa rewrite:
status kamera dari live Server 2 (bukan DynamoDB basi), kartu kamera registry
otomatis + snapshot proxy aman, adapter telemetri kanonis lengkap,
simulasi browser-YOLO dilabeli Lab, info rantai adaptif di UI.
Firmware/model/inferensi tak disentuh.

## 2. V6 Goals

Sesuai prompt: audit → preservasi V5 → dashboard kanonis → observability demo →
hilangkan data menyesatkan → tutup evidence hardware → regression → report.

## 3. Repositories + HEAD Before Work

web `be8f8d7`, yolo `0c43543`, sub `0896f25`. Semua clean, tanpa uncommitted work.

## 4. Current Architecture

Tetap: CAM → WSS 443 → astraea-vision (YOLOv8s@640, tracker/isolasi, fuzzy) →
MQTT kanonis → controller + subscriber → DynamoDB/S3 → Next.js.
Browser → `/api/cameras/live` → Server 2 (token server-side).

## 5. Canonical Data Flow

ESP32-CAM → Server 2 → YOLO sekali → metrik kanonis → fuzzy → MQTT →
controller (durasi) + dashboard (observasi). Browser tidak inferensi untuk count.

## 6. Camera vs Sensor Responsibilities

Kamera/YOLO: counts, queue, waiting, confidence. IR/HC: Level + fallback.
UI menampilkan keduanya terpisah + sumbernya.

## 7. Fuzzy Inputs

queue ratio + vehicle waiting aktual + sensor_level + vision_online +
min/max green (tak berubah).

## 8. Controller Duration Priority

fixed → fuzzy fresh (clamp) → sensor lokal (tak berubah, terverifikasi baca).

## 9. V5 Owner Physical Closure

Owner menyelesaikan hardware test pasca-V5: 3 cam ONLINE + stream, controller
v2.1.2 stabil (tanpa canary/reboot), MQTT kanonis + ACK terverifikasi, fuzzy≈efektif
(East ~47.5/47, North ~31.7/31, South ~20/20), LED ikut durasi efektif, Level 0/1/2,
NORMAL/DEGRADED/FALLBACK. Ini menutup status PENDING V5.

## 10. V6 Dashboard Problems Found

(a) `/cameras` baca `health_state` basi; (b) `inference_fresh` selalu null;
(c) normalize buang field kanonis; (d) kamera butuh IP manual;
(e) count browser-YOLO ganda di dashboard primer; (f) tanpa penjelasan rantai.

## 11. V6 Changes

- `lib/camera-live.ts`: mapping `inference_fresh`.
- `app/api/cameras/live/route.ts`: tak berubah (sudah benar).
- `app/api/cameras/[cameraId]/snapshot/route.ts` (baru): proxy auth + validasi
  registry + Bearer server-side + no-store + 401/400/404/502.
- `components/CanonicalCameraStrip.tsx` (baru): kartu registry + snapshot proxy
  + pill + frame age + placeholder jujur.
- `app/dashboard/page.tsx`: strip kanonis + info NORMAL/FALLBACK + label Lab.
- `lib/hooks/useMqttTraffic.ts` + interface: field kanonis lengkap (rec/eff green,
  valid/source, distance, vision_state, firmware, dsb; backward-compatible).
- Firmware/model: TAK DIUBAH.

## 12. Camera Live Architecture

Browser → Next (session) → Server 2 (token server-side) → merge + derive
ONLINE/STALE/OFFLINE/UNKNOWN → whitelist JSON. Polling 4 dtk.

## 13. Secure Stream Architecture

Snapshot via proxy di atas (fetch singkat, no-store, error 502 bersih).
MJPEG long-lived TIDAK diproxy: menambah failure mode di Next standalone;
snapshot refresh 5 dtk cukup untuk demo + andal. Didokumentasikan di sini.

## 14. Canonical MQTT/Telemetry Adapter

Pola adapter (O.3): subscriber/API tetap adapter kanonis web; browser MQTT legacy
tetap untuk realtime + fallback API. Satu state latest (pickNewestTraffic).
Normalize kini preservasi semua field §N.

## 15. Per-Lane Observability

Lane: light, vehicle/queue (kamera), valid/source, sensor level/IR/US/distance,
rec/eff green, vision fresh — terpisah YOLO vs sensor vs fuzzy vs controller.

## 16. System-Level Observability

Badge vision + umur telemetri + strip kamera + info rantai, semua dari live/API.

## 17. NORMAL / DEGRADED / FALLBACK

Badge + info; semantik dari telemetri controller (3/1-2/0 fresh).

## 18. Signal Safety

Tak diubah; terverifikasi baca (G/H dipatuhi firmware v2.1.2).

## 19. Security Review

Token viewer hanya server-side (test khusus); merge whitelist (test AU);
snapshot proxy auth + validasi; tanpa secret di response/laporan.
Riwayat: repo boleh public (keputusan owner); env produksi tetap di server.

## 20. Tests Added

`camera-live.test.ts` (+inference_fresh), `normalize-traffic.test.ts` (5:
rec/eff, sensor-vs-queue, firmware/field, NORMAL, legacy).

## 21. Full Test Results

| TEST | STATUS | EVIDENCE |
|---|---|---|
| camera-live 8 | PASS | tsx --test |
| normalize 5 | PASS | tsx --test |
| vision 27 | PASS | runner S1+S2 |
| subscriber 10 | PASS | runner |
| tsc | PASS | exit 0 |
| Next build | PASS | build log |
| PIO controller | PASS | SUCCESS 21.8%/75.1% |
| PIO cam | PASS | SUCCESS 18.4%/38.2% |

## 22. Build Results

Di atas. Deps tak diubah (ArduinoJson 6.21.5, PubSubClient 2.8).

## 23. Deployment

Hanya web (rsync aman + env utuh + restart, active).
Server 2/subscriber/mosquitto/nginx tak disentuh.
Verifikasi: login 200, cameras 200, dashboard redirect-login benar,
api-live 401 tanpa sesi (benar).

## 24. Browser Verification

Struktural (tsc/build) + pola auth teruji unit. Uji login penuh = owner
(BE checklist): /cameras 3 status + snapshot + cabut North → OFFLINE.

## 25. Files Changed

Lihat §11. Semua di repo web, branch v5-live-e2e lanjutan → commit V6.

## 26. Commit SHAs

Merge --no-ff ke main + push (tanpa force). SHA di log.

## 27. Remaining Risks

Stabilitas controller jangka panjang di lapangan; kuota LLM;
sesi paralel (koordinasi via pull); snapshot proxy tergantung S2.

## 28. Final Verdict

READY FOR OWNER END-TO-END HARDWARE TEST.
(Server PASS penuh; OWNER-CONFIRMED hardware PASS dari §9 dipertahankan;
tidak ada klaim pengukuran fisik oleh agen.)
