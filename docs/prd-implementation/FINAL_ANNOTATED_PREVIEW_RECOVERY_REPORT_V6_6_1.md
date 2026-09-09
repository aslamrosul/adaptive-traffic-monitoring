# FINAL_ANNOTATED_PREVIEW_RECOVERY_REPORT_V6_6_1.md (PROMPT V6.6.1)

## 1. HEAD before work

web `b5409d5` (clean). Yolo/sub/firmware tak disentuh.

## 2. Bug explanation

`AnnotatedPreview`: stage annotated→raw→dead permanen. Tick baru tak me-reset;
raw gagal → null selamanya. Box tak pernah muncul walau Server 2 sudah serve.

## 3. Previous fallback behavior

Sesuai §2. Sekali gagal = mati sampai refresh halaman.

## 4. New retry/recovery behavior

Reset ke annotated tiap siklus cameraId/tick baru (render-adjust, BUKAN effect
agar anti-loop: dependensi siklus, bukan stage). Gagal annotated→raw,
gagal raw→placeholder "Preview sementara tidak tersedia". Tick berikut coba
annotated lagi otomatis.

## 5. Loop-safety explanation

Reset hanya dari perubahan siklus; error handler hanya majukan stage.
Tak ada siklus annotated→raw→annotated dalam satu tick yang sama.

## 6. Files changed

`components/AnnotatedPreview.tsx` (rewrite), `lib/annotated-preview.test.ts`
(baru), dashboard + dashboard2 (hapus Lab UI + machinery YOLO browser,
sim sensor/kanonis, badge kanonis), `vision-lab-7x9k-alpha` (gate admin +
label eksperimental), report ini.

## 7. Tests

annotated-preview 2/2, camera suites 48/48, vision 27, subscriber 10,
tsc 0, build PASS, lint file garapan 0 error (vision-lab 19 pre-existing,
terbukti via stash-compare).

## 8. Build result

Next build PASS (2x). PIO tak dijalankan (firmware tak diubah).

## 9. Regression audit

Diff: AnnotatedPreview, 2 dashboard (kurang ~400 baris YOLO browser),
vision-lab gate, test, report. Tanpa vision/subscriber/iot/sw.js/auth-provider.
Sim animasi jalan dengan telemetri kanonis. Lab WS hanya di /vision-lab (admin).

## 10. Final verdict

Preview recovery + Lab separation PASS (software). Uji klik + HP = owner.
