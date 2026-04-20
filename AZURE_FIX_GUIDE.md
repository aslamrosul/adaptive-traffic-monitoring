# 🔧 Panduan Memperbaiki Error Azure Cosmos DB

## ❌ Masalah yang Terjadi

Error 401 Unauthorized menunjukkan bahwa **Azure Cosmos DB Key tidak valid atau expired**.

```
Error: The input authorization token can't serve the request. 
The wrong key is being used or the expected payload is not built as per the protocol.
```

## ✅ Solusi Lengkap

### 1. Verifikasi Azure Cosmos DB Key

#### Cara Mendapatkan Key yang Benar:

1. **Login ke Azure Portal**: https://portal.azure.com
2. **Cari Cosmos DB Account**: `traffic-cosmos-slam`
3. **Buka "Keys" di menu sebelah kiri**
4. **Copy Primary Key atau Secondary Key**

#### Update `.env.local`:

```env
# Azure Cosmos DB
AZURE_COSMOS_ENDPOINT=https://traffic-cosmos-slam.documents.azure.com:443/
AZURE_COSMOS_KEY=<PASTE_KEY_BARU_DI_SINI>
AZURE_COSMOS_DATABASE=TrafficDB
```

⚠️ **PENTING**: Setelah update `.env.local`, **restart development server**:

```bash
# Tekan Ctrl+C untuk stop server
# Kemudian jalankan lagi:
npm run dev
```

---

### 2. Verifikasi Database dan Container Sudah Ada

Pastikan database `TrafficDB` dan semua container sudah dibuat di Azure Cosmos DB.

#### Container yang Diperlukan:
- `intersections`
- `traffic_data`
- `analytics_daily`
- `events`
- `reports`
- `notifications`
- `users`
- `device_status`

#### Cara Cek di Azure Portal:

1. Buka Cosmos DB Account: `traffic-cosmos-slam`
2. Klik "Data Explorer"
3. Pastikan database `TrafficDB` ada
4. Pastikan semua container di atas ada

#### Jika Container Belum Ada, Buat Manual:

Di Azure Portal > Data Explorer:
1. Klik "New Container"
2. Database id: `TrafficDB` (pilih existing atau create new)
3. Container id: (nama container, misal `traffic_data`)
4. Partition key: `/id`
5. Klik "OK"

Ulangi untuk semua container yang diperlukan.

---

### 3. Seed Data ke Azure Cosmos DB

Setelah key valid dan container sudah ada, jalankan script untuk mengisi data awal:

```bash
# Seed data awal (intersections, traffic, analytics, events)
npm run db:seed:azure
```

Script ini akan:
- ✅ Membuat 3 persimpangan (intersections)
- ✅ Generate traffic data untuk 24 jam terakhir
- ✅ Generate analytics daily untuk 7 hari terakhir
- ✅ Generate 20 events sample

**Output yang diharapkan:**
```
🚀 Memulai seeding data ke Azure Cosmos DB...

📍 Seeding intersections...
  ✓ Persimpangan Sudirman-Thamrin
  ✓ Persimpangan Gatot Subroto
  ✓ Persimpangan Kuningan

🚗 Seeding traffic data (ini mungkin memakan waktu)...
  Generating 6912 traffic records...
  ✓ Inserted 100/6912
  ✓ Inserted 200/6912
  ...

📊 Seeding daily analytics...
  ✓ 2026-04-20
  ✓ 2026-04-19
  ...

⚠️  Seeding events...
  ✓ Congestion terdeteksi (high)
  ✓ Accident terdeteksi (medium)
  ...

✅ Seeding selesai! Database siap digunakan.
```

---

### 4. Simulasi Data Real-Time

Untuk melihat data bertambah secara real-time di frontend:

```bash
# Jalankan simulasi (akan terus berjalan sampai di-stop)
npm run db:simulate
```

Script ini akan:
- 📡 Mengirim data traffic baru setiap **5 detik**
- 📊 Update daily analytics setiap **1 menit**
- ⚠️ Generate random events secara acak
- 🔄 Data akan otomatis muncul di frontend (auto-refresh)

**Output yang diharapkan:**
```
🚀 Memulai simulasi real-time traffic data...

📡 Mengirim data setiap 5 detik
📊 Update analytics setiap 1 menit
⚠️  Generate random events

════════════════════════════════════════════════════════════

[14:30:15] ✓ Inserted 4 traffic readings:
  🟢 north  | 180 vehicles | 45.2 km/h | moderate
  🟡 south  | 220 vehicles | 38.5 km/h | moderate
  🔴 east   | 280 vehicles | 25.1 km/h | congested
  🟢 west   | 150 vehicles | 52.3 km/h | smooth

🚨 NEW EVENT: Congestion terdeteksi (high)

[14:30:20] ✓ Inserted 4 traffic readings:
  ...
```

**Cara menghentikan simulasi**: Tekan `Ctrl+C`

---

### 5. Verifikasi di Frontend

Setelah data ter-seed dan simulasi berjalan:

1. **Buka browser**: http://localhost:3000
2. **Navigasi ke halaman Analitik**: http://localhost:3000/Analist
3. **Perhatikan**:
   - Chart kepadatan kendaraan akan menampilkan data real
   - Performa Sensor IoT akan update
   - Indeks Kemacetan akan berubah
   - Laporan per jam akan terisi
   - Peringatan kritis akan muncul

4. **Auto-refresh**:
   - Traffic data: refresh setiap **5 detik**
   - Analytics: refresh setiap **1 menit**
   - Events: refresh setiap **10 detik**
   - Intersections: refresh setiap **30 detik**

---

## 🔍 Troubleshooting

### Error: "Module not found: Can't resolve '@azure/cosmos'"

**Solusi**: Install dependencies
```bash
npm install
```

### Error: "AZURE_COSMOS_KEY tidak valid"

**Solusi**: 
1. Periksa key di Azure Portal
2. Copy key yang benar
3. Update `.env.local`
4. Restart server (`Ctrl+C` lalu `npm run dev`)

### Error: "Container not found"

**Solusi**: Buat container di Azure Portal atau jalankan setup script:
```bash
npm run db:setup
```

### Data tidak muncul di frontend

**Solusi**:
1. Cek console browser (F12) untuk error
2. Cek terminal server untuk error API
3. Pastikan simulasi berjalan: `npm run db:simulate`
4. Refresh browser (F5)

### Simulasi terlalu cepat/lambat

**Edit file**: `scripts/simulate-realtime.ts`

Ubah interval:
```typescript
// Dari 5 detik menjadi 10 detik
setInterval(insertTrafficData, 10000); // 10000 = 10 detik

// Dari 1 menit menjadi 30 detik
setInterval(updateDailyAnalytics, 30000); // 30000 = 30 detik
```

---

## 📋 Checklist Lengkap

- [ ] Azure Cosmos DB Key sudah valid di `.env.local`
- [ ] Development server sudah di-restart
- [ ] Database `TrafficDB` sudah ada di Azure
- [ ] Semua container sudah dibuat
- [ ] Data awal sudah di-seed (`npm run db:seed:azure`)
- [ ] Simulasi real-time berjalan (`npm run db:simulate`)
- [ ] Frontend menampilkan data dengan benar
- [ ] Auto-refresh berfungsi

---

## 🎯 Quick Start (Dari Awal)

Jika mulai dari awal, jalankan perintah ini secara berurutan:

```bash
# 1. Install dependencies
npm install

# 2. Update .env.local dengan key yang benar dari Azure Portal
# (Edit manual file .env.local)

# 3. Seed data awal
npm run db:seed:azure

# 4. Start development server (terminal 1)
npm run dev

# 5. Start simulasi real-time (terminal 2 - buka terminal baru)
npm run db:simulate
```

Sekarang buka browser ke http://localhost:3000/Analist dan lihat data real-time!

---

## 📞 Bantuan Lebih Lanjut

Jika masih ada masalah:

1. **Cek log error** di terminal server
2. **Cek console browser** (F12 > Console)
3. **Cek Azure Portal** untuk status Cosmos DB
4. **Cek network tab** di browser untuk melihat API response

Error 401 = Key salah
Error 404 = Container tidak ada
Error 500 = Server error (cek log terminal)
