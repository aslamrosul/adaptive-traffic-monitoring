# FINAL_CANONICAL_CAMERA_UX_REPORT_V6_5.md (PROMPT_CAM.md)

## 1. HEAD before work

web `e4aa104` (clean). Yolo/sub/firmware tak disentuh.

## 2. Problems found

Strip kanonis ganda; placeholder teks di kartu utama; default mjpeg;
ganti sumber menghapus preset; config ambigu saat all-mode.

## 3. Duplicate camera UI removal

`CanonicalCameraStrip` dihapus dari dashboard (file dihapus setelah
verifikasi tak dipakai di mana pun). Data/hook kanonis tetap.

## 4. Canonical source architecture

Registry → camera_id → proxy Next → Server 2 → kartu utama.
Tanpa URL manual, tanpa token ke browser.

## 5. Default source behavior

Server active → itu; registry tanpa config → canonical otomatis;
tanpa registry → fallback lokal. SIMPANG_TALUN_01 default bila ada.

## 6. Canonical preview integration

Snapshot proxy + tick 5 dtk di kartu utama; jujur per status
(offline/stale/unknown = placeholder, tak ada frame beku LIVE).

## 7. Manual preset data model

`active_source` + `manual_mjpeg_url` + `manual_hls_url` independen.
PUT merge: preset tak dikirim = dipertahankan. Migrasi malas dari
`display_source_type/display_url` (baca; tulis model baru).

## 8. Migration from display_url

§7. Non-destruktif; kompat baca lama dipertahankan di GET.

## 9. Intersection-scoped configuration

Fetch per intersection; gear/settings mati di all-mode; mapping
camera_id+intersection+approach, bukan index global.

## 10. All-intersections behavior

Overview global; tanpa save per-lane.

## 11. Security review

401/404/400; tanpa token/hash/pass di response; Bearer server-side;
max 2048; tolak javascript:/data:/file:/blob:; mixed-content diblokir di UI.

## 12. Tests

display-config 22/22, camera-live 8/8, normalize 5/5, ai-status 6/6,
vision 27, subscriber 10. tsc 0. Lint file garapan 0 error.
PIO tak dijalankan (firmware tak diubah).

## 13. Build results

Next build PASS (2x: awal + final hook cleanup).

## 14. Diff scope

API display (2), dashboard + dashboard2, grid detail, hook + helper + tests,
hapus strip, report. Tanpa iot/vision/subscriber/sw.js/auth.

## 15. Known limitations

Uji 2-laptop + HP = owner (kasus A-F di prompt). MJPEG langsung HLS campuran
tetap tanggung jawab URL owner (peringatan mixed-content ada).

## 16. Final verdict

Kamera UX kanonis PASS (software). Perilaku hardware-dependent = owner.
