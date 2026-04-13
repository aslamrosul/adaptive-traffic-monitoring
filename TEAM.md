# 👥 Tim Pengembang - Kelompok 4

## 📊 Overview Tim

**Project**: Adaptive Traffic Light Monitoring System  
**Semester**: 6 (2024)  
**Mata Kuliah**: Framework Programming, IoT, Cloud Computing, Big Data  
**Total Anggota**: 4 orang

---

## 🎯 Pembagian Tugas Berdasarkan Figma Design

### 1️⃣ Zilan Zalilan
**Role**: Core Dashboard & Real-time Alerts Developer

#### 📋 Tanggung Jawab:
Bertanggung jawab atas "pusat kendali" utama yang memberikan ringkasan seluruh sistem.

#### 🎨 Menu yang Dikerjakan:
- **Dashboard (/)** - Halaman utama sistem

#### ✨ Fitur yang Diimplementasikan:
- ✅ High-Level Stats Cards (4 cards)
  - Total Kendaraan dengan trend indicator
  - Status IoT dengan percentage
  - Waktu Tunggu rata-rata
  - Skor Kelancaran dengan grade
- ✅ Bar Chart Tren Lalu Lintas
  - Filter periode (Hari Ini, Kemarin, 7 Hari Terakhir)
  - Gradient fill
  - Interactive tooltip
  - Responsive design
- ✅ Peringatan Terbaru (Sidebar)
  - Live notifications
  - Priority badges
  - Real-time updates
- ✅ Mini Map Preview
  - Status per simpangan
  - Quick overview cards

#### 🛠️ Tech Stack:
- Recharts untuk bar chart
- Framer Motion untuk animasi
- Zustand untuk state management
- React Hot Toast untuk notifications

#### 📁 Files:
- `app/page.tsx` - Dashboard main page
- `components/ModalTambahSimpangan.tsx` - Add intersection modal

---

### 2️⃣ Azzahra Attaqina
**Role**: Intersection Control & IoT Logic Developer

#### 📋 Tanggung Jawab:
Fokus pada detail teknis per titik persimpangan, yang merupakan bagian paling kompleks secara interaksi.

#### 🎨 Menu yang Dikerjakan:
- **Persimpangan (/persimpangan)** - Detail kontrol persimpangan

#### ✨ Fitur yang Diimplementasikan:
- ✅ Visualisasi 4 Jalur
  - Jalur Utara (Sudirman)
  - Jalur Timur (Imam Bonjol)
  - Jalur Selatan (Thamrin)
  - Jalur Barat (Kebon Sirih)
- ✅ Traffic Light Visualization
  - Warna aktual (merah/kuning/hijau)
  - Glow effect untuk lampu aktif
  - Real-time status update
- ✅ CCTV & AI Analysis
  - Live feed info badge
  - AI analysis running status
  - Camera position indicator
- ✅ Manual Override System
  - Confirmation dialog
  - Safety checks
  - Toast notifications
- ✅ Tabel Kejadian & Anomali
  - Priority badges (LOW, INFO, CRITICAL)
  - Timestamp
  - Auto-resolved status
- ✅ Status Perangkat
  - Latensi monitoring
  - Algoritma info (Adaptive-Flow v2.4)
  - Update timestamp

#### 🛠️ Tech Stack:
- Custom traffic light components
- Real-time IoT status indicators
- Event logging system
- Framer Motion untuk animasi

#### 📁 Files:
- `app/persimpangan/page.tsx` - Intersection control page

---

### 3️⃣ Tri Sukma Sarah
**Role**: Data Analytics & Strategic Insights Developer

#### 📋 Tanggung Jawab:
Bertanggung jawab mengubah data mentah menjadi informasi yang mudah dibaca oleh pengambil kebijakan.

#### 🎨 Menu yang Dikerjakan:
- **Analitik (/analitik)** - Data visualization & analytics

#### ✨ Fitur yang Diimplementasikan:
- ✅ Chart Volume Kendaraan Mingguan
  - Bar chart 7 hari
  - Responsive design
  - Custom colors
- ✅ Heatmap Kepadatan
  - Intensitas per jam (12 kolom)
  - Color gradient berdasarkan intensitas
  - Hover effects
- ✅ Efisiensi Sistem
  - Perbandingan AI vs Manual
  - Progress bars
  - Percentage indicators
- ✅ Indeks Kemacetan
  - Gauge display
  - Status label (MODERAT, TINGGI, dll)
  - Real-time updates
- ✅ Export Data
  - Button ekspor CSV
  - Filter parameter
  - Data formatting

#### 🛠️ Tech Stack:
- Recharts untuk charts
- Custom heatmap visualization
- Data export functionality
- Framer Motion untuk animasi

#### 📁 Files:
- `app/analitik/page.tsx` - Analytics page

---

### 4️⃣ Aslam Rosul Ahmad
**Role**: Map Systems & Infrastructure Developer

#### 📋 Tanggung Jawab:
Fokus pada visualisasi geografis secara luas dan manajemen akses sistem.

#### 🎨 Menu yang Dikerjakan:
- **Peta (/peta)** - GIS visualization
- **Manajemen Pengguna (/pengguna)** - User management
- **Pengaturan (/pengaturan)** - System settings
- **Bantuan (/bantuan)** - Help center
- **Profil (/profil)** - User profile
- **Global Components** - Navigation & layout

#### ✨ Fitur yang Diimplementasikan:

**Peta:**
- ✅ Interactive Map
  - 4 marker persimpangan
  - Color-coded by status
  - Pulse animation untuk macet
- ✅ Hover Tooltips
  - Nama simpangan
  - Volume kendaraan
  - Kepadatan percentage
  - Status badge
- ✅ Map Controls
  - Zoom in/out buttons
  - Responsive design
- ✅ Legend Kepadatan
  - V/C ratio indicators
  - Color coding
  - Status descriptions

**Manajemen Pengguna:**
- ✅ CRUD Operations
  - Add user dengan modal
  - Edit user (toast notification)
  - Delete user (confirmation dialog)
- ✅ User Table
  - Profile photos
  - Role badges
  - Status indicators
  - Hover effects
- ✅ Search & Filter
  - Search bar
  - Real-time filtering
- ✅ Role Management
  - Admin Pusat
  - Operator Lapangan
  - Info cards
- ✅ Statistik
  - Total users
  - Active users
  - Offline users

**Pengaturan:**
- ✅ Toggle Switches
  - Mode Otomatis
  - Notifikasi
  - Dark Mode
  - Animated slide
- ✅ IoT Settings
  - MQTT Broker URL
  - API Key ESP32
  - Connection status

**Bantuan:**
- ✅ FAQ Accordion
  - 4 pertanyaan umum
  - Expand/collapse animation
  - Arrow rotation
- ✅ Contact Cards
  - Email support
  - Phone number
  - Operating hours

**Profil:**
- ✅ Edit Mode
  - Toggle edit/view
  - Form validation
  - Save/cancel buttons
- ✅ Profile Info
  - Photo upload button
  - Editable fields
  - Activity statistics

**Global Components:**
- ✅ Sidebar Navigation
  - Active state indicators
  - IoT status badge
  - Smooth animations
- ✅ Header
  - Notification dropdown
  - Profile dropdown
  - Sensor status button
- ✅ Toast Notifications
  - Success messages
  - Error messages
  - Confirmation dialogs

#### 🛠️ Tech Stack:
- Map visualization (SVG-based)
- User management system
- Global navigation components
- Framer Motion untuk animasi
- Zustand untuk state management

#### 📁 Files:
- `app/peta/page.tsx` - Map page
- `app/pengguna/page.tsx` - User management page
- `app/pengaturan/page.tsx` - Settings page
- `app/bantuan/page.tsx` - Help page
- `app/profil/page.tsx` - Profile page
- `components/Sidebar.tsx` - Navigation sidebar
- `components/Header.tsx` - Top header
- `components/Toast.tsx` - Toast provider
- `components/ModalTambahUser.tsx` - Add user modal
- `components/NotificationDropdown.tsx` - Notifications
- `components/ProfileDropdown.tsx` - Profile menu
- `lib/store.ts` - State management
- `tailwind.config.ts` - Design system

---

## 📊 Statistik Kontribusi

| Anggota | Halaman | Komponen | Lines of Code (Est.) |
|---------|---------|----------|----------------------|
| Zilan Zalilan | 1 | 1 | ~400 |
| Azzahra Attaqina | 1 | 0 | ~500 |
| Tri Sukma Sarah | 1 | 0 | ~300 |
| Aslam Rosul Ahmad | 5 | 9 | ~1,800 |
| **Total** | **8** | **10** | **~3,000** |

---

## 🔄 Workflow Kolaborasi

### Git Workflow
1. **Clone** repository
2. **Pull** sebelum mulai coding
3. **Add** hanya file yang dikerjakan
4. **Commit** dengan message jelas
5. **Push** ke branch main

### Communication
- **WhatsApp Group**: Koordinasi harian
- **GitHub Issues**: Bug tracking
- **Weekly Meeting**: Progress review

### Code Review
- Setiap anggota review code anggota lain
- Pastikan konsistensi design system
- Test semua fitur sebelum merge

---

## 🎯 Progress Tracking

| Anggota | Status | Progress | Last Update |
|---------|--------|----------|-------------|
| Zilan Zalilan | 🔄 In Progress | 80% | - |
| Azzahra Attaqina | 🔄 In Progress | 70% | - |
| Tri Sukma Sarah | 🔄 In Progress | 60% | - |
| Aslam Rosul Ahmad | ✅ Done | 100% | 2024-01-XX |

---

## 🏆 Achievement

✅ **8 halaman** fully functional  
✅ **10 komponen** reusable  
✅ **200+ fitur** interaktif  
✅ **Material Design 3** implementation  
✅ **Responsive** all devices  
✅ **Zero errors** in diagnostics  

---

## 📞 Kontak Tim

- **Project Lead**: Aslam Rosul Ahmad
- **GitHub**: [@aslamrosul](https://github.com/aslamrosul)
- **Repository**: [adaptive-traffic-monitoring](https://github.com/aslamrosul/adaptive-traffic-monitoring)

---

**Made with ❤️ by Kelompok 4 - PBL Semester 6**
