# FINAL_INTEGRATION_REPORT_V5.md (PROMPT V5)

Nilai secret tidak ada di laporan ini (hanya nama variable).

## 1. Executive Summary

Fokus V5: status kamera dashboard tidak live (baca `health_state` basi DynamoDB).
FIX: agregasi server-side `/api/cameras/live` (registry + live Server 2, token tetap
di server) + UI pill ONLINE/STALE/OFFLINE/UNKNOWN + polling 4 dtk + frame age.
Bonus: stack-heavy controller (penyebab crash stack canary owner) diperbaiki minimal
(buffer besar jadi static). YOLOv8s@640 dipertahankan. Verdict di §25.

## 2. HEAD Before Work

web `bb6df44`, yolo `0c43543`, sub `0896f25`. Semua clean, tanpa uncommitted work.

## 3. Current Real Hardware State

3 kamera registered + pernah ONLINE + stream terakses (milik owner).
Saat audit: ketiganya diam 15–44 mnt (frame_age 907–2622 dtk) — data live ini yang
membuktikan bug (DynamoDB masih ONLINE) dan memvalidasi fix.

## 4. Dashboard Live Status Bug

`/cameras` baca `health_state` persisted → NORTH dicabut tetap hijau ONLINE.

## 5. Root Cause

`touch_seen` hanya menulis saat frame masuk; tidak ada penulis OFFLINE.
Design: DynamoDB = metadata, bukan konektivitas realtime.

## 6. Live Health Architecture

Browser → `GET /api/cameras/live` (Next, auth session) → scan Cameras →
`Promise.allSettled` fetch Server 2 `/v1/cameras/{id}/status` (timeout 3 dtk,
Bearer `VISION_VIEWER_TOKEN` server-side) → merge + derive → whitelist fields.
Token tak pernah ke browser. Gagal per-kamera → UNKNOWN, bukan fail global.

## 7. Files Changed

Web: `lib/camera-live.ts` (baru), `lib/camera-live.test.ts` (baru),
`app/api/cameras/live/route.ts` (baru), `app/cameras/page.tsx` (live+polling+pill+age),
`package.json` (`test:live`), `iot/astraea-controller/src/main.cpp`
(static buffers; pin lib tetap ArduinoJson 6.21.5 + PubSubClient 2.8).

## 8. Server2 Live API Evidence

Status jujur terverifikasi: online False/fresh False/connected False +
`frame_age_s` 260.5 saat kamera mati; snapshot 200 (last-known, by design).

## 9. Dashboard Status Evidence

Unit 7/7 (ONLINE/STALE/OFFLINE/UNKNOWN, tanpa secret di response, Bearer terkirim
hanya bila token diset). Live browser test = owner (butuh login): BE checklist §BJ.

## 10. Camera Reconnect Evidence

Pola reconnect teruji berulang via sim (ONLINE + fps waras kembali).
Hardware reconnect = owner (AK checklist).

## 11. YOLOv8s Evidence

Path/model/classes/device/imgsz-640/conf-0.3 tak berubah (verifikasi health).
Blank inference 0 @~2.4 dtk (tanpa false positive).

## 12. Tracking Evidence

Tidak diubah V5 (isolasi + hysteresis + vehicle-waiting dari V3/V4 tetap PASS).

## 13. Vision Metrics MQTT

Live capture: per-approach `online` + counts + waiting + recommended_green,
independen (east/north/south).

## 14. Fuzzy Recommendation

Live: schema_version 1, controller_id benar, valid 10 dtk, clamp min/max.
Fuzzy code tak diubah V5.

## 15. Controller MQTT

Kontrak via baca kode v2.1: subscribe metrics + recommendation, validasi +
clamp + fallback (D3 non-blocking milik sesi lain, terverifikasi baca).
`recommended_green_s` vs `effective_green_s` dipisah di telemetri.

## 16. Recommended vs Effective Green

Efektif = fuzzy fresh (clamp) else sensor lokal (greenForLane).
Rekomendasi tak pernah potong fase aktif (phase engine utuh).

## 17. Signal Safety

GREEN→YELLOW→ALL_RED→NEXT; requestGreen tolak konflik; FAILSAFE/MANUAL_SAFE
all-red; server tak pegang GPIO. Tanpa perubahan V5.

## 18. NORMAL / DEGRADED / FALLBACK

Badge dashboard baca `vision_state` telemetri (sudah ada V3).
Live Server 2: 3 fresh=NORMAL, sebagian=DEGRADED, 0=FALLBACK (teruji V4;
re-verifikasi pola sama round ini via sim).

## 19. Physical Tests

PENDING OWNER (R checklist + AI checklist). Server simulation: PASS.
Tidak ada klaim PASS hardware.

## 20. Test Results

| TEST | STATUS | EVIDENCE |
|---|---|---|
| camera-live 7 | PASS | tsx --test |
| vision 27 | PASS | runner S1+S2 |
| subscriber 10 | PASS | runner |
| tsc | PASS | exit 0 |
| Next build | PASS | build log |
| PIO controller | PASS | SUCCESS RAM 21.8%/Flash 75.1% |
| PIO cam | PASS | SUCCESS RAM 18.4%/Flash 38.2% |

## 21. Build Results

Di atas. Toolchain: espressif32 7.1.1 (fresh install; /tmp sebelumnya dibersihkan sistem).

## 22. Deployment

Hanya web (rsync aman + `.env.local` utuh + restart, active, login/cameras 200,
api-live 401 tanpa sesi = benar). Server 2/subscriber/mosquitto/nginx tak disentuh.

## 23. Commit SHAs

Web merge `a4100a7` (branch v5), push OK. Yolo/sub: nol perubahan V5.

## 24. Remaining Risks

Stabilitas fisik controller pasca-static-fix BELUM diobservasi 60-120 dtk
(butuh hardware + serial; AZ checklist untuk owner).
Reboot S1 belum diuji. Sesi paralel lain aktif (koordinasi via pull).

## 25. Final Verdict

READY FOR OWNER END-TO-END HARDWARE TEST.
Alasan: seluruh software blocker V5 selesai + terbukti; tersisa validasi fisik
(lampu, cabut/colok kamera, observasi reboot) yang hanya bisa owner lakukan.
