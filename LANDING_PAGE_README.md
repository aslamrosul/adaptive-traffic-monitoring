# Landing Page - Aerial Command

## 📄 Deskripsi

Landing page untuk Sistem Manajemen Lalu Lintas Cerdas "Aerial Command" yang dikonversi dari HTML statis ke Next.js dengan TypeScript dan Framer Motion untuk animasi.

## 🗂️ Struktur File

### Halaman

- **`app/landing/page.tsx`** - Halaman landing page utama
- **`app/dashboard/page.tsx`** - Dashboard aplikasi (dipindahkan dari app/page.tsx)
- **`app/page.tsx`** - Root page yang redirect ke /landing

### Komponen

- **`components/LandingNav.tsx`** - Navbar untuk landing page dengan mobile menu
- **`components/LandingFooter.tsx`** - Footer untuk landing page

## 🎨 Fitur Landing Page

### 1. Hero Section (#beranda)

- Judul besar dengan gradient text
- Badge "Smart City Ready" dengan animasi pulse
- Deskripsi sistem
- 2 CTA buttons (Mulai Optimasi & Pelajari Cara Kerja)
- Hero image dengan floating data card
- Animasi fade-in dan scale

### 2. Features Section (#fitur)

- 4 kartu fitur dengan icon Material Symbols:
  - **Monitoring Real-time** - multiline_chart icon
  - **Adaptif AI** - psychology icon
  - **Analitik Cerdas** - query_stats icon
  - **Fail-safe Mode** - health_and_safety icon
- Hover effects dengan scale dan shadow
- Animasi stagger saat scroll

### 3. How It Works Section (#cara-kerja)

- 3 langkah proses sistem:
  1. **Sensor Deteksi** - sensors icon
  2. **AI Menganalisis** - memory icon
  3. **Lalu Lintas Optimal** - traffic icon
- Connecting line horizontal (desktop)
- Badge nomor urut pada setiap step
- Animasi scroll-triggered

### 4. CTA Section (#kontak)

- Background gradient blue dengan blur effects
- Judul besar dan deskripsi
- CTA button ke dashboard
- Animasi hover translate-y

### 5. Navigation

- Fixed navbar dengan backdrop blur
- Desktop menu: Beranda, Fitur, Cara Kerja, Kontak
- Mobile hamburger menu dengan AnimatePresence
- CTA button "Masuk Dashboard"
- Smooth scroll ke sections

### 6. Footer

- Brand logo dan copyright
- Links: Kebijakan Privasi, Syarat & Ketentuan, Bantuan
- Responsive grid layout

## 🎭 Animasi

### Framer Motion Effects

- **Hero**: fade-in + slide-up untuk text, scale untuk image
- **Features**: stagger animation saat scroll ke viewport
- **How It Works**: sequential fade-in untuk setiap step
- **CTA**: fade-in saat scroll
- **Mobile Menu**: height animation dengan AnimatePresence

### Hover Effects

- Feature cards: border color change + shadow + icon scale
- Buttons: translate-y, brightness, shadow
- Links: color transition

## 🎨 Design System

### Colors

- **Primary**: Blue-600 (#0040a1)
- **Secondary**: Cyan-500
- **Background**: White, Slate-50
- **Text**: Slate-900, Slate-600
- **Accent**: Green (stats), Orange (fail-safe)

### Typography

- **Font**: Public Sans (via Google Fonts)
- **Headings**: font-bold, tracking-tight
- **Body**: text-slate-600, leading-relaxed

### Spacing

- **Sections**: py-24 (96px vertical padding)
- **Container**: max-w-7xl mx-auto
- **Grid gaps**: gap-8, gap-12

## 🔗 Routing

```
/ (root)           → redirect ke /landing
/landing           → Landing page
/dashboard         → Dashboard aplikasi (dengan Sidebar & Header)
/persimpangan      → Daftar persimpangan
/persimpangan/[id] → Detail persimpangan
/Analist           → Halaman analitik
/notifikasi        → Notifikasi
/pengguna          → Manajemen pengguna
/profile           → Profile user
/tim               → Halaman tim
/peta              → Peta persimpangan
/laporan           → Laporan
```

## 📱 Responsive Design

### Breakpoints (Tailwind)

- **Mobile**: < 768px (1 column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (3-4 columns)

### Mobile Optimizations

- Hamburger menu dengan AnimatePresence
- Stack layout untuk hero section
- Single column untuk features
- Adjusted font sizes (text-5xl → text-6xl on desktop)

## 🚀 Cara Menggunakan

### Development

```bash
npm run dev
```

Buka http://localhost:3000 - akan redirect ke /landing

### Build

```bash
npm run build
npm start
```

### Navigasi

- Klik "Masuk Dashboard" → ke /dashboard
- Klik menu navigation → smooth scroll ke section
- Klik logo → kembali ke landing page

## 🔧 Customization

### Mengubah Konten

Edit file `app/landing/page.tsx`:

- Hero title & description
- Feature cards (title, description, icon)
- How it works steps
- CTA text

### Mengubah Warna

Edit Tailwind classes:

- `bg-blue-600` → primary color
- `text-slate-900` → text color
- `from-blue-600 to-cyan-500` → gradient

### Mengubah Animasi

Edit Framer Motion props:

- `initial` - state awal
- `animate` - state akhir
- `transition` - durasi & delay
- `whileInView` - trigger saat scroll

### Menambah Section

```tsx
<section className="py-24 bg-white" id="section-id">
  <div className="max-w-7xl mx-auto px-6 md:px-12">{/* Content */}</div>
</section>
```

## 📦 Dependencies

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Material Symbols** - Icons (via Google Fonts)

## ✅ Checklist Implementasi

- [x] Konversi HTML ke Next.js/TypeScript
- [x] Navbar dengan mobile menu
- [x] Hero section dengan animasi
- [x] Features section (4 cards)
- [x] How it works section (3 steps)
- [x] CTA section
- [x] Footer
- [x] Responsive design
- [x] Framer Motion animations
- [x] Smooth scroll navigation
- [x] Routing ke dashboard
- [x] No diagnostic errors

## 🎯 Next Steps

1. Tambahkan form kontak di section #kontak
2. Integrasi dengan backend untuk demo request
3. Tambahkan testimonials section
4. Tambahkan pricing section (jika diperlukan)
5. SEO optimization (meta tags, Open Graph)
6. Analytics tracking (Google Analytics)
7. A/B testing untuk CTA buttons
