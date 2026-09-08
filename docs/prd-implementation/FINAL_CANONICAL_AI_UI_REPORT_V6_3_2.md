# FINAL_CANONICAL_AI_UI_REPORT_V6_3_2.md (CAM_FIX2.md)

## 1. HEAD before work

web `c35beeb` (clean). Yolo/sub/firmware tak disentuh.

## 2. Current misleading YOLO UI behavior

Kedua dashboard: `yoloEnabled` default true padahal WS hanya dibuka via klik;
tombol ungu "YOLO"/"YOLO" (teks identik on/off) terkesan kontrol AI ON/OFF;
count kartu dari `yoloStats` browser.

## 3. Production YOLO architecture

ESP32-CAM → Server 2 YOLOv8s@640 → tracker → fuzzy → MQTT → controller.
Browser tak pernah jadi sumber count produksi.

## 4. Canonical AI source of truth

`/api/cameras/live` per approach (registry + live Server 2).

## 5. AI status mapping

`lib/camera-ai-status.ts`: ACTIVE (online+fresh+inference, connected!==false),
STALE, OFFLINE, UNKNOWN. `formatVehicleCount`: 0 vs "-" dibedakan.

## 6. Vehicle count source

`active_vehicle_count` kanonis (atau "-" bila unknown).

## 7. Legacy browser YOLO treatment

Tidak dihapus (kode overlay dipakai Vision Lab/sim). Dari UI produksi diganti
badge; overlay manual via tombol "Lab ON/OFF" + label eksperimental.
Tidak auto-connect (default false, tanpa effect auto).

## 8. Duplicate inference prevention

Overlay Lab hanya dibuka eksplisit per klik; tidak ada auto-connect massal.

## 9. Files changed

`lib/camera-ai-status.ts` + test (baru), `lib/hooks/useCameraLive.ts` (baru),
`components/AiStatusBadge.tsx` (baru), `app/dashboard/page.tsx`,
`app/dashboard2/page.tsx`, report ini.

## 10. Build/test results

camera-ai-status 6/6, camera-live 8/8, normalize 5/5, vision 27, subscriber 10,
tsc 0, Next build PASS, PIO tak dijalankan (firmware tak diubah).

## 11. Regression audit

Diff: 2 halaman + 3 file lib baru + report. Tanpa iot/vision/subscriber/sw.js.
Sim animasi + YOLO overlay code tetap ada (Lab).

## 12. Final verdict

Status AI kanonis PASS (software). Uji visual + HP = owner.
