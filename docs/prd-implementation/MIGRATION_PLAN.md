# MIGRATION_PLAN.md

Urutan migrasi yang sudah/akan dijalankan (tanpa mematikan yang jalan):

1. ✅ Audit + bastion (`ssh astraea-yolo`, SG22, `/opt/astraea-ops`).
2. ✅ Tabel `Cameras`; subscriber dukung topik kanonis + vision sampled.
3. ✅ `astraea-vision-service` gantikan `yolov8-http` + `yolov8-bridge`
   (`yolov8-ws` :8080 dipertahankan sementara untuk Vision Lab).
4. Firmware: flash `astraea-controller-v2.cpp` (kompatibel pin/LED v1),
   lalu `astraea-cam-v1.ino` per kamera setelah provisioning token.
5. UI: halaman Kamera + pedestrian + panduan (sudah deploy).
6. Berikutnya (butuh DNS `vision.astraea.my.id` → 54.253.237.179):
   nginx 443 + WSS di Server 2, kamera beralih ke `wss://vision.astraea.my.id`.
7. Pensiunkan `yolov8-ws` setelah Vision Lab pakai endpoint baru;
   tutup port publik 8080/8081/1883 Server 2 (sisakan 443).
8. S3 tetap layout lama (kompat Hadoop); evaluasi partisi `intersection=` terpisah.
