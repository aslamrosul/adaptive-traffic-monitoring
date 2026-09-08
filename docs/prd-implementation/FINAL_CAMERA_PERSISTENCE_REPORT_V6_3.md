# FINAL_CAMERA_PERSISTENCE_REPORT_V6_3.md (URL_CAM.md)

## 1. HEAD before work

web `65e542e` (clean). Yolo/sub/firmware tak disentuh.

## 2. Current problem

URL/sumber kamera hanya di `localStorage` (`dashboard2_camUrls`,
`dashboard2_camSource`): laptop lain kehilangan config; HLS tak selalu autoplay.

## 3. Existing localStorage behavior

Ditulis tiap render state; dibaca saat mount. Dipertahankan hanya untuk
preferensi UI (`camView`, `simOpen`, `simSource`).

## 4. New server persistence architecture

Browser → PUT server → DynamoDB `Cameras` (atribut `display_*`) → GET saat mount.
Server menang atas lokal. Migrasi lokal→prefill hanya bila server kosong dan
hanya setelah Save eksplisit (tak pernah auto-PUT).

## 5. Database fields used

Tabel existing `Cameras` (+): `display_source_type` (canonical|mjpeg|hls),
`display_url`, `display_enabled`, `autoplay`, `display_updated_at`,
`display_updated_by`. Tanpa tabel baru.

## 6. API routes

- `GET /api/cameras/display-config?intersectionId=` (auth, field aman, no-store).
- `PUT /api/cameras/[cameraId]/display-config` (auth, registry check, validasi,
  webcam/upload/blob/javascript:/data:/file: ditolak).
- Token/hash/password tak pernah dikembalikan.

## 7. Security validation

401 tanpa sesi; 404 kamera tak dikenal; 400 skema/URL jahat; Bearer viewer tetap
server-side; URL max 2048; mixed-content http diblokir di UI + didokumentasikan.

## 8. Camera source behavior

canonical (default registry, via strip + proxy aman) / mjpeg / hls persist;
webcam = klik-aktivasi (tanpa getUserMedia otomatis); upload = pilih ulang
(blob tak direstore, tak dipersist).

## 9. Autoplay behavior

HLS `<video autoPlay muted playsInline>` + percobaan `play()` defensif +
tombol Putar manual bila diblokir (bukan error). MJPEG `<img>` auto-load.
Webcam tak pernah autoplay.

## 10. Webcam/upload limitations

Terdokumentasi di UI + laporan ini (§8).

## 11. Cross-browser test

Struktural: server source of truth + no-store + test validasi.
Uji 2-laptop = owner (BE): laptop A Save → laptop B login → config sama.

## 12. Build/test results

tsc exit 0. display-config tests 10/10. camera-live 8/8 + normalize 5/5 PASS.
Next build PASS. Lint file baru 0 error (repo-wide pre-existing tak berubah).
PIO tak dijalankan (firmware tak diubah).

## 13. Git diff scope

`lib/camera-display-config.*`, 2 API routes, dashboard (server-load + Save +
autoplay + label), tanpa iot/subscriber/vision/sw.js. Tanpa dependensi baru.

## 14. Final verdict

Kamera display persistence + autoplay aman PASS (software).
Uji lintas-browser + HP = owner.
