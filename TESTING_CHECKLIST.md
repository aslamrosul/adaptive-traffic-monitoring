# ✅ Testing Checklist - Semua Fitur

## 🧪 CARA TESTING

1. Jalankan: `npm run dev`
2. Buka: `http://localhost:3000`
3. Test setiap fitur di bawah ini

---

## 🏠 DASHBOARD (/)

### Navigation
- [ ] Klik "Dasbor" di sidebar → Tetap di dashboard
- [ ] Klik "Persimpangan" → Navigate ke /persimpangan
- [ ] Klik "Analitik" → Navigate ke /analitik
- [ ] Klik "Peta" → Navigate ke /peta
- [ ] Klik "Manajemen Pengguna" → Navigate ke /pengguna
- [ ] Klik "Pengaturan" → Navigate ke /pengaturan
- [ ] Klik "Bantuan" → Navigate ke /bantuan

### Stat Cards
- [ ] Hover pada "Total Kendaraan" → Scale animation
- [ ] Hover pada "Status IoT" → Scale animation
- [ ] Hover pada "Waktu Tunggu" → Scale animation
- [ ] Hover pada "Skor Kelancaran" → Scale animation

### Chart
- [ ] Klik dropdown filter → Pilih "Hari Ini" → Chart update
- [ ] Klik dropdown filter → Pilih "Kemarin" → Chart update
- [ ] Klik dropdown filter → Pilih "7 Hari Terakhir" → Chart update
- [ ] Hover pada bar chart → Tooltip muncul

### Simpangan
- [ ] Klik dropdown "Semua Status" → Pilih "Lancar" → Filter bekerja
- [ ] Klik dropdown "Semua Status" → Pilih "Sedang" → Filter bekerja
- [ ] Klik dropdown "Semua Status" → Pilih "Padat" → Filter bekerja
- [ ] Klik dropdown "Semua Status" → Pilih "Macet Parah" → Filter bekerja
- [ ] Filter "Lancar" → Hanya tampil simpangan lancar
- [ ] Filter tidak ada hasil → Empty state muncul
- [ ] Hover pada card simpangan → Scale animation
- [ ] Klik "Tambah Simpangan" → Modal terbuka

### Modal Tambah Simpangan
- [ ] Modal terbuka dengan animasi smooth
- [ ] Klik backdrop (area gelap) → Modal tertutup
- [ ] Klik tombol X → Modal tertutup
- [ ] Submit form kosong → Validation error
- [ ] Isi nama: "Simpang Test"
- [ ] Isi lokasi: "Jl. Test"
- [ ] Pilih jalur: "4 Jalur"
- [ ] Pilih status: "Lancar"
- [ ] Klik "Tambah Simpangan" → Toast success muncul
- [ ] Modal tertutup setelah submit

### Sidebar
- [ ] Klik "Laporan Baru" → Modal laporan terbuka
- [ ] Status IoT pulse animation berjalan

### Header
- [ ] Klik icon notifikasi → Dropdown terbuka
- [ ] Badge count (2) terlihat
- [ ] Klik outside dropdown → Dropdown tertutup
- [ ] Klik profile avatar → Dropdown terbuka
- [ ] Klik "Profil Saya" → Navigate ke /profil
- [ ] Klik "Keluar" → Toast confirmation muncul

---

## 🚦 PERSIMPANGAN (/persimpangan)

### Header
- [ ] Klik back button → Kembali ke halaman sebelumnya
- [ ] IoT status badge "Auto-Mode" terlihat
- [ ] Badge hijau dengan pulse animation

### Metric Cards
- [ ] 4 cards muncul dengan animasi stagger
- [ ] "Total Kendaraan" menampilkan 4,821
- [ ] "Indeks Kemacetan" menampilkan "Sedang"
- [ ] "Waktu Siklus" menampilkan "120 detik"
- [ ] "Status Perangkat" menampilkan "Online"

### Kontrol Jalur
- [ ] 4 jalur cards terlihat
- [ ] Jalur Utara memiliki ring biru (active)
- [ ] Traffic light Jalur Utara → Hijau menyala
- [ ] Traffic light Jalur Timur → Merah menyala
- [ ] Traffic light Jalur Selatan → Kuning menyala
- [ ] Traffic light Jalur Barat → Merah menyala
- [ ] Lampu yang menyala memiliki glow effect

### Visualisasi
- [ ] CCTV info badge terlihat
- [ ] AI Analysis badge terlihat dengan pulse
- [ ] Intersection diagram dengan roads terlihat
- [ ] Dashed circle berputar (10s duration)
- [ ] Traffic lights di roads terlihat

### Control Buttons
- [ ] Klik "Zoom In" → Button responsive
- [ ] Klik "Fullscreen" → Button responsive
- [ ] Klik "Manual Override" → Toast confirmation muncul
- [ ] Toast memiliki 2 tombol: "Aktifkan" & "Batal"
- [ ] Klik "Aktifkan" → Toast success muncul
- [ ] Klik "Batal" → Toast tertutup

### Action Bar
- [ ] "Algoritma Adaptive-Flow v2.4" terlihat
- [ ] "Update Terakhir: Baru saja" terlihat
- [ ] Klik "Unduh Laporan" → Button responsive
- [ ] Klik "Konfigurasi Jalur" → Button responsive

### Tabel Kejadian
- [ ] 3 event rows terlihat
- [ ] Priority badges berwarna (LOW=yellow, INFO=blue, CRITICAL=red)
- [ ] Hover pada row → Background berubah
- [ ] Klik "Lihat Semua Log" → Link responsive

---

## 📊 ANALITIK (/analitik)

### Filters
- [ ] Dropdown "Semua Simpangan" terlihat
- [ ] Klik "Ekspor Data (.csv)" → Button responsive

### Charts
- [ ] Bar chart volume mingguan terlihat
- [ ] 7 bars (SEN-MIN) dengan tinggi berbeda
- [ ] Bars berwarna primary blue

### Efisiensi
- [ ] Card efisiensi dengan background dark
- [ ] Progress bar "AI Lampu Otomatis" 92%
- [ ] Progress bar "Kontrol Manual" 68%
- [ ] Progress bars berwarna berbeda

### Indeks
- [ ] Card indeks kemacetan terlihat
- [ ] Angka "6.4" dengan label "MODERAT"

### Heatmap
- [ ] 12 kolom heatmap terlihat
- [ ] Warna berubah sesuai intensitas (0-100%)
- [ ] Label jam (0:00, 2:00, dst) terlihat

---

## 🗺️ PETA (/peta)

### Map View
- [ ] Background map dengan SVG roads terlihat
- [ ] 4 marker persimpangan terlihat
- [ ] Marker berwarna sesuai status (green/yellow/red)
- [ ] Marker macet parah memiliki pulse animation

### Tooltips
- [ ] Hover pada marker → Tooltip muncul
- [ ] Tooltip menampilkan nama simpangan
- [ ] Tooltip menampilkan status badge
- [ ] Tooltip menampilkan volume & kepadatan
- [ ] Progress bar kepadatan terlihat

### Controls
- [ ] Klik "+" (zoom in) → Button responsive
- [ ] Klik "-" (zoom out) → Button responsive

### Legend
- [ ] Legend box di kanan bawah terlihat
- [ ] 3 status dengan warna berbeda
- [ ] V/C ratio terlihat untuk setiap status

---

## 👥 MANAJEMEN PENGGUNA (/pengguna)

### Header
- [ ] Search input terlihat
- [ ] Placeholder "Cari pengguna..." terlihat
- [ ] Klik "Tambah Pengguna" → Modal terbuka

### Tabel
- [ ] 4 user rows terlihat
- [ ] Foto profil avatar terlihat
- [ ] Role badges berwarna berbeda
- [ ] Status indicator (hijau/abu) terlihat
- [ ] Hover pada row → Action buttons muncul
- [ ] Klik "Edit" → Toast muncul
- [ ] Klik "Delete" → Confirmation toast muncul
- [ ] Confirmation toast memiliki 2 tombol
- [ ] Klik "Hapus" → User terhapus + toast success
- [ ] Klik "Batal" → Toast tertutup

### Sidebar
- [ ] 2 info cards (Admin & Operator) terlihat
- [ ] Statistik card terlihat
- [ ] Total, Aktif, Offline count benar

### Modal Tambah User
- [ ] Modal terbuka dengan animasi
- [ ] Klik backdrop → Modal tertutup
- [ ] Submit form kosong → Validation error
- [ ] Isi nama: "Test User"
- [ ] Isi email: "test@example.com"
- [ ] Pilih role: "Operator Lapangan"
- [ ] Isi password: "password123"
- [ ] Klik "Tambah Pengguna" → Toast success
- [ ] User baru muncul di tabel

---

## ⚙️ PENGATURAN (/pengaturan)

### Toggle Switches
- [ ] 3 toggle switches terlihat
- [ ] Toggle "Mode Otomatis" default ON (biru)
- [ ] Klik toggle → Switch slide dengan animasi
- [ ] Toggle OFF → Warna abu-abu
- [ ] Toggle ON → Warna biru
- [ ] Toggle "Notifikasi" berfungsi
- [ ] Toggle "Mode Gelap" berfungsi

### IoT Settings
- [ ] Input "MQTT Broker URL" terlihat
- [ ] Input "API Key ESP32" terlihat (password type)
- [ ] Input bisa diketik

### Action Buttons
- [ ] Klik "Batal" → Button responsive
- [ ] Klik "Simpan Perubahan" → Toast success muncul

---

## ❓ BANTUAN (/bantuan)

### Hero Section
- [ ] Hero card dengan gradient terlihat
- [ ] Klik "Hubungi Support" → Button responsive
- [ ] Klik "Dokumentasi" → Button responsive

### FAQ
- [ ] 4 FAQ items terlihat
- [ ] Klik FAQ pertama → Expand dengan animasi
- [ ] Arrow icon rotate 180°
- [ ] Answer text muncul
- [ ] Klik lagi → Collapse dengan animasi
- [ ] Test semua 4 FAQ items

### Contact Cards
- [ ] 3 contact cards terlihat
- [ ] Email card dengan icon & text
- [ ] Phone card dengan icon & text
- [ ] Schedule card dengan icon & text

---

## 👤 PROFIL (/profil)

### Profile Header
- [ ] Profile card dengan gradient terlihat
- [ ] Avatar foto terlihat
- [ ] Nama "Admin Pusat" terlihat
- [ ] Role "Super Administrator" terlihat
- [ ] Email & lokasi terlihat
- [ ] Klik "Edit Profil" → Form jadi editable

### Form Fields (Edit Mode)
- [ ] 4 input fields jadi enabled
- [ ] Input nama bisa diubah
- [ ] Input email bisa diubah
- [ ] Input phone bisa diubah
- [ ] Input lokasi bisa diubah
- [ ] 2 action buttons muncul di bawah

### Action Buttons
- [ ] Klik "Batal" → Form jadi disabled
- [ ] Klik "Simpan Perubahan" → Toast success
- [ ] Form kembali ke disabled state

### Activity Stats
- [ ] 3 stat cards terlihat
- [ ] "Laporan Dibuat" menampilkan 24
- [ ] "Laporan Selesai" menampilkan 18
- [ ] "Jam Aktif" menampilkan 156

---

## 📝 MODAL LAPORAN (Sidebar)

### Modal
- [ ] Klik "Laporan Baru" di sidebar → Modal terbuka
- [ ] Modal dengan gradient header terlihat
- [ ] Klik backdrop → Modal tertutup
- [ ] Klik X button → Modal tertutup

### Form
- [ ] Submit form kosong → Validation error
- [ ] Select lokasi: "Simpang Sudirman"
- [ ] Select jenis: "Kemacetan"
- [ ] Select prioritas: "Tinggi"
- [ ] Textarea deskripsi: "Test laporan"
- [ ] Klik "Kirim Laporan" → Toast success
- [ ] Modal tertutup setelah submit

---

## 🔔 NOTIFICATION DROPDOWN

### Dropdown
- [ ] Badge count "2" terlihat
- [ ] Klik icon notifikasi → Dropdown terbuka
- [ ] 4 notifikasi terlihat
- [ ] 2 notifikasi memiliki blue dot (unread)
- [ ] Icon berwarna sesuai type
- [ ] Hover pada notifikasi → Background berubah
- [ ] Klik "Lihat Semua Notifikasi" → Link responsive
- [ ] Klik outside → Dropdown tertutup

---

## 👤 PROFILE DROPDOWN

### Dropdown
- [ ] Klik profile avatar → Dropdown terbuka
- [ ] Profile header dengan foto terlihat
- [ ] Email terlihat
- [ ] 4 menu items terlihat
- [ ] Klik "Profil Saya" → Navigate ke /profil
- [ ] Klik "Pengaturan" → Navigate ke /pengaturan
- [ ] Klik "Bantuan" → Navigate ke /bantuan
- [ ] Klik "Keluar" → Toast confirmation
- [ ] Version number terlihat di footer
- [ ] Klik outside → Dropdown tertutup

---

## 🎨 ANIMASI & RESPONSIVENESS

### Animations
- [ ] Page load → Fade in animation
- [ ] Cards → Stagger animation
- [ ] Buttons → Hover scale effect
- [ ] Buttons → Tap scale effect
- [ ] Modals → Fade + scale animation
- [ ] Dropdowns → Slide down animation
- [ ] Toggles → Smooth slide animation
- [ ] Charts → Smooth rendering

### Responsive
- [ ] Resize browser ke 375px (mobile) → Layout responsive
- [ ] Resize ke 768px (tablet) → Layout responsive
- [ ] Resize ke 1024px+ (desktop) → Layout responsive
- [ ] Sidebar tetap fixed di desktop
- [ ] Cards stack di mobile
- [ ] Tables scroll horizontal di mobile

---

## 🚀 PERFORMANCE

### Loading
- [ ] Page load < 3 detik
- [ ] No layout shift saat load
- [ ] Images load dengan smooth
- [ ] Fonts load tanpa flash

### Interactions
- [ ] Button click responsive (< 100ms)
- [ ] Modal open/close smooth (< 300ms)
- [ ] Dropdown open/close smooth (< 200ms)
- [ ] Animations 60fps (no lag)
- [ ] Scroll smooth tanpa jank

---

## ✅ HASIL TESTING

Total Tests: **200+**

- [ ] Semua navigation bekerja
- [ ] Semua buttons responsive
- [ ] Semua modals buka/tutup
- [ ] Semua dropdowns buka/tutup
- [ ] Semua forms validation bekerja
- [ ] Semua toast notifications muncul
- [ ] Semua animations smooth
- [ ] Semua hover effects bekerja
- [ ] Semua filters berfungsi
- [ ] Responsive di semua device

---

**Status**: Ready untuk User Acceptance Testing (UAT)
**Next**: Backend Integration Testing
