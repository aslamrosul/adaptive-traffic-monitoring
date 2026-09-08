# FINAL_PWA_REPORT_V6_2.md (PWA.md)

## 1. HEAD before

web `be8f8d7` (clean). Yolo/subscriber/firmware tak disentuh.

## 2. Files added

`app/manifest.ts`, `app/offline/page.tsx` ("Coba Lagi", tanpa data palsu),
`components/PwaRegister.tsx` (production-only, gagal diam-diam),
`public/sw.js`, `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
(dari `public/logo.png` 1024 via sharp yang sudah ada; maskable + safe-zone putih).

## 3. Files modified

`app/layout.tsx` (metadata + PwaRegister; provider tree utuh).

## 4. PWA architecture

Manifest route Next (`/manifest.webmanifest`) + SW kustom tanpa dependensi baru +
registrasi production-only + offline shell. Tanpa next-pwa.

## 5. Manifest configuration

name/short/desc ASTRAEA, start_url+scope `/`, standalone, orientasi any,
lang id, bg `#ffffff`, theme `#0056d2` (primer tema), 3 ikon terverifikasi ada.

## 6. Service worker caching policy

Navigasi: network-first → fallback `/offline`. Aset statis same-origin:
stale-while-revalidate. API/realtime: NETWORK ONLY. Versi cache
`astraea-static-v1`; activate hapus versi lama ASTRAEA saja;
skipWaiting + clients.claim.

## 7. Routes/resources NOT cached

`/api/*` (termasuk auth/cameras), `/_next/data/`, snapshot/stream/detect/ws,
`wss://*`/`ws://*` (non-HTTP diabaikan), HTML dinamis, localStorage/session,
telemetri/notifikasi. Satu-satunya `cache.put` di cabang aset-statis
same-origin yang sudah lolos filter network-only.

## 8. Offline behavior

`/offline` 200: pesan offline + tombol Coba Lagi (reload). Tanpa data palsu,
tanpa status basi.

## 9. Installability verification

HTTPS + manifest valid + 192/512 (+maskable) + display standalone +
theme/bg + sw.js 200 (`application/javascript`). Registrasi terjadi di
production via PwaRegister (verifikasi end-device = owner; tak ada popup custom).

## 10. Build/test results

tsc exit 0 (1 fix: import react). Tests existing 13/13 PASS. Next build PASS.
PIO tak dijalankan (firmware tak diubah, sesuai scope).

## 11. Regression audit

Login 200, dashboard 200, cameras 200, api-live 401 tanpa sesi (benar),
fatal-errors 0. MQTT/WS/API tak tersentuh. Realtime/dashboard/auth/kamera
tidak berubah perilaku saat online.

## 12. Known limitations

Install prompt & standalone akhir tergantung browser/HP owner.
MJPEG tidak di-cache (by design). Maskable digenerate lokal (bukan desainer).

## 13. Final verdict

PWA shell PASS (software). Verifikasi install di HP = owner.
