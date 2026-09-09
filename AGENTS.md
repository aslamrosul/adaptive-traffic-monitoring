<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:astraea-project-rules -->
# Aturan Wajib Proyek ASTRAEA (berlaku untuk SEMUA AI & SEMUA sesi)

1. AUTO-FLOW WAJIB HABIS UBAH → BUILD → COMMIT → PUSH → DEPLOY: setiap file
   yang diubah/ditambah (kode, config, docs) WAJIB melewati alur ini sebelum
   sesi/pekerjaan selesai. Dilarang menumpuk perubahan tanpa push/deploy.
   a. Uji: `npx tsc --noEmit` + test relevan (`npx tsx --test lib/...`).
   b. Build: `npm run build` (di box 3.8GB ini pakai
      `NODE_OPTIONS='--max-old-space-size=2560' npx next build` bila OOM).
   c. Bila build SUKSES → langsung `git commit` + `git push` (remote default,
      tanpa token) — JANGAN tunda, JANGAN tanya dulu.
   d. Bila build GAGAL → perbaiki dulu, JANGAN commit/push/deploy.
   e. Deploy web: rsync aman ke `/var/www/adaptive-traffic-monitoring`,
      `npm run build` di sana, `sudo systemctl restart adaptive-traffic`,
      verifikasi `systemctl is-active` + `/api/version` = commit baru.
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
5. AUTO-PUSH + AUTO-DEPLOY (tanpa diminta ulang): server ini adalah EC2 produksi
   sekaligus mesin kerja (`~/workspace/adaptive-traffic-monitoring` + deploy key
   SSH, `git push` langsung tanpa token). Setiap selesai mengubah file:
   commit → push → sync deploy → build → restart → verifikasi, OTOMATIS.
   SYNC AMAN (PENTING): rsync TANPA --delete dan JANGAN menyentuh env —
   `/var/www/.env.local` produksi tidak ada di repo. Selalu:
   `rsync -a --exclude .git --exclude node_modules --exclude .next --exclude ".env*.local"`,
   lalu verifikasi `.env.local` masih ada sebelum restart service.
   `.deploy-info.json` milik root → update pakai sudo agar `/api/version`
   menampilkan commit baru.
<!-- END:astraea-project-rules -->
