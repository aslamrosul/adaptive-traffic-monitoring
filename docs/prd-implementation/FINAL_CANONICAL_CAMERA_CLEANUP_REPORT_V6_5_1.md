# FINAL_CANONICAL_CAMERA_CLEANUP_REPORT_V6_5_1.md (PROMPT V6.5.1)

## 1. HEAD before work

web `7f8c2fe` (clean). Yolo/sub/firmware tak disentuh.

## 2. Audit findings

Keempat isu prompt TERBUKTI: (A) default effect tanpa ref guard,
(B) init mjpeg + URL dev (`esp32-cam-stream`, `10.100.122.135`),
(C) grid selalu snapshot kanonis, (D) PUT cek sesi saja.

## 3. One-time default intersection fix

`lib/intersection-select.ts` + `didResolveIntersection` ref di dua dashboard.
Refresh SWR tak lagi menimpa pilihan "Semua Persimpangan".

## 4. All-intersection behavior

Overview global; gear+save mati di all-mode; fetch scoped per intersection.

## 5. Initial camera source cleanup

`camSource` + `camUrls` init canonical/kosong. URL dev lama dihapus dari state
(sisa rujukan fungsional untuk URL custom user tetap: derivasi snapshot YOLO).

## 6. Old default URL cleanup

Init di atas + tak ada default tertulis ke server.

## 7. Dashboard source resolution

`resolveLaneSource` dipakai kedua dashboard (server > registry > lokal).

## 8. Intersection Detail preview source fix

Grid render per `active_source`: canonical/proxy, mjpeg/img, hls/video,
error terisolasi per kartu + label cocok dengan media.

## 9. Canonical/MJPEG/HLS behavior

Sesuai model preset V6.5 (tak berubah).

## 10. Preset preservation regression check

PUT merge + test lama 22/22 tetap PASS.

## 11. Authorization policy found

`/cameras` POST = admin-only. PUT display: session-only (gap).

## 12. API authorization fix

`lib/authz.ts` + PUT kini 401/403; UI sembunyikan Save non-admin.
Tests: 401/403/admin.

## 13. Security review

Tanpa secret di response/kode/laporan. Token server-side. Skema ditolak:
javascript:/data:/file:/blob:.

## 14. Test results

display-config 25/25 (17+8 baru), live 8/8, normalize 5/5, ai-status 6/6,
intersection-select 4/4, vision 27, subscriber 10. tsc 0.
Lint file garapan 0 error (repo-wide pre-existing tak berubah).

## 15. Build result

Next build PASS.

## 16. Files changed

`lib/intersection-select.*`, dashboard + dashboard2 (guard/init/modal/save),
grid (preview per source), PUT route + `lib/authz.ts`, report ini.

## 17. Known limitations

Uji 2-laptop + HP = owner (kasus STEP 28). MJPEG langsung campuran tanggung jawab URL owner.

## 18. Canonical snapshot cadence note

Snapshot periodik ~5 dtk, bukan full-motion stream (keputusan V6.5, dipertahankan).

## 19. Regression audit

Diff: web saja. Tanpa iot/vision/subscriber/sw.js/auth-provider.

## 20. Final verdict

Cleanup kanonis PASS (software). Perilaku hardware-dependent = owner.
