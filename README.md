# 🚦 Adaptive Traffic Light Monitoring System

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Sistem monitoring dan kontrol lampu lalu lintas adaptif berbasis IoT dengan AI-powered analytics**

[Demo](#-demo) • [Fitur](#-fitur-utama) • [Instalasi](#-instalasi) • [Dokumentasi](#-dokumentasi) • [Tim](#-tim-pengembang)

</div>

---

## 📖 Tentang Project

Project **Adaptive Traffic Light Monitoring System** adalah sistem monitoring dan kontrol lampu lalu lintas cerdas yang dikembangkan sebagai **Project Based Learning (PBL) Semester 6** yang mengintegrasikan 4 mata kuliah:

- 🖥️ **Framework Programming** - Next.js 15 + TypeScript
- 🔌 **Internet of Things (IoT)** - ESP32 + Sensors
- ☁️ **Cloud Computing** - Azure/GCP Integration
- 📊 **Big Data Analytics** - Real-time Data Processing

Sistem ini dirancang untuk mengoptimalkan arus lalu lintas secara real-time menggunakan sensor IoT, algoritma adaptif, dan visualisasi data yang interaktif.

---

## ✨ Fitur Utama

### 🎯 Dashboard Real-time
- Monitoring volume kendaraan dengan grafik interaktif
- 4 stat cards dengan animasi (Total Kendaraan, Status IoT, Waktu Tunggu, Skor Kelancaran)
- Filter periode data (Hari Ini, Kemarin, 7 Hari Terakhir)
- Bar chart dengan gradient dan tooltip

### 🚦 Kontrol Persimpangan 4 Jalur
- Visualisasi traffic light real-time dengan warna aktual (merah/kuning/hijau)
- Kontrol manual override dengan konfirmasi
- Monitoring 4 jalur (Utara, Timur, Selatan, Barat)
- Tabel kejadian & anomali dengan priority badges
- CCTV feed info dan AI analysis status

### 📊 Analitik & Visualisasi
- Chart volume kendaraan mingguan
- Heatmap intensitas kemacetan per jam
- Efisiensi sistem (AI vs Manual control)
- Indeks kemacetan real-time
- Export data ke CSV

### 🗺️ Peta Interaktif
- 4 marker persimpangan dengan status warna
- Hover tooltip dengan detail (volume, kepadatan, status)
- Map controls (zoom in/out)
- Legend kepadatan dengan V/C ratio

### 👥 Manajemen Pengguna
- CRUD pengguna lengkap
- Role management (Admin Pusat, Operator Lapangan)
- Search & filter functionality
- Statistik pengguna (Total, Aktif, Offline)

### ⚙️ Pengaturan Sistem
- Toggle mode otomatis/manual
- Konfigurasi notifikasi
- Dark mode support
- IoT connection settings (MQTT Broker, API Key)

### 🎨 UI/UX Modern
- Material Design 3 color system (60+ colors)
- Smooth animations dengan Framer Motion (60fps)
- Responsive design (Mobile, Tablet, Desktop)
- Accessible & user-friendly interface

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.4 + Material Design 3
- **Animations**: Framer Motion 12.x
- **Charts**: Recharts 3.x
- **State Management**: Zustand 5.x
- **Notifications**: React Hot Toast 2.x
- **Data Fetching**: SWR 2.x
- **Icons**: Material Symbols Outlined
- **Fonts**: Inter & Manrope (Google Fonts)

### Backend (Ready for Integration)
- **Database**: Prisma + PostgreSQL
- **Real-time**: MQTT Protocol
- **IoT**: ESP32 + Sensors
- **Cloud**: Azure IoT Hub / GCP IoT Core
- **Analytics**: Python + FastAPI
- **Authentication**: NextAuth.js

---

## 📦 Instalasi

### Prerequisites
- Node.js 18.x atau lebih tinggi
- npm atau yarn
- Git

### Clone Repository
```bash
git clone https://github.com/aslamrosul/adaptive-traffic-monitoring.git
cd adaptive-traffic-monitoring/traffic-monitoring
```

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Buka browser di [http://localhost:3000](http://localhost:3000)

### Build untuk Production
```bash
npm run build
npm start
```

---

## 📁 Struktur Project

```
traffic-monitoring/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard utama
│   ├── persimpangan/             # Kontrol persimpangan
│   ├── analitik/                 # Analytics & charts
│   ├── peta/                     # Interactive map
│   ├── pengguna/                 # User management
│   ├── pengaturan/               # Settings
│   ├── bantuan/                  # Help center
│   ├── profil/                   # User profile
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
│
├── components/                   # Reusable components
│   ├── Sidebar.tsx               # Navigation sidebar
│   ├── Header.tsx                # Top header
│   ├── ModalLaporan.tsx          # Report modal
│   ├── ModalTambahSimpangan.tsx  # Add intersection modal
│   ├── ModalTambahUser.tsx       # Add user modal
│   ├── NotificationDropdown.tsx  # Notifications
│   ├── ProfileDropdown.tsx       # Profile menu
│   └── Toast.tsx                 # Toast provider
│
├── lib/
│   └── store.ts                  # Zustand state management
│
├── public/                       # Static assets
├── tailwind.config.ts            # Tailwind configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

---

## 🎨 Design System

### Color Palette (Material Design 3)
```css
Primary:   #0040a1  /* Blue - Main actions */
Secondary: #525f73  /* Slate - Secondary elements */
Tertiary:  #93000d  /* Red - Alerts & warnings */
Surface:   #f7f9fc  /* Light gray - Backgrounds */
```

### Typography
- **Headlines**: Manrope (Bold, Extrabold)
- **Body**: Inter (Regular, Medium, Semibold)
- **Labels**: Inter (Bold, Uppercase)

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 📚 Dokumentasi

Project ini dilengkapi dengan dokumentasi lengkap:

- **[QUICK_START.md](QUICK_START.md)** - Quick reference & troubleshooting
- **[SUMMARY.md](SUMMARY.md)** - Complete project summary
- **[FITUR_LENGKAP.md](FITUR_LENGKAP.md)** - Daftar semua fitur (200+)
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Testing guide (200+ test cases)
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Backend integration guide
- **[NAVIGATION_MAP.md](NAVIGATION_MAP.md)** - Visual navigation guide
- **[INDEX.md](INDEX.md)** - Documentation index

---

## 🔌 Integrasi IoT & Backend

### 1. Database Setup (Prisma + PostgreSQL)
```bash
npm install prisma @prisma/client
npx prisma init
npx prisma migrate dev
```

### 2. MQTT Real-time
```bash
npm install mqtt
```

### 3. ESP32 Integration
Upload code ke ESP32 dengan sensor volume kendaraan dan LED traffic light.

### 4. Cloud Deployment
Deploy ke Vercel (frontend) dan Azure/GCP (backend + IoT Hub).

📖 **Lihat [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) untuk panduan lengkap!**

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy --prod
```

### Manual Deployment
```bash
npm run build
npm start
```

---

## 🧪 Testing

### Run Tests
```bash
npm run lint
npm run build
```

### Manual Testing
Ikuti checklist di [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) untuk test 200+ fitur.

---

## 👥 Tim Pengembang

Project ini dikembangkan oleh **Kelompok 4** - PBL Semester 6:

| Nama | Role | Kontribusi |
|------|------|------------|
| **Zilan Zalilan** | Core Dashboard & Real-time Alerts | Dashboard utama, Bar chart, Peringatan real-time, Mini map preview |
| **Azzahra Attaqina** | Intersection Control & IoT Logic | Persimpangan detail, CCTV & AI visualization, Manual override, Status perangkat |
| **Tri Sukma Sarah** | Data Analytics & Strategic Insights | Analitik, Heatmap kepadatan, Efisiensi sistem, Export data |
| **Aslam Rosul Ahmad** | Map Systems & Infrastructure | Peta GIS, Manajemen pengguna, Global navigation, Settings & Support |

### 📋 Pembagian Detail per Menu

#### 🎯 Zilan Zalilan - Core Dashboard & Real-time Alerts
**Menu yang dikerjakan:**
- ✅ **Dashboard (/)** - Halaman utama
  - High-Level Stats (4 cards: Total Kendaraan, Status IoT, Waktu Tunggu, Skor)
  - Bar chart tren lalu lintas dengan filter periode
  - Peringatan terbaru (sidebar alerts)
  - Mini map preview status simpangan

**Tech Stack:**
- Recharts untuk bar chart
- Framer Motion untuk animasi cards
- Real-time data updates

---

#### 🚦 Azzahra Attaqina - Intersection Control & IoT Logic
**Menu yang dikerjakan:**
- ✅ **Persimpangan (/persimpangan)** - Kontrol detail
  - Visualisasi 4 jalur (Utara, Timur, Selatan, Barat)
  - Traffic light visualization dengan warna aktual
  - CCTV feed info & AI analysis status
  - Manual override button dengan konfirmasi
  - Tabel kejadian & anomali
  - Status perangkat & latensi

**Tech Stack:**
- Custom traffic light components
- Real-time IoT status indicators
- Event logging system

---

#### 📊 Tri Sukma Sarah - Data Analytics & Strategic Insights
**Menu yang dikerjakan:**
- ✅ **Analitik (/analitik)** - Data visualization
  - Chart volume kendaraan mingguan
  - Heatmap intensitas kemacetan per jam
  - Efisiensi sistem (AI vs Manual)
  - Indeks kemacetan
  - Export data ke CSV

**Tech Stack:**
- Recharts untuk charts
- Custom heatmap visualization
- Data export functionality

---

#### 🗺️ Aslam Rosul Ahmad - Map Systems & Infrastructure
**Menu yang dikerjakan:**
- ✅ **Peta (/peta)** - GIS visualization
  - Interactive map dengan 4 markers
  - Hover tooltips dengan detail
  - Legend kepadatan (V/C ratio)
  - Map controls (zoom)
- ✅ **Manajemen Pengguna (/pengguna)** - User management
  - CRUD pengguna lengkap
  - Role management (Admin, Operator)
  - Search & filter
  - Statistik pengguna
- ✅ **Pengaturan (/pengaturan)** - System settings
  - Toggle switches (Mode otomatis, Notifikasi, Dark mode)
  - IoT connection settings
- ✅ **Bantuan (/bantuan)** - Help center
  - FAQ accordion
  - Contact cards
- ✅ **Profil (/profil)** - User profile
  - Edit mode
  - Activity statistics
- ✅ **Global Components**
  - Sidebar navigation
  - Header dengan notifications & profile dropdown
  - Toast notifications

**Tech Stack:**
- Map visualization
- User management system
- Global navigation components

---

## 📊 Status Project

| Aspek | Status | Progress |
|-------|--------|----------|
| Frontend | ✅ Complete | 100% |
| UI/UX Design | ✅ Complete | 100% |
| Responsive | ✅ Complete | 100% |
| Animations | ✅ Complete | 100% |
| Documentation | ✅ Complete | 100% |
| Backend API | 🔄 In Progress | 30% |
| IoT Integration | 🔄 In Progress | 20% |
| Cloud Deployment | 📋 Planned | 0% |
| Big Data Analytics | 📋 Planned | 0% |

---

## 🎯 Roadmap

### Phase 1: Frontend ✅ (Selesai)
- [x] Setup Next.js project
- [x] Implement all pages (8 pages)
- [x] Create reusable components (10 components)
- [x] Add animations & interactions
- [x] Responsive design
- [x] Complete documentation

### Phase 2: Backend 🔄 (In Progress)
- [ ] Setup Prisma + PostgreSQL
- [ ] Create API routes
- [ ] Implement authentication
- [ ] CRUD operations

### Phase 3: IoT Integration 📋 (Planned)
- [ ] ESP32 setup & programming
- [ ] Sensor integration
- [ ] MQTT broker setup
- [ ] Real-time data transmission

### Phase 4: Cloud & Big Data 📋 (Planned)
- [ ] Azure/GCP deployment
- [ ] IoT Hub configuration
- [ ] Big Data analytics
- [ ] ML predictions

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Dosen Pembimbing**: [Nama Dosen]
- **Mata Kuliah**: Framework Programming, IoT, Cloud Computing, Big Data
- **Institusi**: [Nama Universitas]
- **Semester**: 6 (2024)

---

## 📞 Kontak

Untuk pertanyaan atau kolaborasi, hubungi:

- **Email**: [email@example.com]
- **GitHub**: [@aslamrosul](https://github.com/aslamrosul)
- **Project Link**: [https://github.com/aslamrosul/adaptive-traffic-monitoring](https://github.com/aslamrosul/adaptive-traffic-monitoring)

---

<div align="center">

**⭐ Jangan lupa beri star jika project ini bermanfaat! ⭐**

Made with ❤️ by Kelompok 4 - PBL Semester 6

</div>
