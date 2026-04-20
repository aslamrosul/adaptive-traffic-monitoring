# ⚠️ Azure Connection Issue - Solusi Alternatif

## Masalah

Terjadi timeout saat seeding data dalam jumlah besar ke Azure Cosmos DB:
```
❌ Error seeding database: connect ETIMEDOUT 70.153.154.68:443
```

Ini bisa disebabkan oleh:
1. Network firewall/proxy
2. Azure Cosmos DB firewall rules
3. Koneksi internet yang lambat
4. Batch size terlalu besar

## ✅ Solusi: Gunakan Real-Time Simulation

Daripada seed data dalam jumlah besar sekaligus, gunakan **real-time simulation** yang akan insert data secara bertahap (setiap 5 detik).

### Langkah-langkah:

#### 1. Start Development Server

```bash
npm run dev
```

Buka browser: http://localhost:3000/Analist

#### 2. Start Real-Time Simulation (Terminal Baru)

```bash
npm run db:simulate
```

Script ini akan:
- ✅ Insert 4 traffic records setiap 5 detik (1 per lane)
- ✅ Update daily analytics setiap 1 menit
- ✅ Generate random events
- ✅ Data langsung muncul di frontend (auto-refresh)

**Output:**
```
🚀 Memulai simulasi real-time traffic data...

📡 Mengirim data setiap 5 detik
📊 Update analytics setiap 1 menit
⚠️  Generate random events

════════════════════════════════════════════════════════════

[14:30:15] ✓ Inserted 4 traffic readings:
  🟢 north  | 180 vehicles | 45.2 km/h | moderate
  🟡 south  | 220 vehicles | 38.5 km/h | moderate
  🔴 east   | 280 vehicles | 25.1 km/h | congested
  🟢 west   | 150 vehicles | 52.3 km/h | smooth
```

#### 3. Biarkan Berjalan 5-10 Menit

Dalam 5 menit:
- 60 traffic records akan ter-insert
- Analytics akan ter-update
- Frontend akan menampilkan data real-time

Dalam 10 menit:
- 120 traffic records
- Cukup untuk visualisasi yang baik

**Cara stop:** Tekan `Ctrl+C`

---

## 🎯 Hasil yang Diharapkan

Setelah simulasi berjalan beberapa menit, halaman `/Analist` akan menampilkan:

### 1. Chart Kepadatan Kendaraan
- Data mingguan akan terisi dari analytics
- Bar chart akan menampilkan data per jalur

### 2. Performa Sensor IoT
- Akurasi: ~98%
- Perangkat aktif: 4/4

### 3. Indeks Kemacetan
- Nilai real-time berdasarkan data terbaru
- Status: Lancar/Moderat/Padat/Macet

### 4. Laporan Per Jam
- Heatmap 24 jam akan terisi
- Intensitas berdasarkan data real

### 5. Peringatan Kritis
- Events yang di-generate akan muncul
- Real-time updates

---

## 🔧 Alternatif: Manual Insert via Azure Portal

Jika simulasi juga timeout, insert data manual via Azure Portal:

### 1. Login ke Azure Portal
https://portal.azure.com

### 2. Buka Cosmos DB Account
`traffic-cosmos-slam`

### 3. Buka Data Explorer

### 4. Insert Sample Data

#### Container: `intersections`

```json
{
  "id": "int-001",
  "name": "Persimpangan Sudirman-Thamrin",
  "location": { "lat": -6.2088, "lng": 106.8456 },
  "lanes": ["north", "south", "east", "west"],
  "devices": ["lane-north", "lane-south", "lane-east", "lane-west"],
  "status": "active",
  "mode": "auto",
  "createdAt": "2026-04-20T00:00:00Z"
}
```

#### Container: `traffic_data`

```json
{
  "id": "traffic-lane-north-1713600000000",
  "deviceId": "lane-north",
  "intersectionId": "int-001",
  "lane": "north",
  "vehicleCount": 180,
  "speed": 45.5,
  "density": 1.8,
  "congestionIndex": 60,
  "status": "moderate",
  "timestamp": "2026-04-20T14:00:00Z",
  "metadata": {
    "temperature": 30,
    "humidity": 65
  }
}
```

Ulangi untuk lane lain (south, east, west) dengan nilai berbeda.

#### Container: `analytics_daily`

```json
{
  "id": "analytics-int-001-2026-04-20",
  "intersectionId": "int-001",
  "date": "2026-04-20",
  "summary": {
    "totalVehicles": 5000,
    "averageSpeed": 45.5,
    "averageCongestionIndex": 55.0,
    "averageWaitTime": 25,
    "peakHour": "17:00",
    "peakVehicleCount": 280
  },
  "hourly": [
    {
      "hour": 8,
      "vehicleCount": 220,
      "averageSpeed": 40.0,
      "congestionIndex": 70,
      "congestionLevel": "high"
    },
    {
      "hour": 17,
      "vehicleCount": 280,
      "averageSpeed": 30.0,
      "congestionIndex": 90,
      "congestionLevel": "high"
    }
  ],
  "efficiency": {
    "autoModeTime": 20,
    "manualModeTime": 4,
    "autoModeEfficiency": 90,
    "manualModeEfficiency": 65
  },
  "events": {
    "total": 5,
    "bySeverity": { "low": 2, "medium": 2, "high": 1, "critical": 0 },
    "byType": { "congestion": 3, "accident": 1, "sensor_error": 1, "other": 0 }
  }
}
```

#### Container: `events`

```json
{
  "id": "event-1713600000000",
  "intersectionId": "int-001",
  "type": "congestion",
  "priority": "high",
  "status": "open",
  "title": "Congestion terdeteksi",
  "description": "Kepadatan tinggi terdeteksi pada jalur utara",
  "timestamp": "2026-04-20T14:00:00Z",
  "resolvedAt": null,
  "metadata": {
    "lane": "north",
    "severity": "high",
    "autoDetected": true
  }
}
```

---

## 🌐 Check Azure Firewall Settings

Jika masih timeout, periksa firewall Azure:

### 1. Azure Portal > Cosmos DB > Networking

### 2. Firewall and virtual networks

Pastikan salah satu:
- ✅ "Allow access from Azure Portal" enabled
- ✅ "Allow access from All networks" enabled
- ✅ IP address Anda ditambahkan ke allowed list

### 3. Cara Menambahkan IP:

1. Cari IP public Anda: https://whatismyipaddress.com
2. Di Azure Portal > Cosmos DB > Networking
3. Klik "Add my current IP"
4. Atau tambahkan manual di "Firewall" section
5. Klik "Save"

---

## 📊 Verifikasi Data di Frontend

Setelah data ter-insert (via simulasi atau manual):

### 1. Refresh Browser
```
F5 atau Ctrl+R
```

### 2. Check Console (F12)
Pastikan tidak ada error 401 atau 404

### 3. Check Network Tab
- API calls ke `/api/analytics/daily` harus return 200
- API calls ke `/api/traffic/realtime` harus return 200
- Response harus berisi data (bukan array kosong)

### 4. Check Halaman Analist
http://localhost:3000/Analist

Harus menampilkan:
- ✅ Chart dengan data
- ✅ Performa sensor
- ✅ Indeks kemacetan
- ✅ Heatmap per jam
- ✅ List events

---

## 🔄 Auto-Refresh

Frontend menggunakan SWR dengan auto-refresh:

| Data | Interval |
|------|----------|
| Traffic | 5 detik |
| Events | 10 detik |
| Intersections | 30 detik |
| Analytics | 1 menit |

Jadi setelah data ter-insert, frontend akan otomatis update tanpa perlu refresh manual.

---

## ✅ Checklist

- [ ] Development server running (`npm run dev`)
- [ ] Real-time simulation running (`npm run db:simulate`)
- [ ] Simulasi sudah berjalan minimal 5 menit
- [ ] Browser dibuka ke http://localhost:3000/Analist
- [ ] Data muncul di frontend
- [ ] Auto-refresh berfungsi
- [ ] Tidak ada error di console

---

## 📞 Troubleshooting

### Simulasi juga timeout?

**Solusi:**
1. Check internet connection
2. Check Azure firewall settings
3. Try manual insert via Azure Portal
4. Contact Azure support untuk check account status

### Data tidak muncul setelah insert?

**Solusi:**
1. Refresh browser (F5)
2. Check console untuk error
3. Check API response di Network tab
4. Verify data di Azure Portal Data Explorer

### Error 401 di console?

**Solusi:**
1. Check AZURE_COSMOS_KEY di `.env.local`
2. Get new key dari Azure Portal
3. Restart server

---

**💡 Tip:** Gunakan simulasi real-time sebagai solusi utama. Ini lebih reliable dan memberikan pengalaman real-time yang sebenarnya!
