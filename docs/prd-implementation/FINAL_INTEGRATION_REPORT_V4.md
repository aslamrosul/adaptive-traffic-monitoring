# FINAL_INTEGRATION_REPORT_V4.md (PROMPT_FINISHING AF)

Nilai secret tidak ada di laporan ini.

## 1. Current HEAD

- web `ca80a4f` (+V4: report ini) / sub `0896f25` (tak berubah, teruji ulang) /
  yolo `8412c44` (+V4: freshness + waiting + fps/Decimal/mqtt).
- Semua clean sebelum kerja; branch `opencode/final-stale-waiting-v4` (web+yolo);
  sub branch dibuat lalu dihapus (nol perubahan).

## 2. Residual Bugs Verified

Semua 3 TERBUKTI di source: (a) inference loop tanpa seq/age check,
(b) max_wait dari semua still (bukan stopped), (c) still untuk semua kategori.

## 3. Stale Frame Root Cause

`STORE.get` + `HUB.update_inference` tiap siklus tanpa cek kebaruan:
JPEG terakhir diinferensi selamanya, `last_infer_at` segar terus,
`online` tak pernah mati.

## 4. Stale Frame Fix

`FrameStore.seq` monotonik per kamera + `claim_frame(camera_id, max_age_s)`:
hanya seq baru DAN umur frame <= VISION_FRESH_S yang diinferensi.
Latest-frame-only dipertahankan (tanpa antrean; gagal decode = drop).

## 5. Freshness Source of Truth

`online`/`fresh` = umur frame DITERIMA (`STORE.age_s`), bukan inferensi.
Tambahan diagnostik: `connected` (sesi WSS), `frame_age_s`, `inference_fresh`.
`intersection_vision_state()`: NORMAL/DEGRADED/FALLBACK + fresh count.

## 6. Same-Frame Reinference

Terbukti berhenti: klaim kedua untuk seq sama return None (TEST 1),
seq baru dilanjutkan (TEST reconnect). Thread-safe (satu lock).

## 7. Waiting Threshold Fix

`max_wait` kini hanya dari `vehicle_stopped_ids` (>= STILL_MIN_S).
< threshold = stopped false + waiting 0 (TEST D).

## 8. Vehicle-Only Waiting

`still_since`/`cat` hanya untuk category vehicle; person/unmotorized
tetap ditrack (masa depan) tapi tak masuk still/waiting.
TEST A (person 10 dtk + vehicle gerak = 0), TEST B (person 8 vs vehicle 3 → 3),
TEST C (dua vehicle → maks).

## 9. Camera Offline Simulation (live)

- 3 cam streaming: semua online.
- North stop + S/E jalan >15 dtk: north False, S/E True (DEGRADED).
- Semua stop: semua False (FALLBACK); status jujur
  (online False, fresh False, frame_age_s 260.5, connected False).
- Reconnect: online + fps waras kembali (2.7, sebelumnya bug 200-300).

## 10. Tests

| TEST | STATUS | EVIDENCE |
|---|---|---|
| freshness 8 (seq/claim/stale/DEGRADED/FALLBACK/reconnect) | PASS | runner |
| tracking 8 (isolation/hysteresis/wait A-F, monotonik) | PASS | runner |
| mqtt 3 + fuzzy 7 + subscriber 10 | PASS | runner + S2 pytest 27 |
| PIO controller | PASS | SUCCESS |
| PIO cam | PASS | SUCCESS |
| py_compile vision+sub | PASS | exit 0 |

## 11. Performance Sanity (YOLOv8s@640, CPU S2)

Predict: 0.29-0.30s (vs 0.70 @960). Track: ~0.31s (vs ~0.73-1.05 @960).
Siklus 3 kamera ~0.9-1.2 dtk (target ≤2 dtk TERCAPAI; @960 ≈2.3 dtk).
RAM: 576 MB (1 engine) → 897 MB (3 engine); sistem 1.6/7.6 GB.
CPU ~28% saat sim. Tanpa backlog (latest-only + claim).
Keputusan: 640 DIPERTAHANKAN (train size + VGA native).

## 12. PlatformIO

Keduanya SUCCESS (firmware tak diubah round ini; verifikasi Z).

## 13. Deployment

Hanya astraea-vision (restart, active, model 640 loaded, MQTT ok).
Subscriber/web/mosquitto/nginx TIDAK direstart (tak berubah).

## 14. Service Health

health-all 7/7 OK (verifikasi akhir). Traceback vision: 0.

## 15. Files Changed

yolo: frame_store, metrics, tracking, main (waiting_actual), camera_ingest
(connected+F9 sudah), stream (frame_age_s), tests (freshness + O),
.env.example (baru). web: report ini. sub: nihil.

## 16. Git SHAs

Merge --no-ff ke main + push (tanpa force). SHA final menyusul di log.

## 17. Hardware Tests Pending

R checklist + AI checklist (PHASE 1-9) menunggu owner + hardware fisik.

## 18. Final Verdict

READY FOR PHYSICAL HARDWARE TEST. REAL HARDWARE TEST = PENDING OWNER.
