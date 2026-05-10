# 🎯 Konsep Baru Traffic Monitoring System

## ⚠️ PENTING: Perubahan Konsep

### Konsep Lama vs Baru

| Aspek | Old Concept ❌ | New Concept ✅ |
|-------|----------------|----------------|
| **Hitung Kendaraan** | Hanya saat lampu merah | **Semua kondisi lampu** (merah, kuning, hijau) |
| **Durasi Lampu Hijau** | Berdasarkan jumlah kendaraan | **Berdasarkan queue level** (0, 1, 2) |
| **Queue Detection** | Tidak ada | **3 level** berdasarkan ultrasonic sensor |

---

## 📏 Queue Level System

### Level 0: Antrian Pendek
- **Jarak**: > 20cm
- **Durasi Lampu Hijau**: 7 detik
- **Indikator**: 🟢 Hijau
- **Kondisi**: Lalu lintas lancar

### Level 1: Antrian Sedang
- **Jarak**: 10-20cm
- **Durasi Lampu Hijau**: 10 detik
- **Indikator**: 🟡 Kuning
- **Kondisi**: Lalu lintas mulai padat

### Level 2: Antrian Panjang
- **Jarak**: < 10cm
- **Durasi Lampu Hijau**: 15 detik
- **Indikator**: 🔴 Merah
- **Kondisi**: Lalu lintas sangat padat

---

## 🔄 Perubahan Utama

### 1. Vehicle Counting
- **Sebelumnya**: Hitung hanya saat lampu merah
- **Sekarang**: Hitung terus-menerus di semua kondisi lampu
- **Tujuan**: Mendapatkan data traffic yang lebih akurat

### 2. Green Light Duration
- **Sebelumnya**: Durasi = f(jumlah kendaraan)
- **Sekarang**: Durasi = f(queue level)
- **Mapping**:
  - Queue Level 0 → 7s
  - Queue Level 1 → 10s
  - Queue Level 2 → 15s

### 3. Data Structure
```typescript
interface LaneData {
  light: 'red' | 'yellow' | 'green';
  vehicleCount: number;      // Hitung di semua kondisi
  irState: 'detected' | 'clear';
  queueLength: number;        // cm dari ultrasonic
  queueLevel: 0 | 1 | 2;     // Derived dari queueLength
  greenDuration: number;      // Durasi aktual yang digunakan
}
```

---

## 📚 Referensi File

Untuk detail implementasi, baca:
- 📄 `GANTT_NEW_CONCEPT_TASKS.csv` - Task breakdown lengkap
- 📄 `AZURE_REALTIME_COMPLETE_GUIDE.md` - Panduan Azure implementation
- 📄 `iot/esp32/traffic_sensor.ino` - Kode ESP32 untuk queue detection

---

## ✅ Acceptance Criteria

Sistem dianggap berhasil jika:
1. ✅ Vehicle count terus berjalan di semua kondisi lampu
2. ✅ Queue level terdeteksi dengan akurat (0, 1, 2)
3. ✅ Durasi lampu hijau sesuai queue level
4. ✅ Data tersimpan di Cosmos DB dengan struktur baru
5. ✅ Dashboard menampilkan queue level real-time
6. ✅ Analytics menunjukkan distribusi queue level
