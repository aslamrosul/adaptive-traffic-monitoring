# FINAL_PWA_REPORT_V6_2_1.md (PWA_CACHE.md)

## 1. HEAD before fix

web `927283b` (clean).

## 2. Exact bug found

`public/sw.js` V6.2 memakai aturan broad same-origin untuk SWR:
request same-origin apa pun (termasuk RSC/prefetch/navigasi dinamis Next)
bisa masuk Cache Storage. Untuk app realtime-terautentikasi ini tidak aman.

## 3. Exact service worker fix

Whitelist eksplisit `isSafeStaticAsset()`: `/_next/static/*`, `/icons/*`,
`logo.png` + 5 SVG public. Fungsi `isNetworkOnly(url, request)`:
path `/api/`, `/_next/data/`, snapshot/stream/detect/ws + header RSC,
Next-Router-Prefetch, Next-Router-State-Tree + Accept `text/x-component`.
Navigasi tetap network-first → `/offline` (HTML tak disimpan).
Satu-satunya `cache.put()` hanya terjangkau dari cabang whitelist
(setelah early-return network-only). Protokol non-http(s) diabaikan (WS utuh).

## 4. Static whitelist

Lihat §3. Disesuaikan dengan isi `public/` aktual.

## 5. Network-only rules

§3 + auth/session/telemetri/notifikasi (tercakup `/api/`),
wss/ws (tercakup guard protokol).

## 6. RSC/prefetch protection

Header + Accept checks di atas; tsc + build lolos.

## 7. Cache version change

`astraea-static-v1` → `astraea-static-v2`; activate hapus versi lama
berprefix sama; cache lain tak disentuh. Precache: offline + 3 ikon.

## 8. Build/test results

tsc exit 0. Tests existing 13/13 PASS. Next build PASS.
Lint repo-wide: 528 error PRE-EXISTING (file V6.2.1: 0 error, 1 warning font
pre-existing di layout). PwaRegister dead-branch disederhanakan.
ThemeColor pindah ke export `viewport` (Next 16).

## 9. Git diff scope

`public/sw.js`, `app/layout.tsx`, `components/PwaRegister.tsx`,
report ini. Tanpa file realtime/core. Tanpa dependensi baru.

## 10. Final verdict

PWA cache aman (software). Verifikasi install/offline di HP = owner.
