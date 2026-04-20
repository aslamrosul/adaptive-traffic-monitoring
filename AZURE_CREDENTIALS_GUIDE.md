# Panduan Mendapatkan Azure Cosmos DB Credentials

## Langkah-langkah Mendapatkan Azure Cosmos DB Key

### 1. Login ke Azure Portal
- Buka https://portal.azure.com
- Login dengan akun Azure Anda

### 2. Navigasi ke Cosmos DB Account
- Di search bar, ketik "Cosmos DB"
- Pilih "Azure Cosmos DB accounts"
- Klik pada account Anda: **traffic-cosmos-slam**

### 3. Dapatkan Connection String dan Key
- Di menu sebelah kiri, klik **"Keys"** (di bawah Settings)
- Anda akan melihat:
  - **URI**: Ini adalah AZURE_COSMOS_ENDPOINT Anda
  - **PRIMARY KEY**: Ini adalah AZURE_COSMOS_KEY Anda
  - **PRIMARY CONNECTION STRING**: Alternative untuk koneksi

### 4. Copy Credentials
```
URI: https://traffic-cosmos-slam.documents.azure.com:443/
PRIMARY KEY: [string panjang yang dimulai dengan huruf dan angka]
```

### 5. Update .env.local
Buka file `.env.local` dan ganti:
```env
AZURE_COSMOS_ENDPOINT=https://traffic-cosmos-slam.documents.azure.com:443/
AZURE_COSMOS_KEY=<PASTE_PRIMARY_KEY_DISINI>
AZURE_COSMOS_DATABASE=TrafficDB
```

### 6. Restart Development Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

## Troubleshooting

### Error 401 Unauthorized
- **Penyebab**: Key salah atau expired
- **Solusi**: 
  1. Regenerate key di Azure Portal
  2. Copy PRIMARY KEY yang baru
  3. Update .env.local
  4. Restart server

### Error 404 Not Found
- **Penyebab**: Database atau container tidak ada
- **Solusi**: 
  1. Cek nama database di Azure Portal
  2. Pastikan containers sudah dibuat (traffic_data, intersections, events, dll)
  3. Jalankan script setup database jika belum

### Connection Timeout
- **Penyebab**: Firewall Azure Cosmos DB
- **Solusi**:
  1. Di Azure Portal, buka Cosmos DB account
  2. Klik "Firewall and virtual networks"
  3. Pilih "Allow access from: All networks" (untuk development)
  4. Atau tambahkan IP address Anda

## Membuat Database dan Containers

Jika database belum ada, buat dengan langkah berikut:

### Via Azure Portal:
1. Buka Cosmos DB account
2. Klik "Data Explorer"
3. Klik "New Database"
   - Database ID: `TrafficDB`
   - Throughput: 400 RU/s (shared)
4. Buat containers:
   - traffic_data (partition key: /intersectionId)
   - intersections (partition key: /id)
   - events (partition key: /intersectionId)
   - reports (partition key: /id)
   - notifications (partition key: /userId)
   - users (partition key: /id)
   - device_status (partition key: /deviceId)
   - analytics_daily (partition key: /date)

### Via Script (Recommended):
Jalankan script setup yang sudah disediakan:
```bash
node scripts/setup-azure-database.js
```

## Security Best Practices

1. **Jangan commit .env.local ke Git**
   - File ini sudah ada di .gitignore
   - Jangan pernah share key di public repository

2. **Gunakan Read-Only Key untuk Frontend**
   - Jika ada operasi read-only, gunakan READ-ONLY KEY
   - PRIMARY KEY hanya untuk backend

3. **Rotate Keys Secara Berkala**
   - Azure menyediakan 2 keys (Primary dan Secondary)
   - Rotate keys setiap 3-6 bulan

4. **Gunakan Azure Key Vault untuk Production**
   - Simpan secrets di Azure Key Vault
   - Reference dari environment variables

## Monitoring

### Cek Koneksi:
```bash
curl http://localhost:3000/api/health
```

Response sukses:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-04-20T05:11:30.000Z"
}
```

### Cek Logs:
- Lihat console output saat `npm run dev`
- Error 401 = Key salah
- Error 404 = Database/container tidak ada
- Error 503 = Azure Cosmos DB down atau network issue
