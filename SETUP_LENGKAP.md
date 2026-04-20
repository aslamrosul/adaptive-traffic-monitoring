# 🚀 Panduan Setup Lengkap - Adaptive Traffic Monitoring System

Panduan lengkap untuk menghubungkan backend dengan Azure Cosmos DB dan menjalankan aplikasi.

## 📋 Prerequisites

- Node.js 20+ terinstall
- Azure account dengan Cosmos DB sudah dibuat
- Git terinstall
- PowerShell (untuk Windows) atau Bash (untuk Linux/Mac)

## 🔧 Langkah 1: Clone Repository

```bash
git clone <repository-url>
cd adaptive-traffic-monitoring
```

## 📦 Langkah 2: Install Dependencies

```bash
npm install
```

## 🔐 Langkah 3: Konfigurasi Environment Variables

### 3.1 Dapatkan Credentials dari Azure Portal

1. Buka [Azure Portal](https://portal.azure.com)
2. Cari Cosmos DB account Anda: `traffic-cosmos-slam`
3. Di menu kiri, klik **Keys**
4. Copy:
   - **URI** → untuk `AZURE_COSMOS_ENDPOINT`
   - **PRIMARY KEY** → untuk `AZURE_COSMOS_KEY`

### 3.2 Buat File `.env.local`

Copy file `.env.local.example` menjadi `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` dan isi dengan credentials Anda:

```env
AZURE_COSMOS_ENDPOINT=https://traffic-cosmos-slam.documents.azure.com:443/
AZURE_COSMOS_KEY=<paste-your-primary-key-here>
AZURE_COSMOS_DATABASE=TrafficDB
```

**PENTING:** Jangan commit file `.env.local` ke Git! File ini sudah ada di `.gitignore`.

## 🗄️ Langkah 4: Setup Database

### 4.1 Buat Collections di Cosmos DB

```bash
npm run db:setup
```

Script ini akan membuat:
- Database: `TrafficDB`
- Collections: `users`, `intersections`, `traffic_data`, `events`, `reports`, `notifications`, `device_status`, `analytics_daily`

### 4.2 Seed Data Awal

```bash
npm run db:seed
```

Script ini akan mengisi database dengan:
- 3 Users (1 admin, 2 operator)
- 4 Intersections (Tugu Tani, Bundaran HI, Semanggi, Kuningan)
- 3 Reports (sample laporan)
- 2 Notifications (sample notifikasi)
- 17 FAQs
- 5 Guides

### 4.3 Atau Jalankan Sekaligus

```bash
npm run db:init
```

## ✅ Langkah 5: Verifikasi Setup

### 5.1 Cek di Azure Data Explorer

1. Buka Azure Portal
2. Navigate ke Cosmos DB: `traffic-cosmos-slam`
3. Klik **Data Explorer**
4. Expand `TrafficDB`
5. Lihat collections dan data yang sudah dibuat

### 5.2 Test API Endpoints

Start development server:

```bash
npm run dev
```

Di terminal lain, test API:

```powershell
# PowerShell
.\scripts\test-api.ps1

# Atau manual dengan curl
curl http://localhost:3000/api/health
curl http://localhost:3000/api/users
curl http://localhost:3000/api/intersections
```

## 🌐 Langkah 6: Akses Aplikasi

Buka browser dan akses:

```
http://localhost:3000
```

### Halaman yang Tersedia:

1. **Dashboard** (`/`) - Overview sistem
2. **Manajemen Pengguna** (`/pengguna`) - CRUD users
3. **Peta Simpangan** (`/peta`) - Map view intersections
4. **Persimpangan** (`/persimpangan`) - List & detail intersections
5. **Laporan** (`/laporan`) - Reports management
6. **Notifikasi** (`/notifikasi`) - Notifications
7. **Analitik** (`/Analist`) - **BARU! Dengan data real dari Azure**
8. **Profile** (`/profile`) - User profile & settings
9. **Tim** (`/tim`) - Team information

## 📊 Langkah 7: Test Halaman Analitik

Halaman analitik sekarang terhubung dengan data real dari Azure Cosmos DB:

### Fitur yang Tersedia:

✅ **Filter Persimpangan** - Pilih persimpangan spesifik atau semua
✅ **Filter Jalur** - Filter berdasarkan arah (Utara, Timur, Barat, Selatan)
✅ **Data Real-time** - Auto-refresh setiap 5 detik
✅ **Statistik Mingguan** - Visualisasi kepadatan per hari
✅ **Heatmap Per Jam** - Intensitas lalu lintas per jam
✅ **IoT Performance** - Status perangkat dan akurasi
✅ **Indeks Kemacetan** - Calculated dari data real
✅ **Peringatan Kritis** - Events dengan priority high/critical
✅ **Export CSV** - Download data untuk analisis

### Test Flow:

1. Buka `http://localhost:3000/Analist`
2. Pilih persimpangan dari dropdown
3. Pilih jalur yang ingin dianalisis
4. Lihat data real-time dari Azure
5. Klik "Ekspor Data (.csv)" untuk download

## 🔄 Langkah 8: Populate Data Real-time (Optional)

Untuk testing dengan data lebih banyak, Anda bisa:

### 8.1 Generate Traffic Data

Buat file `scripts/generate-traffic-data.ts`:

```typescript
import { containers } from '../lib/azure-cosmos';

async function generateTrafficData() {
  const intersections = ['int_001', 'int_002', 'int_003', 'int_004'];
  const lanes = ['north', 'east', 'south', 'west'];
  
  for (let i = 0; i < 100; i++) {
    const data = {
      id: `traffic_${Date.now()}_${i}`,
      intersectionId: intersections[Math.floor(Math.random() * intersections.length)],
      deviceId: `lane-${lanes[Math.floor(Math.random() * lanes.length)]}`,
      lane: lanes[Math.floor(Math.random() * lanes.length)],
      vehicleCount: Math.floor(Math.random() * 100) + 10,
      speed: Math.floor(Math.random() * 60) + 20,
      density: Math.random() * 0.9 + 0.1,
      status: 'normal',
      timestamp: new Date().toISOString(),
      _ts: Math.floor(Date.now() / 1000),
    };
    
    await containers.trafficData.items.create(data);
    console.log(`Created traffic data ${i + 1}/100`);
  }
  
  console.log('✅ Traffic data generated successfully!');
}

generateTrafficData().catch(console.error);
```

Jalankan:

```bash
npx tsx scripts/generate-traffic-data.ts
```

### 8.2 Generate Analytics Data

Buat file `scripts/generate-analytics-data.ts`:

```typescript
import { containers } from '../lib/azure-cosmos';

async function generateAnalyticsData() {
  const intersections = ['int_001', 'int_002', 'int_003', 'int_004'];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    for (const intId of intersections) {
      const hourly = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        vehicleCount: Math.floor(Math.random() * 500) + 50,
        averageSpeed: Math.floor(Math.random() * 40) + 20,
        congestionLevel: hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19 ? 'high' : 'medium',
        congestionIndex: Math.floor(Math.random() * 80) + 20,
      }));
      
      const totalVehicles = hourly.reduce((sum, h) => sum + h.vehicleCount, 0);
      const avgSpeed = hourly.reduce((sum, h) => sum + h.averageSpeed, 0) / 24;
      const avgCongestion = hourly.reduce((sum, h) => sum + h.congestionIndex, 0) / 24;
      
      const analytics = {
        id: `${intId}_${dateStr}`,
        intersectionId: intId,
        date: dateStr,
        summary: {
          totalVehicles,
          averageSpeed: Math.round(avgSpeed),
          averageCongestionIndex: Math.round(avgCongestion),
          averageWaitTime: Math.floor(Math.random() * 60) + 20,
          peakHour: '08:00',
          peakVehicleCount: Math.max(...hourly.map(h => h.vehicleCount)),
        },
        hourly,
        efficiency: {
          autoModeTime: 1380,
          manualModeTime: 60,
          autoModeEfficiency: 92.5,
          manualModeEfficiency: 75.0,
        },
        events: {
          total: Math.floor(Math.random() * 10),
          bySeverity: {
            low: 2,
            medium: 3,
            high: 1,
            critical: 0,
          },
          byType: {
            congestion: 3,
            accident: 1,
            sensor_error: 1,
            other: 1,
          },
        },
      };
      
      await containers.analyticsDaily.items.upsert(analytics);
      console.log(`Created analytics for ${intId} on ${dateStr}`);
    }
  }
  
  console.log('✅ Analytics data generated successfully!');
}

generateAnalyticsData().catch(console.error);
```

Jalankan:

```bash
npx tsx scripts/generate-analytics-data.ts
```

## 🚀 Langkah 9: Deploy ke Production (Optional)

### Deploy ke Azure Web App

Aplikasi sudah dikonfigurasi untuk deploy ke Azure:

```bash
git add .
git commit -m "Setup complete with analytics"
git push origin main
```

GitHub Actions akan otomatis deploy ke Azure Web App.

### Deploy ke Vercel (Alternative)

```bash
npm install -g vercel
vercel
```

Jangan lupa set environment variables di Vercel dashboard.

## 🔧 Troubleshooting

### Error: "Azure Cosmos DB credentials not configured"

**Solusi:** Pastikan `.env.local` sudah dibuat dan berisi credentials yang benar.

### Error: "Container not found"

**Solusi:** Jalankan `npm run db:setup` untuk membuat collections.

### API Returns Empty Data

**Solusi:** Jalankan `npm run db:seed` untuk mengisi data awal.

### Halaman Analitik Tidak Menampilkan Data

**Solusi:**
1. Cek console browser untuk error
2. Pastikan API endpoint berjalan: `curl http://localhost:3000/api/analytics/daily`
3. Generate data dengan script di atas
4. Refresh halaman

### Connection Timeout

**Solusi:**
1. Cek firewall settings di Azure Portal
2. Pastikan IP address allowed di Cosmos DB
3. Test connection dengan Azure Portal Data Explorer

## 📚 Dokumentasi Lengkap

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Schema database detail
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference lengkap
- [AZURE_DATA_EXPLORER_GUIDE.md](./AZURE_DATA_EXPLORER_GUIDE.md) - Cara menggunakan Azure Data Explorer
- [BACKEND_COMPLETE_SUMMARY.md](./BACKEND_COMPLETE_SUMMARY.md) - Summary backend lengkap

## 🎯 Next Steps

Setelah setup selesai:

1. ✅ Explore semua halaman aplikasi
2. ✅ Test CRUD operations (Create, Read, Update, Delete)
3. ✅ Generate lebih banyak data untuk testing
4. ✅ Customize sesuai kebutuhan
5. 🔄 Implement authentication (NextAuth)
6. 🔄 Setup IoT Hub untuk real-time data dari ESP32
7. 🔄 Deploy ke production

## 🆘 Support

Jika ada masalah:

1. Check documentation files
2. Test APIs dengan `.\scripts\test-api.ps1`
3. Verify data di Azure Data Explorer
4. Check logs di Azure Portal
5. Review error messages di console

## 🎉 Selesai!

Backend sudah **100% terhubung** dengan Azure Cosmos DB dan halaman analitik sudah menampilkan data real!

**Fitur yang Sudah Lengkap:**
- ✅ 11 API endpoint groups
- ✅ 8 database collections
- ✅ Setup & seed scripts
- ✅ Halaman Analitik dengan data real
- ✅ Real-time data fetching dengan SWR
- ✅ Export CSV functionality
- ✅ Filter & search capabilities
- ✅ Complete documentation

Selamat menggunakan! 🚀
