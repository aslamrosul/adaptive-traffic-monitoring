# FINAL_ANNOTATED_CAMERA_UI_REPORT_V6_6.md (web)

## 1. HEAD before work

web `42ce357` (clean).

## 2-4. Raw limitation, single inference, bbox schema

Lihat laporan vision. Web tak menambah inferensi apa pun.

## 5. Annotation renderer / 6. store / 7. seq

Server-side (laporan vision). Web hanya menampilkan JPEG.

## 8. Server endpoints

Baru: `GET /api/cameras/[cameraId]/annotated` (mirror snapshot proxy:
session wajib, cameraId validasi + registry check, Bearer server-side,
`image/jpeg`, no-store, 401/400/404/502). Tanpa token ke browser.

## 9. Authentication

Sama dengan snapshot proxy. PWA: `/api/*` network-only (tak diubah).

## 10. Next proxy

Di atas.

## 11. Dashboard integration

`AnnotatedPreview` (annotated → fallback raw jujur → null) dipakai kartu
kanonis dashboard + dashboard2 (konsisten, tanpa logika divergen).

## 12. Detail integration

Grid: canonical memakai AnnotatedPreview; MJPEG/HLS manual tetap langsung.

## 13. Refresh cadence

1500ms untuk kartu kanonis yang terlihat (sekitar 2 req/detik untuk 3 kamera).
Dokumentasi: ringan, bukan 10 FPS.

## 14. Performance measurements

Server-side §14 laporan vision. Web: 1 fetch JPEG per kartu per tick.

## 15. Tests

Web suites 48/48 PASS (tanpa suite baru; komponen tipis, logika di helper
teruji). tsc 0. Build PASS.

## 16. Regression audit

Diff: proxy annotated, komponen preview, 2 dashboard, grid.
Tanpa PWA/auth/MQTT/presets/status/traffic-controller.

## 17. Deployment scope

Hanya web (rsync aman + restart, active). Server lain tak disentuh.

## 18. Known limitations

Uji visual box-vs-mobil + HP = owner.

## 19. Final verdict

UI anotasi kanonis PASS (software).
