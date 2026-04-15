# 📋 Tabel Database - Ringkasan Struktur & Tipe Data

## 🗄️ Daftar Tabel (Collections)

### 1. **users** - Data Pengguna

| Field                       | Tipe       | Keterangan                                |
| --------------------------- | ---------- | ----------------------------------------- |
| `id`                        | string     | ID unik pengguna                          |
| `email`                     | string     | Email (unique)                            |
| `name`                      | string     | Nama lengkap                              |
| `role`                      | enum       | `'admin_pusat'` \| `'operator_lapangan'`  |
| `phone`                     | string?    | Nomor telepon (optional)                  |
| `photoURL`                  | string?    | URL foto profil                           |
| `location`                  | string?    | Lokasi kerja                              |
| `status`                    | enum       | `'active'` \| `'inactive'` \| `'offline'` |
| `createdAt`                 | timestamp  | Waktu dibuat                              |
| `updatedAt`                 | timestamp  | Waktu update                              |
| `lastLogin`                 | timestamp? | Login terakhir                            |
| `metadata.reportsCreated`   | number     | Jumlah laporan dibuat                     |
| `metadata.reportsCompleted` | number     | Jumlah laporan selesai                    |
| `metadata.activeHours`      | number     | Total jam aktif                           |

---

### 2. **intersections** - Data Persimpangan

| Field                       | Tipe      | Keterangan                                    |
| --------------------------- | --------- | --------------------------------------------- |
| `id`                        | string    | ID unik persimpangan                          |
| `name`                      | string    | Nama persimpangan                             |
| `address`                   | string    | Alamat lengkap                                |
| `location.lat`              | number    | Latitude (-90 to 90)                          |
| `location.lng`              | number    | Longitude (-180 to 180)                       |
| `deviceId`                  | string    | ID perangkat ESP32 (unique)                   |
| `status`                    | enum      | `'active'` \| `'inactive'` \| `'maintenance'` |
| `lanes.count`               | number    | Jumlah jalur (3, 4, 5, 6)                     |
| `lanes.directions`          | string[]  | `['north', 'east', 'south', 'west']`          |
| `config.mode`               | enum      | `'auto'` \| `'manual'`                        |
| `config.threshold.low`      | number    | Threshold volume rendah                       |
| `config.threshold.medium`   | number    | Threshold volume sedang                       |
| `config.threshold.high`     | number    | Threshold volume tinggi                       |
| `config.threshold.critical` | number    | Threshold volume kritis                       |
| `config.alertEnabled`       | boolean   | Notifikasi aktif/tidak                        |
| `config.cycleTime.min`      | number    | Waktu siklus min (detik)                      |
| `config.cycleTime.max`      | number    | Waktu siklus max (detik)                      |
| `cctv.enabled`              | boolean?  | CCTV aktif                                    |
| `cctv.streamUrl`            | string?   | URL CCTV stream                               |
| `cctv.recordingEnabled`     | boolean?  | Recording aktif                               |
| `createdAt`                 | timestamp | Waktu dibuat                                  |
| `updatedAt`                 | timestamp | Waktu update                                  |
| `lastUpdate`                | timestamp | Update terakhir dari IoT                      |

---

### 3. **traffic_data** - Data Lalu Lintas Real-time

| Field                       | Tipe      | Keterangan                                        |
| --------------------------- | --------- | ------------------------------------------------- |
| `id`                        | string    | ID unik data                                      |
| `intersectionId`            | string    | Reference ke intersections                        |
| `deviceId`                  | string    | ID perangkat ESP32                                |
| `timestamp`                 | timestamp | Waktu pengambilan data                            |
| **Data Per Jalur:**         |           |                                                   |
| `lanes.north.vehicleCount`  | number    | Jumlah kendaraan                                  |
| `lanes.north.speed`         | number    | Kecepatan rata-rata (km/jam)                      |
| `lanes.north.density`       | number    | Kepadatan jalur                                   |
| `lanes.north.queueLength`   | number    | Panjang antrian (meter)                           |
| `lanes.north.lightStatus`   | enum      | `'red'` \| `'yellow'` \| `'green'`                |
| `lanes.north.greenTime`     | number    | Durasi lampu hijau (detik)                        |
| `lanes.east.*`              | object    | (sama seperti north)                              |
| `lanes.south.*`             | object    | (sama seperti north)                              |
| `lanes.west.*`              | object    | (sama seperti north)                              |
| **Agregat Data:**           |           |                                                   |
| `totalVehicles`             | number    | Total kendaraan semua jalur                       |
| `averageSpeed`              | number    | Kecepatan rata-rata (km/jam)                      |
| `congestionLevel`           | enum      | `'low'` \| `'medium'` \| `'high'` \| `'critical'` |
| `congestionIndex`           | number    | 0-100 (0=lancar, 100=macet)                       |
| `density`                   | number    | Kepadatan (vehicles/km)                           |
| `vcRatio`                   | number    | Volume/Capacity ratio (0-1+)                      |
| **Traffic Light Status:**   |           |                                                   |
| `currentLight.north`        | enum      | `'red'` \| `'yellow'` \| `'green'`                |
| `currentLight.east`         | enum      | `'red'` \| `'yellow'` \| `'green'`                |
| `currentLight.south`        | enum      | `'red'` \| `'yellow'` \| `'green'`                |
| `currentLight.west`         | enum      | `'red'` \| `'yellow'` \| `'green'`                |
| `cycleTime`                 | number    | Waktu siklus aktif (detik)                        |
| `waitTime`                  | number    | Waktu tunggu rata-rata (detik)                    |
| **Metadata:**               |           |                                                   |
| `metadata.temperature`      | number?   | Suhu (Celsius)                                    |
| `metadata.humidity`         | number?   | Kelembaban (%)                                    |
| `metadata.weather`          | string?   | Kondisi cuaca                                     |
| `metadata.visibility`       | number?   | Jarak pandang (meter)                             |
| **AI Analysis:**            |           |                                                   |
| `aiAnalysis.prediction`     | enum?     | `'increasing'` \| `'stable'` \| `'decreasing'`    |
| `aiAnalysis.confidence`     | number?   | 0-1                                               |
| `aiAnalysis.recommendation` | string?   | Rekomendasi AI                                    |

---

### 4. **events** - Kejadian & Anomali

| Field                      | Tipe       | Keterangan                                                                                                       |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `id`                       | string     | ID unik kejadian                                                                                                 |
| `intersectionId`           | string     | Reference ke intersections                                                                                       |
| `type`                     | enum       | `'congestion'` \| `'accident'` \| `'sensor_error'` \| `'manual_override'` \| `'system_alert'` \| `'maintenance'` |
| `priority`                 | enum       | `'low'` \| `'medium'` \| `'high'` \| `'critical'`                                                                |
| `status`                   | enum       | `'open'` \| `'in_progress'` \| `'resolved'` \| `'closed'`                                                        |
| `title`                    | string     | Judul kejadian                                                                                                   |
| `description`              | string     | Deskripsi detail                                                                                                 |
| `timestamp`                | timestamp  | Waktu kejadian                                                                                                   |
| `resolvedAt`               | timestamp? | Waktu penyelesaian                                                                                               |
| `reportedBy.userId`        | string?    | User ID pelapor                                                                                                  |
| `reportedBy.userName`      | string?    | Nama pelapor                                                                                                     |
| `reportedBy.userRole`      | string?    | Role pelapor                                                                                                     |
| `assignedTo.userId`        | string?    | User ID yang ditugaskan                                                                                          |
| `assignedTo.userName`      | string?    | Nama yang ditugaskan                                                                                             |
| `location.lane`            | string?    | Jalur spesifik                                                                                                   |
| `location.coordinates.lat` | number?    | Latitude                                                                                                         |
| `location.coordinates.lng` | number?    | Longitude                                                                                                        |
| `metadata.vehicleCount`    | number?    | Jumlah kendaraan                                                                                                 |
| `metadata.congestionLevel` | string?    | Level kemacetan                                                                                                  |
| `metadata.duration`        | number?    | Durasi (menit)                                                                                                   |
| `metadata.affectedLanes`   | string[]?  | Jalur terdampak                                                                                                  |
| `metadata.images`          | string[]?  | URLs gambar                                                                                                      |
| `actions`                  | array?     | Riwayat aksi                                                                                                     |
| `createdAt`                | timestamp  | Waktu dibuat                                                                                                     |
| `updatedAt`                | timestamp  | Waktu update                                                                                                     |

---

### 5. **reports** - Laporan Pengguna

| Field                    | Tipe       | Keterangan                                                                        |
| ------------------------ | ---------- | --------------------------------------------------------------------------------- |
| `id`                     | string     | ID unik laporan                                                                   |
| `intersectionId`         | string     | Reference ke intersections                                                        |
| `type`                   | enum       | `'congestion'` \| `'accident'` \| `'sensor_malfunction'` \| `'other'`             |
| `priority`               | enum       | `'low'` \| `'medium'` \| `'high'` \| `'critical'`                                 |
| `status`                 | enum       | `'submitted'` \| `'reviewed'` \| `'in_progress'` \| `'completed'` \| `'rejected'` |
| `title`                  | string     | Judul laporan                                                                     |
| `description`            | string     | Deskripsi detail                                                                  |
| `reportedBy.userId`      | string     | User ID pelapor                                                                   |
| `reportedBy.userName`    | string     | Nama pelapor                                                                      |
| `reportedBy.userEmail`   | string     | Email pelapor                                                                     |
| `reportedBy.userRole`    | string     | Role pelapor                                                                      |
| `attachments[].type`     | enum?      | `'image'` \| `'video'` \| `'document'`                                            |
| `attachments[].url`      | string?    | URL file                                                                          |
| `attachments[].filename` | string?    | Nama file                                                                         |
| `location.lat`           | number?    | Latitude                                                                          |
| `location.lng`           | number?    | Longitude                                                                         |
| `reviewedBy.userId`      | string?    | User ID reviewer                                                                  |
| `reviewedBy.userName`    | string?    | Nama reviewer                                                                     |
| `reviewedBy.reviewedAt`  | timestamp? | Waktu review                                                                      |
| `reviewedBy.notes`       | string?    | Catatan review                                                                    |
| `resolution.resolvedBy`  | string?    | User ID resolver                                                                  |
| `resolution.resolvedAt`  | timestamp? | Waktu selesai                                                                     |
| `resolution.solution`    | string?    | Solusi                                                                            |
| `resolution.notes`       | string?    | Catatan                                                                           |
| `createdAt`              | timestamp  | Waktu dibuat                                                                      |
| `updatedAt`              | timestamp  | Waktu update                                                                      |

---

### 6. **notifications** - Notifikasi

| Field                       | Tipe       | Keterangan                                                 |
| --------------------------- | ---------- | ---------------------------------------------------------- |
| `id`                        | string     | ID unik notifikasi                                         |
| `userId`                    | string     | Target user                                                |
| `type`                      | enum       | `'alert'` \| `'info'` \| `'warning'` \| `'success'`        |
| `category`                  | enum       | `'traffic'` \| `'system'` \| `'report'` \| `'maintenance'` |
| `title`                     | string     | Judul notifikasi                                           |
| `message`                   | string     | Isi pesan                                                  |
| `read`                      | boolean    | Status baca                                                |
| `readAt`                    | timestamp? | Waktu dibaca                                               |
| `actionUrl`                 | string?    | URL untuk action                                           |
| `relatedTo.type`            | enum?      | `'intersection'` \| `'event'` \| `'report'`                |
| `relatedTo.id`              | string?    | ID terkait                                                 |
| `metadata.intersectionName` | string?    | Nama persimpangan                                          |
| `metadata.priority`         | string?    | Prioritas                                                  |
| `createdAt`                 | timestamp  | Waktu dibuat                                               |
| `expiresAt`                 | timestamp? | Waktu expired                                              |

---

### 7. **analytics_daily** - Analitik Harian

| Field                             | Tipe      | Keterangan                   |
| --------------------------------- | --------- | ---------------------------- |
| `id`                              | string    | Format: "int_001_2026-04-15" |
| `intersectionId`                  | string    | Reference ke intersections   |
| `date`                            | string    | Format: "YYYY-MM-DD"         |
| **Summary:**                      |           |                              |
| `summary.totalVehicles`           | number    | Total kendaraan              |
| `summary.averageSpeed`            | number    | Kecepatan rata-rata          |
| `summary.averageCongestionIndex`  | number    | Index kemacetan rata-rata    |
| `summary.averageWaitTime`         | number    | Waktu tunggu rata-rata       |
| `summary.peakHour`                | string    | Jam puncak (format: "HH:00") |
| `summary.peakVehicleCount`        | number    | Jumlah kendaraan puncak      |
| **Hourly Data:**                  |           |                              |
| `hourly[].hour`                   | number    | Jam (0-23)                   |
| `hourly[].vehicleCount`           | number    | Jumlah kendaraan             |
| `hourly[].averageSpeed`           | number    | Kecepatan rata-rata          |
| `hourly[].congestionLevel`        | string    | Level kemacetan              |
| `hourly[].congestionIndex`        | number    | Index kemacetan              |
| **Efficiency:**                   |           |                              |
| `efficiency.autoModeTime`         | number    | Menit dalam mode auto        |
| `efficiency.manualModeTime`       | number    | Menit dalam mode manual      |
| `efficiency.autoModeEfficiency`   | number    | Efisiensi mode auto (%)      |
| `efficiency.manualModeEfficiency` | number    | Efisiensi mode manual (%)    |
| **Events:**                       |           |                              |
| `events.total`                    | number    | Total kejadian               |
| `events.bySeverity.low`           | number    | Kejadian prioritas rendah    |
| `events.bySeverity.medium`        | number    | Kejadian prioritas sedang    |
| `events.bySeverity.high`          | number    | Kejadian prioritas tinggi    |
| `events.bySeverity.critical`      | number    | Kejadian prioritas kritis    |
| `events.byType.congestion`        | number    | Kejadian kemacetan           |
| `events.byType.accident`          | number    | Kejadian kecelakaan          |
| `events.byType.sensor_error`      | number    | Kejadian error sensor        |
| `events.byType.other`             | number    | Kejadian lainnya             |
| `createdAt`                       | timestamp | Waktu dibuat                 |
| `updatedAt`                       | timestamp | Waktu update                 |

---

### 8. **system_config** - Konfigurasi Sistem

| Field                                  | Tipe       | Keterangan                 |
| -------------------------------------- | ---------- | -------------------------- |
| `id`                                   | string     | "global_config"            |
| `settings.autoMode`                    | boolean    | Mode otomatis aktif        |
| `settings.notificationsEnabled`        | boolean    | Notifikasi aktif           |
| `settings.darkMode`                    | boolean    | Dark mode aktif            |
| `iot.mqttBrokerUrl`                    | string     | URL MQTT Broker            |
| `iot.apiKey`                           | string     | API Key (encrypted)        |
| `iot.connectionTimeout`                | number     | Timeout koneksi (detik)    |
| `iot.heartbeatInterval`                | number     | Interval heartbeat (detik) |
| `alerts.congestionThreshold`           | number     | Threshold kemacetan        |
| `alerts.responseTime`                  | number     | Waktu respons (menit)      |
| `alerts.escalationTime`                | number     | Waktu eskalasi (menit)     |
| `alerts.emailEnabled`                  | boolean    | Email alert aktif          |
| `alerts.smsEnabled`                    | boolean    | SMS alert aktif            |
| `maintenance.scheduledDowntime.start`  | timestamp? | Mulai maintenance          |
| `maintenance.scheduledDowntime.end`    | timestamp? | Selesai maintenance        |
| `maintenance.scheduledDowntime.reason` | string?    | Alasan maintenance         |
| `maintenance.lastMaintenance`          | timestamp? | Maintenance terakhir       |
| `maintenance.nextMaintenance`          | timestamp? | Maintenance berikutnya     |
| `updatedAt`                            | timestamp  | Waktu update               |
| `updatedBy`                            | string     | User ID yang update        |

---

### 9. **device_status** - Status Perangkat IoT

| Field                       | Tipe       | Keterangan                             |
| --------------------------- | ---------- | -------------------------------------- |
| `id`                        | string     | Device ID (e.g., "ESP32_001")          |
| `intersectionId`            | string     | Reference ke intersections             |
| `status`                    | enum       | `'online'` \| `'offline'` \| `'error'` |
| `lastHeartbeat`             | timestamp  | Heartbeat terakhir                     |
| `hardware.model`            | string     | Model perangkat                        |
| `hardware.firmwareVersion`  | string     | Versi firmware                         |
| `hardware.uptime`           | number     | Uptime (detik)                         |
| `hardware.freeMemory`       | number     | Memory bebas (bytes)                   |
| `hardware.cpuUsage`         | number     | CPU usage (%)                          |
| `network.signalStrength`    | number     | Kekuatan sinyal (dBm)                  |
| `network.ipAddress`         | string     | IP Address                             |
| `network.latency`           | number     | Latency (ms)                           |
| `network.packetLoss`        | number     | Packet loss (%)                        |
| `sensors[].type`            | string     | Tipe sensor                            |
| `sensors[].status`          | enum       | `'ok'` \| `'warning'` \| `'error'`     |
| `sensors[].lastCalibration` | timestamp? | Kalibrasi terakhir                     |
| `errors[].timestamp`        | timestamp? | Waktu error                            |
| `errors[].code`             | string?    | Kode error                             |
| `errors[].message`          | string?    | Pesan error                            |
| `errors[].severity`         | enum?      | `'low'` \| `'medium'` \| `'high'`      |
| `createdAt`                 | timestamp  | Waktu dibuat                           |
| `updatedAt`                 | timestamp  | Waktu update                           |

---

### 10. **audit_logs** - Log Audit

| Field             | Tipe      | Keterangan                                                        |
| ----------------- | --------- | ----------------------------------------------------------------- |
| `id`              | string    | ID unik log                                                       |
| `userId`          | string    | User ID                                                           |
| `userName`        | string    | Nama user                                                         |
| `userRole`        | string    | Role user                                                         |
| `action`          | enum      | `'create'` \| `'update'` \| `'delete'` \| `'login'` \| `'logout'` |
| `resource`        | enum      | `'user'` \| `'intersection'` \| `'report'` \| `'config'`          |
| `resourceId`      | string?   | ID resource                                                       |
| `details.before`  | any?      | State sebelum perubahan                                           |
| `details.after`   | any?      | State setelah perubahan                                           |
| `details.changes` | string[]? | Daftar field yang berubah                                         |
| `ipAddress`       | string?   | IP Address                                                        |
| `userAgent`       | string?   | User Agent                                                        |
| `timestamp`       | timestamp | Waktu kejadian                                                    |

---

## 📊 Ringkasan Tipe Data

### Tipe Primitif

- **string**: Text data
- **number**: Angka (integer atau float)
- **boolean**: true/false
- **timestamp**: Waktu (Firebase Timestamp)
- **array**: List/array data
- **object**: Nested object

### Tipe Enum (Pilihan Terbatas)

- **role**: `'admin_pusat'` | `'operator_lapangan'`
- **status**: `'active'` | `'inactive'` | `'offline'` | `'maintenance'`
- **mode**: `'auto'` | `'manual'`
- **lightStatus**: `'red'` | `'yellow'` | `'green'`
- **congestionLevel**: `'low'` | `'medium'` | `'high'` | `'critical'`
- **priority**: `'low'` | `'medium'` | `'high'` | `'critical'`
- **eventType**: `'congestion'` | `'accident'` | `'sensor_error'` | `'manual_override'` | `'system_alert'` | `'maintenance'`
- **reportStatus**: `'submitted'` | `'reviewed'` | `'in_progress'` | `'completed'` | `'rejected'`

### Tipe Optional

- Tanda `?` = field optional (boleh kosong)
- Contoh: `phone?: string` berarti phone boleh tidak diisi

---

## 🔗 Relasi Antar Tabel

```
users (1) -----> (N) reports (reportedBy)
users (1) -----> (N) events (reportedBy, assignedTo)
users (1) -----> (N) notifications (userId)
users (1) -----> (N) audit_logs (userId)

intersections (1) -----> (N) traffic_data (intersectionId)
intersections (1) -----> (N) events (intersectionId)
intersections (1) -----> (N) reports (intersectionId)
intersections (1) -----> (N) analytics_daily (intersectionId)
intersections (1) -----> (1) device_status (intersectionId)
```

---

## 📈 Ukuran Data Estimasi

| Tabel           | Jumlah Record | Growth Rate               |
| --------------- | ------------- | ------------------------- |
| users           | ~50           | Slow (manual)             |
| intersections   | ~10-100       | Slow (manual)             |
| traffic_data    | ~1M+/month    | Very Fast (real-time)     |
| events          | ~1K/month     | Medium                    |
| reports         | ~500/month    | Medium                    |
| notifications   | ~10K/month    | Fast                      |
| analytics_daily | ~3K/year      | Slow (1/day/intersection) |
| system_config   | 1             | Static                    |
| device_status   | ~10-100       | Static (1/device)         |
| audit_logs      | ~50K/month    | Fast                      |

---

**Last Updated**: April 15, 2026
**Version**: 1.0.0
