# Dashboard Real Data Integration - Complete

## 📊 Overview
Semua komponen dashboard sekarang mengambil data **real-time dari Azure Cosmos DB**, bukan lagi hardcode. Data akan **auto-refresh setiap 30 detik** untuk memastikan selalu update.

## ✅ Komponen yang Sudah Diupdate

### 1. **DashboardStats** (`components/DashboardStats.tsx`)
**Data Real dari Database:**
- ✅ **Total Kendaraan**: Dihitung dari `traffic_data` container (sum vehicleCount)
- ✅ **Total Kendaraan Hari Ini**: Dari `analytics_daily` container (today's summary)
- ✅ **Perubahan vs Kemarin**: Perbandingan data hari ini vs kemarin (%)
- ✅ **Status IoT**: Persentase device aktif dari `intersections` container
- ✅ **Jumlah Device Aktif/Total**: Count dari intersections dengan status 'active'
- ✅ **Waktu Tunggu Rata-rata**: Dari `analytics_daily` (averageWaitTime)
- ✅ **Perubahan Waktu Tunggu**: Selisih waktu tunggu hari ini vs kemarin
- ✅ **Skor Kelancaran**: Dihitung dari IoT percentage + congestion index

**Formula Skor Kelancaran:**
```typescript
if (iotPercentage > 90 && avgCongestion < 40) → 'A'
else if (iotPercentage > 80 && avgCongestion < 60) → 'B+'
else if (iotPercentage > 70 && avgCongestion < 70) → 'B'
else → 'C'
```

### 2. **TrafficTrendChart** (`components/TrafficTrendChart.tsx`)
**Data Real dari Database:**
- ✅ **Grafik Per Jam**: Agregasi data dari `traffic_data` per jam (last 7 hours)
- ✅ **Peak Hour**: Jam dengan kendaraan terbanyak
- ✅ **Average Vehicles**: Rata-rata kendaraan per jam
- ✅ **Lowest Hour**: Jam dengan kendaraan paling sedikit
- ✅ **Tooltip Interaktif**: Menampilkan data real saat hover

**Cara Perhitungan:**
```typescript
// Group traffic data by hour
hourlyData[hour] = {
  count: number of records,
  total: sum of vehicleCount
}

// Calculate average per hour
avgVehicles = total / count

// Scale for chart (0-100)
height = (vehicles / maxVehicles) * 100
```

### 3. **AlertsPanel** (`components/AlertsPanel.tsx`)
**Data Real dari Database:**
- ✅ **Recent Events**: Dari `events` container (status: 'open', limit: 10)
- ✅ **Live Indicator**: Event dalam 5 menit terakhir dengan priority 'critical'
- ✅ **Event Type Icons**: Berdasarkan type dan priority dari database
- ✅ **Time Ago**: Dihitung dari timestamp event
- ✅ **Intersection Name**: Lookup dari `intersections` container
- ✅ **Priority Badge**: critical, high, medium, low dengan warna berbeda

**Live Event Logic:**
```typescript
const eventTime = new Date(timestamp).getTime();
const now = Date.now();
const diffMinutes = (now - eventTime) / (1000 * 60);
live = diffMinutes < 5 && priority === 'critical'
```

### 4. **IntersectionGrid** (`components/IntersectionGrid.tsx`)
**Sudah Terintegrasi Sebelumnya:**
- ✅ Mengambil data dari `intersections` container
- ✅ Menampilkan 4 intersection pertama di dashboard
- ✅ Status, location, deviceId dari database

## 🔄 Auto-Refresh System

### Custom Hook: `useDashboard()`
**File:** `lib/hooks/useDashboard.ts`

**Features:**
- ✅ Fetch data dari 4 API endpoints secara parallel
- ✅ Auto-refresh setiap 30 detik
- ✅ Loading states untuk setiap komponen
- ✅ Error handling dengan fallback
- ✅ Last updated timestamp

**API Endpoints yang Digunakan:**
```typescript
1. GET /api/intersections          → Device status & locations
2. GET /api/traffic/realtime       → Real-time traffic data (limit: 500)
3. GET /api/analytics/daily        → Daily analytics (limit: 7 days)
4. GET /api/events                 → Recent events (status: open, limit: 10)
```

**Return Values:**
```typescript
{
  stats: DashboardStats | null,
  trafficTrend: TrafficTrendData[],
  recentEvents: DashboardEvent[],
  isLoading: boolean,
  error: string | null,
  lastUpdated: Date | null,
  refresh: () => Promise<void>
}
```

## 📊 Data Flow

```
Azure Cosmos DB
    ↓
API Routes (/api/*)
    ↓
useDashboard() Hook
    ↓
Dashboard Components
    ↓
Real-time UI Update (every 30s)
```

## 🗄️ Database Containers Used

### 1. **intersections**
```json
{
  "id": "int_xxx",
  "name": "Simpangan Sarinah",
  "address": "Jl. MH Thamrin",
  "status": "active",
  "deviceId": "ESP32_001",
  "location": { "lat": -6.xxx, "lng": 106.xxx }
}
```

### 2. **traffic_data**
```json
{
  "id": "ESP32_001-timestamp",
  "deviceId": "ESP32_001",
  "lane": "north",
  "vehicleCount": 45,
  "speed": 35,
  "density": 0.75,
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 3. **analytics_daily**
```json
{
  "id": "analytics_xxx",
  "date": "2024-01-01",
  "intersectionId": "int_xxx",
  "summary": {
    "totalVehicles": 12500,
    "averageWaitTime": 45,
    "averageCongestionIndex": 65,
    "peakHour": "17:00"
  }
}
```

### 4. **events**
```json
{
  "id": "evt_xxx",
  "intersectionId": "int_xxx",
  "type": "congestion",
  "priority": "critical",
  "status": "open",
  "title": "Kepadatan Ekstrem",
  "description": "Volume meningkat drastis",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

## 🎯 Key Features

### 1. **Real-time Updates**
- Data refresh otomatis setiap 30 detik
- Tidak perlu reload halaman
- Smooth transitions dengan Framer Motion

### 2. **Smart Calculations**
- Perbandingan hari ini vs kemarin
- Agregasi data per jam
- Dynamic scoring system

### 3. **Loading States**
- Skeleton loading untuk setiap komponen
- Graceful degradation jika API error
- Fallback values untuk data kosong

### 4. **Performance Optimized**
- Parallel API calls (Promise.all)
- Efficient data aggregation
- Minimal re-renders

## 🚀 Testing

### 1. **Pastikan Database Terisi**
```bash
# Seed data ke Azure Cosmos DB
npm run db:seed:azure
```

### 2. **Check Environment Variables**
```env
AZURE_COSMOS_ENDPOINT=https://xxx.documents.azure.com:443/
AZURE_COSMOS_KEY=your-key-here
AZURE_COSMOS_DATABASE=TrafficDB
```

### 3. **Test Dashboard**
```bash
npm run dev
# Buka http://localhost:3000/dashboard
```

### 4. **Verify Data Updates**
- Buka dashboard
- Tunggu 30 detik
- Data akan auto-refresh
- Check console untuk API calls

## 📝 Notes

### Data Kosong?
Jika data masih kosong atau menggunakan fallback:
1. Pastikan containers sudah dibuat di Cosmos DB
2. Seed data dengan `npm run db:seed:azure`
3. Check API routes di `/api/*` untuk errors
4. Verify credentials di `.env.local`

### Performance Tips
- Data di-cache di client selama 30 detik
- API routes menggunakan `force-dynamic` untuk fresh data
- Gunakan `limit` parameter untuk membatasi data

### Future Improvements
- [ ] Add date range filter
- [ ] Export data to CSV
- [ ] Real-time WebSocket updates
- [ ] Historical data comparison
- [ ] Custom refresh interval

## ✨ Summary

**Sebelum:**
- ❌ Semua data hardcode
- ❌ Tidak ada update otomatis
- ❌ Data tidak real

**Setelah:**
- ✅ 100% data dari Azure Cosmos DB
- ✅ Auto-refresh setiap 30 detik
- ✅ Real-time calculations
- ✅ Smart aggregations
- ✅ Loading & error states
- ✅ Performance optimized

Dashboard sekarang **fully dynamic** dan **always up-to-date** dengan data real dari database! 🎉
