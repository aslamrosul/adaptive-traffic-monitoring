# 🚀 Panduan Lengkap Integrasi Azure - Adaptive Traffic Monitoring

## 📋 Overview

Sistem monitoring lalu lintas adaptif ini sekarang **100% terintegrasi dengan Azure Cosmos DB**. Semua halaman menggunakan data real-time dari cloud.

---

## ✅ Yang Sudah Dikerjakan

### 1. **Library Hooks untuk Azure Connection**

Dibuat custom hooks menggunakan SWR untuk auto-refresh data:

- ✅ `lib/hooks/useIntersections.ts` - Fetch data persimpangan
- ✅ `lib/hooks/useTraffic.ts` - Fetch data lalu lintas real-time
- ✅ `lib/hooks/useAnalytics.ts` - Fetch data analitik
- ✅ `lib/hooks/useEvents.ts` - Fetch data kejadian/alert

### 2. **Update Halaman Persimpangan**

#### **Halaman Daftar Persimpangan** (`app/persimpangan/page.tsx`)

- ✅ Menggunakan `useIntersections()` hook
- ✅ Menampilkan data dari Azure Cosmos DB
- ✅ Fitur pencarian persimpangan
- ✅ Stats overview (Total, Aktif, Maintenance, Tidak Aktif)
- ✅ Grid card untuk setiap persimpangan
- ✅ Loading state & error handling
- ✅ Click to detail page

#### **Halaman Detail Persimpangan** (`app/persimpangan/[id]/page.tsx`)

- ✅ Menggunakan `useIntersection(id)` hook
- ✅ Menggunakan `useRealtimeTraffic(id)` hook
- ✅ Menggunakan `useEvents(id)` hook
- ✅ Menampilkan data real-time dari Azure
- ✅ Visualisasi persimpangan dengan traffic light
- ✅ Metrics (Volume, Kemacetan, Cycle Time, Status)
- ✅ Lane controls dengan data real-time
- ✅ Event log table
- ✅ Loading state & error handling

### 3. **Scripts untuk Seeding Data**

Dibuat scripts untuk populate database dengan sample data:

- ✅ `scripts/seed-intersections.ts` - Seed 5 persimpangan
- ✅ `scripts/seed-traffic-data.ts` - Seed data lalu lintas 24 jam
- ✅ `scripts/seed-events.ts` - Seed 10 kejadian/alert
- ✅ `scripts/seed-all.ts` - Run semua seeding sekaligus

### 4. **NPM Scripts**

Ditambahkan ke `package.json`:

```json
{
  "db:seed:intersections": "tsx scripts/seed-intersections.ts",
  "db:seed:traffic": "tsx scripts/seed-traffic-data.ts",
  "db:seed:events": "tsx scripts/seed-events.ts",
  "db:seed:all": "tsx scripts/seed-all.ts"
}
```

---

## 🚀 Cara Menggunakan

### 1. **Setup Environment Variables**

Pastikan `.env.local` sudah berisi credentials Azure:

```env
# Azure Cosmos DB
AZURE_COSMOS_ENDPOINT=https://traffic-cosmos-slam.documents.azure.com:443/
AZURE_COSMOS_KEY=your-cosmos-key-here
AZURE_COSMOS_DATABASE=TrafficDB

# Azure Storage (Data Lake)
AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string
AZURE_STORAGE_ACCOUNT=trafficdatalakeslam
AZURE_STORAGE_CONTAINER=processed-data

# Azure IoT Hub
AZURE_IOT_HUB_NAME=traffic-iot-slam
```

### 2. **Install Dependencies**

```bash
npm install
```

### 3. **Seed Database dengan Sample Data**

```bash
# Seed semua data sekaligus
npm run db:seed:all

# Atau seed satu per satu
npm run db:seed:intersections
npm run db:seed:traffic
npm run db:seed:events
```

### 4. **Jalankan Development Server**

```bash
npm run dev
```

### 5. **Akses Aplikasi**

Buka browser dan akses:

- **Dashboard**: http://localhost:3000
- **Daftar Persimpangan**: http://localhost:3000/persimpangan
- **Detail Persimpangan**: http://localhost:3000/persimpangan/int_001

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  - app/persimpangan/page.tsx                               │
│  - app/persimpangan/[id]/page.tsx                          │
└────────────────────┬────────────────────────────────────────┘
                     │ useIntersections(), useTraffic(), etc.
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Custom Hooks (SWR)                         │
│  - lib/hooks/useIntersections.ts                           │
│  - lib/hooks/useTraffic.ts                                 │
│  - lib/hooks/useEvents.ts                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Requests (auto-refresh)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  API Routes (Next.js)                       │
│  - /api/intersections                                       │
│  - /api/intersections/[id]                                  │
│  - /api/traffic/realtime                                    │
│  - /api/events                                              │
└────────────────────┬────────────────────────────────────────┘
                     │ Azure SDK
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Azure Cosmos Client                            │
│  - lib/azure-cosmos.ts                                      │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Azure Cosmos DB (Cloud)                        │
│  Database: TrafficDB                                        │
│  - intersections                                            │
│  - traffic_data                                             │
│  - events                                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Auto-Refresh Configuration

Setiap hook memiliki auto-refresh interval yang berbeda:

| Hook                   | Refresh Interval | Use Case                   |
| ---------------------- | ---------------- | -------------------------- |
| `useIntersections()`   | 30 detik         | Daftar persimpangan        |
| `useIntersection(id)`  | 10 detik         | Detail persimpangan        |
| `useRealtimeTraffic()` | 5 detik          | Data lalu lintas real-time |
| `useEvents()`          | 15 detik         | Kejadian/alert             |
| `useAnalytics()`       | 60 detik         | Data analitik              |

---

## 📝 Sample Data yang Di-seed

### Intersections (5 persimpangan)

1. **int_001** - Persimpangan Thamrin-Sudirman (Active)
2. **int_002** - Persimpangan Kuningan-Rasuna Said (Active)
3. **int_003** - Persimpangan Gatot Subroto (Active, Manual Mode)
4. **int_004** - Persimpangan Imam Bonjol (Inactive)
5. **int_005** - Persimpangan Senayan (Maintenance)

### Traffic Data

- 24 jam data untuk setiap persimpangan
- 4 arah (north, east, south, west)
- Data: vehicleCount, speed, density, congestionIndex

### Events (10 kejadian)

- Anomali IoT
- Penyesuaian Fase
- Kendaraan Prioritas
- Manual Override
- Maintenance
- Kemacetan

---

## 🎯 Fitur Halaman Persimpangan

### Halaman Daftar

✅ **Stats Overview**

- Total Persimpangan
- Status Aktif
- Maintenance
- Tidak Aktif

✅ **Search & Filter**

- Pencarian berdasarkan nama atau alamat

✅ **Grid Cards**

- Nama persimpangan
- Alamat
- Status badge (Active/Maintenance/Inactive)
- Device ID
- Jumlah jalur
- Tanggal update
- Button detail

✅ **Loading & Error States**

- Skeleton loading
- Error message dengan retry

### Halaman Detail

✅ **Top Metrics**

- Total Kendaraan/Jam
- Indeks Kemacetan
- Waktu Siklus Aktif
- Status Perangkat

✅ **Lane Controls**

- 4 jalur (Utara, Timur, Selatan, Barat)
- Volume kendaraan real-time
- Durasi lampu
- Traffic light visualization
- Status aktif/standby

✅ **Intersection Visualization**

- Visual persimpangan dengan jalan
- Traffic light indicators
- Flow indicators (aktif/siaga)
- CCTV feed overlay
- AI Analysis status

✅ **Action Bar**

- Metode sinkronisasi
- Update terakhir
- Button: Unduh Laporan
- Button: Konfigurasi Jalur
- Button: Manual Override

✅ **Event Log Table**

- Waktu kejadian
- Tipe kejadian
- Deskripsi
- Priority badge (LOW/INFO/CRITICAL)
- Status

---

## 🔧 Troubleshooting

### Issue: "Azure Cosmos DB credentials not configured"

**Solution:**

```bash
# Pastikan .env.local ada dan berisi credentials
cat .env.local

# Restart dev server
npm run dev
```

### Issue: "Failed to fetch intersections"

**Solution:**

1. Check API endpoint: http://localhost:3000/api/intersections
2. Verify data ada di Cosmos DB (Azure Portal → Data Explorer)
3. Check browser console untuk error
4. Run seeding script: `npm run db:seed:all`

### Issue: "No data displayed"

**Solution:**

1. Open browser DevTools → Network tab
2. Check API responses
3. Verify data structure
4. Check console for errors
5. Run: `npm run db:seed:all`

---

## 📚 API Endpoints

### GET /api/intersections

Fetch semua persimpangan

**Response:**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "int_001",
      "name": "Persimpangan Thamrin-Sudirman",
      "address": "Jl. Thamrin - Jl. Sudirman, Jakarta Pusat",
      "status": "active",
      "deviceId": "ESP32_001",
      "lanes": { "count": 4, "directions": [...] },
      "config": { ... },
      "createdAt": "2026-04-20T...",
      "updatedAt": "2026-04-20T..."
    }
  ]
}
```

### GET /api/intersections/[id]

Fetch detail persimpangan

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "int_001",
    "name": "Persimpangan Thamrin-Sudirman",
    ...
  }
}
```

### GET /api/traffic/realtime?intersectionId=int_001&limit=100

Fetch data lalu lintas real-time

**Response:**

```json
{
  "success": true,
  "count": 100,
  "data": [
    {
      "id": "...",
      "intersectionId": "int_001",
      "deviceId": "ESP32_001_north",
      "timestamp": "2026-04-20T...",
      "vehicleCount": 245,
      "speed": 35,
      "density": 24.5,
      "congestionIndex": 62,
      "direction": "north",
      "laneId": "lane_north"
    }
  ]
}
```

### GET /api/events?intersectionId=int_001&limit=50

Fetch kejadian/alert

**Response:**

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "evt_001",
      "intersectionId": "int_001",
      "title": "Anomali IoT Terdeteksi",
      "description": "...",
      "type": "alert",
      "priority": "low",
      "status": "resolved",
      "timestamp": "2026-04-20T...",
      "resolvedAt": "2026-04-20T...",
      "createdBy": "system"
    }
  ]
}
```

---

## 🎉 Summary

### ✅ Completed

1. **Library Hooks** - Custom hooks dengan SWR untuk auto-refresh
2. **Halaman Persimpangan** - Daftar & detail menggunakan data Azure
3. **Seeding Scripts** - Scripts untuk populate database
4. **NPM Scripts** - Commands untuk seeding
5. **Documentation** - Panduan lengkap integrasi

### 🚀 Next Steps

1. **Jalankan seeding**: `npm run db:seed:all`
2. **Start dev server**: `npm run dev`
3. **Test halaman persimpangan**: http://localhost:3000/persimpangan
4. **Verify data di Azure Portal** → Data Explorer

### 📊 Data Real-time

Semua halaman sekarang menggunakan data real-time dari Azure Cosmos DB dengan auto-refresh:

- ✅ Daftar persimpangan auto-refresh setiap 30 detik
- ✅ Detail persimpangan auto-refresh setiap 10 detik
- ✅ Traffic data auto-refresh setiap 5 detik
- ✅ Events auto-refresh setiap 15 detik

**Backend sudah 100% terhubung dengan Azure Cloud! 🎉**

---

## 📞 Support

Jika ada masalah:

1. Check `.env.local` credentials
2. Verify Azure Cosmos DB di portal
3. Run `npm run db:seed:all`
4. Check browser console & network tab
5. Restart dev server

Happy coding! 🚀
