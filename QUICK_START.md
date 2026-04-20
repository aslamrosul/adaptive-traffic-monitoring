# 🚀 Quick Start Guide - Adaptive Traffic Monitoring

## 📋 Prerequisites

- Node.js 18+ installed
- Azure Cosmos DB account (sudah ada: `traffic-cosmos-slam`)
- Access ke Azure Portal untuk mendapatkan Cosmos DB key

---

## ⚡ Quick Start (5 Menit)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Azure Credentials

Edit file `.env.local` dan pastikan `AZURE_COSMOS_KEY` benar:

```env
AZURE_COSMOS_ENDPOINT=https://traffic-cosmos-slam.documents.azure.com:443/
AZURE_COSMOS_KEY=<PASTE_KEY_DARI_AZURE_PORTAL>
AZURE_COSMOS_DATABASE=TrafficDB
```

**Cara mendapatkan key:**
1. Login ke https://portal.azure.com
2. Cari "traffic-cosmos-slam"
3. Klik "Keys" di sidebar
4. Copy "Primary Key" atau "Secondary Key"
5. Paste ke `.env.local`

### 3. Test Koneksi Azure

```bash
npm run db:test
```

**Output yang diharapkan:**
```
✅ Connected to database: TrafficDB
✅ All containers exist
✅ Query successful
```

**Jika error 401:**
- Key salah → Update `.env.local` dengan key yang benar
- Restart terminal setelah update

### 4. Seed Data Awal

```bash
npm run db:seed:azure
```

Ini akan mengisi database dengan:
- 3 persimpangan (intersections)
- ~7000 traffic data records (24 jam)
- 7 hari analytics data
- 20 sample events

**Durasi:** ~2-3 menit

### 5. Start Development Server

```bash
npm run dev
```

Buka browser: http://localhost:3000

### 6. Start Real-Time Simulation (Optional)

Buka **terminal baru** (jangan tutup terminal server):

```bash
npm run db:simulate
```

Ini akan:
- 📡 Insert traffic data baru setiap 5 detik
- 📊 Update analytics setiap 1 menit
- ⚠️ Generate random events
- 🔄 Frontend akan auto-refresh dan menampilkan perubahan

**Cara stop:** Tekan `Ctrl+C`

---

## 🎯 Halaman yang Tersedia

| URL | Deskripsi | Status |
|-----|-----------|--------|
| `/` | Dashboard utama | ✅ Complete |
| `/Analist` | **Halaman Analytics** | ✅ Complete |
| `/persimpangan` | Daftar persimpangan | ✅ Complete |
| `/persimpangan/[id]` | Detail persimpangan | ✅ Complete |
| `/laporan` | Laporan | ✅ Complete |
| `/notifikasi` | Notifikasi | ✅ Complete |
| `/pengguna` | Manajemen user | ✅ Complete |
| `/profile` | Profile user | ✅ Complete |
| `/peta` | Peta traffic | ✅ Complete |
| `/tim` | Halaman tim | ✅ Complete |

---

## 📊 Halaman Analytics (`/Analist`)

Halaman ini menampilkan:

### 1. **Analisis Kepadatan Kendaraan** (Chart Utama)
- Bar chart mingguan per jalur (Utara, Timur, Barat, Selatan)
- Filter berdasarkan persimpangan dan jalur
- Data dari `analytics_daily` container

### 2. **Performa Sensor IoT**
- Akurasi deteksi kepadatan
- Jumlah perangkat aktif
- Progress bar visual

### 3. **Indeks Kemacetan**
- Circular progress indicator
- Status: Lancar / Moderat / Padat / Macet
- Perbandingan dengan hari sebelumnya

### 4. **Laporan Kepadatan Per Jam**
- Heatmap 24 jam
- Intensitas warna berdasarkan kepadatan
- Highlight jam puncak

### 5. **Peringatan Kritis Lalu Lintas**
- List events dengan prioritas
- Real-time updates
- Filter berdasarkan status

### 6. **Wawasan Strategis IoT**
- Prediksi dan rekomendasi
- Action button untuk apply konfigurasi

---

## 🔄 Auto-Refresh Intervals

| Data | Refresh Interval | Hook |
|------|------------------|------|
| Traffic Real-time | 5 detik | `useRealtimeTraffic` |
| Events | 10 detik | `useEvents` |
| Intersections | 30 detik | `useIntersections` |
| Analytics Daily | 1 menit | `useAnalytics` |

Semua menggunakan **SWR** untuk caching dan auto-revalidation.

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:test` | Test Azure connection |
| `npm run db:seed:azure` | Seed initial data |
| `npm run db:simulate` | Start real-time simulation |

---

## 🔍 Troubleshooting

### ❌ Error 401: Unauthorized

**Penyebab:** Azure Cosmos DB key salah atau expired

**Solusi:**
1. Dapatkan key baru dari Azure Portal
2. Update `.env.local`
3. Restart server (`Ctrl+C` lalu `npm run dev`)

### ❌ Error 404: Container not found

**Penyebab:** Container belum dibuat di Azure

**Solusi:**
```bash
npm run db:seed:azure
```

### ❌ Data tidak muncul di frontend

**Solusi:**
1. Cek console browser (F12) untuk error
2. Cek terminal server untuk error API
3. Pastikan data sudah di-seed: `npm run db:test`
4. Refresh browser (F5)

### ❌ Module not found: @azure/cosmos

**Solusi:**
```bash
npm install
```

---

## 📁 Struktur Project

```
adaptive-traffic-monitoring/
├── app/
│   ├── Analist/              # 📊 Halaman Analytics
│   │   └── page.tsx
│   ├── api/                  # API Routes
│   │   ├── analytics/
│   │   ├── traffic/
│   │   ├── events/
│   │   └── intersections/
│   └── ...
├── components/               # React Components
├── lib/
│   ├── azure-cosmos.ts      # Azure Cosmos DB client
│   ├── hooks/
│   │   └── useAnalytics.ts  # SWR hooks
│   └── utils/
│       └── analytics.ts     # Analytics utilities
├── scripts/
│   ├── seed-azure-data.ts   # Seed script
│   ├── simulate-realtime.ts # Real-time simulation
│   └── test-azure-connection.ts
├── .env.local               # Environment variables
└── package.json
```

---

## 🎨 Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **State:** SWR (data fetching), Zustand
- **Backend:** Next.js API Routes
- **Database:** Azure Cosmos DB (NoSQL)
- **Charts:** Recharts
- **Notifications:** React Hot Toast

---

## 📝 Environment Variables

```env
# Azure Cosmos DB (REQUIRED)
AZURE_COSMOS_ENDPOINT=https://traffic-cosmos-slam.documents.azure.com:443/
AZURE_COSMOS_KEY=<YOUR_KEY_HERE>
AZURE_COSMOS_DATABASE=TrafficDB

# Azure Storage (Optional - untuk data lake)
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_ACCOUNT=trafficdatalakeslam
AZURE_STORAGE_CONTAINER=processed-data

# Azure IoT Hub (Optional - untuk ESP32)
AZURE_IOT_HUB_NAME=traffic-iot-slam
ESP32_LANE_NORTH=...
ESP32_LANE_SOUTH=...
ESP32_LANE_EAST=...
ESP32_LANE_WEST=...

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
NODE_ENV=development
```

---

## 🚀 Production Deployment

### Build

```bash
npm run build
```

### Start

```bash
npm run start
```

### Environment

Pastikan semua environment variables sudah di-set di production environment.

---

## 📞 Support

Jika ada masalah:

1. **Cek dokumentasi:** `AZURE_FIX_GUIDE.md`
2. **Test koneksi:** `npm run db:test`
3. **Cek logs:** Terminal server dan browser console
4. **Cek Azure Portal:** Status Cosmos DB

---

## ✅ Checklist Deployment

- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` configured dengan key yang benar
- [ ] Azure connection tested (`npm run db:test`)
- [ ] Data seeded (`npm run db:seed:azure`)
- [ ] Development server running (`npm run dev`)
- [ ] Frontend accessible (http://localhost:3000)
- [ ] Analytics page working (http://localhost:3000/Analist)
- [ ] Real-time simulation running (optional: `npm run db:simulate`)

---

**🎉 Selamat! Project sudah siap digunakan.**

Buka http://localhost:3000/Analist untuk melihat halaman analytics dengan data real-time!
