# Panduan Setup Database Azure Cosmos DB

Panduan lengkap untuk menghubungkan backend dengan data di Azure Cosmos DB.

## 📋 Prerequisites

- Azure Cosmos DB account sudah dibuat
- Credentials sudah dikonfigurasi di `.env.local`
- Node.js dan npm terinstall
- PowerShell (untuk Windows)

## 🚀 Quick Start

Jalankan script otomatis untuk setup database:

```powershell
.\scripts\setup-database.ps1
```

Script ini akan:
1. ✅ Membuat database dan collections di Cosmos DB
2. ✅ Mengisi data awal (users, intersections, reports, notifications)
3. ✅ Testing API endpoints

## 📝 Manual Setup

Jika ingin setup manual, ikuti langkah berikut:

### 1. Setup Collections

Buat database dan collections di Cosmos DB:

```powershell
npx tsx scripts/setup-cosmos-db.ts
```

Collections yang dibuat:
- `users` - Data pengguna (admin, operator)
- `intersections` - Data persimpangan
- `traffic_data` - Data lalu lintas real-time
- `events` - Event log sistem
- `reports` - Laporan dari operator
- `notifications` - Notifikasi untuk user
- `device_status` - Status perangkat IoT
- `analytics_daily` - Analitik harian

### 2. Seed Data Awal

Isi database dengan data sample:

```powershell
npx tsx scripts/seed-data.ts
```

Data yang ditambahkan:
- **3 Users**: 1 admin, 2 operator
- **4 Intersections**: Tugu Tani, Bundaran HI, Semanggi, Kuningan
- **3 Reports**: Sample laporan dengan berbagai status
- **2 Notifications**: Sample notifikasi

### 3. Test API Endpoints

Start development server:

```powershell
npm run dev
```

Di terminal lain, test API:

```powershell
.\scripts\test-api.ps1
```

## 🔍 Verifikasi di Azure Portal

1. Buka [Azure Portal](https://portal.azure.com)
2. Navigasi ke Cosmos DB account: `traffic-cosmos-slam`
3. Buka **Data Explorer**
4. Pilih database: `TrafficDB`
5. Lihat collections dan data yang sudah dibuat

## 📊 Struktur Data

### Users Collection

```json
{
  "id": "user_admin_001",
  "email": "admin@traffic.com",
  "name": "Admin Utama",
  "role": "admin",
  "phone": "+62812345678",
  "status": "active",
  "reportsCreated": 0,
  "reportsCompleted": 0,
  "activeHours": 0
}
```

### Intersections Collection

```json
{
  "id": "int_001",
  "name": "Simpang Tugu Tani",
  "address": "Jl. Medan Merdeka Barat, Jakarta Pusat",
  "location": { "lat": -6.1754, "lng": 106.8272 },
  "deviceId": "lane-north",
  "status": "active",
  "lanes": {
    "count": 4,
    "directions": ["north", "east", "south", "west"]
  },
  "config": {
    "mode": "auto",
    "threshold": { "low": 50, "medium": 100, "high": 200, "critical": 300 }
  }
}
```

### Reports Collection

```json
{
  "id": "rpt_001",
  "intersectionId": "int_001",
  "type": "congestion",
  "priority": "high",
  "status": "in_progress",
  "title": "Kemacetan Parah di Jam Pulang Kerja",
  "description": "Terjadi kemacetan parah setiap hari pada jam 17:00-19:00",
  "reportedBy": {
    "userId": "user_operator_001",
    "userName": "Operator Lalu Lintas 1"
  }
}
```

## 🌐 API Endpoints

Backend sudah terhubung dengan Cosmos DB melalui endpoints berikut:

### Users Management
- `GET /api/users` - List semua users
- `POST /api/users` - Tambah user baru
- Query params: `?role=admin&status=active`

### Intersections
- `GET /api/intersections` - List semua persimpangan
- `GET /api/intersections/[id]` - Detail persimpangan
- `POST /api/intersections` - Tambah persimpangan baru

### Reports
- `GET /api/reports` - List semua laporan
- `POST /api/reports` - Buat laporan baru
- Query params: `?intersectionId=int_001&status=submitted`

### Notifications
- `GET /api/notifications` - List notifikasi
- `POST /api/notifications` - Buat notifikasi baru

### Health Check
- `GET /api/health` - Status koneksi database

## 🎯 Testing di Frontend

Setelah setup database, test di halaman frontend:

### 1. Manajemen Pengguna
URL: `http://localhost:3000/pengguna`

Fitur:
- ✅ List semua users dari database
- ✅ Filter by role (admin/operator)
- ✅ Tambah user baru
- ✅ Lihat statistik user

### 2. Peta Simpangan
URL: `http://localhost:3000/peta`

Fitur:
- ✅ Tampilkan semua intersections di map
- ✅ Real-time status (active/maintenance)
- ✅ Click untuk detail

### 3. Persimpangan
URL: `http://localhost:3000/persimpangan`

Fitur:
- ✅ Grid view semua intersections
- ✅ Status dan device info
- ✅ Tambah intersection baru
- ✅ Detail page per intersection

### 4. Laporan
URL: `http://localhost:3000/laporan`

Fitur:
- ✅ List semua reports
- ✅ Filter by status/priority
- ✅ Buat laporan baru
- ✅ Update status laporan

### 5. Pengaturan & Bantuan
URL: `http://localhost:3000/profile`

Fitur:
- ✅ Profile management
- ✅ Settings tabs
- ✅ Help content

## 🔧 Troubleshooting

### Error: "Azure Cosmos DB credentials not configured"

Pastikan `.env.local` berisi:
```env
AZURE_COSMOS_ENDPOINT=https://traffic-cosmos-slam.documents.azure.com:443/
AZURE_COSMOS_KEY=your-key-here
AZURE_COSMOS_DATABASE=TrafficDB
```

### Error: "Container not found"

Jalankan setup script lagi:
```powershell
npx tsx scripts/setup-cosmos-db.ts
```

### API Returns Empty Data

Seed data belum dijalankan:
```powershell
npx tsx scripts/seed-data.ts
```

### Connection Timeout

1. Check firewall settings di Azure Portal
2. Pastikan IP address allowed di Cosmos DB
3. Test connection dengan Azure Portal Data Explorer

## 📚 Next Steps

Setelah database setup:

1. ✅ Deploy ke Azure Web App (sudah running)
2. ✅ Configure environment variables di Azure Portal
3. ✅ Test production endpoints
4. 🔄 Setup IoT Hub untuk real-time data
5. 🔄 Implement authentication (NextAuth)

## 🆘 Support

Jika ada masalah:
1. Check Azure Portal logs
2. Check application logs di Azure Web App
3. Test API dengan `.\scripts\test-api.ps1`
4. Verify data di Azure Data Explorer

## 📖 Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Schema lengkap
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [DEPLOY_AZURE.md](./DEPLOY_AZURE.md) - Deployment guide
