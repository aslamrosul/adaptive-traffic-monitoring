# 🚀 Quick Start - Adaptive Traffic Monitoring

## Setup dalam 5 Menit

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy file `.env.local.example` ke `.env.local`:

```bash
cp .env.local.example .env.local
```

Credentials Azure sudah ada di `.env.local` (sudah dikonfigurasi).

### 3. Seed Database dengan Sample Data

```bash
npm run db:seed:all
```

Script ini akan:

- ✅ Seed 5 persimpangan
- ✅ Seed data lalu lintas 24 jam
- ✅ Seed 10 kejadian/alert

### 4. Jalankan Development Server

```bash
npm run dev
```

### 5. Buka Aplikasi

- **Dashboard**: http://localhost:3000
- **Daftar Persimpangan**: http://localhost:3000/persimpangan
- **Detail Persimpangan**: http://localhost:3000/persimpangan/int_001

---

## 📊 Sample Data

Setelah seeding, Anda akan memiliki:

### 5 Persimpangan

1. **int_001** - Persimpangan Thamrin-Sudirman (Active)
2. **int_002** - Persimpangan Kuningan-Rasuna Said (Active)
3. **int_003** - Persimpangan Gatot Subroto (Active, Manual Mode)
4. **int_004** - Persimpangan Imam Bonjol (Inactive)
5. **int_005** - Persimpangan Senayan (Maintenance)

### Data Lalu Lintas

- 24 jam data untuk 3 persimpangan aktif
- 4 arah per persimpangan (Utara, Timur, Selatan, Barat)
- Total: ~288 data points

### 10 Kejadian/Alert

- Anomali IoT
- Penyesuaian Fase
- Kendaraan Prioritas
- Manual Override
- Maintenance
- Kemacetan

---

## 🔄 Auto-Refresh

Semua data auto-refresh dari Azure Cosmos DB:

- **Daftar Persimpangan**: 30 detik
- **Detail Persimpangan**: 10 detik
- **Traffic Data**: 5 detik
- **Events**: 15 detik

---

## 🎯 Fitur Utama

### Halaman Daftar Persimpangan

✅ Stats overview (Total, Aktif, Maintenance, Tidak Aktif)
✅ Search persimpangan
✅ Grid cards dengan info lengkap
✅ Click to detail

### Halaman Detail Persimpangan

✅ Metrics real-time (Volume, Kemacetan, Cycle Time, Status)
✅ Lane controls dengan traffic light
✅ Visualisasi persimpangan
✅ Event log table
✅ Manual override button

---

## 🔧 Commands

```bash
# Development
npm run dev                    # Start dev server

# Database Seeding
npm run db:seed:all           # Seed semua data
npm run db:seed:intersections # Seed persimpangan saja
npm run db:seed:traffic       # Seed traffic data saja
npm run db:seed:events        # Seed events saja

# Testing
npm run test:api              # Test API endpoints
```

---

## 📚 Documentation

- **AZURE_INTEGRATION_COMPLETE.md** - Panduan lengkap integrasi Azure
- **CLOUD_INTEGRATION_GUIDE.md** - Panduan koneksi cloud
- **API_DOCUMENTATION.md** - Dokumentasi API

---

## ✅ Checklist

- [x] Install dependencies
- [x] Setup .env.local
- [x] Seed database
- [x] Start dev server
- [x] Test halaman persimpangan
- [x] Verify data di Azure Portal

---

## 🎉 Done!

Backend sudah 100% terhubung dengan Azure Cloud!

Sekarang Anda bisa:

1. Lihat daftar persimpangan
2. Click detail persimpangan
3. Lihat data real-time
4. Monitor traffic & events

Happy coding! 🚀
