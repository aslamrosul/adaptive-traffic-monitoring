# FINAL_CAMERA_FLICKER_FIX_V6_7_3 — Flicker-Free Annotated Preview

## Bug
North/South/East berkedip hitam serentak tiap 1500 ms: `image → black → image`.
Penyebab: `AnnotatedPreview` memakai `key={`${cameraId}-${tick}-${stage}`}` sehingga
setiap tick me-remount `<img>`; frame lama hilang sebelum JPEG annotated berikutnya
selesai load (background container hitam terlihat).

## Fix (frontend only)
Double-buffered rendering, last-good-frame retention:

- `components/AnnotatedPreview.tsx`:
  - Visible `<img>` memakai `key={cameraId}` saja — TIDAK PERNAH mengandung `tick`,
    tidak remount tiap polling.
  - `visibleUrl` hanya diganti saat preload sukses (atomic swap A → B).
  - Preload tiap `pendingUrl` via `new Image()` di `useEffect` dengan `cancelled`
    cleanup → tidak ada backlog; hasil basi diabaikan.
  - Gagal annotated → coba raw SIKLUS SAMA (setelah load); gagal keduanya →
    visible lama TETAP. Placeholder "Preview sementara tidak tersedia" hanya bila
    belum pernah ada frame valid.
  - Ganti `cameraId` → visible dibersihkan (frame kamera lama tidak dipakai sebagai
    data kamera baru), langsung load annotated kamera baru.
- `lib/annotated-preview-state.ts` (baru): state machine murni + testable
  (`initPreview` / `previewNext`, guard `ev.url !== pendingUrl`, `gen` anti-overwrite).
- Refresh tetap 1500 ms di `/dashboard`, `/dashboard2`, `IntersectionCameraGrid`
  — semua memakai komponen shared ini, tanpa polling acak tambahan.
- Layout dipertahankan: container `aspect-[4/3]`, `object-contain`, bbox annotated
  produksi, fullscreen, AI badge, proxy aman `/api/cameras/...` (tanpa token di browser).
- Tidak menyentuh: firmware ESP32, inferensi YOLO Server 2, MQTT/fuzzy/controller,
  model/imgsz, auth V6.7.2.

## Tests (16/16 lolos)
- `lib/annotated-preview.test.ts` + `lib/annotated-preview-state.test.ts` (8 kasus V6.7.3):
  1. annotated sukses pertama, 2. annotated gagal → raw siklus sama,
  3. raw gagal tanpa frame → unavailable, 4. raw gagal + frame lama → frame bertahan,
  5. tick berikut retry annotated + pulih otomatis, 6. respons basi diabaikan,
  7. ganti cameraId isolasi frame, 8. visible tidak di-key oleh tick (cek sumber).
- `npx tsc --noEmit`: bersih.
- `npm run build`: sukses (26/26 static pages).
- Kamera suite (`camera-live`, `camera-ai-status`, `camera-display-config`): 44/44 lolos.
- Suite lain (`ai-conversation`, `normalize-traffic`, `intersection-select`): 30/30 lolos.

## Verifikasi manual (pemilik)
Buka dashboard produksi, amati North + South + East ≥ 30 detik:
sebelum `frame → BLACK → frame`, sesudah `frame → frame → frame` tanpa flash hitam;
bbox YOLO tetap update; satu annotated gagal sesaat tidak mengosongkan kartu.

## Deploy
Hanya service web/frontend. Jangan restart astraea-vision / YOLO / MQTT /
subscriber / ESP32. Setelah deploy cek `/api/version` memuat commit baru.
