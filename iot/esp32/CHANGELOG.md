# Changelog - ESP32 Traffic Sensor

## Perubahan dari Versi Lama ke Baru

### ❌ Versi Lama (Masalah)

```cpp
// Counting tanpa debounce - BISA DOUBLE COUNT!
if (northIR == LOW && lastNorthIR == HIGH) northCount++;
```

**Masalah:**
- Satu kendaraan bisa terhitung berkali-kali
- Tidak ada delay antara counting
- Tidak akurat

---

### ✅ Versi Baru (Solusi)

```cpp
// Counting dengan debounce 2 detik
void countVehicle(String lane, bool irDetected) {
  if (irDetected && !lastState) {
    if (currentTime - lastTime > VEHICLE_DEBOUNCE_MS) {  // 2 detik
      count++;
      lastTime = currentTime;
    }
  }
}
```

**Keuntungan:**
- Satu kendaraan = satu hitungan
- Debounce 2 detik mencegah duplikat
- Lebih akurat

---

## Fitur Baru yang Ditambahkan

### 1. Density Level System

**Versi Lama:**
```cpp
// Hanya ada irState: "detected" atau "clear"
north["irState"] = (northIR == LOW) ? "detected" : "clear";
```

**Versi Baru:**
```cpp
// Ada 3 level kepadatan
int calculateDensityLevel(bool irDetected, int distance) {
  if (!irDetected) return 0;                    // Kosong
  if (irDetected && distance < 50) return 2;    // Padat (IR + HC-SR04)
  if (irDetected) return 1;                     // Normal (IR saja)
}

north["densityLevel"] = northDensityLevel;  // 0, 1, atau 2
```

---

### 2. Queue Detection (10 Detik)

**Versi Lama:**
- Tidak ada queue detection
- Hanya baca jarak HC-SR04

**Versi Baru:**
```cpp
void detectQueue(String lane, bool irDetected) {
  if (irDetected) {
    if (queueStartTime == 0) {
      queueStartTime = millis();
    } else if (millis() - queueStartTime > 10000) {  // 10 detik
      queueDetected = true;
      Serial.println("Queue detected!");
    }
  } else {
    queueStartTime = 0;
    queueDetected = false;
  }
}

north["queueDetected"] = northQueueDetected;  // true/false
```

---

### 3. Continuous Counting

**Versi Lama & Baru:**
- Sama-sama hitung di semua warna lampu ✅
- Tidak ada perubahan di sini

---

## Struktur Data yang Dikirim

### Versi Lama
```json
{
  "north": {
    "light": "red",
    "vehicleCount": 15,
    "irState": "detected",
    "queueLength": 35
  }
}
```

### Versi Baru
```json
{
  "north": {
    "light": "red",
    "vehicleCount": 15,
    "densityLevel": 2,           // ← BARU!
    "queueDetected": true,       // ← BARU!
    "queueLength": 35
  }
}
```

---

## Konstanta yang Ditambahkan

```cpp
// Debounce untuk vehicle counting
#define VEHICLE_DEBOUNCE_MS 2000    // 2 detik

// Queue detection threshold
#define QUEUE_THRESHOLD_MS 10000    // 10 detik

// HC-SR04 threshold untuk density level 2
#define HCSR04_THRESHOLD_CM 50      // 50 cm
```

---

## Variabel Baru

```cpp
// Debounce tracking
unsigned long lastNorthVehicleTime = 0;
unsigned long lastSouthVehicleTime = 0;
unsigned long lastEastVehicleTime = 0;
bool lastNorthIR = false;
bool lastSouthIR = false;
bool lastEastIR = false;

// Queue detection tracking
unsigned long northQueueStartTime = 0;
unsigned long southQueueStartTime = 0;
unsigned long eastQueueStartTime = 0;
bool northQueueDetected = false;
bool southQueueDetected = false;
bool eastQueueDetected = false;

// Density levels
int northDensityLevel = 0;
int southDensityLevel = 0;
int eastDensityLevel = 0;
```

---

## Loop() Changes

### Versi Lama
```cpp
void loop() {
  // Send data setiap 15 detik
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 15000) {
    readAndSendData();  // Baca sensor DI SINI
    lastSend = millis();
  }
}
```

**Masalah:** Sensor hanya dibaca setiap 15 detik!

### Versi Baru
```cpp
void loop() {
  // Baca sensor setiap 100ms (responsif!)
  static unsigned long lastRead = 0;
  if (millis() - lastRead > 100) {
    // Baca semua sensor
    countVehicle("north", northIR);
    northDensityLevel = calculateDensityLevel(northIR, northDistance);
    detectQueue("north", northIR);
    lastRead = millis();
  }
  
  // Send data setiap 15 detik
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 15000) {
    readAndSendData();  // Kirim data yang sudah dikumpulkan
    lastSend = millis();
  }
}
```

**Keuntungan:** 
- Sensor dibaca setiap 100ms (sangat responsif)
- Data dikirim setiap 15 detik (hemat bandwidth)

---

## Migration Guide

### Cara Upgrade dari Versi Lama

1. **Backup kode lama** (kalau perlu rollback)

2. **Upload kode baru** (`traffic_sensor_multi_lane.ino`)

3. **Tidak perlu ubah wiring** - Pin sama semua!

4. **Test di Serial Monitor:**
   - Cek vehicle counting dengan debounce
   - Cek density level (0, 1, 2)
   - Cek queue detection (tahan 10 detik)

5. **Update Azure Function** (kalau perlu) untuk handle field baru:
   - `densityLevel`
   - `queueDetected`

---

## Tuning Parameters

Kalau perlu adjust:

```cpp
// Terlalu banyak double count? Naikkan debounce
#define VEHICLE_DEBOUNCE_MS 3000  // 3 detik

// Queue detection terlalu cepat? Naikkan threshold
#define QUEUE_THRESHOLD_MS 15000  // 15 detik

// Density level 2 terlalu sensitif? Kurangi jarak
#define HCSR04_THRESHOLD_CM 30    // 30 cm
```

---

## Summary

| Fitur | Versi Lama | Versi Baru |
|-------|-----------|-----------|
| Vehicle Counting | ❌ Tanpa debounce | ✅ Debounce 2 detik |
| Density Level | ❌ Hanya irState | ✅ Level 0, 1, 2 |
| Queue Detection | ❌ Tidak ada | ✅ 10 detik threshold |
| Sensor Reading | ⚠️ Setiap 15 detik | ✅ Setiap 100ms |
| Data Accuracy | ⚠️ Bisa duplikat | ✅ Akurat |
