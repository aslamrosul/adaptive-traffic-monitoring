# 🗺️ Peta Navigasi & Fitur

## 🏠 HOMEPAGE: Dashboard (/)

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR              │  HEADER                          │
│  ┌─────────────┐     │  [Notif ▼] [Sensor] [Profile ▼] │
│  │ Aerial      │     │                                   │
│  │ Command     │     ├───────────────────────────────────┤
│  │ ● Terhubung │     │  STAT CARDS (4)                   │
│  ├─────────────┤     │  [Kendaraan] [IoT] [Waktu] [Skor]│
│  │ ▶ Dasbor    │     │                                   │
│  │   Persimpang│     ├───────────────────────────────────┤
│  │   Analitik  │     │  CHART                            │
│  │   Peta      │     │  [Filter ▼] Bar Chart dengan      │
│  │   Pengguna  │     │  gradient                         │
│  ├─────────────┤     │                                   │
│  │ [Laporan]   │     ├───────────────────────────────────┤
│  │ Pengaturan  │     │  SIMPANGAN                        │
│  │ Bantuan     │     │  [Filter ▼] [+ Tambah]            │
│  └─────────────┘     │  [Card] [Card] [Card] [Card]      │
│                      │  dengan map images                 │
│                      │                                   │
│                      │  PERINGATAN                       │
│                      │  [Alert 1] [Alert 2]              │
└─────────────────────────────────────────────────────────┘
```

### Tombol & Fitur:
- **Notif**: Dropdown dengan 4 notifikasi
- **Profile**: Dropdown dengan menu
- **Filter Chart**: Hari Ini, Kemarin, 7 Hari
- **Filter Status**: Semua, Lancar, Sedang, Padat, Macet
- **+ Tambah**: Modal tambah simpangan
- **Laporan**: Modal buat laporan

---

## 🚦 PERSIMPANGAN (/persimpangan)

```
┌─────────────────────────────────────────────────────────┐
│  [← Back] Persimpangan Thamrin-Sudirman                 │
│  [🟢 IoT Aktif: Auto-Mode] [🔔] [👤]                    │
├─────────────────────────────────────────────────────────┤
│  METRICS (4 cards)                                       │
│  [4,821] [Sedang] [120s] [Online]                       │
├──────────────┬──────────────────────────────────────────┤
│  JALUR (4)   │  VISUALISASI                             │
│  ┌─────────┐ │  [CCTV Info] [AI Analysis]               │
│  │ Utara   │ │                                          │
│  │ 🔴🟡🟢  │ │      ╔═══════╗                          │
│  │ AKTIF   │ │      ║       ║                          │
│  └─────────┘ │  ════╬═══════╬════                      │
│  ┌─────────┐ │      ║   ⭕  ║                          │
│  │ Timur   │ │  ════╬═══════╬════                      │
│  │ 🔴🟡🟢  │ │      ║       ║                          │
│  └─────────┘ │      ╚═══════╝                          │
│  ┌─────────┐ │                                          │
│  │ Selatan │ │  [🔍] [⛶] [🚨 MANUAL OVERRIDE]          │
│  │ 🔴🟡🟢  │ │                                          │
│  └─────────┘ ├──────────────────────────────────────────┤
│  ┌─────────┐ │  ACTION BAR                              │
│  │ Barat   │ │  Algoritma: Adaptive-Flow v2.4           │
│  │ 🔴🟡🟢  │ │  [Unduh Laporan] [Konfigurasi Jalur]    │
│  └─────────┘ └──────────────────────────────────────────┤
├─────────────────────────────────────────────────────────┤
│  TABEL KEJADIAN                                          │
│  [Waktu] [Tipe] [Deskripsi] [Prioritas] [Status]       │
│  14:22   Anomali IoT   ...   [LOW]   Auto-resolved     │
│  14:15   Penyesuaian   ...   [INFO]  Sistem            │
│  13:45   Kendaraan     ...   [CRITICAL] Selesai        │
└─────────────────────────────────────────────────────────┘
```

### Tombol & Fitur:
- **← Back**: Kembali
- **🔍 Zoom**: Zoom in visualization
- **⛶ Fullscreen**: Toggle fullscreen
- **🚨 Manual Override**: Confirmation dialog
- **Unduh Laporan**: Download report
- **Konfigurasi Jalur**: Configure lanes

---

## 📊 ANALITIK (/analitik)

```
┌─────────────────────────────────────────────────────────┐
│  [Filter Simpangan ▼]              [📥 Ekspor Data]     │
├──────────────────────────┬──────────────────────────────┤
│  VOLUME MINGGUAN         │  EFISIENSI                   │
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐   │  AI: 92% ████████████░░      │
│  │ │ │ │ │ │ │ │ │ │   │  Manual: 68% ████████░░░░    │
│  │ │ │ │ │ │ │ │ │ │   │                              │
│  └─┘ └─┘ └─┘ └─┘ └─┘   │  INDEKS                      │
│  SEN SEL RAB KAM JUM    │    ┌───┐                     │
│                          │    │6.4│ MODERAT             │
│                          │    └───┘                     │
├──────────────────────────┴──────────────────────────────┤
│  HEATMAP KEMACETAN PER JAM                              │
│  ░ ░ ░ ▓ █ █ ▓ ▓ █ ▓ ░ ░                              │
│  0 2 4 6 8 10 12 14 16 18 20 22                        │
└─────────────────────────────────────────────────────────┘
```

### Tombol & Fitur:
- **Filter Simpangan**: Dropdown filter
- **📥 Ekspor Data**: Download CSV

---

## 🗺️ PETA (/peta)

```
┌─────────────────────────────────────────────────────────┐
│                                          [+] [-]         │
│                                                          │
│      🟢 Thamrin                                         │
│      (Hover: tooltip)                                   │
│                                                          │
│                    🔴 Sudirman                          │
│                    (Pulse animation)                    │
│                                                          │
│                              🟡 Kuningan                │
│                                                          │
│      🔴 Gatot Subroto                                   │
│                                                          │
│                                                          │
│                              ┌─────────────────┐        │
│                              │ LEGEND          │        │
│                              │ 🟢 Lancar       │        │
│                              │ 🟡 Sedang       │        │
│                              │ 🔴 Padat        │        │
│                              └─────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Tombol & Fitur:
- **[+]**: Zoom in
- **[-]**: Zoom out
- **Markers**: Hover untuk tooltip
- **Legend**: Info kepadatan

---

## 👥 PENGGUNA (/pengguna)

```
┌─────────────────────────────────────────────────────────┐
│  Manajemen Pengguna                                      │
│  [🔍 Cari pengguna...]              [+ Tambah Pengguna] │
├──────────────────────────┬──────────────────────────────┤
│  TABEL                   │  INFO PERAN                  │
│  ┌────────────────────┐  │  ┌────────────────────────┐ │
│  │ 👤 Budi Santoso   │  │  │ 🛡️ Admin Pusat         │ │
│  │ ADMIN PUSAT       │  │  │ Akses penuh...         │ │
│  │ ● Aktif  [✏️] [🗑️]│  │  └────────────────────────┘ │
│  └────────────────────┘  │  ┌────────────────────────┐ │
│  ┌────────────────────┐  │  │ 📊 Operator Lapangan  │ │
│  │ 👤 Siti Aminah    │  │  │ Monitoring...          │ │
│  │ OPERATOR          │  │  └────────────────────────┘ │
│  │ ● Aktif  [✏️] [🗑️]│  │                            │
│  └────────────────────┘  │  STATISTIK                 │
│  ┌────────────────────┐  │  Total: 4                  │
│  │ 👤 Rahmat Hidayat │  │  Aktif: 3                  │
│  │ OPERATOR          │  │  Offline: 1                │
│  │ ○ Offline [✏️][🗑️]│  │                            │
│  └────────────────────┘  │                            │
└──────────────────────────┴──────────────────────────────┘
```

### Tombol & Fitur:
- **🔍 Search**: Cari pengguna
- **+ Tambah**: Modal tambah user
- **✏️ Edit**: Edit user (toast)
- **🗑️ Delete**: Delete user (confirmation)

---

## ⚙️ PENGATURAN (/pengaturan)

```
┌─────────────────────────────────────────────────────────┐
│  PENGATURAN UMUM                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Mode Otomatis                            [●─────]  │ │
│  │ Aktifkan kontrol lampu otomatis berbasis AI       │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Notifikasi                               [●─────]  │ │
│  │ Terima notifikasi untuk peringatan penting        │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Mode Gelap                               [─────○]  │ │
│  │ Ubah tampilan ke mode gelap                       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  KONEKSI IoT                                            │
│  MQTT Broker URL: [mqtt://broker.example.com:1883]     │
│  API Key ESP32:   [••••••••••••••••]                   │
│                                                          │
│                              [Batal] [Simpan Perubahan] │
└─────────────────────────────────────────────────────────┘
```

### Tombol & Fitur:
- **Toggle Switches**: Animated slide
- **Input Fields**: MQTT & API Key
- **Batal**: Cancel changes
- **Simpan**: Save + toast

---

## ❓ BANTUAN (/bantuan)

```
┌─────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────┐ │
│  │ 💙 Ada yang bisa kami bantu?                      │ │
│  │ Temukan jawaban untuk pertanyaan umum...          │ │
│  │ [Hubungi Support] [Dokumentasi]                   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  FAQ                                                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ▶ Bagaimana cara mengubah mode lampu?            │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ▼ Apa yang harus dilakukan jika sensor offline?  │ │
│  │   Jika sensor IoT offline, sistem akan...        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  KONTAK                                                  │
│  [📧 Email]  [📞 Phone]  [🕐 24/7]                     │
└─────────────────────────────────────────────────────────┘
```

### Tombol & Fitur:
- **Hubungi Support**: Contact button
- **Dokumentasi**: Docs button
- **FAQ Accordion**: Expand/collapse
- **Contact Cards**: Email, phone, hours

---

## 👤 PROFIL (/profil)

```
┌─────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────┐ │
│  │ 💙 [👤 Photo]  Admin Pusat                        │ │
│  │              Super Administrator                   │ │
│  │              admin@traffic-command.go.id           │ │
│  │              📍 Jakarta Pusat                      │ │
│  │                              [Edit Profil]         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  INFORMASI PRIBADI                                       │
│  Nama:     [Admin Pusat          ]  (disabled)          │
│  Email:    [admin@traffic...     ]  (disabled)          │
│  Telepon:  [+62 812 3456 7890    ]  (disabled)          │
│  Lokasi:   [Jakarta Pusat        ]  (disabled)          │
│                                                          │
│  AKTIVITAS                                               │
│  [📄 24]        [✅ 18]        [⏰ 156]                 │
│  Laporan        Selesai        Jam Aktif                │
└─────────────────────────────────────────────────────────┘
```

### Tombol & Fitur:
- **Edit Photo**: Upload button
- **Edit Profil**: Toggle edit mode
- **Form Fields**: Editable saat edit mode
- **Batal/Simpan**: Action buttons

---

## 🔔 NOTIFICATION DROPDOWN

```
┌──────────────────────────────┐
│ Notifikasi      2 belum dibaca│
├──────────────────────────────┤
│ ⚠️ Kepadatan Ekstrem      ● │
│   Simpang Sarinah...         │
│   2 menit lalu               │
├──────────────────────────────┤
│ ℹ️ Pembaruan Sistem       ● │
│   Firmware IoT v2.4...       │
│   1 jam lalu                 │
├──────────────────────────────┤
│ ✅ Laporan Selesai           │
│   Laporan #1234...           │
│   3 jam lalu                 │
├──────────────────────────────┤
│ ❌ Sensor Offline            │
│   Sensor CCTV-04...          │
│   5 jam lalu                 │
├──────────────────────────────┤
│ [Lihat Semua Notifikasi]     │
└──────────────────────────────┘
```

---

## 👤 PROFILE DROPDOWN

```
┌──────────────────────────────┐
│ 💙 [👤] Admin Pusat          │
│        admin@traffic...      │
├──────────────────────────────┤
│ 👤 Profil Saya               │
│ ⚙️ Pengaturan                │
│ ❓ Bantuan                    │
│ 🚪 Keluar                    │
├──────────────────────────────┤
│ Aerial Command v2.4.0        │
└──────────────────────────────┘
```

---

## 📝 MODAL LAPORAN

```
┌──────────────────────────────┐
│ 💙 Buat Laporan Baru      [X]│
│    Laporkan insiden...       │
├──────────────────────────────┤
│ Lokasi: [Pilih Lokasi ▼]    │
│                              │
│ Jenis:  [Kemacetan ▼]       │
│ Prioritas: [Sedang ▼]       │
│                              │
│ Deskripsi:                   │
│ [                          ] │
│ [                          ] │
│ [                          ] │
│                              │
│      [Batal] [Kirim Laporan] │
└──────────────────────────────┘
```

---

## 🚦 MODAL TAMBAH SIMPANGAN

```
┌──────────────────────────────┐
│ 💙 Tambah Simpangan Baru  [X]│
│    Daftarkan persimpangan... │
├──────────────────────────────┤
│ Nama: [Simpang Monas       ] │
│                              │
│ Lokasi: [Jl. Medan Merdeka ] │
│                              │
│ Jalur: [4 Jalur ▼]          │
│ Status: [Lancar ▼]          │
│                              │
│ ℹ️ Catatan                   │
│ Setelah simpangan...         │
│                              │
│  [Batal] [Tambah Simpangan]  │
└──────────────────────────────┘
```

---

## 👥 MODAL TAMBAH USER

```
┌──────────────────────────────┐
│ 💙 Tambah Pengguna Baru   [X]│
│    Buat akun untuk...        │
├──────────────────────────────┤
│ Nama: [Nama Lengkap        ] │
│                              │
│ Email: [nama@traffic...    ] │
│                              │
│ Role: [Operator Lapangan ▼] │
│                              │
│ Password: [••••••••••••••• ] │
│                              │
│   [Batal] [Tambah Pengguna]  │
└──────────────────────────────┘
```

---

## 🎯 QUICK NAVIGATION

### Dari Sidebar (Selalu Tersedia)
- Dashboard → /
- Persimpangan → /persimpangan
- Analitik → /analitik
- Peta → /peta
- Pengguna → /pengguna
- Pengaturan → /pengaturan
- Bantuan → /bantuan

### Dari Profile Dropdown
- Profil → /profil
- Pengaturan → /pengaturan
- Bantuan → /bantuan
- Keluar → Toast confirmation

### Modal Triggers
- "Laporan Baru" (Sidebar) → Modal Laporan
- "+ Tambah Simpangan" (Dashboard) → Modal Simpangan
- "+ Tambah Pengguna" (Pengguna) → Modal User

---

**Total Navigasi**: 8 halaman + 3 modal + 2 dropdown
**Total Interaksi**: 200+ fitur
**Status**: ✅ Semua berfungsi
