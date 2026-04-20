# ✅ Fix: Halaman Detail Persimpangan Tidak Menampilkan Data

## 🐛 Masalah

Ketika user click detail persimpangan dari halaman daftar, muncul error:

```
Persimpangan tidak ditemukan
```

Padahal data ada di database dan halaman daftar bisa menampilkan data dengan baik.

---

## 🔍 Root Cause

Masalahnya ada di **API route** `/api/intersections/[id]/route.ts`.

### Partition Key Salah

Di Cosmos DB, container `intersections` menggunakan **`/deviceId`** sebagai partition key, bukan `/id`.

```typescript
// Schema di setup-cosmos-db.ts
{ id: 'intersections', partitionKey: '/deviceId' }
```

### Kode Lama (SALAH):

```typescript
// Menggunakan id sebagai partition key (SALAH!)
const { resource } = await containers.intersections.item(id, id).read();
```

Ini akan gagal karena:

1. Partition key seharusnya `deviceId`, bukan `id`
2. Cosmos DB tidak bisa menemukan item dengan partition key yang salah

---

## ✅ Solusi

Gunakan **query** untuk mencari item berdasarkan `id`, karena kita tidak tahu `deviceId` dari URL.

### Kode Baru (BENAR):

#### GET (Fetch Detail)

```typescript
// Query by id since partition key is deviceId
const { resources } = await containers.intersections.items
  .query({
    query: "SELECT * FROM c WHERE c.id = @id",
    parameters: [{ name: "@id", value: id }],
  })
  .fetchAll();

if (!resources || resources.length === 0) {
  return NextResponse.json(
    { success: false, error: "Intersection not found" },
    { status: 404 },
  );
}

return NextResponse.json({
  success: true,
  data: resources[0],
});
```

#### PATCH (Update)

```typescript
// 1. Query to find the item first
const { resources } = await containers.intersections.items
  .query({
    query: "SELECT * FROM c WHERE c.id = @id",
    parameters: [{ name: "@id", value: id }],
  })
  .fetchAll();

if (!resources || resources.length === 0) {
  return NextResponse.json(
    { success: false, error: "Intersection not found" },
    { status: 404 },
  );
}

const existing = resources[0];

// 2. Update with correct partition key
const updated = {
  ...existing,
  ...data,
  id: existing.id,
  updatedAt: new Date().toISOString(),
};

const { resource } = await containers.intersections
  .item(existing.id, existing.deviceId) // Use deviceId as partition key
  .replace(updated);
```

#### DELETE (Hapus)

```typescript
// 1. Query to find the item first
const { resources } = await containers.intersections.items
  .query({
    query: "SELECT * FROM c WHERE c.id = @id",
    parameters: [{ name: "@id", value: id }],
  })
  .fetchAll();

if (!resources || resources.length === 0) {
  return NextResponse.json(
    { success: false, error: "Intersection not found" },
    { status: 404 },
  );
}

const existing = resources[0];

// 2. Delete with correct partition key
await containers.intersections
  .item(existing.id, existing.deviceId) // Use deviceId as partition key
  .delete();
```

---

## 🧪 Testing

### Test API Endpoint

```bash
# Test GET detail
curl http://localhost:3000/api/intersections/int_001

# Expected response:
{
  "success": true,
  "data": {
    "id": "int_001",
    "name": "Simpang Tugu Tani",
    "address": "Jl. Medan Merdeka Barat, Jakarta Pusat",
    "deviceId": "lane-north",
    ...
  }
}
```

### Test di Browser

1. Buka `http://localhost:3000/persimpangan`
2. Click salah satu card persimpangan
3. Halaman detail seharusnya menampilkan:
   - ✅ Top metrics (Volume, Kemacetan, Cycle Time, Status)
   - ✅ Lane controls dengan traffic light
   - ✅ Visualisasi persimpangan
   - ✅ Event log table
   - ✅ Data real-time dari Azure

---

## 📝 File yang Diupdate

- ✅ `app/api/intersections/[id]/route.ts`
  - GET: Query by id instead of item(id, id)
  - PATCH: Query first, then update with deviceId
  - DELETE: Query first, then delete with deviceId

---

## 🎯 Kenapa Menggunakan Query?

### Keuntungan Query:

1. ✅ **Flexible** - Tidak perlu tahu partition key dari URL
2. ✅ **Reliable** - Selalu menemukan item berdasarkan id
3. ✅ **Consistent** - Bekerja untuk semua item terlepas dari partition key

### Kerugian:

1. ⚠️ **Sedikit lebih lambat** - Query cross-partition lebih lambat dari point read
2. ⚠️ **Lebih mahal** - Query menggunakan lebih banyak RU (Request Units)

### Alternatif (Jika Perlu Optimasi):

Jika perlu optimasi performa, bisa ubah URL pattern menjadi:

```
/persimpangan/[deviceId]/[id]
```

Tapi ini akan membuat URL lebih kompleks dan kurang user-friendly.

---

## ✅ Status

**FIXED!** ✅

Halaman detail persimpangan sekarang bisa:

- ✅ Fetch data dari Azure Cosmos DB
- ✅ Menampilkan detail lengkap
- ✅ Update data (PATCH)
- ✅ Delete data (DELETE)

---

## 🎉 Kesimpulan

Masalah **partition key** sudah diperbaiki dengan menggunakan **query** untuk mencari item berdasarkan `id`.

**Sekarang halaman detail persimpangan sudah berfungsi dengan baik!** 🚀

---

## 📚 Referensi

- [Azure Cosmos DB Partition Keys](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)
- [Cosmos DB Query](https://docs.microsoft.com/azure/cosmos-db/sql-query-getting-started)
- [Point Read vs Query](https://docs.microsoft.com/azure/cosmos-db/sql-query-getting-started#point-reads-vs-queries)
