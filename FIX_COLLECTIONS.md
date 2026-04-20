# Fix Collections - Hapus Duplicate

## ⚠️ Masalah yang Ditemukan

Database Anda memiliki **duplicate collections** dengan case berbeda:

```
❌ Duplicate:
   - intersections dan Intersections
   - users dan Users  
   - traffic_data dan TrafficData
```

Cosmos DB case-sensitive, jadi ini dianggap collections berbeda dan bisa menyebabkan masalah.

## 🔧 Cara Memperbaiki

### Step 1: Cek Duplicate

```powershell
npm run db:cleanup
```

Output akan menunjukkan collections mana yang duplicate dan akan dihapus.

### Step 2: Backup Data (PENTING!)

```powershell
# Backup semua data dulu sebelum hapus
npm run db:export
```

Data akan tersimpan di folder `exports/cosmos-backup-YYYY-MM-DD/`

### Step 3: Hapus Duplicate

```powershell
# Jalankan dengan --confirm untuk benar-benar hapus
npm run db:cleanup -- --confirm
```

Script akan:
- ✅ Hapus collections dengan nama non-standard (Intersections, Users, TrafficData)
- ✅ Pertahankan collections dengan nama standard (intersections, users, traffic_data)

### Step 4: Verifikasi

```powershell
# Cek apakah masih ada duplicate
npm run db:check
```

### Step 5: Setup Ulang (Jika Perlu)

Jika ada collections yang terhapus semua:

```powershell
# Buat collections yang missing
npm run db:setup

# Isi data awal
npm run db:seed
```

## 📋 Standard Collection Names

Collections yang benar (lowercase dengan underscore):

1. ✅ `users` (bukan Users)
2. ✅ `intersections` (bukan Intersections)
3. ✅ `traffic_data` (bukan TrafficData)
4. ✅ `events`
5. ✅ `reports`
6. ✅ `notifications`
7. ✅ `device_status`
8. ✅ `analytics_daily`

## 🎯 Quick Fix (All in One)

```powershell
# 1. Backup
npm run db:export

# 2. Cleanup duplicate
npm run db:cleanup -- --confirm

# 3. Setup collections yang missing
npm run db:setup

# 4. Isi data
npm run db:seed

# 5. Verifikasi
npm run db:check
```

## ❓ FAQ

### Q: Apakah data akan hilang?

A: Data di collections yang dihapus akan hilang. Makanya penting backup dulu dengan `npm run db:export`

### Q: Collection mana yang akan dipertahankan?

A: Collections dengan nama standard (lowercase) akan dipertahankan:
- ✅ Keep: `users`, `intersections`, `traffic_data`
- ❌ Delete: `Users`, `Intersections`, `TrafficData`

### Q: Bagaimana jika ada data penting di collection yang akan dihapus?

A: 
1. Export dulu: `npm run db:export`
2. Atau manual copy data dari Azure Portal
3. Setelah cleanup, import kembali ke collection yang benar

### Q: Kenapa ada duplicate?

A: Kemungkinan:
- Script dijalankan dengan nama berbeda
- Manual create di Azure Portal dengan case berbeda
- Import dari source lain

## 🚨 Troubleshooting

### Error: "Cannot delete container"

Pastikan tidak ada aplikasi yang sedang menggunakan collection tersebut.

```powershell
# Stop dev server dulu
# Ctrl+C di terminal yang running npm run dev

# Lalu cleanup
npm run db:cleanup -- --confirm
```

### Ingin Manual Delete di Portal

1. Buka Azure Portal
2. Navigate ke Data Explorer
3. Right-click collection yang ingin dihapus
4. Pilih "Delete Container"
5. Konfirmasi

### Restore Data Setelah Cleanup

```powershell
# Import dari backup
npm run db:import exports/cosmos-backup-2024-01-25
```

## 💡 Best Practices

1. **Selalu backup** sebelum cleanup:
   ```powershell
   npm run db:export
   ```

2. **Gunakan script** untuk create collections (bukan manual):
   ```powershell
   npm run db:setup
   ```

3. **Konsisten dengan naming**:
   - Gunakan lowercase
   - Gunakan underscore untuk separator
   - Jangan gunakan PascalCase atau camelCase

4. **Cek struktur secara berkala**:
   ```powershell
   npm run db:check
   ```

## 📞 Need Help?

Jika ada masalah:
1. Check backup di folder `exports/`
2. Lihat logs di console
3. Cek Azure Portal Data Explorer
4. Restore dari backup jika perlu

---

**IMPORTANT:** Selalu backup data sebelum menjalankan cleanup!
