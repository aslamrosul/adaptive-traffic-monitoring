# Quick Start Guide - Backend & Database

Panduan cepat untuk setup dan mengelola backend dengan Azure Cosmos DB.

## 🚀 Setup Database (Pertama Kali)

### Opsi 1: Otomatis dengan Script

```powershell
# Setup collections + seed data sekaligus
.\scripts\setup-database.ps1
```

### Opsi 2: Manual Step-by-Step

```powershell
# 1. Buat collections
npm run db:setup

# 2. Isi data awal
npm run db:seed

# 3. Test API
npm run dev
# Di terminal lain:
.\scripts\test-api.ps1
```

## 📊 Lihat Data di Azure Portal

1. Buka https://portal.azure.com
2. Search: `traffic-cosmos-slam`
3. Klik **Data Explorer**
4. Expand **TrafficDB** untuk lihat collections
5. Klik **Items** untuk lihat data

## ✏️ Edit Data

### Via Azure Portal (Recommended untuk Manual Edit)

1. Buka Data Explorer
2. Navigate: `TrafficDB` > `users` > `Items`
3. Klik item yang ingin diedit
4. Edit JSON di panel kanan
5. Klik **Update**

### Via Script (Recommended untuk Bulk Changes)

```powershell
# Edit file scripts/seed-data.ts
# Lalu jalankan:
npm run db:seed
```

### Via API (Production)

```powershell
# Test dengan PowerShell
$body = @{
    name = "Nama Baru"
    email = "email@baru.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
    -Method PUT `
    -Body $body `
    -ContentType "application/json"
```

## 💾 Backup & Restore

### Export Data (Backup)

```powershell
npm run db:export
```

File akan tersimpan di folder `exports/cosmos-backup-YYYY-MM-DD/`

### Import Data (Restore)

```powershell
npm run db:import exports/cosmos-backup-2024-01-25
```

## 🔍 Query Data

### Via Azure Portal

Buka Data Explorer > New SQL Query:

```sql
-- Lihat semua users
SELECT * FROM c

-- Filter by role
SELECT * FROM c WHERE c.role = "admin"

-- Count items
SELECT VALUE COUNT(1) FROM c

-- Sort by date
SELECT * FROM c ORDER BY c.createdAt DESC
```

### Via API

```powershell
# Get all users
Invoke-RestMethod -Uri "http://localhost:3000/api/users"

# Get users by role
Invoke-RestMethod -Uri "http://localhost:3000/api/users?role=admin"

# Get all intersections
Invoke-RestMethod -Uri "http://localhost:3000/api/intersections"

# Get specific intersection
Invoke-RestMethod -Uri "http://localhost:3000/api/intersections/int_001"
```

## 📝 Tambah Data Baru

### Via Azure Portal

1. Buka container (misal: `users`)
2. Klik **New Item**
3. Paste JSON:

```json
{
  "id": "user_new_001",
  "email": "newuser@traffic.com",
  "name": "User Baru",
  "role": "operator",
  "phone": "+62812345682",
  "status": "active",
  "reportsCreated": 0,
  "reportsCompleted": 0,
  "activeHours": 0,
  "createdAt": "2024-01-25T10:00:00Z",
  "updatedAt": "2024-01-25T10:00:00Z"
}
```

4. Klik **Save**

### Via API

```powershell
$newUser = @{
    email = "newuser@traffic.com"
    name = "User Baru"
    role = "operator"
    phone = "+62812345682"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
    -Method POST `
    -Body $newUser `
    -ContentType "application/json"
```

## 🗑️ Hapus Data

### Via Azure Portal

1. Buka container > Items
2. Klik item yang ingin dihapus
3. Klik **Delete Item**
4. Konfirmasi

### Via API

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/user_001" `
    -Method DELETE
```

## 🧪 Testing

### Test All APIs

```powershell
npm run dev
# Di terminal lain:
.\scripts\test-api.ps1
```

### Test Specific Endpoint

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:3000/api/health"

# Users
Invoke-RestMethod -Uri "http://localhost:3000/api/users"

# Intersections
Invoke-RestMethod -Uri "http://localhost:3000/api/intersections"

# Reports
Invoke-RestMethod -Uri "http://localhost:3000/api/reports"

# Settings
Invoke-RestMethod -Uri "http://localhost:3000/api/settings?userId=user_admin_001"

# FAQs
Invoke-RestMethod -Uri "http://localhost:3000/api/help/faqs"

# Guides
Invoke-RestMethod -Uri "http://localhost:3000/api/help/guides"
```

## 📚 Available Collections

| Collection | Partition Key | Purpose |
|------------|---------------|---------|
| `users` | `/email` | Data pengguna (admin, operator) |
| `intersections` | `/deviceId` | Data persimpangan |
| `traffic_data` | `/intersectionId` | Data lalu lintas real-time |
| `events` | `/intersectionId` | Event log sistem |
| `reports` | `/intersectionId` | Laporan dari operator |
| `notifications` | `/userId` | Notifikasi untuk user |
| `device_status` | `/deviceId` | Status perangkat IoT |
| `analytics_daily` | `/intersectionId` | Analitik harian |

## 🎯 Common Tasks

### Task 1: Tambah User Baru

```powershell
# Via API
$user = @{
    email = "operator4@traffic.com"
    name = "Operator 4"
    role = "operator"
    phone = "+62812345683"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
    -Method POST -Body $user -ContentType "application/json"
```

### Task 2: Update Intersection Status

```powershell
# Via API
$update = @{
    status = "maintenance"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/intersections/int_001" `
    -Method PUT -Body $update -ContentType "application/json"
```

### Task 3: Buat Laporan Baru

```powershell
# Via API
$report = @{
    intersectionId = "int_001"
    type = "congestion"
    priority = "high"
    title = "Kemacetan Parah"
    description = "Kemacetan di jam sibuk"
    userId = "user_operator_001"
    userName = "Operator 1"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/reports" `
    -Method POST -Body $report -ContentType "application/json"
```

### Task 4: Search FAQs

```powershell
# Search by keyword
Invoke-RestMethod -Uri "http://localhost:3000/api/help/faqs?search=sensor"

# Filter by category
Invoke-RestMethod -Uri "http://localhost:3000/api/help/faqs?category=IoT & Sensor"
```

## 🔧 Troubleshooting

### Database Connection Error

```powershell
# Check environment variables
cat .env.local

# Test connection
npm run db:setup
```

### API Returns Empty Data

```powershell
# Seed data
npm run db:seed

# Verify in Azure Portal
# Open Data Explorer > TrafficDB > users > Items
```

### Frontend Not Showing Data

1. ✅ Check API works: `.\scripts\test-api.ps1`
2. ✅ Check data exists in Azure Portal
3. ✅ Check browser console for errors
4. ✅ Refresh page (Ctrl+F5)

## 📖 Documentation

- [AZURE_DATA_EXPLORER_GUIDE.md](./AZURE_DATA_EXPLORER_GUIDE.md) - Panduan lengkap Azure Data Explorer
- [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md) - Setup database detail
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference lengkap
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Schema database

## 💡 Tips

1. **Backup Sebelum Edit**: Selalu export data sebelum edit besar
   ```powershell
   npm run db:export
   ```

2. **Test di Local Dulu**: Test perubahan di local sebelum deploy
   ```powershell
   npm run dev
   ```

3. **Gunakan Query untuk Validasi**: Setelah edit, validasi dengan query di Data Explorer

4. **Monitor Logs**: Check Azure Portal logs untuk troubleshooting

5. **Version Control**: Commit perubahan script ke git untuk tracking

## 🆘 Need Help?

- Check [AZURE_DATA_EXPLORER_GUIDE.md](./AZURE_DATA_EXPLORER_GUIDE.md) untuk panduan detail
- Check [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md) untuk troubleshooting
- Test API dengan `.\scripts\test-api.ps1`
- Lihat logs di Azure Portal
