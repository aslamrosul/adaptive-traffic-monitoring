# 🚀 Quick Start Guide - Adaptive Traffic Light Monitoring

## ⚡ TL;DR - Cara Cepat Mulai

```bash
cd traffic-monitoring
npm install
npm run dev
```

Buka browser: **http://localhost:3000**

---

## 📂 Struktur Project

```
traffic-monitoring/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 🏠 Dashboard
│   ├── persimpangan/page.tsx     # 🚦 Detail Persimpangan
│   ├── analitik/page.tsx         # 📊 Analytics
│   ├── peta/page.tsx             # 🗺️ Map View
│   ├── pengguna/page.tsx         # 👥 User Management
│   ├── pengaturan/page.tsx       # ⚙️ Settings
│   ├── bantuan/page.tsx          # ❓ Help Center
│   └── profil/page.tsx           # 👤 Profile
│
├── components/                   # Reusable Components
│   ├── Sidebar.tsx               # Navigation
│   ├── Header.tsx                # Top bar
│   ├── ModalLaporan.tsx          # Report modal
│   ├── ModalTambahSimpangan.tsx  # Add intersection
│   ├── ModalTambahUser.tsx       # Add user
│   ├── NotificationDropdown.tsx  # Notifications
│   ├── ProfileDropdown.tsx       # Profile menu
│   └── Toast.tsx                 # Toast provider
│
├── lib/
│   └── store.ts                  # Zustand state management
│
├── public/                       # Static assets
├── tailwind.config.ts            # Tailwind config
├── package.json                  # Dependencies
├── README.md                     # Main documentation
├── PROJECT_STATUS.md             # ✅ Status lengkap
└── INTEGRATION_GUIDE.md          # 🔌 Panduan integrasi
```

---

## 🎯 Fitur yang Sudah Jadi

### ✅ Dashboard (/)
- 4 stat cards (Total Kendaraan, Status IoT, Waktu Tunggu, Skor)
- Bar chart dengan gradient + filter periode
- Daftar simpangan dengan map images
- Filter status + tambah simpangan
- Panel peringatan

### ✅ Persimpangan (/persimpangan)
- Custom header dengan IoT status badge
- 4 metric cards
- Kontrol 4 jalur dengan traffic light visualization
- Visualisasi persimpangan + CCTV info
- Manual override button dengan konfirmasi
- Tabel kejadian & anomali

### ✅ Analitik (/analitik)
- Chart volume mingguan
- Efisiensi sistem (AI vs Manual)
- Indeks kemacetan
- Heatmap per jam

### ✅ Peta (/peta)
- 4 marker persimpangan
- Hover tooltip dengan detail
- Map controls (zoom)
- Legend kepadatan

### ✅ Pengguna (/pengguna)
- Tabel user dengan foto
- Search bar
- Add/Edit/Delete user
- Role management
- Statistik

---

## 🎨 Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| Framework | Next.js 15 | React framework |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS v3 | Utility-first CSS |
| Animations | Framer Motion | Smooth animations |
| Charts | Recharts | Data visualization |
| State | Zustand | State management |
| Notifications | React Hot Toast | Toast messages |
| Data Fetching | SWR | API integration ready |
| Icons | Material Symbols | Icon library |
| Fonts | Inter + Manrope | Typography |

---

## 🎨 Design System

### Colors (Material Design 3)
```css
Primary:   #0040a1  /* Blue - Main actions */
Secondary: #525f73  /* Slate - Secondary elements */
Tertiary:  #93000d  /* Red - Alerts */
Surface:   #f7f9fc  /* Light gray - Backgrounds */
```

### Typography
- **Headlines**: Manrope (Bold, Extrabold)
- **Body**: Inter (Regular, Medium, Semibold)
- **Labels**: Inter (Bold, Uppercase)

### Spacing
- Base unit: 4px (0.25rem)
- Common: 8px, 12px, 16px, 24px, 32px

---

## 🔧 Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Run ESLint
```

---

## 📱 Responsive Breakpoints

```css
Mobile:  < 768px
Tablet:  768px - 1024px
Desktop: > 1024px
```

Semua halaman sudah responsive!

---

## 🎯 Next Steps (Integrasi)

### 1. Database Setup
```bash
npm install prisma @prisma/client
npx prisma init
# Edit schema.prisma
npx prisma migrate dev
```

### 2. API Routes
Create `app/api/traffic/route.ts` untuk terima data dari ESP32

### 3. MQTT Real-time
```bash
npm install mqtt
```
Setup di `lib/mqtt.ts`

### 4. ESP32 Integration
Upload code ke ESP32 dengan sensor & LED

### 5. Cloud (Azure/GCP)
- IoT Hub untuk device management
- Blob Storage untuk CCTV footage
- Functions untuk serverless

### 6. Big Data Analytics
Python + FastAPI untuk ML predictions

📖 **Lihat INTEGRATION_GUIDE.md untuk detail lengkap!**

---

## 🐛 Troubleshooting

### Port sudah digunakan
```bash
npm run dev -- -p 3001
```

### Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Tailwind tidak load
```bash
rm -rf .next
npm run dev
```

### Build error
```bash
npm run build
# Check error messages
```

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| `README.md` | Main documentation |
| `PROJECT_STATUS.md` | ✅ Complete status & achievements |
| `INTEGRATION_GUIDE.md` | 🔌 IoT, Cloud, Big Data integration |
| `QUICK_START.md` | ⚡ This file - quick reference |

---

## 🎓 Untuk Demo PBL

### Demo Flow (10 menit):

1. **Dashboard** (2 min)
   - Show real-time stats
   - Filter chart
   - Add intersection

2. **Persimpangan** (3 min)
   - 4-lane control
   - Traffic lights
   - Manual override
   - Events table

3. **Analytics** (2 min)
   - Weekly chart
   - Efficiency
   - Heatmap

4. **Map** (1 min)
   - Markers
   - Tooltips

5. **Users** (2 min)
   - CRUD operations
   - Roles

### Key Points:
- ✅ Modern UI/UX (Material Design 3)
- ✅ Smooth animations (Framer Motion)
- ✅ Responsive design
- ✅ Ready untuk IoT integration
- ✅ Cloud-ready architecture
- ✅ Big Data analytics ready

---

## 💡 Tips

1. **Development**: Gunakan `npm run dev` untuk hot reload
2. **Testing**: Test di Chrome DevTools responsive mode
3. **Performance**: Check Lighthouse score
4. **Deployment**: Vercel untuk frontend, Azure untuk backend
5. **Documentation**: Update README saat ada perubahan

---

## 🏆 Achievement Summary

✅ **7 pages** fully functional
✅ **10 components** reusable
✅ **60+ colors** Material Design 3
✅ **Smooth animations** everywhere
✅ **Responsive** all devices
✅ **TypeScript** type-safe
✅ **Ready for integration** IoT + Cloud + Big Data

---

## 📞 Need Help?

1. Check `README.md` untuk setup lengkap
2. Check `PROJECT_STATUS.md` untuk status detail
3. Check `INTEGRATION_GUIDE.md` untuk integrasi
4. Check browser console untuk error messages
5. Check Next.js docs: https://nextjs.org/docs

---

**Status**: ✅ PRODUCTION READY (Frontend)
**Next**: Backend Integration (IoT + Cloud + Big Data)

**Good luck! 🚀**
