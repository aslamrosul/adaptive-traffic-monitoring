<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:astraea-project-rules -->
# Aturan Wajib Proyek ASTRAEA (berlaku untuk SEMUA AI & SEMUA sesi)

1. COMMIT + PUSH SETIAP PERUBAHAN: setiap file yang diubah/ditambah (kode, config, docs)
   WAJIB di-`git commit` dan `git push` ke branch yang sama sebelum sesi/pekerjaan selesai.
   Dilarang menumpuk perubahan tanpa push.
2. SECRET & ENV: semua repo kini PRIVATE — file `.env*` WAJIB ikut di-commit+push
   agar config tidak hilang (pengecualian dari aturan umum, berlaku selama repo private).
   DILARANG menjadikan repo ini public. Jangan paste secret di issue/komentar.
3. LOKASI DEPLOY: `/var/www/adaptive-traffic-monitoring` di EC2 `astraea-web-mqtt`
   (ap-southeast-2). Service systemd: `adaptive-traffic` (port 3000, nginx 80/443).
   Variabel `NEXT_PUBLIC_*` tertanam saat build → setiap mengubahnya wajib
   `npm run build` + `systemctl restart adaptive-traffic`.
4. SERVICE TERKAIT: Mosquitto (MQTT 1883 + wss 8089), `traffic-aws-subscriber`
   (repo Thesambala/astraea-subscriber-mqtt), YOLOv8 inference di EC2 `yolov8-server`
   (repo Thesambala/yolov8-server), backup full di aslamrosul/backup-all (PRIVATE).
<!-- END:astraea-project-rules -->
