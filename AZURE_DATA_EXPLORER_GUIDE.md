# Panduan Azure Cosmos DB Data Explorer

Panduan lengkap untuk melihat, membaca, dan mengedit data di Azure Cosmos DB menggunakan Data Explorer.

## 🌐 Akses Azure Data Explorer

### Cara 1: Melalui Azure Portal

1. Buka [Azure Portal](https://portal.azure.com)
2. Login dengan akun Azure Anda
3. Di search bar atas, ketik: `traffic-cosmos-slam`
4. Klik pada Cosmos DB account Anda
5. Di menu kiri, klik **Data Explorer**

### Cara 2: Direct Link

Buka langsung: https://portal.azure.com/#@yourdomain/resource/subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/YOUR_RESOURCE_GROUP/providers/Microsoft.DocumentDB/databaseAccounts/traffic-cosmos-slam/dataExplorer

## 📂 Struktur Database

```
TrafficDB (Database)
├── users (Container)
├── intersections (Container)
├── traffic_data (Container)
├── events (Container)
├── reports (Container)
├── notifications (Container)
├── device_status (Container)
└── analytics_daily (Container)
```

## 👀 Melihat Data yang Ada

### 1. Lihat Collections (Containers)

Di Data Explorer:
- Expand **TrafficDB** di sidebar kiri
- Anda akan melihat semua containers yang sudah dibuat
- Jika belum ada, jalankan script setup: `npx tsx scripts/setup-cosmos-db.ts`

### 2. Lihat Items dalam Container

1. Expand container yang ingin dilihat (misal: `users`)
2. Klik **Items**
3. Anda akan melihat list semua documents dalam container
4. Klik pada item untuk melihat detail JSON

### 3. Query Data

Di Data Explorer, klik **New SQL Query** dan coba query ini:

```sql
-- Lihat semua users
SELECT * FROM c

-- Lihat users dengan role tertentu
SELECT * FROM c WHERE c.role = "admin"

-- Lihat intersections yang active
SELECT * FROM c WHERE c.status = "active"

-- Count total items
SELECT VALUE COUNT(1) FROM c
```

## ✏️ Mengedit Data Manual

### Cara 1: Edit Langsung di Portal

1. Buka container (misal: `users`)
2. Klik **Items**
3. Klik pada item yang ingin diedit
4. Edit JSON di panel kanan
5. Klik **Update** untuk menyimpan

**Contoh Edit User:**
```json
{
  "id": "user_admin_001",
  "email": "admin@traffic.com",
  "name": "Admin Utama - EDITED",
  "role": "admin",
  "phone": "+62812345678",
  "status": "active",
  "settings": {
    "general": {
      "autoMode": true,
      "language": "id",
      "timezone": "WIB"
    }
  }
}
```

### Cara 2: Tambah Item Baru

1. Buka container
2. Klik **New Item**
3. Paste JSON structure
4. Klik **Save**

**Template User Baru:**
```json
{
  "id": "user_operator_003",
  "email": "operator3@traffic.com",
  "name": "Operator Baru",
  "role": "operator",
  "phone": "+62812345681",
  "photoURL": "",
  "location": "Jakarta Timur",
  "status": "active",
  "reportsCreated": 0,
  "reportsCompleted": 0,
  "activeHours": 0,
  "settings": {
    "general": {
      "autoMode": true,
      "language": "id",
      "timezone": "WIB"
    },
    "notifications": {
      "email": true,
      "push": true,
      "priorities": {
        "extreme": true,
        "iotAnomaly": true,
        "maintenance": false
      }
    }
  },
  "createdAt": "2024-01-25T10:00:00Z",
  "updatedAt": "2024-01-25T10:00:00Z"
}
```

**Template Intersection Baru:**
```json
{
  "id": "int_005",
  "name": "Simpang Baru",
  "address": "Jl. Sudirman, Jakarta",
  "location": {
    "lat": -6.2088,
    "lng": 106.8456
  },
  "deviceId": "lane-new-001",
  "status": "active",
  "lanes": {
    "count": 4,
    "directions": ["north", "east", "south", "west"]
  },
  "config": {
    "mode": "auto",
    "threshold": {
      "low": 50,
      "medium": 100,
      "high": 200,
      "critical": 300
    },
    "alertEnabled": true,
    "cycleTime": {
      "min": 30,
      "max": 120
    }
  },
  "createdAt": "2024-01-25T10:00:00Z",
  "updatedAt": "2024-01-25T10:00:00Z"
}
```

### Cara 3: Delete Item

1. Buka container
2. Klik **Items**
3. Klik pada item yang ingin dihapus
4. Klik **Delete Item**
5. Konfirmasi penghapusan

## 🔍 Membaca Struktur yang Ada

### Langkah-langkah:

1. **Buka Container**
   - Expand `TrafficDB` > `users` > `Items`

2. **Pilih Sample Item**
   - Klik pada salah satu user (misal: `user_admin_001`)

3. **Copy JSON Structure**
   - Copy seluruh JSON dari panel kanan
   - Paste ke text editor untuk analisis

4. **Identifikasi Fields**
   - Lihat field apa saja yang ada
   - Perhatikan tipe data (string, number, object, array)
   - Perhatikan nested objects (misal: `settings.general.autoMode`)

5. **Sesuaikan dengan Kebutuhan**
   - Tambah field baru jika perlu
   - Edit nilai default
   - Simpan perubahan

## 📝 Workflow Rekomendasi

### Untuk Setup Awal:

```bash
# 1. Jalankan setup untuk membuat collections
npx tsx scripts/setup-cosmos-db.ts

# 2. Buka Azure Data Explorer
# Verifikasi collections sudah dibuat

# 3. Lihat struktur yang dibuat
# Buka setiap container dan lihat apakah sudah sesuai

# 4. Jalankan seed data
npx tsx scripts/seed-data.ts

# 5. Verifikasi data di Azure Data Explorer
# Buka Items di setiap container

# 6. Edit manual jika perlu
# Tambah, edit, atau hapus data sesuai kebutuhan
```

### Untuk Edit Data yang Sudah Ada:

**Opsi A: Edit Manual di Portal** (Untuk perubahan kecil)
1. Buka Azure Data Explorer
2. Navigate ke container > Items
3. Edit langsung di portal
4. Klik Update

**Opsi B: Edit via Script** (Untuk perubahan besar)
1. Edit file `scripts/seed-data.ts`
2. Jalankan ulang: `npx tsx scripts/seed-data.ts`
3. Script akan upsert (update or insert) data

**Opsi C: Edit via API** (Untuk production)
1. Gunakan API endpoints yang sudah dibuat
2. Contoh: `PUT /api/users` untuk update user
3. Data akan tersimpan otomatis ke Cosmos DB

## 🎯 Use Cases

### Use Case 1: Tambah User Baru

**Via Portal:**
1. Buka `users` container
2. Klik **New Item**
3. Paste JSON template user
4. Edit `id`, `email`, `name`, dll
5. Klik **Save**

**Via Script:**
```typescript
// Edit scripts/seed-data.ts
const users = [
  // ... existing users
  {
    id: 'user_new_001',
    email: 'newuser@traffic.com',
    name: 'User Baru',
    // ... fields lainnya
  }
];
```

### Use Case 2: Update Intersection Status

**Via Portal:**
1. Buka `intersections` container
2. Cari intersection yang ingin diupdate
3. Edit field `status` dari `"active"` ke `"maintenance"`
4. Klik **Update**

**Via API:**
```bash
curl -X PUT http://localhost:3000/api/intersections/int_001 \
  -H "Content-Type: application/json" \
  -d '{"status": "maintenance"}'
```

### Use Case 3: Lihat Semua Reports

**Via Portal Query:**
```sql
SELECT 
  c.id,
  c.title,
  c.status,
  c.priority,
  c.intersectionId,
  c.createdAt
FROM c
ORDER BY c.createdAt DESC
```

### Use Case 4: Bulk Update Settings

**Via Portal Query (Read Only):**
```sql
-- Lihat users yang belum punya settings
SELECT * FROM c WHERE NOT IS_DEFINED(c.settings)
```

**Via Script (Update):**
Edit `scripts/seed-data.ts` dan jalankan ulang untuk update semua users.

## 🔧 Tips & Tricks

### 1. Backup Data Sebelum Edit

Sebelum edit manual, export data:
```sql
SELECT * FROM c
```
Copy hasil query dan simpan sebagai backup.

### 2. Gunakan Query untuk Validasi

Setelah edit, validasi dengan query:
```sql
-- Cek apakah semua users punya settings
SELECT c.id, c.name, IS_DEFINED(c.settings) as hasSettings FROM c

-- Cek intersections yang active
SELECT VALUE COUNT(1) FROM c WHERE c.status = "active"
```

### 3. Partition Key

Perhatikan partition key saat create/edit:
- `users`: partition key = `/email`
- `intersections`: partition key = `/deviceId`
- `reports`: partition key = `/intersectionId`

Partition key tidak bisa diubah setelah item dibuat!

### 4. ID Harus Unique

Field `id` harus unique dalam container. Jika duplicate, akan error.

### 5. Timestamp Format

Gunakan ISO 8601 format untuk timestamp:
```json
"createdAt": "2024-01-25T10:30:00Z"
```

## 🚨 Troubleshooting

### Error: "Partition key not found"

**Solusi:** Pastikan field partition key ada di JSON:
```json
{
  "id": "user_001",
  "email": "user@example.com",  // <- Partition key untuk users
  // ... fields lainnya
}
```

### Error: "Conflict - Document with same id exists"

**Solusi:** 
- Gunakan ID yang berbeda, atau
- Hapus document lama dulu, atau
- Gunakan upsert di script

### Data Tidak Muncul di Frontend

**Checklist:**
1. ✅ Data ada di Azure Data Explorer?
2. ✅ API endpoint berfungsi? (test dengan `.\scripts\test-api.ps1`)
3. ✅ Frontend fetch dari API yang benar?
4. ✅ Environment variables sudah benar?

## 📚 Resources

- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [SQL Query Reference](https://docs.microsoft.com/azure/cosmos-db/sql-query-getting-started)
- [Partition Keys Best Practices](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)

## 🎓 Next Steps

Setelah familiar dengan Data Explorer:

1. ✅ Setup collections dengan script
2. ✅ Seed data awal
3. ✅ Verifikasi di Data Explorer
4. ✅ Edit/tambah data manual jika perlu
5. ✅ Test API endpoints
6. ✅ Verifikasi frontend menampilkan data
7. 🔄 Gunakan API untuk CRUD operations (production)

---

**Pro Tip:** Untuk development, edit manual di portal sangat berguna. Untuk production, selalu gunakan API endpoints agar ada logging dan validation.
