# ROLLBACK_PLAN.md

Setiap langkah migrasi dapat dibatalkan independen (data DynamoDB/S3 tidak dihapus):

- Vision baru bermasalah: `ssh astraea-yolo "sudo systemctl stop astraea-vision;
  sudo systemctl enable --now yolov8-http yolov8-bridge"` (file lama masih ada di `~`).
- Subscriber kanonis bermasalah: copy `~/workspace/astraea-subscriber-mqtt` versi
  commit sebelumnya ke `/home/ubuntu/traffic-aws-subscriber`, restart service.
- Web bermasalah: `/var/www` sebelumnya = build GitHub `12c8d89`; checkout commit itu,
  `npm run build`, restart. Env cadangan: `/root/astraea-webenv-backup.env`.
- Firmware bermasalah: flash ulang `esp32-main-sensor-YOLO.cpp` / `esp32cam_stream.ino` lama.
- Mosquitto: blok `astraea/#` di `/etc/mosquitto/acl` bisa dihapus lalu restart.
- Kunci: tidak ada migrasi yang menghapus tabel/bucket; semua penambahan aditif.
