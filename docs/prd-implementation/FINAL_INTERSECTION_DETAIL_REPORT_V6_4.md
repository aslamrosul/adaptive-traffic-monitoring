# FINAL_INTERSECTION_DETAIL_REPORT_V6_4.md (CAM_UI.md)

## 1. HEAD before implementation

web `c5ffc15` (clean). Yolo/sub/firmware tak disentuh.

## 2. Previous Intersection Detail structure

Header + 4 kartu metrik + kartu jalur (volume/durasi/lampu) + panel pedestrian +
events + hapus. Sumber: `useRealtimeTraffic` (adapter) + `useIntersection`.

## 3. Problems identified

- `latency: isOnline ? 14 : 0` (fake), `"12% dari rata-rata"` (fake),
  label algoritma statis, tombol Manual Override tanpa aksi nyata.
- Tak ada seksi kamera/AI, sensor terpisah, rec-vs-effective, vision state,
  umur telemetri, fallback banner, config timing.

## 4. New information architecture

Header → ringkasan → Kamera & AI → Operasi Jalur → Sensor & Controller →
Konfigurasi (+pedestrian) → Events. Sesuai STEP 3.

## 5. Camera registry integration

`IntersectionCameraGrid`: `/api/cameras/live` + display-config, filter
intersection, map by approach_id, polling 4 dtk, preview 4:3 + fullscreen
object-contain, modal config (canonical/mjpeg/hls + URL + save states).

## 6. Camera/AI canonical data source

Registry + live Server 2 + metrik; AiStatusBadge reuse; "-" bila unknown.

## 7. Sensor/controller canonical data source

Telemetri terbaru (kanonis via adapter): controller/MQTT/firmware/fase/
jalur aktif/config + IR/US/distance/level per pendekatan + label semantik.

## 8. Display configuration model

Reuse Cameras `display_*` + API V6.3 (validasi server). Tanpa provisioning
(itu di /cameras). Tanpa token.

## 9. API changes

Nihil (reuse live/display-config/intersections/iot-config PUT).

## 10. Security model

PUT display butuh login; PUT iot butuh sesi (pola existing);
tak ada token/kredensial ke browser; role admin untuk config kamera.

## 11. URL validation

Server-side (V6.3): https/http saja, max 2048, tolak javascript:/data:/file:/blob:,
peringatan mixed-content.

## 12. Recommended vs effective green mapping

Recommended (fuzzy) vs Applied (efektif) terpisah jelas + Abdullah:
rekomendasi ≠ durasi fisik.

## 13. NORMAL/DEGRADED/FALLBACK behavior

Dari `vision_state` telemetri (sumber backend, bukan hitungan frontend);
banner fallback/degraded; UNKNOWN bila tak ada data.

## 14. Responsive UX

Grid 1/2/3 kolom, tanpa pixel fix, aspect 4:3.

## 15. Files changed

`app/persimpangan/[id]/page.tsx` (rewrite seksi),
`components/IntersectionCameraGrid.tsx` (baru),
`lib/traffic-adapter.ts` (field kanonis opsional),
report ini. Tanpa iot/vision/subscriber/sw.js.

## 16. Test/build results

tsc 0. camera tests 23/23. Next build PASS.
Lint file baru/ubah: 0 error (adapter pre-existing tak disentuh).
Manual Override kini PATCH nyata ke iot-config (sukses/gagal jujur).

## 17. Known limitations

Waiting per-jalur "-" hingga telemetri membawa waiting (terdokumentasi;
bukan 0 palsu). Uji login penuh = owner.

## 18. Regression audit

Diff: 3 file + report. Tanpa core. Build+deploy+200 OK semua route,
fatal-errors 0.

## 19. Final verdict

Operations center PASS (software). Uji visual + hardware = owner.
