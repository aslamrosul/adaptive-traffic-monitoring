# Database Structure - Adaptive Traffic Monitoring

Dokumentasi struktur database untuk tim development.

## 🚀 Quick Start - Cek Struktur Database

Jalankan 1 command ini untuk melihat semua collections dan strukturnya:

```powershell
npm run db:check
```

Command ini akan:
- ✅ Cek collections apa saja yang ada
- ✅ Tampilkan struktur setiap collection
- ✅ Hitung jumlah data di setiap collection
- ✅ Generate report dalam format JSON dan Markdown
- ✅ Simpan ke folder `database-structure/`

## 📊 Output

Setelah menjalankan `npm run db:check`, Anda akan mendapat:

### 1. Console Output
```
🔍 Checking Azure Cosmos DB Structure

================================================================================
Database: TrafficDB
Endpoint: https://traffic-cosmos-slam.documents.azure.com:443/
================================================================================

✅ Database exists

📦 Found 8 collections:

✅ users
   Partition Key: /email
   Description: Data pengguna (admin, operator)
   Items: 3

✅ intersections
   Partition Key: /deviceId
   Description: Data persimpangan lalu lintas
   Items: 4

... (dan seterusnya)
```

### 2. File Report

**`database-structure/database-structure.json`**
- Format JSON lengkap
- Bisa dibaca oleh program
- Berisi semua detail struktur

**`database-structure/DATABASE_STRUCTURE.md`**
- Format Markdown yang mudah dibaca
- Berisi sample structure setiap collection
- Bisa dibuka di editor atau GitHub

## 📋 Collections yang Tersedia

### 1. users
**Partition Key:** `/email`  
**Purpose:** Data pengguna (admin, operator)

```json
{
  "id": "user_001",
  "email": "user@example.com",
  "name": "User Name",
  "role": "admin | operator",
  "phone": "+62812345678",
  "status": "active | inactive",
  "settings": { ... }
}
```

### 2. intersections
**Partition Key:** `/deviceId`  
**Purpose:** Data persimpangan lalu lintas

```json
{
  "id": "int_001",
  "name": "Simpang Tugu Tani",
  "address": "Jl. ...",
  "location": { "lat": -6.1754, "lng": 106.8272 },
  "deviceId": "lane-north",
  "status": "active | maintenance | offline",
  "lanes": { ... },
  "config": { ... }
}
```

### 3. traffic_data
**Partition Key:** `/intersectionId`  
**Purpose:** Data lalu lintas real-time dari sensor

```json
{
  "id": "traffic_001",
  "intersectionId": "int_001",
  "vehicleCount": 45,
  "density": 75,
  "avgSpeed": 25,
  "waitTime": 60
}
```

### 4. events
**Partition Key:** `/intersectionId`  
**Purpose:** Event log sistem

```json
{
  "id": "event_001",
  "intersectionId": "int_001",
  "type": "manual_override | alert | system",
  "severity": "info | warning | error | critical",
  "title": "Manual Override Activated"
}
```

### 5. reports
**Partition Key:** `/intersectionId`  
**Purpose:** Laporan dari operator

```json
{
  "id": "rpt_001",
  "intersectionId": "int_001",
  "type": "congestion | accident | maintenance",
  "priority": "low | medium | high | critical",
  "status": "submitted | in_progress | resolved",
  "title": "Kemacetan Parah"
}
```

### 6. notifications
**Partition Key:** `/userId`  
**Purpose:** Notifikasi untuk user

```json
{
  "id": "notif_001",
  "userId": "user_001",
  "type": "alert | report | system",
  "title": "Kemacetan Tinggi Terdeteksi",
  "read": false
}
```

### 7. device_status
**Partition Key:** `/deviceId`  
**Purpose:** Status perangkat IoT

```json
{
  "id": "device_001",
  "deviceId": "lane-north",
  "status": "online | offline | error",
  "lastHeartbeat": "2024-01-25T10:00:00Z",
  "firmware": "1.2.3"
}
```

### 8. analytics_daily
**Partition Key:** `/intersectionId`  
**Purpose:** Analitik harian agregat

```json
{
  "id": "analytics_001",
  "intersectionId": "int_001",
  "date": "2024-01-25",
  "totalVehicles": 12500,
  "avgDensity": 65
}
```

## 🔧 Setup Database

### Jika Collections Belum Ada

```powershell
# 1. Cek dulu
npm run db:check

# 2. Jika ada yang missing, buat collections
npm run db:setup

# 3. Isi data awal (optional)
npm run db:seed

# 4. Cek lagi untuk verifikasi
npm run db:check
```

### Jika Collections Sudah Ada

```powershell
# Cukup cek struktur
npm run db:check

# Lihat report di folder database-structure/
```

## 👥 Untuk Teman-teman Tim

### Cara Lihat Struktur Database:

**Opsi 1: Via Command (Recommended)**
```powershell
# Clone repo
git clone <repo-url>
cd adaptive-traffic-monitoring

# Install dependencies
npm install

# Copy .env.local dari teman yang sudah setup
# Atau minta credentials dari admin

# Cek struktur
npm run db:check

# Buka file report
code database-structure/DATABASE_STRUCTURE.md
```

**Opsi 2: Via Azure Portal**
1. Minta akses Azure Portal dari admin
2. Buka https://portal.azure.com
3. Search: `traffic-cosmos-slam`
4. Klik **Data Explorer**
5. Expand **TrafficDB**
6. Lihat collections dan sample data

**Opsi 3: Baca File Report**
1. Minta teman yang sudah run `npm run db:check`
2. Copy folder `database-structure/`
3. Buka file `DATABASE_STRUCTURE.md`

## 📝 Workflow Development

### Untuk Developer Baru:

1. **Setup Environment**
   ```powershell
   npm install
   # Copy .env.local dari teman
   ```

2. **Cek Struktur Database**
   ```powershell
   npm run db:check
   ```

3. **Baca Report**
   ```
   Buka: database-structure/DATABASE_STRUCTURE.md
   ```

4. **Mulai Development**
   ```powershell
   npm run dev
   ```

### Untuk Update Struktur:

1. **Cek Struktur Sekarang**
   ```powershell
   npm run db:check
   ```

2. **Edit Script** (jika perlu tambah collection)
   ```
   Edit: scripts/setup-cosmos-db.ts
   Edit: scripts/check-database.ts
   ```

3. **Run Setup**
   ```powershell
   npm run db:setup
   ```

4. **Verifikasi**
   ```powershell
   npm run db:check
   ```

## 🎯 Common Commands

```powershell
# Cek struktur database
npm run db:check

# Setup collections (pertama kali)
npm run db:setup

# Isi data sample
npm run db:seed

# Setup + seed sekaligus
npm run db:init

# Backup data
npm run db:export

# Restore data
npm run db:import exports/cosmos-backup-2024-01-25

# Test APIs
npm run dev
.\scripts\test-api.ps1
```

## 📚 File Penting

- `database-structure/DATABASE_STRUCTURE.md` - Report struktur (auto-generated)
- `database-structure/database-structure.json` - Report JSON (auto-generated)
- `scripts/check-database.ts` - Script untuk cek struktur
- `scripts/setup-cosmos-db.ts` - Script untuk setup collections
- `scripts/seed-data.ts` - Script untuk isi data sample

## 🆘 Troubleshooting

### Error: "Cannot connect to database"
```powershell
# Check .env.local
cat .env.local

# Pastikan ada:
# AZURE_COSMOS_ENDPOINT=...
# AZURE_COSMOS_KEY=...
# AZURE_COSMOS_DATABASE=TrafficDB
```

### Error: "Database not found"
```powershell
# Buat database dulu
npm run db:setup
```

### Ingin Lihat Data Tanpa Setup
```powershell
# Minta teman yang sudah setup untuk run:
npm run db:check

# Lalu share folder database-structure/
```

## 💡 Tips

1. **Selalu cek struktur dulu** sebelum coding:
   ```powershell
   npm run db:check
   ```

2. **Share report dengan tim** via Git:
   ```powershell
   git add database-structure/
   git commit -m "Update database structure report"
   git push
   ```

3. **Update report secara berkala** saat ada perubahan struktur

4. **Gunakan report sebagai referensi** saat develop API atau frontend

## 🔗 Links

- [AZURE_DATA_EXPLORER_GUIDE.md](./AZURE_DATA_EXPLORER_GUIDE.md) - Cara edit data di portal
- [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md) - Setup lengkap
- [QUICK_START.md](./QUICK_START.md) - Quick reference
- [CHEAT_SHEET.md](./CHEAT_SHEET.md) - Command cheat sheet

---

**Dibuat untuk:** Tim Development Adaptive Traffic Monitoring  
**Last Updated:** 2024-01-25  
**Maintainer:** Team Lead
