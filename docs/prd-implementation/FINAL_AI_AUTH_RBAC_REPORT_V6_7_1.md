# FINAL_AI_AUTH_RBAC_REPORT_V6_7_1.md (PROMPT V6.7.1)

Nilai secret tidak ada di laporan ini.

## 1. HEAD before work

web `d84d0a7` (clean). Yolo/sub/firmware tak disentuh.

## 2. AI correctness bugs confirmed

Timeframe rolling disamakan calendar; peak lintas-hari; wording totalFlow;
3-5 diperbaiki + 21/21 tests (kini 26/26 dengan tambahan).

## 3. Timeframe changes

`seminggu terakhir`/`7 hari terakhir` = rolling today-6d (label jujur);
`minggu ini/pekan ini` = Senin-hari ini. Lainnya tetap.

## 4. Peak-hour algorithm changes

Grup per device+lane+TANGGAL WIB; delta kronologis; atribusi ke jam sampel
akhir; reboot aman; tanpa delta lintas hari.

## 5. peakFlow vs totalFlow

`peakFlow` = jam pemenang; `totalFlow` = periode. Template pakai peakFlow.

## 6. Auth root cause

JWT callback hanya isi role saat `user` hadir (login). Refresh berikutnya
tanpa `user` → role lama/hilang → fallback operator.

## 7. Google OAuth role-sync fix

JWT selalu refresh dari Users by email; gagal lookup pertahankan role valid
else operator; inactive → strip ke operator + flag.

## 8. Credentials role-sync verification

Jalur credentials juga lewat DB lookup yang sama (kode, bukan browser).
Live login dua-duanya = owner (akun admin+operator tersedia di DB).

## 9. Session schema before/after

Before: id/role/avatar kadang hilang. After: id/role (admin|operator)/
avatar/userStatus selalu dari token; types `types/next-auth.d.ts` baru.

## 10. RBAC holes found

5 endpoint users TANPA auth (mutasi sebelum logging). normalizeRole
`includes("admin")` permisif. PUT role bisa eskalasi siapa saja.

## 11. /pengguna protection

Halaman 403 non-admin + redirect; nav disembunyikan operator.

## 12. API protection

Auth-first admin-only kelimanya; urutan auth→validasi→mutasi→log.
Strict role (eksak + 2 label lama; lain → 400). Last-admin (409) +
self-delete/demote guard (400).

## 13. Camera-config policy

Tetap admin-only (PUT + UI). Tak dilonggarkan.

## 14. TypeScript augmentation

`types/next-auth.d.ts` (Session/JWT). tsc 0.

## 15. Tests

ai-conversation 26/26. authz 5/5 (401/403/admin/inactive/strict).
Suite lain: camera 8+5+6+4+2, vision 27, subscriber 10 — PASS.

## 16. Build results

tsc 0. Next build PASS. Lint file garapan 0 `any` baru (repo-wide pre-existing
terdokumentasi; 1 hooks-ordering diperbaiki).

## 17. Deployed revision

`/api/version` → commit baru + buildTime (bukan d84d0a7).

## 18. /api/version production response

Tercatat saat verifikasi (commit + buildTime + nextBuildId).

## 19. Production /api/auth/session verification

Butuh login browser owner (tak bisa dari server). Akun uji tersedia:
6 admin aktif + beberapa operator di DB. Instruksi: login Google admin →
cek session role=admin + header Admin; operator → sebaliknya.

## 20. Known limitations

Propagasi role butuh JWT callback jalan (login/session refresh);
logout/login pasti segar. MQTT/SMTP lama + history backup awal tetap
risiko diterima. Reboot S1 belum diuji.

## 21. Final verdict

READY FOR OWNER END-TO-END HARDWARE TEST (software PASS; smoke login = owner).
